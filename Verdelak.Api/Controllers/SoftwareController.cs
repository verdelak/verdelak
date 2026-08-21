using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/software")]
public class SoftwareController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";
    private const int TitleMaxLength = 100;

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<SoftwareItemDto>> List(
        [FromQuery] string? q,
        [FromQuery] int? platformId,
        [FromQuery] int? locationId,
        [FromQuery] string? mediaType,
        [FromQuery] string? status = OwnedStatus,
        [FromQuery] string? sort = "title",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = Includes().AsNoTracking();
        query = ApplyStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                item.Title.Contains(term) ||
                (item.Publisher != null && item.Publisher.Contains(term)) ||
                (item.Developer != null && item.Developer.Contains(term)) ||
                (item.Notes != null && item.Notes.Contains(term)));
        }

        if (platformId is not null)
        {
            query = query.Where(item => item.PlatformID == platformId);
        }

        if (locationId is not null)
        {
            query = query.Where(item => item.LocationID == locationId);
        }

        if (!string.IsNullOrWhiteSpace(mediaType))
        {
            query = query.Where(item => item.MediaType == mediaType.Trim());
        }

        query = ApplySort(query, sort);

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        return new PagedResult<SoftwareItemDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SoftwareItemDto>> Get(int id, CancellationToken cancellationToken)
    {
        var item = await Includes().AsNoTracking().FirstOrDefaultAsync(item => item.ID == id, cancellationToken);
        return item is null ? NotFound() : ToDto(item);
    }

    [AllowAnonymous]
    [HttpGet("platforms")]
    public async Task<IEnumerable<SoftwareLookupDto>> GetPlatforms(CancellationToken cancellationToken) =>
        await context.SoftwarePlatforms
            .OrderBy(item => item.Platform)
            .Select(item => new SoftwareLookupDto(item.ID, item.Platform))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("locations")]
    public async Task<IEnumerable<SoftwareLookupDto>> GetLocations(CancellationToken cancellationToken) =>
        await context.SoftwareLocations
            .OrderBy(item => item.Location)
            .Select(item => new SoftwareLookupDto(item.ID, item.Location))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("media-types")]
    public async Task<IEnumerable<string>> GetMediaTypes(CancellationToken cancellationToken) =>
        await context.Software
            .AsNoTracking()
            .Where(item => item.MediaType != null && item.MediaType != string.Empty)
            .Select(item => item.MediaType!)
            .Distinct()
            .OrderBy(item => item)
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("reports/summary")]
    public async Task<SoftwareReportSummaryDto> GetReportSummary(CancellationToken cancellationToken)
    {
        var items = await Includes()
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var byPlatform = items
            .GroupBy(item => new { item.PlatformID, Name = item.Platform?.Platform ?? "Unknown" })
            .OrderBy(group => group.Key.Name)
            .Select(group => ToBucket(group.Key.PlatformID, group.Key.Name, group))
            .ToList();

        var byLocation = items
            .GroupBy(item => new { item.LocationID, Name = item.Location?.Location ?? "None" })
            .OrderBy(group => group.Key.Name)
            .Select(group => ToBucket(group.Key.LocationID, group.Key.Name, group))
            .ToList();

        return new SoftwareReportSummaryDto(
            items.Count(item => IsOwned(item)),
            items.Count(item => IsWanted(item)),
            items.Count(item => !IsOwned(item) && !IsWanted(item)),
            byPlatform,
            byLocation);
    }

    
    [AllowAnonymous]
    [HttpGet("reports/want-list")]
    public async Task<IEnumerable<SoftwareItemDto>> GetWantListReport(
        [FromQuery] string? q,
        [FromQuery] int? platformId,
        [FromQuery] int? locationId,
        [FromQuery] string? mediaType,
        [FromQuery] string? sort = "title",
        CancellationToken cancellationToken = default)
    {
        var query = Includes().AsNoTracking();
        query = ApplyStatusFilter(query, WantedStatus);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                item.Title.Contains(term) ||
                (item.Publisher != null && item.Publisher.Contains(term)) ||
                (item.Developer != null && item.Developer.Contains(term)) ||
                (item.Notes != null && item.Notes.Contains(term)));
        }

        if (platformId is not null)
        {
            query = query.Where(item => item.PlatformID == platformId);
        }

        if (locationId is not null)
        {
            query = query.Where(item => item.LocationID == locationId);
        }

        if (!string.IsNullOrWhiteSpace(mediaType))
        {
            query = query.Where(item => item.MediaType == mediaType.Trim());
        }

        query = ApplySort(query, sort);

        return await query
            .Take(5000)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<SoftwareItemDto>> Create(UpsertSoftwareItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var platform = await ResolvePlatform(dto.PlatformId!.Value, cancellationToken);
        if (platform is null)
        {
            return BadRequest("Choose a platform from Admin Settings.");
        }

        var location = await ResolveLocation(dto.LocationId, cancellationToken);
        if (dto.LocationId is not null && location is null)
        {
            return BadRequest("Choose a location from Admin Settings, or leave it blank.");
        }

        var item = new Software();
        ApplySave(item, dto, platform, location);
        context.Software.Add(item);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = item.ID }, await LoadDto(item.ID, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("import/preview")]
    public async Task<ActionResult<SoftwareBulkImportPreviewDto>> PreviewImport(
        SoftwareBulkImportRequestDto request,
        CancellationToken cancellationToken)
    {
        var preview = await BuildImportPreview(request, cancellationToken);
        return preview;
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("import/commit")]
    public async Task<ActionResult<SoftwareBulkImportCommitResultDto>> CommitImport(
        SoftwareBulkImportRequestDto request,
        CancellationToken cancellationToken)
    {
        var preview = await BuildImportPreview(request, cancellationToken);
        var created = 0;
        var updated = 0;
        var rows = preview.Rows.ToList();

        foreach (var row in rows.Where(row => row.Action == "Create"))
        {
            var platform = await ResolvePlatform(row.PlatformId!.Value, cancellationToken);
            var location = await ResolveLocation(row.LocationId, cancellationToken);
            if (platform is null || (row.LocationId is not null && location is null))
            {
                continue;
            }

            context.Software.Add(new Software
            {
                Title = row.Title!.Trim(),
                StatusID = row.StatusID,
                Platform = platform,
                Location = location,
                HasBox = false,
                HasManual = false,
                HasDisc = false
            });
            created++;
        }

        foreach (var row in rows.Where(row => row.Action == "Update" && row.ExistingId is not null))
        {
            var item = await context.Software
                .Include(item => item.Platform)
                .Include(item => item.Location)
                .FirstOrDefaultAsync(item => item.ID == row.ExistingId, cancellationToken);
            if (item is null)
            {
                continue;
            }

            var platform = await ResolvePlatform(row.PlatformId!.Value, cancellationToken);
            var location = await ResolveLocation(row.LocationId, cancellationToken);
            if (platform is null || (row.LocationId is not null && location is null))
            {
                continue;
            }

            item.Title = row.Title!.Trim();
            item.StatusID = row.StatusID;
            item.Platform = platform;
            item.Location = location;
            updated++;
        }

        if (created > 0 || updated > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return new SoftwareBulkImportCommitResultDto(
            created,
            updated,
            rows.Count(row => row.Action == "Skip"),
            rows.Count(row => row.Action == "Error"),
            rows);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<SoftwareItemDto>> Update(int id, UpsertSoftwareItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.Software.FindAsync([id], cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        var platform = await ResolvePlatform(dto.PlatformId!.Value, cancellationToken);
        if (platform is null)
        {
            return BadRequest("Choose a platform from Admin Settings.");
        }

        var location = await ResolveLocation(dto.LocationId, cancellationToken);
        if (dto.LocationId is not null && location is null)
        {
            return BadRequest("Choose a location from Admin Settings, or leave it blank.");
        }

        ApplySave(item, dto, platform, location);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await context.Software.FindAsync([id], cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.Software.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<Software> Includes() =>
        context.Software
            .Include(item => item.Platform)
            .Include(item => item.Location);

    private static IQueryable<Software> ApplyStatusFilter(IQueryable<Software> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "all" => query,
            "want" or "wanted" or "w" => query.Where(item => item.StatusID == WantedStatus),
            "unknown" => query.Where(item => item.StatusID != OwnedStatus && item.StatusID != WantedStatus),
            _ => query.Where(item => item.StatusID == OwnedStatus)
        };
    }


    private static IQueryable<Software> ApplySort(IQueryable<Software> query, string? sort) =>
        sort?.ToLowerInvariant() switch
        {
            "platform" => query.OrderBy(item => item.Platform!.Platform).ThenBy(item => item.Title),
            "-platform" => query.OrderByDescending(item => item.Platform!.Platform).ThenBy(item => item.Title),
            "location" => query.OrderBy(item => item.Location!.Location).ThenBy(item => item.Title),
            "-location" => query.OrderByDescending(item => item.Location!.Location).ThenBy(item => item.Title),
            "publisher" => query.OrderBy(item => item.Publisher).ThenBy(item => item.Title),
            "-publisher" => query.OrderByDescending(item => item.Publisher).ThenBy(item => item.Title),
            "-title" => query.OrderByDescending(item => item.Title),
            _ => query.OrderBy(item => item.Title)
        };
    private async Task<SoftwareItemDto> LoadDto(int id, CancellationToken cancellationToken) =>
        ToDto(await Includes().AsNoTracking().SingleAsync(item => item.ID == id, cancellationToken));

    private static SoftwareItemDto ToDto(Software item) =>
        new(
            item.ID,
            item.Title,
            NormalizeStatus(item.StatusID),
            item.PlatformID,
            item.Platform?.Platform ?? string.Empty,
            item.LocationID,
            item.Location?.Location,
            item.Publisher,
            item.Developer,
            item.VersionEdition,
            item.MediaType,
            item.SerialLicenseKeyNotes,
            item.HasBox,
            item.HasManual,
            item.HasDisc,
            item.Notes);

    private static string? Validate(UpsertSoftwareItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return "Title is required.";
        }

        if (dto.Title.Trim().Length > TitleMaxLength)
        {
            return $"Title must be {TitleMaxLength} characters or fewer.";
        }

        if (dto.PlatformId is null)
        {
            return "Choose a platform from Admin Settings.";
        }

        if (!string.IsNullOrWhiteSpace(dto.StatusID) && dto.StatusID.Trim() is not (OwnedStatus or WantedStatus))
        {
            return "Status must be H or W.";
        }

        return null;
    }

    private async Task<SoftwarePlatform?> ResolvePlatform(int platformId, CancellationToken cancellationToken) =>
        await context.SoftwarePlatforms.SingleOrDefaultAsync(item => item.ID == platformId, cancellationToken);

    private async Task<SoftwareLocation?> ResolveLocation(int? locationId, CancellationToken cancellationToken)
    {
        if (locationId is null)
        {
            return null;
        }

        return await context.SoftwareLocations.SingleOrDefaultAsync(item => item.ID == locationId, cancellationToken);
    }

    private static void ApplySave(Software item, UpsertSoftwareItemDto dto, SoftwarePlatform platform, SoftwareLocation? location)
    {
        item.Title = dto.Title.Trim();
        item.StatusID = dto.StatusID?.Trim() == WantedStatus ? WantedStatus : OwnedStatus;
        item.Platform = platform;
        item.Location = location;
        item.Publisher = Trim(dto.Publisher);
        item.Developer = Trim(dto.Developer);
        item.VersionEdition = Trim(dto.VersionEdition);
        item.MediaType = Trim(dto.MediaType);
        item.SerialLicenseKeyNotes = Trim(dto.SerialLicenseKeyNotes);
        item.HasBox = dto.HasBox ?? false;
        item.HasManual = dto.HasManual ?? false;
        item.HasDisc = dto.HasDisc ?? false;
        item.Notes = Trim(dto.Notes);
    }

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task<SoftwareBulkImportPreviewDto> BuildImportPreview(
        SoftwareBulkImportRequestDto request,
        CancellationToken cancellationToken)
    {
        var platforms = await context.SoftwarePlatforms.AsNoTracking().ToListAsync(cancellationToken);
        var locations = await context.SoftwareLocations.AsNoTracking().ToListAsync(cancellationToken);
        var existing = await context.Software.AsNoTracking()
            .Include(item => item.Platform)
            .Include(item => item.Location)
            .Select(item => new ExistingSoftwareImportMatch(
                item.ID,
                item.Title,
                NormalizeStatus(item.StatusID),
                item.PlatformID,
                item.Platform != null ? item.Platform.Platform : string.Empty,
                item.LocationID,
                item.Location != null ? item.Location.Location : null))
            .ToListAsync(cancellationToken);

        var defaultStatus = NormalizeImportStatus(request.DefaultStatusID);
        var rows = new List<SoftwareBulkImportPreviewRowDto>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var decisions = (request.RowDecisions ?? [])
            .GroupBy(decision => decision.RowNumber)
            .ToDictionary(group => group.Key, group => group.Last());
        var rawLines = (request.Text ?? string.Empty)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace('\r', '\n')
            .Split('\n');
        var sourceRowNumber = 0;

        foreach (var rawLine in rawLines)
        {
            sourceRowNumber++;
            var trimmed = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                continue;
            }

            if (request.HasHeader && rows.Count == 0)
            {
                continue;
            }

            var row = ParseImportRow(
                sourceRowNumber,
                trimmed,
                request.DefaultPlatformId,
                request.DefaultLocationId,
                defaultStatus,
                platforms,
                locations,
                existing,
                seen,
                decisions.TryGetValue(sourceRowNumber, out var decision) ? decision : null);
            rows.Add(row);
        }

        return new SoftwareBulkImportPreviewDto(
            rows.Count,
            rows.Count(row => row.Action is "Create" or "Update"),
            rows.Count(row => row.Action == "Skip"),
            rows.Count(row => row.Action == "Error"),
            rows);
    }

    private static SoftwareBulkImportPreviewRowDto ParseImportRow(
        int rowNumber,
        string rawText,
        int? defaultPlatformId,
        int? defaultLocationId,
        string defaultStatus,
        IEnumerable<SoftwarePlatform> platforms,
        IEnumerable<SoftwareLocation> locations,
        IEnumerable<ExistingSoftwareImportMatch> existing,
        ISet<string> seen,
        SoftwareBulkImportRowDecisionDto? decision)
    {
        var fields = SplitImportLine(rawText);
        var messages = new List<string>();
        var title = fields.FirstOrDefault()?.Trim();
        var status = defaultStatus;
        var platformId = defaultPlatformId;
        var locationId = defaultLocationId;

        foreach (var field in fields.Skip(1).Select(field => field.Trim()).Where(field => field.Length > 0))
        {
            if (TryNormalizeImportStatus(field, out var parsedStatus))
            {
                status = parsedStatus;
                continue;
            }

            var platform = platforms.FirstOrDefault(item => NamesMatch(item.Platform, field));
            if (platform is not null)
            {
                platformId = platform.ID;
                continue;
            }

            var location = locations.FirstOrDefault(item => NamesMatch(item.Location, field));
            if (location is not null)
            {
                locationId = location.ID;
                continue;
            }

            messages.Add($"Unrecognized value: {field}");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            messages.Add("Title is required.");
        }
        else if (title.Length > TitleMaxLength)
        {
            messages.Add($"Title is longer than {TitleMaxLength} characters.");
        }

        if (platformId is null)
        {
            messages.Add("Platform is required.");
        }

        var platformName = platformId is null ? null : platforms.FirstOrDefault(item => item.ID == platformId)?.Platform;
        var locationName = locationId is null ? null : locations.FirstOrDefault(item => item.ID == locationId)?.Location;
        var existingMatch = title is null || platformId is null
            ? null
            : existing.FirstOrDefault(item =>
                item.Title.Equals(title, StringComparison.OrdinalIgnoreCase) &&
                item.PlatformId == platformId &&
                item.LocationId == locationId);
        var matches = title is null
            ? []
            : existing
                .Where(item => item.Title.Equals(title, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(item => item.Id == existingMatch?.Id)
                .ThenBy(item => item.Platform)
                .ThenBy(item => item.Location)
                .Select(item => new SoftwareBulkImportMatchDto(
                    item.Id,
                    item.Title,
                    item.StatusID,
                    item.PlatformId,
                    item.Platform,
                    item.LocationId,
                    item.Location,
                    item.Id == existingMatch?.Id ? "Exact" : "Same title"))
                .ToList();

        var key = $"{title}|{platformId}|{locationId}";
        var action = "Create";
        int? existingId = null;
        if (messages.Count > 0)
        {
            action = "Error";
        }
        else if (existingMatch is not null)
        {
            action = "Skip";
            existingId = existingMatch.Id;
            messages.Add("Already exists for this platform/location.");
        }
        else if (matches.Count > 0)
        {
            messages.Add("Same title exists elsewhere. Choose Create or Update.");
        }
        else if (!seen.Add(key))
        {
            action = "Skip";
            messages.Add("Duplicate row in pasted import.");
        }

        if (messages.Count == 0 || messages.All(message => !message.EndsWith("required.", StringComparison.OrdinalIgnoreCase) && !message.StartsWith("Title is longer", StringComparison.OrdinalIgnoreCase)))
        {
            ApplyImportDecision(decision, matches, ref action, ref existingId, messages);
        }

        return new SoftwareBulkImportPreviewRowDto(
            rowNumber,
            rawText,
            title,
            status,
            platformId,
            platformName,
            locationId,
            locationName,
            action,
            existingId,
            matches,
            messages);
    }

    private static void ApplyImportDecision(
        SoftwareBulkImportRowDecisionDto? decision,
        IReadOnlyCollection<SoftwareBulkImportMatchDto> matches,
        ref string action,
        ref int? existingId,
        ICollection<string> messages)
    {
        if (decision is null)
        {
            return;
        }

        switch (decision.Action.Trim().ToLowerInvariant())
        {
            case "create":
                action = "Create";
                existingId = null;
                messages.Remove("Already exists for this platform/location.");
                messages.Add("Forced create.");
                break;
            case "skip":
                action = "Skip";
                existingId = null;
                messages.Add("Skipped by import choice.");
                break;
            case "update":
                if (decision.ExistingId is null || !matches.Any(match => match.Id == decision.ExistingId))
                {
                    action = "Error";
                    messages.Add("Choose a matching existing item to update.");
                    break;
                }

                action = "Update";
                existingId = decision.ExistingId;
                messages.Add("Will update selected existing item.");
                break;
        }
    }

    private static IReadOnlyList<string> SplitImportLine(string line)
    {
        var delimiter = line.Contains('\t')
            ? '\t'
            : line.Contains('|')
                ? '|'
                : ',';
        var fields = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        foreach (var c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
                continue;
            }

            if (c == delimiter && !inQuotes)
            {
                fields.Add(current.ToString().Trim());
                current.Clear();
                continue;
            }

            current.Append(c);
        }

        fields.Add(current.ToString().Trim());
        return fields;
    }

    private static string NormalizeImportStatus(string? value) =>
        TryNormalizeImportStatus(value, out var status) ? status : OwnedStatus;

    private static bool TryNormalizeImportStatus(string? value, out string status)
    {
        switch (value?.Trim().ToLowerInvariant())
        {
            case "h":
            case "have":
            case "owned":
            case "own":
                status = OwnedStatus;
                return true;
            case "w":
            case "want":
            case "wanted":
            case "wishlist":
                status = WantedStatus;
                return true;
            default:
                status = OwnedStatus;
                return false;
        }
    }

    private static bool NamesMatch(string left, string right) =>
        left.Equals(right, StringComparison.OrdinalIgnoreCase);

    private sealed record ExistingSoftwareImportMatch(
        int Id,
        string Title,
        string StatusID,
        int PlatformId,
        string Platform,
        int? LocationId,
        string? Location);

    private static string NormalizeStatus(string? status)
    {
        var normalized = status?.Trim();
        return normalized switch
        {
            WantedStatus => WantedStatus,
            OwnedStatus => OwnedStatus,
            _ => "Unknown"
        };
    }

    private static SoftwareReportBucketDto ToBucket(int? id, string name, IEnumerable<Software> items)
    {
        var rows = items.ToList();
        return new SoftwareReportBucketDto(
            id,
            name,
            rows.Count(IsOwned),
            rows.Count(IsWanted),
            rows.Count(item => !IsOwned(item) && !IsWanted(item)));
    }

    private static bool IsOwned(Software item) => item.StatusID?.Trim() == OwnedStatus;

    private static bool IsWanted(Software item) => item.StatusID?.Trim() == WantedStatus;
}

