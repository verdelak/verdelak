using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/alcohol")]
public class AlcoholController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<AlcoholItemDto>> List(
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] string? location,
        [FromQuery] string? status = "all",
        [FromQuery] string? sort = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.AlcoholItems.AsNoTracking();
        query = ApplyStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                item.Name.Contains(term) ||
                (item.Producer != null && item.Producer.Contains(term)) ||
                (item.Style != null && item.Style.Contains(term)) ||
                (item.Type != null && item.Type.Contains(term)) ||
                (item.Variety != null && item.Variety.Contains(term)) ||
                (item.Region != null && item.Region.Contains(term)) ||
                (item.Country != null && item.Country.Contains(term)) ||
                (item.Notes != null && item.Notes.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(item => item.Category == category.Trim());
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            query = query.Where(item => item.Location == location.Trim());
        }

        query = sort?.ToLowerInvariant() switch
        {
            "category" => query.OrderBy(item => item.Category).ThenBy(item => item.Name),
            "-category" => query.OrderByDescending(item => item.Category).ThenBy(item => item.Name),
            "producer" => query.OrderBy(item => item.Producer).ThenBy(item => item.Name),
            "-producer" => query.OrderByDescending(item => item.Producer).ThenBy(item => item.Name),
            "location" => query.OrderBy(item => item.Location).ThenBy(item => item.Category).ThenBy(item => item.Name),
            "-location" => query.OrderByDescending(item => item.Location).ThenBy(item => item.Category).ThenBy(item => item.Name),
            "quantity" => query.OrderBy(item => item.QuantityOnHand).ThenBy(item => item.Name),
            "-quantity" => query.OrderByDescending(item => item.QuantityOnHand).ThenBy(item => item.Name),
            "rating" => query.OrderBy(item => item.Rating).ThenBy(item => item.Name),
            "-rating" => query.OrderByDescending(item => item.Rating).ThenBy(item => item.Name),
            "-name" => query.OrderByDescending(item => item.Name),
            _ => query.OrderBy(item => item.Name)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        return new PagedResult<AlcoholItemDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AlcoholItemDto>> Get(int id, CancellationToken cancellationToken)
    {
        var item = await context.AlcoholItems.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return item is null ? NotFound() : ToDto(item);
    }

    [AllowAnonymous]
    [HttpGet("categories")]
    public async Task<IEnumerable<string>> GetCategories(CancellationToken cancellationToken)
    {
        var settings = await ReadAlcoholLookups(cancellationToken);
        var inventoryValues = await context.AlcoholItems.AsNoTracking()
            .Select(item => item.Category)
            .Where(value => value != "")
            .Distinct()
            .ToListAsync(cancellationToken);

        return NormalizeList([.. settings.Categories, .. inventoryValues]);
    }

    [AllowAnonymous]
    [HttpGet("locations")]
    public async Task<IEnumerable<string>> GetLocations(CancellationToken cancellationToken)
    {
        var settings = await ReadAlcoholLookups(cancellationToken);
        var inventoryValues = await context.AlcoholItems.AsNoTracking()
            .Where(item => item.Location != null && item.Location != "")
            .Select(item => item.Location!)
            .Distinct()
            .ToListAsync(cancellationToken);

        return NormalizeList([.. settings.Locations, .. inventoryValues]);
    }


    [AllowAnonymous]
    [HttpGet("report")]
    public async Task<ActionResult<AlcoholReportDto>> Report(CancellationToken cancellationToken)
    {
        var items = await context.AlcoholItems
            .AsNoTracking()
            .OrderBy(item => item.Category)
            .ThenBy(item => item.Name)
            .ToListAsync(cancellationToken);

        var wanted = items
            .Where(item => item.StatusID == WantedStatus)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.Name)
            .Select(ToDto)
            .ToList();

        var cleanup = items
            .Where(NeedsCleanup)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.Name)
            .Select(ToDto)
            .ToList();

        var totalValue = items.Any(item => item.Price.HasValue)
            ? items.Sum(item => (item.Price ?? 0m) * Math.Max(item.QuantityOnHand ?? 0m, 0m))
            : (decimal?)null;

        return new AlcoholReportDto(
            items.Count,
            items.Sum(item => item.QuantityOnHand ?? 0m),
            totalValue,
            items.Count(item => item.StatusID == OwnedStatus),
            items.Count(item => item.StatusID == WantedStatus),
            items.Count(item => item.StatusID != OwnedStatus && item.StatusID != WantedStatus),
            items.Count(item => string.IsNullOrWhiteSpace(item.Location)),
            cleanup.Count,
            BuildBreakdown(items, item => item.Category, "Uncategorized"),
            BuildBreakdown(items, item => item.Location, "No location"),
            BuildBreakdown(items, item => StatusLabel(item.StatusID), "Unknown"),
            wanted,
            cleanup);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<AlcoholItemDto>> Create(UpsertAlcoholItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = new AlcoholItem();
        Apply(item, dto);
        context.AlcoholItems.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, ToDto(item));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<AlcoholItemDto>> Update(int id, UpsertAlcoholItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.AlcoholItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        Apply(item, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(item);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await context.AlcoholItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.AlcoholItems.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static IQueryable<AlcoholItem> ApplyStatusFilter(IQueryable<AlcoholItem> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "owned" or "h" => query.Where(item => item.StatusID == OwnedStatus),
            "want" or "wanted" or "w" => query.Where(item => item.StatusID == WantedStatus),
            "unknown" => query.Where(item => item.StatusID != OwnedStatus && item.StatusID != WantedStatus),
            _ => query
        };
    }

    private static string? Validate(UpsertAlcoholItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            return "Category is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Name is required.";
        }

        if (dto.Price < 0)
        {
            return "Price cannot be negative.";
        }

        if (dto.Rating is < 0 or > 10)
        {
            return "Rating must be between 0 and 10.";
        }

        return dto.QuantityOnHand < 0 ? "Quantity cannot be negative." : null;
    }

    private static void Apply(AlcoholItem item, UpsertAlcoholItemDto dto)
    {
        item.Category = dto.Category.Trim();
        item.Name = dto.Name.Trim();
        item.Producer = Trim(dto.Producer);
        item.Style = Trim(dto.Style);
        item.Type = Trim(dto.Type);
        item.Variety = Trim(dto.Variety);
        item.Color = Trim(dto.Color);
        item.Country = Trim(dto.Country);
        item.Region = Trim(dto.Region);
        item.VintageOrYear = Trim(dto.VintageOrYear);
        item.Size = Trim(dto.Size);
        item.Price = dto.Price;
        item.Rating = dto.Rating;
        item.QuantityOnHand = dto.QuantityOnHand;
        item.Location = Trim(dto.Location);
        item.StatusID = string.IsNullOrWhiteSpace(dto.StatusID) ? OwnedStatus : dto.StatusID.Trim();
        item.Notes = Trim(dto.Notes);
        item.SourceSheet = Trim(dto.SourceSheet);
        item.SourceRowLabel = Trim(dto.SourceRowLabel);
    }

    private static bool NeedsCleanup(AlcoholItem item)
    {
        if (item.StatusID != OwnedStatus && item.StatusID != WantedStatus)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(item.Location))
        {
            return true;
        }

        if (item.Category.Equals("Wine", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(item.Variety) &&
            string.IsNullOrWhiteSpace(item.Color))
        {
            return true;
        }

        return item.Price is < 0 || item.Rating is < 0 or > 10 || item.QuantityOnHand is < 0;
    }

    private static IReadOnlyList<AlcoholBreakdownDto> BuildBreakdown(
        IEnumerable<AlcoholItem> items,
        Func<AlcoholItem, string?> labelSelector,
        string emptyLabel) =>
        items
            .GroupBy(item => string.IsNullOrWhiteSpace(labelSelector(item)) ? emptyLabel : labelSelector(item)!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group => new AlcoholBreakdownDto(
                group.Key,
                group.Count(),
                group.Sum(item => item.QuantityOnHand ?? 0m),
                group.Any(item => item.Price.HasValue)
                    ? group.Sum(item => (item.Price ?? 0m) * Math.Max(item.QuantityOnHand ?? 0m, 0m))
                    : null))
            .OrderByDescending(row => row.Count)
            .ThenBy(row => row.Label)
            .ToList();

    private static string StatusLabel(string? status) => status switch
    {
        OwnedStatus => "Owned",
        WantedStatus => "Wanted",
        _ => "Unknown"
    };
    private static AlcoholItemDto ToDto(AlcoholItem item) => new(
        item.Id,
        item.Category,
        item.Name,
        item.Producer,
        item.Style,
        item.Type,
        item.Variety,
        item.Color,
        item.Country,
        item.Region,
        item.VintageOrYear,
        item.Size,
        item.Price,
        item.Rating,
        item.QuantityOnHand,
        item.Location,
        item.StatusID,
        item.Notes,
        item.SourceSheet,
        item.SourceRowLabel);

    private async Task<AlcoholLookupSettingsDto> ReadAlcoholLookups(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == AdminSettingsController.AlcoholLookupSettingsKey, cancellationToken);

        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return AdminSettingsController.AlcoholLookupDefaults();
        }

        try
        {
            var stored = JsonSerializer.Deserialize<AlcoholLookupSettingsDto>(setting.ValueJson);
            return stored is null
                ? AdminSettingsController.AlcoholLookupDefaults()
                : new AlcoholLookupSettingsDto(
                    NormalizeList(stored.Categories),
                    NormalizeList(stored.Locations));
        }
        catch (JsonException)
        {
            return AdminSettingsController.AlcoholLookupDefaults();
        }
    }

    private static IReadOnlyList<string> NormalizeList(IEnumerable<string> values) =>
        values
            .Select(value => value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value)
            .ToList();

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}


