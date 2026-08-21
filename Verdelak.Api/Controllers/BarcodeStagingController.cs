using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;
using Verdelak.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/barcode-staging")]
public class BarcodeStagingController(
    VerdelakDbContext context,
    IOpenLibraryLookupService openLibraryLookupService,
    IGoogleBooksLookupService googleBooksLookupService,
    ICrossrefLookupService crossrefLookupService,
    IMusicBrainzLookupService musicBrainzLookupService,
    IUpcItemDbLookupService upcItemDbLookupService,
    IOpenFoodFactsLookupService openFoodFactsLookupService,
    IDiscogsLookupService discogsLookupService,
    IWikidataLookupService wikidataLookupService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BarcodeStagingItemDto>>> GetStagedItems(
        [FromQuery] string? status,
        [FromQuery] string? itemType,
        [FromQuery] string? source,
        [FromQuery] string? batchName,
        CancellationToken cancellationToken)
    {
        var query = context.BarcodeStagingItems.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(item => item.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(itemType))
        {
            query = query.Where(item => item.ItemType == itemType);
        }

        if (!string.IsNullOrWhiteSpace(source))
        {
            query = query.Where(item => item.Source == source);
        }

        if (!string.IsNullOrWhiteSpace(batchName))
        {
            query = query.Where(item => item.BatchName == batchName);
        }

        var items = await query
            .OrderByDescending(item => item.CreatedAtUtc)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        return items;
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<BarcodeStagingItemDto>>> StageItems(
        BarcodeStagingCreateRequest request,
        CancellationToken cancellationToken)
    {
        var codes = request.Upcs
            .Select(code => new
            {
                Raw = code?.Trim() ?? string.Empty,
                Normalized = NormalizeCode(code)
            })
            .Where(code => !string.IsNullOrWhiteSpace(code.Normalized))
            .GroupBy(code => code.Normalized, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToList();

        if (codes.Count == 0)
        {
            return BadRequest("At least one UPC, EAN, or ISBN value is required.");
        }

        var normalizedCodes = codes.Select(code => code.Normalized).ToList();
        var existingUpcs = await context.BarcodeStagingItems
            .Where(item => normalizedCodes.Contains(item.NormalizedCode))
            .Select(item => item.NormalizedCode)
            .ToListAsync(cancellationToken);

        var existingSet = existingUpcs.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var now = DateTime.UtcNow;
        var source = NormalizeChoice(request.Source, "Manual");
        var stagedItems = codes.Select(code => new BarcodeStagingItem
        {
            Upc = code.Raw,
            NormalizedCode = code.Normalized,
            CodeType = DetectCodeType(code.Normalized),
            Source = source,
            BatchName = string.IsNullOrWhiteSpace(request.BatchName) ? null : request.BatchName.Trim(),
            Status = existingSet.Contains(code.Normalized) ? "Duplicate" : "New",
            ItemType = "Unknown",
            CreatedAtUtc = now
        }).ToList();

        context.BarcodeStagingItems.AddRange(stagedItems);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetStagedItems), stagedItems.Select(ToDto).ToList());
    }

    [HttpGet("duplicates")]
    public async Task<ActionResult<IEnumerable<BarcodeStagingDuplicateGroupDto>>> GetDuplicateGroups(
        CancellationToken cancellationToken)
    {
        var items = await context.BarcodeStagingItems
            .AsNoTracking()
            .OrderByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return items
            .GroupBy(item => item.NormalizedCode, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key)
            .Select(group => new BarcodeStagingDuplicateGroupDto
            {
                NormalizedCode = group.Key,
                CodeType = group.First().CodeType,
                Count = group.Count(),
                Items = group.Select(ToDto).ToList()
            })
            .ToList();
    }

    [HttpGet("batch-reports")]
    public async Task<ActionResult<IEnumerable<BarcodeBatchReportDto>>> GetBatchReports(CancellationToken cancellationToken)
    {
        var items = await context.BarcodeStagingItems
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var stagingIds = items.Select(item => item.Id).ToList();
        var candidateSummaries = await context.BarcodeLookupCandidates
            .AsNoTracking()
            .Where(candidate => stagingIds.Contains(candidate.BarcodeStagingItemId))
            .GroupBy(candidate => candidate.BarcodeStagingItemId)
            .Select(group => new
            {
                BarcodeStagingItemId = group.Key,
                CandidateCount = group.Count(),
                SelectedCandidateCount = group.Count(candidate => candidate.Selected)
            })
            .ToListAsync(cancellationToken);

        var candidateSummaryByItem = candidateSummaries.ToDictionary(summary => summary.BarcodeStagingItemId);
        var candidates = await context.BarcodeLookupCandidates
            .AsNoTracking()
            .Where(candidate => stagingIds.Contains(candidate.BarcodeStagingItemId))
            .Select(candidate => new BarcodeProviderCandidateSummary(candidate.BarcodeStagingItemId, candidate.Provider, candidate.Selected))
            .ToListAsync(cancellationToken);

        var candidatesByItem = candidates
            .GroupBy(candidate => candidate.BarcodeStagingItemId)
            .ToDictionary(group => group.Key, group => group.ToList());

        var duplicateCodes = items
            .GroupBy(item => item.NormalizedCode, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return items
            .GroupBy(item => new { BatchName = item.BatchName ?? "No batch", item.Source })
            .OrderByDescending(group => group.Max(item => item.UpdatedAtUtc ?? item.CreatedAtUtc))
            .ThenBy(group => group.Key.BatchName)
            .Select(group => new BarcodeBatchReportDto
            {
                BatchName = group.Key.BatchName,
                Source = group.Key.Source,
                TotalCount = group.Count(),
                NewCount = group.Count(item => item.Status == "New"),
                MatchedCount = group.Count(item => item.Status == "Matched"),
                NeedsReviewCount = group.Count(item => item.Status == "NeedsReview" || item.Status == "Duplicate"),
                ApprovedCount = group.Count(item => item.Status == "Approved"),
                ImportedCount = group.Count(item => item.Status == "Imported"),
                RejectedCount = group.Count(item => item.Status == "Rejected"),
                ReadyToImportCount = group.Count(IsReadyToImport),
                DuplicateCodeCount = group.Count(item => duplicateCodes.Contains(item.NormalizedCode)),
                BookCount = group.Count(item => item.ItemType == "Book"),
                CdCount = group.Count(item => item.ItemType == "CD"),
                DvdCount = group.Count(item => item.ItemType == "DVD"),
                OtherTypeCount = group.Count(item => item.ItemType != "Book" && item.ItemType != "CD" && item.ItemType != "DVD"),
                ImportedBookCount = group.Count(item => item.Status == "Imported" && item.ImportedEntityType == "Book"),
                ImportedCdCount = group.Count(item => item.Status == "Imported" && item.ImportedEntityType == "MusicAlbum"),
                ImportedDvdCount = group.Count(item => item.Status == "Imported" && item.ImportedEntityType == "MovieInventoryItem"),
                ImportedOtherTypeCount = group.Count(item =>
                    item.Status == "Imported" &&
                    item.ImportedEntityType != "Book" &&
                    item.ImportedEntityType != "MusicAlbum" &&
                    item.ImportedEntityType != "MovieInventoryItem"),
                CandidateCount = group.Sum(item => candidateSummaryByItem.TryGetValue(item.Id, out var summary) ? summary.CandidateCount : 0),
                SelectedCandidateCount = group.Sum(item => candidateSummaryByItem.TryGetValue(item.Id, out var summary) ? summary.SelectedCandidateCount : 0),
                NoCandidateCount = group.Count(item => !candidateSummaryByItem.ContainsKey(item.Id)),
                LowConfidenceCount = group.Count(item => item.Confidence is < 50),
                ProviderMatchSummary = ProviderMatchSummary(group.Select(item => item.Id).ToHashSet(), candidatesByItem),
                ProviderFailureSummary = ProviderFailureSummary(group.Select(item => item.Notes)),
                SelectedProviderSummary = SelectedProviderSummary(group.Select(item => item.Id).ToHashSet(), candidatesByItem, group.Select(item => item.LookupProvider)),
                FirstStagedAtUtc = group.Min(item => item.CreatedAtUtc),
                LastUpdatedAtUtc = group.Max(item => item.UpdatedAtUtc ?? item.CreatedAtUtc),
                LastImportedAtUtc = group
                    .Where(item => item.ImportedAtUtc.HasValue)
                    .Select(item => item.ImportedAtUtc)
                    .Max()
            })
            .ToList();
    }

    [HttpGet("import-history")]
    public async Task<ActionResult<IEnumerable<BarcodeImportHistoryRowDto>>> GetImportHistory(
        [FromQuery] string? batchName,
        [FromQuery] string? source,
        [FromQuery] string? itemType,
        [FromQuery] string? importedEntityType,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] int take = 250,
        CancellationToken cancellationToken = default)
    {
        var query = context.BarcodeStagingItems
            .AsNoTracking()
            .Where(item => item.ImportedAtUtc.HasValue);

        if (!string.IsNullOrWhiteSpace(batchName))
        {
            var normalizedBatch = batchName.Trim();
            query = normalizedBatch.Equals("No batch", StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.BatchName == null)
                : query.Where(item => item.BatchName == normalizedBatch);
        }

        if (!string.IsNullOrWhiteSpace(source))
        {
            query = query.Where(item => item.Source == source.Trim());
        }

        if (!string.IsNullOrWhiteSpace(itemType))
        {
            query = query.Where(item => item.ItemType == itemType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(importedEntityType))
        {
            query = query.Where(item => item.ImportedEntityType == importedEntityType.Trim());
        }

        if (fromUtc.HasValue)
        {
            query = query.Where(item => item.ImportedAtUtc >= fromUtc.Value);
        }

        if (toUtc.HasValue)
        {
            query = query.Where(item => item.ImportedAtUtc <= toUtc.Value);
        }

        var rowLimit = Math.Clamp(take, 1, 1000);
        var rows = await query
            .OrderByDescending(item => item.ImportedAtUtc)
            .ThenBy(item => item.BatchName)
            .ThenBy(item => item.SuggestedTitle)
            .Take(rowLimit)
            .Select(item => ToImportHistoryDto(item))
            .ToListAsync(cancellationToken);

        return rows;
    }
    private static string ProviderMatchSummary(
        ISet<int> itemIds,
        IReadOnlyDictionary<int, List<BarcodeProviderCandidateSummary>> candidatesByItem)
    {
        var providerCounts = itemIds
            .SelectMany(id => candidatesByItem.TryGetValue(id, out var candidates) ? candidates : [])
            .GroupBy(candidate => candidate.Provider, StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => CandidateProviderRank(group.Key))
            .ThenBy(group => group.Key)
            .Select(group => $"{group.Key}: {group.Select(candidate => candidate.BarcodeStagingItemId).Distinct().Count()} matched");

        return string.Join("; ", providerCounts);
    }

    private static string SelectedProviderSummary(
        ISet<int> itemIds,
        IReadOnlyDictionary<int, List<BarcodeProviderCandidateSummary>> candidatesByItem,
        IEnumerable<string?> lookupProviders)
    {
        var selectedFromCandidates = itemIds
            .SelectMany(id => candidatesByItem.TryGetValue(id, out var candidates) ? candidates : [])
            .Where(candidate => candidate.Selected)
            .Select(candidate => candidate.Provider);
        var selectedFromItems = lookupProviders
            .Where(provider => !string.IsNullOrWhiteSpace(provider))
            .SelectMany(SplitProviderList);
        var selectedCounts = selectedFromCandidates
            .Concat(selectedFromItems)
            .GroupBy(provider => provider, StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => CandidateProviderRank(group.Key))
            .ThenBy(group => group.Key)
            .Select(group => $"{group.Key}: {group.Count()} selected");

        return string.Join("; ", selectedCounts);
    }

    private static string ProviderFailureSummary(IEnumerable<string?> notes)
    {
        var providerCounts = notes
            .SelectMany(note => BarcodeLookupProviderNames()
                .Where(provider => note?.Contains($"{provider} lookup failed", StringComparison.OrdinalIgnoreCase) == true
                    || note?.Contains($"{provider} lookup returned unreadable data", StringComparison.OrdinalIgnoreCase) == true))
            .GroupBy(provider => provider, StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => CandidateProviderRank(group.Key))
            .ThenBy(group => group.Key)
            .Select(group => $"{group.Key}: {group.Count()} failed");

        return string.Join("; ", providerCounts);
    }

    private static bool HasProviderFailure(string? notes)
    {
        return BarcodeLookupProviderNames()
            .Any(provider => notes?.Contains($"{provider} lookup failed", StringComparison.OrdinalIgnoreCase) == true
                || notes?.Contains($"{provider} lookup returned unreadable data", StringComparison.OrdinalIgnoreCase) == true);
    }

    private static IEnumerable<string> SplitProviderList(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static HashSet<string> ProvidersAlreadyTried(
        BarcodeStagingItem item,
        IReadOnlyList<BarcodeProviderCandidateSummary>? candidates)
    {
        return SplitProviderList(item.LookupProvider)
            .Concat(candidates?.Select(candidate => candidate.Provider) ?? Enumerable.Empty<string>())
            .Select(provider => NormalizeProvider(provider) ?? provider)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<string> BarcodeLookupProviderNames() =>
    [
        "GoogleBooks",
        "OpenLibrary",
        "Crossref",
        "MusicBrainz",
        "UPCitemdb",
        "OpenFoodFacts",
        "Discogs",
        "Wikidata"
    ];
    [HttpPost("cleanup-preview")]
    public async Task<ActionResult<BarcodeStagingCleanupResultDto>> PreviewCleanup(
        BarcodeStagingCleanupRequest request,
        CancellationToken cancellationToken)
    {
        var items = await ResolveCleanupItems(request, cancellationToken);
        var cutoff = CleanupCutoff(request);

        return new BarcodeStagingCleanupResultDto
        {
            MatchedCount = items.Count,
            DeletedCount = 0,
            CutoffUtc = cutoff,
            Items = items.Select(ToDto).ToList()
        };
    }

    [HttpPost("cleanup")]
    public async Task<ActionResult<BarcodeStagingCleanupResultDto>> Cleanup(
        BarcodeStagingCleanupRequest request,
        CancellationToken cancellationToken)
    {
        var items = await ResolveCleanupItems(request, cancellationToken);
        var cutoff = CleanupCutoff(request);
        var dtos = items.Select(ToDto).ToList();

        context.BarcodeStagingItems.RemoveRange(items);
        await context.SaveChangesAsync(cancellationToken);

        return new BarcodeStagingCleanupResultDto
        {
            MatchedCount = dtos.Count,
            DeletedCount = dtos.Count,
            CutoffUtc = cutoff,
            Items = dtos
        };
    }

    [HttpPost("import-preview")]
    public async Task<ActionResult<BarcodeImportValidationPreviewDto>> PreviewImport(
        BarcodeImportValidationRequest request,
        CancellationToken cancellationToken)
    {
        var query = context.BarcodeStagingItems.AsNoTracking();

        if (request.Ids.Count > 0)
        {
            var ids = request.Ids.Distinct().ToList();
            query = query.Where(item => ids.Contains(item.Id));
        }
        else if (!string.IsNullOrWhiteSpace(request.BatchName))
        {
            var batchName = request.BatchName.Trim();
            query = batchName.Equals("No batch", StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.BatchName == null)
                : query.Where(item => item.BatchName == batchName);
        }
        else
        {
            query = query.Where(item => item.Status == "Approved");
        }

        var items = await query
            .OrderBy(item => item.BatchName)
            .ThenBy(item => item.ItemType)
            .ThenBy(item => item.SuggestedTitle)
            .ToListAsync(cancellationToken);

        var duplicateContexts = await DuplicateCodeContexts(cancellationToken);
        var rows = new List<BarcodeImportValidationRowDto>();
        foreach (var item in items)
        {
            rows.Add(await ValidateImportRow(item, duplicateContexts, cancellationToken));
        }

        return new BarcodeImportValidationPreviewDto
        {
            TotalCount = rows.Count,
            ReadyCount = rows.Count(row => row.Severity == "Ready"),
            WarningCount = rows.Count(row => row.Severity == "Warning"),
            BlockedCount = rows.Count(row => row.Severity == "Blocked"),
            Rows = rows
        };
    }

    [HttpPost("import")]
    public async Task<ActionResult<BarcodeImportCommitResultDto>> CommitImport(
        BarcodeImportCommitRequest request,
        CancellationToken cancellationToken)
    {
        var items = await ResolveImportItems(request.Ids, request.BatchName, tracking: true, cancellationToken);
        if (items.Count == 0)
        {
            return BadRequest("No staged rows were found for import.");
        }

        var duplicateContexts = await DuplicateCodeContexts(cancellationToken);
        var messages = new List<string>();
        var imported = 0;
        var skipped = 0;

        foreach (var item in items.OrderBy(item => item.ItemType).ThenBy(item => item.SuggestedTitle))
        {
            var validation = await ValidateImportRow(item, duplicateContexts, cancellationToken);
            if (!validation.CanImport)
            {
                skipped++;
                messages.Add($"{item.NormalizedCode}: skipped - {string.Join(" ", validation.Messages)}");
                continue;
            }

            if (item.Status == "Imported" || item.ImportedEntityId is not null)
            {
                skipped++;
                messages.Add($"{item.NormalizedCode}: skipped - already imported.");
                continue;
            }

            var result = await ImportStagedItem(item, cancellationToken);
            if (result.Imported)
            {
                imported++;
            }
            else
            {
                skipped++;
            }

            messages.Add($"{item.NormalizedCode}: {result.Message}");
        }

        await context.SaveChangesAsync(cancellationToken);

        return new BarcodeImportCommitResultDto
        {
            RequestedCount = items.Count,
            ImportedCount = imported,
            SkippedCount = skipped,
            Messages = messages
        };
    }

    /*
     * The previous import-preview and import endpoints used a duplicate code set.
     * Keep the richer duplicate context path below as the single implementation so
     * preview and commit warnings stay identical.
     */
    private async Task<IReadOnlyDictionary<string, List<BarcodeStagingDuplicateContext>>> DuplicateCodeContexts(
        CancellationToken cancellationToken)
    {
        var duplicateCodes = await context.BarcodeStagingItems
            .AsNoTracking()
            .GroupBy(item => item.NormalizedCode)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToListAsync(cancellationToken);

        if (duplicateCodes.Count == 0)
        {
            return new Dictionary<string, List<BarcodeStagingDuplicateContext>>(StringComparer.OrdinalIgnoreCase);
        }

        return await context.BarcodeStagingItems
            .AsNoTracking()
            .Where(item => duplicateCodes.Contains(item.NormalizedCode))
            .Select(item => new BarcodeStagingDuplicateContext(
                item.Id,
                item.NormalizedCode,
                item.Status,
                item.ItemType,
                item.BatchName,
                item.Source,
                item.SuggestedTitle,
                item.ImportedEntityType,
                item.ImportedEntityId))
            .GroupBy(item => item.NormalizedCode)
            .ToDictionaryAsync(
                group => group.Key,
                group => group.OrderBy(item => item.Id).ToList(),
                StringComparer.OrdinalIgnoreCase,
                cancellationToken);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStagedItem(
        int id,
        BarcodeStagingUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        item.ItemType = NormalizeChoice(request.ItemType, "Unknown");
        item.Status = NormalizeChoice(request.Status, "New");
        item.SuggestedTitle = TrimToNull(request.SuggestedTitle);
        item.SuggestedCreator = TrimToNull(request.SuggestedCreator);
        item.SuggestedFormat = TrimToNull(request.SuggestedFormat);
        item.SuggestedYear = TrimToNull(request.SuggestedYear);
        item.LookupProvider = TrimToNull(request.LookupProvider);
        item.Confidence = request.Confidence;
        item.Notes = TrimToNull(request.Notes);
        item.UpdatedAtUtc = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("batch/update")]
    public async Task<ActionResult<BarcodeStagingBatchResultDto>> BatchUpdate(
        BarcodeStagingBatchUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();
        if (ids.Count == 0)
        {
            return BadRequest("Select at least one staged item.");
        }

        var items = await context.BarcodeStagingItems
            .Where(item => ids.Contains(item.Id))
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            if (!string.IsNullOrWhiteSpace(request.ItemType))
            {
                item.ItemType = NormalizeChoice(request.ItemType, item.ItemType);
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                item.Status = NormalizeChoice(request.Status, item.Status);
            }

            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                item.Notes = AppendNote(item.Notes, request.Notes.Trim());
            }

            item.UpdatedAtUtc = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);

        return new BarcodeStagingBatchResultDto
        {
            RequestedCount = ids.Count,
            UpdatedCount = items.Count,
            Messages = [$"Updated {items.Count} staged item{(items.Count == 1 ? string.Empty : "s")}."]
        };
    }

    [HttpPost("batch/lookup")]
    public async Task<ActionResult<BarcodeStagingBatchResultDto>> BatchLookup(
        BarcodeStagingBatchLookupRequest request,
        CancellationToken cancellationToken)
    {
        var ids = request.Ids.Distinct().ToList();
        var hasBatchTarget = !string.IsNullOrWhiteSpace(request.BatchName);
        if (ids.Count == 0 && !hasBatchTarget)
        {
            return BadRequest("Select staged items or choose a batch to lookup.");
        }

        var provider = NormalizeChoice(request.Provider, "Auto");
        var query = context.BarcodeStagingItems.AsQueryable();

        if (ids.Count > 0)
        {
            query = query.Where(item => ids.Contains(item.Id));
        }
        else
        {
            var batchName = request.BatchName!.Trim();
            query = batchName.Equals("No batch", StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.BatchName == null || item.BatchName == string.Empty)
                : query.Where(item => item.BatchName == batchName);

            if (!string.IsNullOrWhiteSpace(request.Source))
            {
                var source = request.Source.Trim();
                query = query.Where(item => item.Source == source);
            }
        }

        var items = await query
            .Where(item => item.Status != "Imported" && item.Status != "Rejected")
            .OrderBy(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var existingCandidates = await context.BarcodeLookupCandidates
            .AsNoTracking()
            .Where(candidate => items.Select(item => item.Id).Contains(candidate.BarcodeStagingItemId))
            .Select(candidate => new BarcodeProviderCandidateSummary(candidate.BarcodeStagingItemId, candidate.Provider, candidate.Selected))
            .ToListAsync(cancellationToken);

        var candidatesByItem = existingCandidates
            .GroupBy(candidate => candidate.BarcodeStagingItemId)
            .ToDictionary(group => group.Key, group => group.ToList());

        if (request.RetryMissingOnly)
        {
            items = items
                .Where(item =>
                    !candidatesByItem.TryGetValue(item.Id, out var candidates)
                    || candidates.Count == 0
                    || request.FallbackProvidersOnly && (HasProviderFailure(item.Notes) || item.Confidence is < 50))
                .ToList();
        }

        var messages = new List<string>();
        var attempted = 0;
        var matched = 0;
        var needsReview = 0;
        var skipped = 0;

        foreach (var item in items)
        {
            var selectedProviders = await ResolveLookupProviders(item, provider, cancellationToken);
            var providerOrder = string.Join(" > ", selectedProviders);
            if (request.FallbackProvidersOnly)
            {
                var alreadyTried = ProvidersAlreadyTried(item, candidatesByItem.GetValueOrDefault(item.Id));
                selectedProviders = selectedProviders
                    .Where(candidateProvider => !alreadyTried.Contains(candidateProvider))
                    .ToList();

                var skippedProviders = string.Join(", ", alreadyTried
                    .Where(triedProvider => NormalizeProvider(triedProvider) is not null)
                    .OrderBy(CandidateProviderRank));
                providerOrder = string.Join(" > ", selectedProviders);
                if (!string.IsNullOrWhiteSpace(skippedProviders))
                {
                    messages.Add($"{item.NormalizedCode}: fallback skipped already-tried providers {skippedProviders}.");
                }
            }

            if (selectedProviders.Count == 0)
            {
                item.Status = "NeedsReview";
                item.Notes = AppendNote(item.Notes, request.FallbackProvidersOnly
                    ? "No fallback lookup provider remains for this staged item."
                    : $"No lookup provider is available for {item.CodeType}.");
                item.UpdatedAtUtc = DateTime.UtcNow;
                needsReview += 1;
                skipped += 1;
                continue;
            }

            attempted += 1;
            var result = await RunLookupInternal(item, selectedProviders, cancellationToken);
            if (!string.IsNullOrWhiteSpace(providerOrder))
            {
                messages.Add($"{item.NormalizedCode}: provider order {providerOrder}.");
            }

            if (result.Candidates.Count > 0)
            {
                matched += 1;
            }
            else
            {
                needsReview += 1;
            }

            messages.Add($"{item.NormalizedCode}: {result.Message}");
        }

        await context.SaveChangesAsync(cancellationToken);

        if (request.RetryMissingOnly && items.Count == 0)
        {
            messages.Add("No missing lookup rows were found for the selected target.");
        }

        if (request.FallbackProvidersOnly && skipped > 0)
        {
            messages.Add($"Skipped {skipped} item{(skipped == 1 ? string.Empty : "s")} with no fallback provider remaining.");
        }

        return new BarcodeStagingBatchResultDto
        {
            RequestedCount = ids.Count > 0 ? ids.Count : items.Count,
            UpdatedCount = items.Count,
            LookupAttemptedCount = attempted,
            MatchedCount = matched,
            NeedsReviewCount = needsReview,
            Messages = messages
        };
    }
    [HttpGet("{id:int}/candidates")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> GetLookupCandidates(
        int id,
        CancellationToken cancellationToken)
    {
        var exists = await context.BarcodeStagingItems
            .AnyAsync(item => item.Id == id, cancellationToken);

        if (!exists)
        {
            return NotFound();
        }

        var candidates = await context.BarcodeLookupCandidates
            .AsNoTracking()
            .Where(candidate => candidate.BarcodeStagingItemId == id)
            .OrderByDescending(candidate => candidate.Selected)
            .ThenByDescending(candidate => candidate.Confidence)
            .ThenBy(candidate => candidate.Provider)
            .Select(candidate => ToDto(candidate))
            .ToListAsync(cancellationToken);

        return candidates;
    }

    [HttpPost("{id:int}/lookup/auto")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupAuto(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        var providers = await ResolveLookupProviders(item, "Auto", cancellationToken);
        if (providers.Count == 0)
        {
            return BadRequest($"No enabled lookup providers are available for {item.CodeType}.");
        }

        var result = await RunLookupInternal(item, providers, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        if (!result.Succeeded)
        {
            return Problem(result.Message);
        }

        return await CandidatesForItem(item.Id, cancellationToken);
    }
    [HttpPost("{id:int}/lookup/open-library")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupOpenLibrary(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsIsbn(item.CodeType))
        {
            return BadRequest("Open Library lookup requires an ISBN10 or ISBN13 staged item.");
        }

        var result = await RunLookupInternal(item, ["OpenLibrary"], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        if (!result.Succeeded)
        {
            return Problem(result.Message);
        }

        return await context.BarcodeLookupCandidates
            .AsNoTracking()
            .Where(candidate => candidate.BarcodeStagingItemId == id)
            .OrderByDescending(candidate => candidate.Selected)
            .ThenByDescending(candidate => candidate.Confidence)
            .Select(candidate => ToDto(candidate))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("{id:int}/lookup/google-books")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupGoogleBooks(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsIsbn(item.CodeType))
        {
            return BadRequest("Google Books lookup requires an ISBN10 or ISBN13 staged item.");
        }

        return await RunLookup(
            item,
            "GoogleBooks",
            () => googleBooksLookupService.LookupIsbnAsync(item, cancellationToken),
            cancellationToken);
    }

    [HttpPost("{id:int}/lookup/crossref")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupCrossref(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsIsbn(item.CodeType))
        {
            return BadRequest("Crossref lookup requires an ISBN10 or ISBN13 staged item.");
        }

        return await RunLookup(
            item,
            "Crossref",
            () => crossrefLookupService.LookupIsbnAsync(item, cancellationToken),
            cancellationToken);
    }

    [HttpPost("{id:int}/lookup/musicbrainz")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupMusicBrainz(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsBarcode(item.CodeType))
        {
            return BadRequest("MusicBrainz lookup requires a UPC, EAN8, or EAN13 staged item.");
        }

        return await RunLookup(
            item,
            "MusicBrainz",
            () => musicBrainzLookupService.LookupBarcodeAsync(item, cancellationToken),
            cancellationToken);
    }

    [HttpPost("{id:int}/lookup/upcitemdb")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupUpcItemDb(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsBarcode(item.CodeType))
        {
            return BadRequest("UPCitemdb lookup requires a UPC, EAN8, or EAN13 staged item.");
        }

        return await RunLookup(
            item,
            "UPCitemdb",
            () => upcItemDbLookupService.LookupBarcodeAsync(item, cancellationToken),
            cancellationToken);
    }

    [HttpPost("{id:int}/lookup/open-food-facts")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupOpenFoodFacts(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsBarcode(item.CodeType))
        {
            return BadRequest("Open Food Facts lookup requires a UPC, EAN8, or EAN13 staged item.");
        }

        return await RunLookup(
            item,
            "OpenFoodFacts",
            () => openFoodFactsLookupService.LookupBarcodeAsync(item, cancellationToken),
            cancellationToken);
    }
    [HttpPost("{id:int}/lookup/discogs")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupDiscogs(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsBarcode(item.CodeType))
        {
            return BadRequest("Discogs lookup requires a UPC, EAN8, or EAN13 staged item.");
        }

        return await RunLookup(
            item,
            "Discogs",
            () => discogsLookupService.LookupBarcodeAsync(item, cancellationToken),
            cancellationToken);
    }

    [HttpPost("{id:int}/lookup/wikidata")]
    public async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> LookupWikidata(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (!IsIsbn(item.CodeType) && !IsBarcode(item.CodeType))
        {
            return BadRequest("Wikidata lookup requires an ISBN, UPC, EAN8, or EAN13 staged item.");
        }

        return await RunLookup(
            item,
            "Wikidata",
            () => wikidataLookupService.LookupBarcodeAsync(item, cancellationToken),
            cancellationToken);
    }

    [HttpPost("{id:int}/candidates/{candidateId:int}/select")]
    public async Task<ActionResult<BarcodeStagingItemDto>> SelectLookupCandidate(
        int id,
        int candidateId,
        CancellationToken cancellationToken)
    {
        var item = await context.BarcodeStagingItems.FindAsync([id], cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        var candidates = await context.BarcodeLookupCandidates
            .Where(candidate => candidate.BarcodeStagingItemId == id)
            .ToListAsync(cancellationToken);
        var selected = candidates.FirstOrDefault(candidate => candidate.Id == candidateId);

        if (selected is null)
        {
            return NotFound();
        }

        foreach (var candidate in candidates)
        {
            candidate.Selected = candidate.Id == candidateId;
        }

        ApplyCandidateToStagingItem(item, selected, selected: true);
        item.Status = "Matched";
        item.UpdatedAtUtc = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return ToDto(item);
    }

    private static string NormalizeCode(string? upc)
    {
        return string.IsNullOrWhiteSpace(upc)
            ? string.Empty
            : new string(upc.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
    }

    private static string DetectCodeType(string code)
    {
        if (code.Length == 10 && IsIsbn10(code))
        {
            return "ISBN10";
        }

        if (code.Length == 13 && IsDigits(code) && (code.StartsWith("978") || code.StartsWith("979")))
        {
            return "ISBN13";
        }

        if (code.Length == 12 && IsDigits(code))
        {
            return "UPC";
        }

        if (code.Length == 13 && IsDigits(code))
        {
            return "EAN13";
        }

        if (code.Length == 8 && IsDigits(code))
        {
            return "EAN8";
        }

        return "Unknown";
    }

    private static bool IsIsbn(string codeType)
    {
        return string.Equals(codeType, "ISBN10", StringComparison.OrdinalIgnoreCase)
            || string.Equals(codeType, "ISBN13", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsBarcode(string codeType)
    {
        return string.Equals(codeType, "UPC", StringComparison.OrdinalIgnoreCase)
            || string.Equals(codeType, "EAN8", StringComparison.OrdinalIgnoreCase)
            || string.Equals(codeType, "EAN13", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDigits(string value)
    {
        return value.All(char.IsDigit);
    }

    private static bool IsIsbn10(string value)
    {
        return value.Take(9).All(char.IsDigit) && (char.IsDigit(value[9]) || value[9] == 'X');
    }

    private static string NormalizeChoice(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }

    private static string? TrimToNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? AppendNote(string? existingNotes, string note)
    {
        return string.IsNullOrWhiteSpace(existingNotes)
            ? note
            : $"{existingNotes}{Environment.NewLine}{note}";
    }

    private static void ApplyCandidateToStagingItem(
        BarcodeStagingItem item,
        BarcodeLookupCandidate candidate,
        bool selected)
    {
        item.ItemType = InferCandidateItemType(candidate);
        item.SuggestedTitle = candidate.Title;
        item.SuggestedCreator = candidate.Creator;
        item.SuggestedFormat = NormalizeCandidateFormat(candidate);
        item.SuggestedYear = candidate.PublishDate;
        item.LookupProvider = candidate.Provider;
        item.Confidence = candidate.Confidence;
        item.RawLookupJson = candidate.RawJson;
        candidate.Selected = selected;
    }

    private async Task<ActionResult<IEnumerable<BarcodeLookupCandidateDto>>> RunLookup(
        BarcodeStagingItem item,
        string provider,
        Func<Task<IReadOnlyList<BarcodeLookupCandidate>>> lookup,
        CancellationToken cancellationToken)
    {
        var result = await RunLookupInternal(item, [provider], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        if (!result.Succeeded)
        {
            return Problem(result.Message);
        }

        return await CandidatesForItem(item.Id, cancellationToken);
    }

    private async Task<LookupRunResult> RunLookupInternal(
        BarcodeStagingItem item,
        IReadOnlyList<string> providers,
        CancellationToken cancellationToken)
    {
        item.Status = "LookupPending";
        item.UpdatedAtUtc = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        var existingCandidates = await context.BarcodeLookupCandidates
            .Where(candidate => candidate.BarcodeStagingItemId == item.Id && providers.Contains(candidate.Provider))
            .ToListAsync(cancellationToken);

        context.BarcodeLookupCandidates.RemoveRange(existingCandidates);
        var allCandidates = new List<BarcodeLookupCandidate>();
        var messages = new List<string>();

        foreach (var provider in providers)
        {
            IReadOnlyList<BarcodeLookupCandidate> candidates;
            try
            {
                candidates = provider switch
                {
                    "OpenLibrary" => await openLibraryLookupService.LookupIsbnAsync(item, cancellationToken),
                    "GoogleBooks" => await googleBooksLookupService.LookupIsbnAsync(item, cancellationToken),
                    "Crossref" => await crossrefLookupService.LookupIsbnAsync(item, cancellationToken),
                    "MusicBrainz" => await musicBrainzLookupService.LookupBarcodeAsync(item, cancellationToken),
                    "UPCitemdb" => await upcItemDbLookupService.LookupBarcodeAsync(item, cancellationToken),
                    "OpenFoodFacts" => await openFoodFactsLookupService.LookupBarcodeAsync(item, cancellationToken),
                    "Discogs" => await discogsLookupService.LookupBarcodeAsync(item, cancellationToken),
                    "Wikidata" => await wikidataLookupService.LookupBarcodeAsync(item, cancellationToken),
                    _ => []
                };
            }
            catch (HttpRequestException ex)
            {
                item.Notes = AppendNote(item.Notes, $"{provider} lookup failed: {ex.Message}");
                messages.Add($"{provider} failed");
                continue;
            }
            catch (System.Text.Json.JsonException ex)
            {
                item.Notes = AppendNote(item.Notes, $"{provider} lookup returned unreadable data: {ex.Message}");
                messages.Add($"{provider} returned unreadable data");
                continue;
            }

            allCandidates.AddRange(candidates);
            messages.Add(candidates.Count > 0
                ? $"{provider} matched {candidates.Count}"
                : $"{provider} found none");
        }

        if (allCandidates.Count > 0)
        {
            context.BarcodeLookupCandidates.AddRange(allCandidates);
            ApplyCandidateToStagingItem(item, BestCandidate(allCandidates), selected: false);
            item.Status = "Matched";
        }
        else
        {
            item.Status = "NeedsReview";
            item.LookupProvider = string.Join(",", providers);
            item.Confidence = 0;
        }

        item.UpdatedAtUtc = DateTime.UtcNow;

        return new LookupRunResult(true, allCandidates, string.Join("; ", messages));
    }

    private async Task<List<BarcodeLookupCandidateDto>> CandidatesForItem(int itemId, CancellationToken cancellationToken)
    {
        return await context.BarcodeLookupCandidates
            .AsNoTracking()
            .Where(candidate => candidate.BarcodeStagingItemId == itemId)
            .OrderByDescending(candidate => candidate.Selected)
            .ThenByDescending(candidate => candidate.Confidence)
            .ThenBy(candidate => candidate.Provider)
            .Select(candidate => ToDto(candidate))
            .ToListAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<string>> ResolveLookupProviders(
        BarcodeStagingItem item,
        string requestedProvider,
        CancellationToken cancellationToken)
    {
        if (requestedProvider.Equals("Auto", StringComparison.OrdinalIgnoreCase))
        {
            var settings = await ReadBarcodeLookupSettings(cancellationToken);
            return settings.Providers
                .Where(provider => provider.Enabled && IsProviderValidForItem(provider.Provider, item))
                .OrderBy(provider => provider.Priority)
                .Select(provider => provider.Provider)
                .ToList();
        }

        var normalizedProvider = NormalizeProvider(requestedProvider);
        return normalizedProvider is not null && IsProviderValidForItem(normalizedProvider, item)
            ? [normalizedProvider]
            : [];
    }

    private async Task<BarcodeLookupSettingsDto> ReadBarcodeLookupSettings(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == AdminSettingsController.BarcodeLookupSettingsKey, cancellationToken);

        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return AdminSettingsController.BarcodeLookupDefaults();
        }

        try
        {
            return AdminSettingsController.Normalize(
                System.Text.Json.JsonSerializer.Deserialize<BarcodeLookupSettingsDto>(setting.ValueJson)
                ?? AdminSettingsController.BarcodeLookupDefaults());
        }
        catch (System.Text.Json.JsonException)
        {
            return AdminSettingsController.BarcodeLookupDefaults();
        }
    }

    private static bool IsProviderValidForItem(string provider, BarcodeStagingItem item)
    {
        return provider switch
        {
            "OpenLibrary" or "GoogleBooks" or "Crossref" => IsIsbn(item.CodeType),
            "MusicBrainz" or "UPCitemdb" or "OpenFoodFacts" or "Discogs" => IsBarcode(item.CodeType),
            "Wikidata" => IsIsbn(item.CodeType) || IsBarcode(item.CodeType),
            _ => false
        };
    }

    private static string? NormalizeProvider(string provider)
    {
        return provider.Equals("OpenLibrary", StringComparison.OrdinalIgnoreCase) ? "OpenLibrary"
            : provider.Equals("GoogleBooks", StringComparison.OrdinalIgnoreCase) ? "GoogleBooks"
            : provider.Equals("Crossref", StringComparison.OrdinalIgnoreCase) ? "Crossref"
            : provider.Equals("MusicBrainz", StringComparison.OrdinalIgnoreCase) ? "MusicBrainz"
            : provider.Equals("UPCitemdb", StringComparison.OrdinalIgnoreCase) ? "UPCitemdb"
            : provider.Equals("OpenFoodFacts", StringComparison.OrdinalIgnoreCase) ? "OpenFoodFacts"
            : provider.Equals("Discogs", StringComparison.OrdinalIgnoreCase) ? "Discogs"
            : provider.Equals("Wikidata", StringComparison.OrdinalIgnoreCase) ? "Wikidata"
            : null;
    }

    private static BarcodeLookupCandidate BestCandidate(IReadOnlyList<BarcodeLookupCandidate> candidates)
    {
        return candidates
            .OrderByDescending(candidate => candidate.Confidence ?? 0)
            .ThenByDescending(candidate => CandidateCompleteness(candidate))
            .ThenBy(candidate => CandidateProviderRank(candidate.Provider))
            .First();
    }

    private static int CandidateCompleteness(BarcodeLookupCandidate candidate)
    {
        return new[]
        {
            candidate.Title,
            candidate.Creator,
            candidate.Publisher,
            candidate.PublishDate,
            candidate.Format,
            candidate.CoverImageUrl
        }.Count(value => !string.IsNullOrWhiteSpace(value));
    }

    private static int CandidateProviderRank(string provider)
    {
        return provider switch
        {
            "OpenLibrary" => 10,
            "GoogleBooks" => 20,
            "Crossref" => 25,
            "MusicBrainz" => 30,
            "UPCitemdb" => 40,
            "OpenFoodFacts" => 50,
            "Discogs" => 60,
            "Wikidata" => 70,
            _ => 999
        };
    }

    private static string InferCandidateItemType(BarcodeLookupCandidate candidate)
    {
        if (candidate.Provider.Equals("OpenLibrary", StringComparison.OrdinalIgnoreCase)
            || candidate.Provider.Equals("GoogleBooks", StringComparison.OrdinalIgnoreCase)
            || candidate.Provider.Equals("Crossref", StringComparison.OrdinalIgnoreCase))
        {
            return "Book";
        }

        if (candidate.Provider.Equals("MusicBrainz", StringComparison.OrdinalIgnoreCase)
            || candidate.Provider.Equals("Discogs", StringComparison.OrdinalIgnoreCase))
        {
            return "CD";
        }

        var haystack = $"{candidate.Title} {candidate.Creator} {candidate.Publisher} {candidate.Format}".ToUpperInvariant();
        if (ContainsAny(haystack, "BOOK", "PAPERBACK", "HARDCOVER", "ISBN"))
        {
            return "Book";
        }

        if (ContainsAny(haystack, "MUSIC", "AUDIO CD", "COMPACT DISC", "VINYL", "LP", "CASSETTE"))
        {
            return "CD";
        }

        if (ContainsAny(haystack, "DVD", "BLU-RAY", "BLURAY", "MOVIE", "FILM", "VIDEO"))
        {
            return "DVD";
        }

        return "Other";
    }

    private static string? NormalizeCandidateFormat(BarcodeLookupCandidate candidate)
    {
        var itemType = InferCandidateItemType(candidate);
        if (itemType == "Book")
        {
            return NormalizeBookFormat(candidate.Format);
        }

        if (itemType == "CD")
        {
            return NormalizeMusicFormat(candidate.Format);
        }

        if (itemType == "DVD")
        {
            return NormalizeMovieFormat(candidate.Format);
        }

        return TrimToNull(candidate.Format);
    }

    private static bool ContainsAny(string value, params string[] needles)
    {
        return needles.Any(needle => value.Contains(needle, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsReadyToImport(BarcodeStagingItem item)
    {
        return item.Status == "Approved"
            && !item.ItemType.Equals("Unknown", StringComparison.OrdinalIgnoreCase)
            && !item.ItemType.Equals("Other", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(item.SuggestedTitle);
    }

    private async Task<BarcodeImportValidationRowDto> ValidateImportRow(
        BarcodeStagingItem item,
        IReadOnlyDictionary<string, List<BarcodeStagingDuplicateContext>> duplicateContexts,
        CancellationToken cancellationToken)
    {
        var blocking = new List<string>();
        var warnings = new List<string>();

        if (item.Status != "Approved")
        {
            blocking.Add("Status must be Approved before import.");
        }

        if (item.ItemType.Equals("Unknown", StringComparison.OrdinalIgnoreCase))
        {
            blocking.Add("Item type must be set.");
        }

        if (!IsSupportedImportType(item.ItemType))
        {
            blocking.Add("Only Book, CD, and DVD barcode imports can be committed right now.");
        }

        if (item.Status == "Imported" || item.ImportedEntityId is not null)
        {
            blocking.Add("This staged row has already been imported.");
        }

        if (string.IsNullOrWhiteSpace(item.SuggestedTitle))
        {
            blocking.Add("Suggested title is required.");
        }

        warnings.AddRange(CommitReadinessWarnings(item));

        if (item.CodeType.Equals("Unknown", StringComparison.OrdinalIgnoreCase))
        {
            warnings.Add("Code type is unknown.");
        }

        if (duplicateContexts.TryGetValue(item.NormalizedCode, out var stagedDuplicates))
        {
            warnings.Add(StagingDuplicateMessage(item, stagedDuplicates));
        }

        var inventorySignals = await FindInventoryDuplicateSignals(item, cancellationToken);
        if (inventorySignals.ExactBarcodeMatches.Count > 0)
        {
            blocking.AddRange(inventorySignals.ExactBarcodeMatches);
        }

        warnings.AddRange(inventorySignals.TitleMatches);

        if (item.Confidence is < 50)
        {
            warnings.Add("Lookup confidence is below 50.");
        }

        var severity = blocking.Count > 0 ? "Blocked" : warnings.Count > 0 ? "Warning" : "Ready";

        return new BarcodeImportValidationRowDto
        {
            Item = ToDto(item),
            CanImport = blocking.Count == 0,
            Severity = severity,
            Messages = blocking.Concat(warnings).ToList()
        };
    }

    private static string StagingDuplicateMessage(
        BarcodeStagingItem item,
        IReadOnlyList<BarcodeStagingDuplicateContext> duplicateRows)
    {
        var otherRows = duplicateRows
            .Where(row => row.Id != item.Id)
            .Take(4)
            .Select(row =>
            {
                var title = string.IsNullOrWhiteSpace(row.SuggestedTitle) ? "No title" : row.SuggestedTitle.Trim();
                var batch = string.IsNullOrWhiteSpace(row.BatchName) ? "No batch" : row.BatchName.Trim();
                var imported = row.ImportedEntityId.HasValue
                    ? $", imported as {row.ImportedEntityType ?? "item"} #{row.ImportedEntityId}"
                    : string.Empty;

                return $"row #{row.Id} [{row.Status}/{row.ItemType}/{row.Source}/{batch}: {title}{imported}]";
            })
            .ToList();

        var remainingCount = Math.Max(0, duplicateRows.Count - 1 - otherRows.Count);
        var remainingText = remainingCount > 0
            ? $" plus {remainingCount} more duplicate row{(remainingCount == 1 ? string.Empty : "s")}"
            : string.Empty;

        return $"Staging duplicate normalized code: {item.NormalizedCode} also appears on {string.Join("; ", otherRows)}{remainingText}.";
    }

    private static IReadOnlyList<string> CommitReadinessWarnings(BarcodeStagingItem item)
    {
        var warnings = new List<string>();

        if (item.ItemType.Equals("Book", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(item.SuggestedCreator))
            {
                warnings.Add("Book has no author; import will create/use an Unknown author.");
            }

            if (string.IsNullOrWhiteSpace(item.SuggestedFormat))
            {
                warnings.Add("Book format is blank; import will default to Hardcover.");
            }
            else if (!IsKnownBookFormat(item.SuggestedFormat))
            {
                warnings.Add($"Book format '{item.SuggestedFormat}' is not one of the standard formats.");
            }
        }
        else if (item.ItemType.Equals("CD", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(item.SuggestedCreator))
            {
                warnings.Add("CD has no artist; import will create/use (Unknown).");
            }

            if (string.IsNullOrWhiteSpace(item.SuggestedFormat))
            {
                warnings.Add("Music format is blank; import will default to CD.");
            }
            else if (!IsKnownMusicFormat(item.SuggestedFormat))
            {
                warnings.Add($"Music format '{item.SuggestedFormat}' will normalize to CD.");
            }
        }
        else if (item.ItemType.Equals("DVD", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(item.SuggestedCreator))
            {
                warnings.Add("DVD has no creator/studio.");
            }

            if (string.IsNullOrWhiteSpace(item.SuggestedFormat))
            {
                warnings.Add("Video format is blank; import will default to DVD.");
            }
            else if (!IsKnownMovieFormat(item.SuggestedFormat))
            {
                warnings.Add($"Video format '{item.SuggestedFormat}' will normalize to DVD.");
            }
        }

        if (string.IsNullOrWhiteSpace(item.LookupProvider))
        {
            warnings.Add("No lookup provider is recorded for this staged row.");
        }

        return warnings;
    }

    private async Task<InventoryDuplicateSignals> FindInventoryDuplicateSignals(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(item.SuggestedTitle) || !IsSupportedImportType(item.ItemType))
        {
            return InventoryDuplicateSignals.Empty;
        }

        if (item.ItemType.Equals("Book", StringComparison.OrdinalIgnoreCase))
        {
            return await FindBookDuplicateSignals(item, cancellationToken);
        }

        if (item.ItemType.Equals("CD", StringComparison.OrdinalIgnoreCase))
        {
            return await FindMusicDuplicateSignals(item, cancellationToken);
        }

        if (item.ItemType.Equals("DVD", StringComparison.OrdinalIgnoreCase))
        {
            return await FindMovieDuplicateSignals(item, cancellationToken);
        }

        return InventoryDuplicateSignals.Empty;
    }

    private async Task<InventoryDuplicateSignals> FindBookDuplicateSignals(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var title = item.SuggestedTitle!.Trim();
        var authorParts = SplitPersonName(item.SuggestedCreator);
        var titleKey = DuplicateTextKey(title);
        var authorKey = DuplicateTextKey(FormatPersonName(authorParts));

        var possibleBooks = await context.Books
            .AsNoTracking()
            .Include(book => book.Author)
            .Where(book => book.Title != null && book.Author != null)
            .Select(book => new
            {
                book.Title,
                FirstName = book.Author!.Fname,
                Middle = book.Author.Middle,
                LastName = book.Author.LName
            })
            .Take(5000)
            .ToListAsync(cancellationToken);

        var exactTitleAuthorMatch = possibleBooks.Any(book =>
            DuplicateTextKey(book.Title) == titleKey
            && DuplicateTextKey(FormatPersonName((book.FirstName, book.Middle, book.LastName))) == authorKey);
        var similarTitleMatches = possibleBooks
            .Where(book => IsSimilarDuplicateTitle(titleKey, DuplicateTextKey(book.Title)))
            .Select(book => $"{book.Title} by {FormatPersonName((book.FirstName, book.Middle, book.LastName))}")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();

        var warnings = new List<string>();
        if (exactTitleAuthorMatch)
        {
            warnings.Add($"Normalized Book title/author match already exists: {title} by {FormatPersonName(authorParts)}.");
        }

        if (similarTitleMatches.Count > 0)
        {
            warnings.Add($"Normalized Book similar-title review: {string.Join("; ", similarTitleMatches)}.");
        }

        if (IsIsbn(item.CodeType))
        {
            warnings.Add("Book ISBN/barcode storage limitation: Books does not currently store ISBN/barcode, so this preview can only compare normalized title and author.");
        }

        return warnings.Count > 0 ? new InventoryDuplicateSignals([], warnings) : InventoryDuplicateSignals.Empty;
    }

    private async Task<InventoryDuplicateSignals> FindMusicDuplicateSignals(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var title = item.SuggestedTitle!.Trim();
        var artist = string.IsNullOrWhiteSpace(item.SuggestedCreator) ? "(Unknown)" : item.SuggestedCreator.Trim();
        var barcodeMarker = $"Barcode: {item.NormalizedCode}";
        var titleKey = DuplicateTextKey(title);
        var artistKey = DuplicateTextKey(artist);

        var exactBarcodeMatch = await context.MusicAlbumInfos
            .AsNoTracking()
            .AnyAsync(info => info.InfoText != null && info.InfoText.Contains(barcodeMarker), cancellationToken);

        var possibleAlbums = await context.Albums
            .AsNoTracking()
            .Include(album => album.Band)
            .Where(album => album.Title != null)
            .Select(album => new
            {
                album.Title,
                Artist = album.Band != null ? album.Band.Band : null
            })
            .Take(5000)
            .ToListAsync(cancellationToken);

        var titleMatch = possibleAlbums.Any(album =>
            DuplicateTextKey(album.Title) == titleKey
            && DuplicateTextKey(album.Artist) == artistKey);
        var similarTitleMatches = possibleAlbums
            .Where(album => IsSimilarDuplicateTitle(titleKey, DuplicateTextKey(album.Title)))
            .Select(album => $"{album.Artist ?? "(Unknown)"} - {album.Title}")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();

        var warnings = new List<string>();
        if (titleMatch)
        {
            warnings.Add($"Normalized CD title/artist match already exists: {artist} - {title}.");
        }

        if (similarTitleMatches.Count > 0)
        {
            warnings.Add($"Normalized CD similar-title review: {string.Join("; ", similarTitleMatches)}.");
        }

        return new InventoryDuplicateSignals(
            exactBarcodeMatch ? [$"CD barcode blocker: this barcode already appears on an imported CD/MusicAlbum: {item.NormalizedCode}."] : [],
            warnings);
    }

    private async Task<InventoryDuplicateSignals> FindMovieDuplicateSignals(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var title = item.SuggestedTitle!.Trim();
        var format = NormalizeMovieFormat(item.SuggestedFormat);
        var titleKey = DuplicateTextKey(title);
        var formatKey = DuplicateTextKey(format);

        var exactBarcodeMatch = await context.MovieInventoryItems
            .AsNoTracking()
            .AnyAsync(movie => movie.Barcode == item.NormalizedCode, cancellationToken);

        var possibleMovies = await context.MovieInventoryItems
            .AsNoTracking()
            .Where(movie => movie.Title != null)
            .Select(movie => new
            {
                movie.Title,
                movie.Format
            })
            .Take(5000)
            .ToListAsync(cancellationToken);

        var titleMatch = possibleMovies.Any(movie =>
            DuplicateTextKey(movie.Title) == titleKey
            && DuplicateTextKey(movie.Format) == formatKey);
        var similarTitleMatches = possibleMovies
            .Where(movie => IsSimilarDuplicateTitle(titleKey, DuplicateTextKey(movie.Title)))
            .Select(movie => $"{movie.Title} ({movie.Format})")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();

        var warnings = new List<string>();
        if (titleMatch)
        {
            warnings.Add($"Normalized DVD title/format match already exists: {title} ({format}).");
        }

        if (similarTitleMatches.Count > 0)
        {
            warnings.Add($"Normalized DVD/Movie similar-title review: {string.Join("; ", similarTitleMatches)}.");
        }

        return new InventoryDuplicateSignals(
            exactBarcodeMatch ? [$"DVD barcode blocker: this barcode already exists in MovieInventoryItems: {item.NormalizedCode}."] : [],
            warnings);
    }

    private static string DuplicateTextKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = new string(value
            .ToUpperInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray());

        return normalized.StartsWith("THE", StringComparison.Ordinal) && normalized.Length > 3
            ? normalized[3..]
            : normalized;
    }

    private static bool IsSimilarDuplicateTitle(string left, string right)
    {
        if (left.Length < 6 || right.Length < 6 || left == right)
        {
            return false;
        }

        return left.Contains(right, StringComparison.Ordinal)
            || right.Contains(left, StringComparison.Ordinal);
    }

    private static BarcodeStagingItemDto ToDto(BarcodeStagingItem item)
    {
        return new BarcodeStagingItemDto
        {
            Id = item.Id,
            Upc = item.Upc,
            NormalizedCode = item.NormalizedCode,
            CodeType = item.CodeType,
            Source = item.Source,
            BatchName = item.BatchName,
            ItemType = item.ItemType,
            Status = item.Status,
            SuggestedTitle = item.SuggestedTitle,
            SuggestedCreator = item.SuggestedCreator,
            SuggestedFormat = item.SuggestedFormat,
            SuggestedYear = item.SuggestedYear,
            LookupProvider = item.LookupProvider,
            Confidence = item.Confidence,
            Notes = item.Notes,
            ImportedEntityType = item.ImportedEntityType,
            ImportedEntityId = item.ImportedEntityId,
            ImportedAtUtc = item.ImportedAtUtc,
            CreatedAtUtc = item.CreatedAtUtc,
            UpdatedAtUtc = item.UpdatedAtUtc
        };
    }

    private static BarcodeImportHistoryRowDto ToImportHistoryDto(BarcodeStagingItem item)
    {
        return new BarcodeImportHistoryRowDto
        {
            Id = item.Id,
            Upc = item.Upc,
            NormalizedCode = item.NormalizedCode,
            CodeType = item.CodeType,
            Source = item.Source,
            BatchName = item.BatchName,
            ItemType = item.ItemType,
            Status = item.Status,
            SuggestedTitle = item.SuggestedTitle,
            SuggestedCreator = item.SuggestedCreator,
            SuggestedFormat = item.SuggestedFormat,
            SuggestedYear = item.SuggestedYear,
            LookupProvider = item.LookupProvider,
            Confidence = item.Confidence,
            ImportedEntityType = item.ImportedEntityType,
            ImportedEntityId = item.ImportedEntityId,
            ImportedAtUtc = item.ImportedAtUtc ?? item.UpdatedAtUtc ?? item.CreatedAtUtc,
            CreatedAtUtc = item.CreatedAtUtc
        };
    }
    private async Task<List<BarcodeStagingItem>> ResolveImportItems(
        IReadOnlyList<int> ids,
        string? batchName,
        bool tracking,
        CancellationToken cancellationToken)
    {
        var query = context.BarcodeStagingItems.AsQueryable();
        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        if (ids.Count > 0)
        {
            var distinctIds = ids.Distinct().ToList();
            query = query.Where(item => distinctIds.Contains(item.Id));
        }
        else if (!string.IsNullOrWhiteSpace(batchName))
        {
            var normalizedBatch = batchName.Trim();
            query = normalizedBatch.Equals("No batch", StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.BatchName == null)
                : query.Where(item => item.BatchName == normalizedBatch);
        }
        else
        {
            query = query.Where(item => item.Status == "Approved");
        }

        return await query
            .OrderBy(item => item.BatchName)
            .ThenBy(item => item.ItemType)
            .ThenBy(item => item.SuggestedTitle)
            .ToListAsync(cancellationToken);
    }

    private async Task<List<BarcodeStagingItem>> ResolveCleanupItems(
        BarcodeStagingCleanupRequest request,
        CancellationToken cancellationToken)
    {
        var cutoff = CleanupCutoff(request);
        var statuses = NormalizeCleanupStatuses(request.Statuses);
        var query = context.BarcodeStagingItems
            .Where(item => statuses.Contains(item.Status))
            .Where(item => (item.ImportedAtUtc ?? item.UpdatedAtUtc ?? item.CreatedAtUtc) < cutoff);

        if (!string.IsNullOrWhiteSpace(request.BatchName))
        {
            var batchName = request.BatchName.Trim();
            query = batchName.Equals("No batch", StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.BatchName == null)
                : query.Where(item => item.BatchName == batchName);
        }

        if (!string.IsNullOrWhiteSpace(request.Source))
        {
            var source = request.Source.Trim();
            query = query.Where(item => item.Source == source);
        }

        return await query
            .OrderBy(item => item.BatchName)
            .ThenBy(item => item.Status)
            .ThenBy(item => item.UpdatedAtUtc ?? item.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    private static DateTime CleanupCutoff(BarcodeStagingCleanupRequest request)
    {
        return DateTime.UtcNow.AddDays(-Math.Clamp(request.OlderThanDays, 1, 3650));
    }

    private static List<string> NormalizeCleanupStatuses(IReadOnlyList<string> statuses)
    {
        var normalized = statuses
            .Select(status => NormalizeChoice(status, string.Empty))
            .Where(status => status is "Imported" or "Rejected")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return normalized.Count == 0 ? ["Imported", "Rejected"] : normalized;
    }

    private async Task<ImportItemResult> ImportStagedItem(BarcodeStagingItem item, CancellationToken cancellationToken)
    {
        if (item.ItemType.Equals("Book", StringComparison.OrdinalIgnoreCase))
        {
            var book = await CreateBookFromStaging(item, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
            MarkImported(item, "Book", book.ID);
            return new ImportItemResult(true, $"imported Book #{book.ID}.");
        }

        if (item.ItemType.Equals("CD", StringComparison.OrdinalIgnoreCase))
        {
            var album = await CreateMusicAlbumFromStaging(item, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
            MarkImported(item, "MusicAlbum", album.ID);
            return new ImportItemResult(true, $"imported CD #{album.ID}.");
        }

        if (item.ItemType.Equals("DVD", StringComparison.OrdinalIgnoreCase))
        {
            var movie = CreateMovieInventoryItemFromStaging(item);
            context.MovieInventoryItems.Add(movie);
            await context.SaveChangesAsync(cancellationToken);
            MarkImported(item, "MovieInventoryItem", movie.Id);
            return new ImportItemResult(true, $"imported DVD/Movie #{movie.Id}.");
        }

        return new ImportItemResult(false, $"skipped - {item.ItemType} import is not implemented yet.");
    }

    private async Task<Book> CreateBookFromStaging(BarcodeStagingItem item, CancellationToken cancellationToken)
    {
        var authorParts = SplitPersonName(item.SuggestedCreator);
        var author = await ResolveBookAuthor(authorParts.FirstName, authorParts.Middle, authorParts.LastName, cancellationToken);
        var format = await ResolveBookFormat(item.SuggestedFormat, cancellationToken);
        var book = new Book
        {
            Title = item.SuggestedTitle!.Trim(),
            Author = author,
            Status = new BookStatus
            {
                WantStatusID = "H",
                Format = format
            }
        };

        context.Books.Add(book);
        return book;
    }

    private async Task<BookAuthor> ResolveBookAuthor(string? firstName, string? middle, string lastName, CancellationToken cancellationToken)
    {
        var existing = await context.BookAuthors.FirstOrDefaultAsync(author =>
            author.LName == lastName &&
            author.Fname == firstName &&
            author.Middle == middle,
            cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var created = new BookAuthor
        {
            LName = lastName,
            Fname = firstName,
            Middle = middle
        };
        context.BookAuthors.Add(created);
        return created;
    }

    private async Task<BookFormat> ResolveBookFormat(string? format, CancellationToken cancellationToken)
    {
        var name = NormalizeBookFormat(format);
        var existing = await context.BookFormats.FirstOrDefaultAsync(candidate => candidate.Format == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new BookFormat { Format = name };
        context.BookFormats.Add(created);
        return created;
    }

    private async Task<MusicAlbum> CreateMusicAlbumFromStaging(BarcodeStagingItem item, CancellationToken cancellationToken)
    {
        var artistName = string.IsNullOrWhiteSpace(item.SuggestedCreator) ? "(Unknown)" : item.SuggestedCreator.Trim();
        var artist = await context.MusicArtist.FirstOrDefaultAsync(artist => artist.Band == artistName, cancellationToken);
        if (artist is null)
        {
            artist = new MusicArtist { Band = artistName };
            context.MusicArtist.Add(artist);
        }

        var format = NormalizeMusicFormat(item.SuggestedFormat);
        var album = new MusicAlbum
        {
            Title = item.SuggestedTitle!.Trim(),
            Band = artist,
            Info = new MusicAlbumInfo
            {
                ReleaseDate = ParseYearAsDate(item.SuggestedYear),
                InfoText = BuildImportInfoText(item),
                Format = format
            },
            Status = new MusicAlbumStatus
            {
                FormatID = MusicFormatToCode(format),
                WantStatusID = "H"
            }
        };

        context.Albums.Add(album);
        return album;
    }

    private static MovieInventoryItem CreateMovieInventoryItemFromStaging(BarcodeStagingItem item)
    {
        return new MovieInventoryItem
        {
            Title = item.SuggestedTitle!.Trim(),
            Creator = TrimToNull(item.SuggestedCreator),
            Format = NormalizeMovieFormat(item.SuggestedFormat),
            WantStatusID = "H",
            ReleaseYear = TrimToNull(item.SuggestedYear),
            Barcode = item.NormalizedCode,
            Source = TrimToNull(item.LookupProvider),
            Notes = BuildMovieImportNotes(item),
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    private static void MarkImported(BarcodeStagingItem item, string entityType, int entityId)
    {
        item.Status = "Imported";
        item.ImportedEntityType = entityType;
        item.ImportedEntityId = entityId;
        item.ImportedAtUtc = DateTime.UtcNow;
        item.UpdatedAtUtc = DateTime.UtcNow;
        item.Notes = AppendNote(item.Notes, $"Imported as {entityType} #{entityId}.");
    }

    private static bool IsSupportedImportType(string itemType)
    {
        return itemType.Equals("Book", StringComparison.OrdinalIgnoreCase)
            || itemType.Equals("CD", StringComparison.OrdinalIgnoreCase)
            || itemType.Equals("DVD", StringComparison.OrdinalIgnoreCase);
    }

    private static (string? FirstName, string? Middle, string LastName) SplitPersonName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return (null, null, "(Unknown)");
        }

        var normalized = value.Trim();
        if (normalized.Contains(',', StringComparison.Ordinal))
        {
            var parts = normalized.Split(',', 2, StringSplitOptions.TrimEntries);
            var remaining = parts.Length > 1 ? parts[1].Split(' ', StringSplitOptions.RemoveEmptyEntries) : Array.Empty<string>();
            return (
                remaining.FirstOrDefault(),
                remaining.Length > 2 ? string.Join(' ', remaining.Skip(1)) : null,
                string.IsNullOrWhiteSpace(parts[0]) ? "(Unknown)" : parts[0]);
        }

        var tokens = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (tokens.Length == 1)
        {
            return (null, null, tokens[0]);
        }

        return (
            tokens[0],
            tokens.Length > 2 ? string.Join(' ', tokens.Skip(1).Take(tokens.Length - 2)) : null,
            tokens[^1]);
    }

    private static string NormalizeBookFormat(string? format)
    {
        if (string.IsNullOrWhiteSpace(format))
        {
            return "Hardcover";
        }

        return format.Trim().ToUpperInvariant() switch
        {
            "BOOK" or "BOOKS" => "Hardcover",
            "PB" or "PAPERBACK" or "SOFTCOVER" or "SOFT COVER" => "Softcover",
            "AUDIO" or "AUDIOBOOK" or "AUDIO BOOK" => "Audio Book",
            "HC" or "HARDCOVER" or "HARD COVER" => "Hardcover",
            _ => format.Trim()
        };
    }

    private static bool IsKnownBookFormat(string format)
    {
        return format.Trim().ToUpperInvariant() switch
        {
            "BOOK" or "BOOKS" or "PB" or "PAPERBACK" or "SOFTCOVER" or "SOFT COVER" or "AUDIO" or "AUDIOBOOK" or "AUDIO BOOK" or "HC" or "HARDCOVER" or "HARD COVER" => true,
            _ => false
        };
    }

    private static string FormatPersonName((string? FirstName, string? Middle, string LastName) person)
    {
        return string.Join(' ', new[] { person.FirstName, person.Middle, person.LastName }
            .Where(part => !string.IsNullOrWhiteSpace(part)));
    }

    private static string NormalizeMusicFormat(string? format)
    {
        if (string.IsNullOrWhiteSpace(format))
        {
            return "CD";
        }

        return format.Trim().ToUpperInvariant() switch
        {
            "TA" or "T" or "TAPE" or "TAPES" => "Tape",
            "VI" or "V" or "LP" or "VINYL" or "RECORD" or "RECORDS" => "Vinyl",
            "MP" or "MP3" or "MP3S" or "DIGITAL" => "MP3",
            _ => "CD"
        };
    }

    private static bool IsKnownMusicFormat(string format)
    {
        return format.Trim().ToUpperInvariant() switch
        {
            "CD" or "COMPACT DISC" or "TA" or "T" or "TAPE" or "TAPES" or "VI" or "V" or "LP" or "VINYL" or "RECORD" or "RECORDS" or "MP" or "MP3" or "MP3S" or "DIGITAL" => true,
            _ => false
        };
    }

    private static string NormalizeMovieFormat(string? format)
    {
        if (string.IsNullOrWhiteSpace(format))
        {
            return "DVD";
        }

        return format.Trim().ToUpperInvariant() switch
        {
            "BLU" or "BLURAY" or "BLU-RAY" or "BD" => "Blu-ray",
            "DIGITAL" or "DIGITAL COPY" or "STREAMING" => "Digital",
            "DUB" or "DUBS" => "Dub",
            "VHS" => "VHS",
            _ => "DVD"
        };
    }

    private static bool IsKnownMovieFormat(string format)
    {
        return format.Trim().ToUpperInvariant() switch
        {
            "DVD" or "BLU" or "BLURAY" or "BLU-RAY" or "BD" or "DIGITAL" or "DIGITAL COPY" or "STREAMING" or "DUB" or "DUBS" or "VHS" => true,
            _ => false
        };
    }

    private static string MusicFormatToCode(string format) => format switch
    {
        "Tape" => "TA",
        "Vinyl" => "VI",
        "MP3" => "MP",
        _ => "CD"
    };

    private static DateTime? ParseYearAsDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return int.TryParse(new string(value.TakeWhile(char.IsDigit).ToArray()), out var year) && year is > 1000 and < 9999
            ? new DateTime(year, 1, 1)
            : null;
    }

    private static string? BuildImportInfoText(BarcodeStagingItem item)
    {
        var parts = new[]
        {
            $"Barcode: {item.NormalizedCode}",
            string.IsNullOrWhiteSpace(item.LookupProvider) ? null : $"Lookup: {item.LookupProvider}",
            string.IsNullOrWhiteSpace(item.SuggestedYear) ? null : $"Published/released: {item.SuggestedYear}"
        }.Where(part => !string.IsNullOrWhiteSpace(part));

        return string.Join(Environment.NewLine, parts);
    }

    private static string? BuildMovieImportNotes(BarcodeStagingItem item)
    {
        var parts = new[]
        {
            $"Barcode: {item.NormalizedCode}",
            string.IsNullOrWhiteSpace(item.LookupProvider) ? null : $"Lookup: {item.LookupProvider}",
            string.IsNullOrWhiteSpace(item.SuggestedYear) ? null : $"Released: {item.SuggestedYear}",
            string.IsNullOrWhiteSpace(item.Notes) ? null : item.Notes.Trim()
        }.Where(part => !string.IsNullOrWhiteSpace(part));

        return string.Join(Environment.NewLine, parts);
    }

    private static BarcodeLookupCandidateDto ToDto(BarcodeLookupCandidate candidate)
    {
        return new BarcodeLookupCandidateDto
        {
            Id = candidate.Id,
            BarcodeStagingItemId = candidate.BarcodeStagingItemId,
            Provider = candidate.Provider,
            ExternalId = candidate.ExternalId,
            Title = candidate.Title,
            Creator = candidate.Creator,
            Publisher = candidate.Publisher,
            PublishDate = candidate.PublishDate,
            Format = candidate.Format,
            CoverImageUrl = candidate.CoverImageUrl,
            Confidence = candidate.Confidence,
            Selected = candidate.Selected,
            CreatedAtUtc = candidate.CreatedAtUtc
        };
    }

    private sealed record BarcodeProviderCandidateSummary(int BarcodeStagingItemId, string Provider, bool Selected);

    private sealed record LookupRunResult(bool Succeeded, IReadOnlyList<BarcodeLookupCandidate> Candidates, string Message);

    private sealed record ImportItemResult(bool Imported, string Message);

    private sealed record BarcodeStagingDuplicateContext(
        int Id,
        string NormalizedCode,
        string Status,
        string ItemType,
        string? BatchName,
        string Source,
        string? SuggestedTitle,
        string? ImportedEntityType,
        int? ImportedEntityId);

    private sealed record InventoryDuplicateSignals(
        IReadOnlyList<string> ExactBarcodeMatches,
        IReadOnlyList<string> TitleMatches)
    {
        public static InventoryDuplicateSignals Empty { get; } = new([], []);
    }
}

























