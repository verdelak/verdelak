using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/mtg")]
public class MtgCollectionController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";
    private const string ColorSortOrder = "WUBRG";
    private const string NoLocationFilter = "__none";
    private const string NoMetadataFilter = "__none";
    private static readonly Expression<Func<MtgCollectionItem, bool>> HasCleanupIssueFilter = item =>
        item.Printing!.ImageUrl == null || item.Printing.ImageUrl == "" ||
        item.Printing.ScryfallId == null || item.Printing.ScryfallId == "" ||
        item.Printing.SetCode == null || item.Printing.SetCode == "" || item.Printing.SetCode == "UNK" ||
        item.Printing.CollectorNumber == null || item.Printing.CollectorNumber == "" || item.Printing.CollectorNumber == "UNK" ||
        item.Printing.Card!.ColorIdentity == null || item.Printing.Card.ColorIdentity == "" ||
        item.Printing.Card.TypeLine == null || item.Printing.Card.TypeLine == "" ||
        item.WantStatusID == OwnedStatus && item.Quantity + item.FoilQuantity <= 0 ||
        item.WantStatusID == OwnedStatus && (item.Location == null || item.Location == "") ||
        item.WantStatusID == OwnedStatus && (item.Condition == null || item.Condition == "") ||
        item.WantStatusID == OwnedStatus && (item.Language == null || item.Language == "");
    private static readonly Expression<Func<MtgCollectionItem, bool>> HasNoCleanupIssueFilter =
        Expression.Lambda<Func<MtgCollectionItem, bool>>(Expression.Not(HasCleanupIssueFilter.Body), HasCleanupIssueFilter.Parameters);

    [HttpGet]
    public async Task<PagedResult<MtgCollectionItemDto>> List(
        [FromQuery] string? q,
        [FromQuery] string? setCode,
        [FromQuery] string? color,
        [FromQuery] string? rarity,
        [FromQuery] string? type,
        [FromQuery] string? location,
        [FromQuery] string? condition,
        [FromQuery] string? language,
        [FromQuery] string? finish,
        [FromQuery] string? cleanup,
        [FromQuery] string? status = OwnedStatus,
        [FromQuery] string? sort = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyFilters(BaseQuery(), q, setCode, color, rarity, type, location, condition, language, finish, cleanup, status);

        query = sort?.ToLowerInvariant() switch
        {
            "set" => query.OrderBy(item => item.Printing!.SetCode).ThenBy(item => item.Printing!.CollectorNumber).ThenBy(item => item.Printing!.Card!.Name),
            "-set" => query.OrderByDescending(item => item.Printing!.SetCode).ThenByDescending(item => item.Printing!.CollectorNumber).ThenBy(item => item.Printing!.Card!.Name),
            "rarity" => query.OrderBy(item => item.Printing!.Rarity).ThenBy(item => item.Printing!.Card!.Name),
            "-rarity" => query.OrderByDescending(item => item.Printing!.Rarity).ThenBy(item => item.Printing!.Card!.Name),
            "qty" => query.OrderBy(item => item.Quantity + item.FoilQuantity).ThenBy(item => item.Printing!.Card!.Name),
            "-qty" => query.OrderByDescending(item => item.Quantity + item.FoilQuantity).ThenBy(item => item.Printing!.Card!.Name),
            "value" => query.OrderBy(item => item.EstimatedValue).ThenBy(item => item.Printing!.Card!.Name),
            "-value" => query.OrderByDescending(item => item.EstimatedValue).ThenBy(item => item.Printing!.Card!.Name),
            "location" => query.OrderBy(item => item.Location).ThenBy(item => item.Printing!.Card!.Name),
            "-location" => query.OrderByDescending(item => item.Location).ThenBy(item => item.Printing!.Card!.Name),
            "condition" => query.OrderBy(item => item.Condition).ThenBy(item => item.Printing!.Card!.Name),
            "-condition" => query.OrderByDescending(item => item.Condition).ThenBy(item => item.Printing!.Card!.Name),
            "review" => query.OrderByDescending(HasCleanupIssueFilter).ThenBy(item => item.Printing!.Card!.Name),
            "-review" => query.OrderBy(HasCleanupIssueFilter).ThenBy(item => item.Printing!.Card!.Name),
            "-name" => query.OrderByDescending(item => item.Printing!.Card!.Name),
            _ => query.OrderBy(item => item.Printing!.Card!.Name).ThenBy(item => item.Printing!.SetCode)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        return new PagedResult<MtgCollectionItemDto>(items, total);
    }

    [HttpGet("report")]
    public async Task<MtgCollectionReportDto> GetReport(
        [FromQuery] string? q,
        [FromQuery] string? setCode,
        [FromQuery] string? color,
        [FromQuery] string? rarity,
        [FromQuery] string? type,
        [FromQuery] string? location,
        [FromQuery] string? condition,
        [FromQuery] string? language,
        [FromQuery] string? finish,
        [FromQuery] string? cleanup,
        [FromQuery] string? status = OwnedStatus,
        CancellationToken cancellationToken = default)
    {
        var items = await ApplyFilters(BaseQuery(), q, setCode, color, rarity, type, location, condition, language, finish, cleanup, status)
            .OrderBy(item => item.Printing!.Card!.Name)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        var duplicateClusters = BuildDuplicateClusters(items);
        return new MtgCollectionReportDto(
            items.Count,
            items.Sum(item => item.Quantity + item.FoilQuantity),
            items.Sum(item => item.FoilQuantity),
            items.Count(item => item.WantStatusID == WantedStatus),
            items.Sum(item => item.EstimatedValue ?? 0),
            items.Count(item => string.IsNullOrWhiteSpace(item.ImageUrl)),
            items.Count(item => string.IsNullOrWhiteSpace(item.ScryfallId)),
            items.Count(item => IsWeakPrinting(item)),
            items.Count(item => string.IsNullOrWhiteSpace(item.ColorIdentity) || string.IsNullOrWhiteSpace(item.TypeLine)),
            items.Count(item => item.WantStatusID == OwnedStatus && item.Quantity + item.FoilQuantity <= 0),
            items.Count(item => item.WantStatusID == OwnedStatus && string.IsNullOrWhiteSpace(item.Location)),
            items.Count(HasCleanupIssue),
            duplicateClusters.Count,
            BuildReportBuckets(items, item => string.IsNullOrWhiteSpace(item.SetCode) ? "Unknown set" : item.SetCode),
            BuildReportBuckets(items, item => ColorLabel(item.ColorIdentity)),
            BuildReportBuckets(items, item => string.IsNullOrWhiteSpace(item.Rarity) ? "Unknown rarity" : item.Rarity!),
            BuildReportBuckets(items, item => string.IsNullOrWhiteSpace(item.Location) ? "No location" : item.Location!),
            BuildCleanupBuckets(items),
            duplicateClusters);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MtgCollectionItemDto>> Get(int id, CancellationToken cancellationToken)
    {
        var item = await context.MtgCollectionItems
            .Include(collectionItem => collectionItem.Printing)
            .ThenInclude(printing => printing!.Card)
            .AsNoTracking()
            .FirstOrDefaultAsync(collectionItem => collectionItem.Id == id, cancellationToken);

        return item is null ? NotFound() : ToDto(item);
    }

    [HttpGet("sets")]
    public async Task<IEnumerable<MtgLookupDto>> GetSets(CancellationToken cancellationToken) =>
        await LookupValues(context.MtgPrintings.Select(printing => printing.SetCode), cancellationToken);

    [HttpGet("rarities")]
    public async Task<IEnumerable<MtgLookupDto>> GetRarities(CancellationToken cancellationToken) =>
        await LookupValues(context.MtgPrintings.Select(printing => printing.Rarity), cancellationToken);

    [HttpGet("locations")]
    public async Task<IEnumerable<MtgLookupDto>> GetLocations(CancellationToken cancellationToken) =>
        await LookupValues(context.MtgCollectionItems.Select(item => item.Location), cancellationToken);

    [HttpGet("conditions")]
    public async Task<IEnumerable<MtgLookupDto>> GetConditions(CancellationToken cancellationToken) =>
        await LookupValues(context.MtgCollectionItems.Select(item => item.Condition), cancellationToken);

    [HttpGet("languages")]
    public async Task<IEnumerable<MtgLookupDto>> GetLanguages(CancellationToken cancellationToken) =>
        await LookupValues(context.MtgCollectionItems.Select(item => item.Language), cancellationToken);

    [HttpGet("finishes")]
    public async Task<IEnumerable<MtgLookupDto>> GetFinishes(CancellationToken cancellationToken)
    {
        var values = await context.MtgPrintings
            .Select(printing => printing.Finishes)
            .Where(value => value != null && value != "")
            .ToListAsync(cancellationToken);

        return values
            .SelectMany(value => value!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct()
            .OrderBy(value => value)
            .Select(value => new MtgLookupDto(value, value));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<MtgCollectionItemDto>> Create(UpsertMtgCollectionItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var card = await ResolveCard(dto, cancellationToken);
        var printing = await ResolvePrinting(dto, card, cancellationToken);
        var item = new MtgCollectionItem();
        ApplySave(item, dto, printing);

        context.MtgCollectionItems.Add(item);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = item.Id }, await LoadDto(item.Id, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<MtgCollectionItemDto>> Update(int id, UpsertMtgCollectionItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.MtgCollectionItems.FindAsync([id], cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        var card = await ResolveCard(dto, cancellationToken);
        var printing = await ResolvePrinting(dto, card, cancellationToken);
        ApplySave(item, dto, printing);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await context.MtgCollectionItems.FindAsync([id], cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.MtgCollectionItems.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static IQueryable<MtgCollectionItem> ApplyStatusFilter(IQueryable<MtgCollectionItem> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "all" => query,
            "want" or "wanted" or "w" => query.Where(item => item.WantStatusID == WantedStatus),
            "unknown" => query.Where(item => item.WantStatusID != OwnedStatus && item.WantStatusID != WantedStatus),
            _ => query.Where(item => item.WantStatusID == OwnedStatus)
        };
    }

    private IQueryable<MtgCollectionItem> BaseQuery() =>
        context.MtgCollectionItems
            .Include(item => item.Printing)
            .ThenInclude(printing => printing!.Card)
            .AsNoTracking();

    private static IQueryable<MtgCollectionItem> ApplyFilters(
        IQueryable<MtgCollectionItem> query,
        string? q,
        string? setCode,
        string? color,
        string? rarity,
        string? type,
        string? location,
        string? condition,
        string? language,
        string? finish,
        string? cleanup,
        string? status)
    {
        query = ApplyStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                item.Printing!.Card!.Name.Contains(term) ||
                item.Printing.SetCode.Contains(term) ||
                item.Printing.CollectorNumber.Contains(term) ||
                (item.Printing.SetName != null && item.Printing.SetName.Contains(term)) ||
                (item.Printing.Artist != null && item.Printing.Artist.Contains(term)) ||
                (item.Printing.Card.TypeLine != null && item.Printing.Card.TypeLine.Contains(term)) ||
                (item.Printing.Card.OracleText != null && item.Printing.Card.OracleText.Contains(term)) ||
                (item.Notes != null && item.Notes.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(setCode))
        {
            var normalizedSetCode = NormalizeCode(setCode);
            query = query.Where(item => item.Printing!.SetCode != null && item.Printing.SetCode.ToUpper() == normalizedSetCode);
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            var colorFilter = color.Trim().ToUpperInvariant();
            var normalizedColor = NormalizeColorString(color)!;
            query = normalizedColor switch
            {
                _ when colorFilter is "C" or "COLORLESS" => query.Where(item => item.Printing!.Card!.ColorIdentity == null || item.Printing.Card.ColorIdentity == ""),
                { Length: > 1 } => query.Where(item => item.Printing!.Card!.ColorIdentity == normalizedColor),
                _ => query.Where(item => item.Printing!.Card!.ColorIdentity != null && item.Printing.Card.ColorIdentity.Contains(normalizedColor))
            };
        }

        if (!string.IsNullOrWhiteSpace(rarity))
        {
            var normalizedRarity = NormalizeRarity(rarity);
            query = query.Where(item => item.Printing!.Rarity != null && item.Printing.Rarity.ToLower() == normalizedRarity);
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            var normalizedType = type.Trim();
            query = query.Where(item => item.Printing!.Card!.TypeLine != null && item.Printing.Card.TypeLine.Contains(normalizedType));
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            var normalizedLocation = location.Trim();
            query = normalizedLocation.Equals(NoLocationFilter, StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.Location == null || item.Location == "")
                : query.Where(item => item.Location == normalizedLocation);
        }

        if (!string.IsNullOrWhiteSpace(condition))
        {
            var normalizedCondition = condition.Trim();
            query = normalizedCondition.Equals(NoMetadataFilter, StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.Condition == null || item.Condition == "")
                : query.Where(item => item.Condition == normalizedCondition);
        }

        if (!string.IsNullOrWhiteSpace(language))
        {
            var normalizedLanguage = NormalizeCode(language)!;
            query = normalizedLanguage.Equals(NoMetadataFilter, StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.Language == null || item.Language == "")
                : query.Where(item => item.Language != null && item.Language.ToUpper() == normalizedLanguage);
        }

        if (!string.IsNullOrWhiteSpace(finish))
        {
            var normalizedFinish = NormalizeLower(finish)!;
            query = query.Where(item => item.Printing!.Finishes != null && item.Printing.Finishes.ToLower().Contains(normalizedFinish));
        }

        return ApplyCleanupFilter(query, cleanup);
    }

    private static IQueryable<MtgCollectionItem> ApplyCleanupFilter(IQueryable<MtgCollectionItem> query, string? cleanup)
    {
        if (string.IsNullOrWhiteSpace(cleanup))
        {
            return query;
        }

        return cleanup.Trim() switch
        {
            "anyIssue" => query.Where(HasCleanupIssueFilter),
            "noIssue" => query.Where(HasNoCleanupIssueFilter),
            "missingImage" => query.Where(item => item.Printing!.ImageUrl == null || item.Printing.ImageUrl == ""),
            "missingScryfall" => query.Where(item => item.Printing!.ScryfallId == null || item.Printing.ScryfallId == ""),
            "missingPrinting" => query.Where(item =>
                item.Printing!.SetCode == null || item.Printing.SetCode == "" || item.Printing.SetCode == "UNK" ||
                item.Printing.CollectorNumber == null || item.Printing.CollectorNumber == "" || item.Printing.CollectorNumber == "UNK"),
            "missingIdentity" => query.Where(item =>
                item.Printing!.Card!.ColorIdentity == null || item.Printing.Card.ColorIdentity == "" ||
                item.Printing.Card.TypeLine == null || item.Printing.Card.TypeLine == ""),
            "zeroCopies" => query.Where(item => item.WantStatusID == OwnedStatus && item.Quantity + item.FoilQuantity <= 0),
            "missingLocation" => query.Where(item => item.WantStatusID == OwnedStatus && (item.Location == null || item.Location == "")),
            "missingCondition" => query.Where(item => item.WantStatusID == OwnedStatus && (item.Condition == null || item.Condition == "")),
            "missingLanguage" => query.Where(item => item.WantStatusID == OwnedStatus && (item.Language == null || item.Language == "")),
            _ => query
        };
    }

    private async Task<MtgCard> ResolveCard(UpsertMtgCollectionItemDto dto, CancellationToken cancellationToken)
    {
        MtgCard? card = null;
        if (dto.CardId is not null)
        {
            card = await context.MtgCards.FindAsync([dto.CardId.Value], cancellationToken);
        }

        card ??= await context.MtgCards.FirstOrDefaultAsync(existing => existing.Name == dto.Name.Trim(), cancellationToken);
        if (card is null)
        {
            card = new MtgCard();
            context.MtgCards.Add(card);
        }

        card.Name = dto.Name.Trim();
        card.ManaCost = NormalizeOptional(dto.ManaCost);
        card.Colors = NormalizeColorString(dto.Colors);
        card.ColorIdentity = NormalizeColorString(dto.ColorIdentity);
        card.TypeLine = NormalizeOptional(dto.TypeLine);
        card.OracleText = NormalizeOptional(dto.OracleText);
        return card;
    }

    private async Task<MtgPrinting> ResolvePrinting(UpsertMtgCollectionItemDto dto, MtgCard card, CancellationToken cancellationToken)
    {
        MtgPrinting? printing = null;
        if (dto.PrintingId is not null)
        {
            printing = await context.MtgPrintings.FindAsync([dto.PrintingId.Value], cancellationToken);
        }

        var setCode = NormalizeCode(dto.SetCode) ?? "UNK";
        var collectorNumber = NormalizeOptional(dto.CollectorNumber) ?? "UNK";
        printing ??= await context.MtgPrintings.FirstOrDefaultAsync(existing =>
            existing.CardId == card.Id &&
            existing.SetCode != null &&
            existing.SetCode.ToUpper() == setCode &&
            existing.CollectorNumber == collectorNumber,
            cancellationToken);

        if (printing is null)
        {
            printing = new MtgPrinting();
            context.MtgPrintings.Add(printing);
        }

        printing.Card = card;
        printing.SetCode = setCode;
        printing.SetName = NormalizeOptional(dto.SetName);
        printing.CollectorNumber = collectorNumber;
        printing.Rarity = NormalizeRarity(dto.Rarity);
        printing.Artist = NormalizeOptional(dto.Artist);
        printing.ImageUrl = NormalizeOptional(dto.ImageUrl);
        printing.ScryfallId = NormalizeOptional(dto.ScryfallId);
        printing.Finishes = NormalizeLower(dto.Finishes);
        return printing;
    }

    private static void ApplySave(MtgCollectionItem item, UpsertMtgCollectionItemDto dto, MtgPrinting printing)
    {
        item.Printing = printing;
        item.Quantity = (short)Math.Max(0, (int)dto.Quantity.GetValueOrDefault(1));
        item.FoilQuantity = (short)Math.Max(0, (int)dto.FoilQuantity.GetValueOrDefault(0));
        item.WantStatusID = NormalizeStatus(dto.WantStatusID);
        item.Condition = NormalizeOptional(dto.Condition);
        item.Language = NormalizeCode(dto.Language);
        item.Location = NormalizeOptional(dto.Location);
        item.Notes = NormalizeOptional(dto.Notes);
        item.EstimatedValue = dto.EstimatedValue is null ? null : Math.Max(0, dto.EstimatedValue.Value);
    }

    private async Task<MtgCollectionItemDto> LoadDto(int id, CancellationToken cancellationToken) =>
        await context.MtgCollectionItems
            .Include(item => item.Printing)
            .ThenInclude(printing => printing!.Card)
            .Where(item => item.Id == id)
            .Select(item => ToDto(item))
            .FirstAsync(cancellationToken);

    private static MtgCollectionItemDto ToDto(MtgCollectionItem item) => new(
        item.Id,
        item.Printing!.CardId,
        item.Printing.Card!.Name,
        item.Printing.Card.ManaCost,
        item.Printing.Card.Colors,
        item.Printing.Card.ColorIdentity,
        item.Printing.Card.TypeLine,
        item.Printing.Card.OracleText,
        item.PrintingId,
        item.Printing.SetCode,
        item.Printing.SetName,
        item.Printing.CollectorNumber,
        item.Printing.Rarity,
        item.Printing.Artist,
        item.Printing.ImageUrl,
        item.Printing.ScryfallId,
        item.Printing.Finishes,
        item.Quantity,
        item.FoilQuantity,
        item.WantStatusID,
        item.Condition,
        item.Language,
        item.Location,
        item.Notes,
        item.EstimatedValue);

    private static IReadOnlyList<MtgReportBucketDto> BuildReportBuckets(IEnumerable<MtgCollectionItemDto> items, Func<MtgCollectionItemDto, string> nameSelector) =>
        items
            .GroupBy(nameSelector)
            .Select(group => new MtgReportBucketDto(
                group.Key,
                group.Count(),
                group.Count(item => item.WantStatusID == OwnedStatus),
                group.Count(item => item.WantStatusID == WantedStatus),
                group.Sum(item => item.Quantity + item.FoilQuantity),
                group.Sum(item => item.FoilQuantity),
                group.Sum(item => item.EstimatedValue ?? 0),
                group.Count(item => string.IsNullOrWhiteSpace(item.ImageUrl))))
            .OrderByDescending(row => row.RowCount)
            .ThenBy(row => row.Name)
            .ToList();

    private static IReadOnlyList<MtgCleanupBucketDto> BuildCleanupBuckets(IReadOnlyList<MtgCollectionItemDto> items) =>
    [
        new("missingImage", "Missing images", items.Count(item => string.IsNullOrWhiteSpace(item.ImageUrl)), "No image URL for visual card review", "amber"),
        new("missingScryfall", "Missing Scryfall IDs", items.Count(item => string.IsNullOrWhiteSpace(item.ScryfallId)), "No external card identifier", "amber"),
        new("missingPrinting", "Weak printing data", items.Count(IsWeakPrinting), "Set code or collector number needs review", "red"),
        new("missingIdentity", "Missing identity", items.Count(item => string.IsNullOrWhiteSpace(item.ColorIdentity) || string.IsNullOrWhiteSpace(item.TypeLine)), "Color identity or type line is blank", "amber"),
        new("zeroCopies", "Zero-copy owned rows", items.Count(item => item.WantStatusID == OwnedStatus && item.Quantity + item.FoilQuantity <= 0), "Owned rows with no regular or foil copies", "red"),
        new("missingLocation", "Missing locations", items.Count(item => item.WantStatusID == OwnedStatus && string.IsNullOrWhiteSpace(item.Location)), "Owned rows without a binder/box/location", "slate"),
        new("missingCondition", "Missing conditions", items.Count(item => item.WantStatusID == OwnedStatus && string.IsNullOrWhiteSpace(item.Condition)), "Owned rows without trade condition", "slate"),
        new("missingLanguage", "Missing languages", items.Count(item => item.WantStatusID == OwnedStatus && string.IsNullOrWhiteSpace(item.Language)), "Owned rows without card language", "slate")
    ];

    private static bool HasCleanupIssue(MtgCollectionItemDto item) =>
        string.IsNullOrWhiteSpace(item.ImageUrl) ||
        string.IsNullOrWhiteSpace(item.ScryfallId) ||
        IsWeakPrinting(item) ||
        string.IsNullOrWhiteSpace(item.ColorIdentity) ||
        string.IsNullOrWhiteSpace(item.TypeLine) ||
        item.WantStatusID == OwnedStatus && item.Quantity + item.FoilQuantity <= 0 ||
        item.WantStatusID == OwnedStatus && string.IsNullOrWhiteSpace(item.Location) ||
        item.WantStatusID == OwnedStatus && string.IsNullOrWhiteSpace(item.Condition) ||
        item.WantStatusID == OwnedStatus && string.IsNullOrWhiteSpace(item.Language);

    private static IReadOnlyList<MtgDuplicateClusterDto> BuildDuplicateClusters(IEnumerable<MtgCollectionItemDto> items) =>
        items
            .GroupBy(item => string.Join('|',
                item.Name.ToLowerInvariant(),
                item.SetCode.ToLowerInvariant(),
                item.CollectorNumber.ToLowerInvariant(),
                item.WantStatusID,
                item.Condition?.ToLowerInvariant() ?? "",
                item.Language?.ToLowerInvariant() ?? "",
                item.Location?.ToLowerInvariant() ?? ""))
            .Where(group => group.Count() > 1)
            .Select(group =>
            {
                var first = group.First();
                return new MtgDuplicateClusterDto(
                    group.Key,
                    $"{first.Name} | {first.SetCode} #{first.CollectorNumber}",
                    first.Name,
                    first.SetCode,
                    first.CollectorNumber,
                    first.WantStatusID,
                    first.Condition,
                    first.Language,
                    first.Location,
                    group.Count(),
                    group.Sum(item => item.Quantity + item.FoilQuantity),
                    string.Join(", ", group.Select(item => string.IsNullOrWhiteSpace(item.Location) ? "No location" : item.Location).Distinct()));
            })
            .OrderByDescending(row => row.RowCount)
            .ThenBy(row => row.Label)
            .Take(10)
            .ToList();

    private static bool IsWeakPrinting(MtgCollectionItemDto item) =>
        string.IsNullOrWhiteSpace(item.SetCode) ||
        item.SetCode == "UNK" ||
        string.IsNullOrWhiteSpace(item.CollectorNumber) ||
        item.CollectorNumber == "UNK";

    private static string ColorLabel(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "Colorless / unspecified";
        }

        return string.Join(" / ", value.Select(color => color switch
        {
            'W' => "White",
            'U' => "Blue",
            'B' => "Black",
            'R' => "Red",
            'G' => "Green",
            _ => color.ToString()
        }));
    }

    private static async Task<IEnumerable<MtgLookupDto>> LookupValues(IQueryable<string?> values, CancellationToken cancellationToken) =>
        await values
            .Where(value => value != null && value != "")
            .Distinct()
            .OrderBy(value => value)
            .Select(value => new MtgLookupDto(value!, value!))
            .ToListAsync(cancellationToken);

    private static string? Validate(UpsertMtgCollectionItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Name is required.";
        }

        return null;
    }

    private static string NormalizeStatus(string? value) =>
        value?.Trim().Equals(WantedStatus, StringComparison.OrdinalIgnoreCase) == true ? WantedStatus : OwnedStatus;

    private static string? NormalizeColorString(string? value)
    {
        var normalized = NormalizeOptional(value)?.ToUpperInvariant().Replace(",", string.Empty).Replace(" ", string.Empty);
        return normalized is null
            ? null
            : string.Concat(normalized.Distinct().OrderBy(ColorSortIndex).ThenBy(color => color));
    }

    private static int ColorSortIndex(char color)
    {
        var index = ColorSortOrder.IndexOf(color);
        return index < 0 ? ColorSortOrder.Length : index;
    }

    private static string? NormalizeRarity(string? value) =>
        NormalizeLower(value);

    private static string? NormalizeLower(string? value) =>
        NormalizeOptional(value)?.ToLowerInvariant();

    private static string? NormalizeCode(string? value) =>
        NormalizeOptional(value)?.ToUpperInvariant();

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
