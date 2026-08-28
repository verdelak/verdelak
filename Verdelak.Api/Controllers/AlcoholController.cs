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
    private const string NoLocation = "No location";
    private static readonly Dictionary<string, string?> CountryCleanupMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["."] = null,
        ["Chili"] = "Chile",
        ["US"] = "United States",
        ["USA"] = "United States",
        ["S.E. Australia"] = "Australia"
    };

    private static readonly Dictionary<string, string?> RegionCleanupMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["."] = null,
        ["Cali"] = "California",
        ["German"] = "Germany",
        ["Wisconson"] = "Wisconsin",
        ["NY"] = "New York",
        ["NJ"] = "New Jersey"
    };

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<AlcoholItemDto>> List(
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] string? type,
        [FromQuery] string? style,
        [FromQuery] string? country,
        [FromQuery] string? region,
        [FromQuery] string? location,
        [FromQuery] string? status = "all",
        [FromQuery] string? sort = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var items = await LoadNormalizedItems(cancellationToken);
        var query = ApplyStatusFilter(items, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                Contains(item.Name, term) ||
                Contains(item.Producer, term) ||
                Contains(item.Style, term) ||
                Contains(item.Type, term) ||
                Contains(item.Variety, term) ||
                Contains(item.Region, term) ||
                Contains(item.Country, term) ||
                Contains(item.Notes, term));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(item => string.Equals(item.Category, category.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(item => string.Equals(item.Type, type.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(style))
        {
            query = query.Where(item => string.Equals(item.Style, style.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(country))
        {
            query = query.Where(item => string.Equals(item.Country, country.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(region))
        {
            query = query.Where(item => string.Equals(item.Region, region.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            query = query.Where(item => string.Equals(item.Location, location.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        query = sort?.ToLowerInvariant() switch
        {
            "category" => query.OrderBy(item => item.Category).ThenBy(item => item.Name),
            "-category" => query.OrderByDescending(item => item.Category).ThenBy(item => item.Name),
            "type" => query.OrderBy(item => item.Type).ThenBy(item => item.Category).ThenBy(item => item.Name),
            "-type" => query.OrderByDescending(item => item.Type).ThenBy(item => item.Category).ThenBy(item => item.Name),
            "style" => query.OrderBy(item => item.Style).ThenBy(item => item.Category).ThenBy(item => item.Name),
            "-style" => query.OrderByDescending(item => item.Style).ThenBy(item => item.Category).ThenBy(item => item.Name),
            "country" => query.OrderBy(item => item.Country).ThenBy(item => item.Region).ThenBy(item => item.Name),
            "-country" => query.OrderByDescending(item => item.Country).ThenBy(item => item.Region).ThenBy(item => item.Name),
            "region" => query.OrderBy(item => item.Region).ThenBy(item => item.Country).ThenBy(item => item.Name),
            "-region" => query.OrderByDescending(item => item.Region).ThenBy(item => item.Country).ThenBy(item => item.Name),
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
        var total = query.Count();
        var pageItems = query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToList();

        return new PagedResult<AlcoholItemDto>(pageItems, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AlcoholItemDto>> Get(int id, CancellationToken cancellationToken)
    {
        var count = await LoadCount(id, tracking: false, cancellationToken);
        return count is null ? NotFound() : ToDto(count);
    }

    [AllowAnonymous]
    [HttpGet("categories")]
    public async Task<IEnumerable<string>> GetCategories(CancellationToken cancellationToken)
    {
        var settings = await ReadAlcoholLookups(cancellationToken);
        var inventoryValues = await context.AlcoholCategories.AsNoTracking()
            .Select(item => item.Category)
            .ToListAsync(cancellationToken);

        return NormalizeList([.. settings.Categories, .. inventoryValues]);
    }

    [AllowAnonymous]
    [HttpGet("locations")]
    public async Task<IEnumerable<string>> GetLocations(CancellationToken cancellationToken)
    {
        var settings = await ReadAlcoholLookups(cancellationToken);
        var inventoryValues = await context.AlcoholLocations.AsNoTracking()
            .Select(item => item.Location)
            .ToListAsync(cancellationToken);

        return NormalizeList([.. settings.Locations, .. inventoryValues.Where(value => value != NoLocation)]);
    }

    [AllowAnonymous]
    [HttpGet("types")]
    public async Task<IEnumerable<string>> GetTypes(CancellationToken cancellationToken)
    {
        var inventoryValues = await context.AlcoholTypes.AsNoTracking()
            .Select(item => item.Type)
            .ToListAsync(cancellationToken);

        return NormalizeList(inventoryValues);
    }

    [AllowAnonymous]
    [HttpGet("styles")]
    public async Task<IEnumerable<string>> GetStyles(CancellationToken cancellationToken)
    {
        var inventoryValues = await context.AlcoholStyles.AsNoTracking()
            .Select(item => item.Name)
            .ToListAsync(cancellationToken);

        return NormalizeList(inventoryValues);
    }

    [AllowAnonymous]
    [HttpGet("regions")]
    public async Task<IEnumerable<string>> GetRegions(CancellationToken cancellationToken)
    {
        var inventoryValues = await context.AlcoholRegions.AsNoTracking()
            .Select(item => item.Region)
            .ToListAsync(cancellationToken);

        return NormalizeList(inventoryValues);
    }

    [AllowAnonymous]
    [HttpGet("countries")]
    public async Task<IEnumerable<string>> GetCountries(CancellationToken cancellationToken)
    {
        var productValues = await context.AlcoholProducts.AsNoTracking()
            .Where(item => item.Country != null && item.Country != "")
            .Select(item => item.Country!)
            .ToListAsync(cancellationToken);
        var regionValues = await context.AlcoholRegions.AsNoTracking()
            .Where(item => item.Country != null && item.Country != "")
            .Select(item => item.Country!)
            .ToListAsync(cancellationToken);

        return NormalizeList([.. productValues, .. regionValues]);
    }

    [AllowAnonymous]
    [HttpGet("lookup-cleanup")]
    public async Task<ActionResult<AlcoholLookupCleanupDto>> LookupCleanup(CancellationToken cancellationToken)
    {
        var products = await context.AlcoholProducts
            .AsNoTracking()
            .Include(product => product.Type)
            .Include(product => product.Style)
            .Include(product => product.Region)
            .ToListAsync(cancellationToken);
        var locations = await context.AlcoholCounts
            .AsNoTracking()
            .Include(count => count.Location)
            .ToListAsync(cancellationToken);

        var suggestions = new List<AlcoholLookupCleanupSuggestionDto>();
        AddCleanupSuggestions(
            suggestions,
            "Country",
            products.Select(product => product.Country).Concat(products.Select(product => product.Region?.Country)),
            CountryCleanupMap,
            "Normalize imported country labels.");
        AddCleanupSuggestions(
            suggestions,
            "Region",
            products.Select(product => product.Region?.Region),
            RegionCleanupMap,
            "Normalize imported region labels and common abbreviations.");
        AddCleanupSuggestions(
            suggestions,
            "Type",
            products.Select(product => product.Type?.Type),
            new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase),
            "Review short or punctuation-heavy imported type labels.");
        AddCleanupSuggestions(
            suggestions,
            "Style",
            products.Select(product => product.Style?.Name),
            new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase),
            "Review short or punctuation-heavy imported style labels.");
        AddCleanupSuggestions(
            suggestions,
            "Location",
            locations.Select(count => count.Location?.Location),
            new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase),
            "Review placeholder or missing storage labels.");

        var ordered = suggestions
            .OrderBy(suggestion => suggestion.Field)
            .ThenByDescending(suggestion => suggestion.Count)
            .ThenBy(suggestion => suggestion.CurrentValue)
            .ToList();

        return new AlcoholLookupCleanupDto(ordered.Count, ordered);
    }

    [AllowAnonymous]
    [HttpGet("import-duplicate-keys")]
    public async Task<ActionResult<IReadOnlyList<AlcoholImportDuplicateKeyDto>>> ImportDuplicateKeys(CancellationToken cancellationToken)
    {
        var items = await LoadNormalizedItems(cancellationToken);
        var keys = items
            .Where(item => !string.IsNullOrWhiteSpace(item.Name))
            .GroupBy(ImportDuplicateKey)
            .Select(group =>
            {
                var first = group.First();
                return new AlcoholImportDuplicateKeyDto(
                    group.Key,
                    group.Count(),
                    first.Category,
                    first.Name,
                    first.Producer,
                    first.VintageOrYear,
                    first.Size);
            })
            .OrderBy(row => row.Name)
            .ThenBy(row => row.Producer)
            .ThenBy(row => row.VintageOrYear)
            .ToList();

        return keys;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("lookup-cleanup/apply")]
    public async Task<ActionResult<ApplyAlcoholLookupCleanupResultDto>> ApplyLookupCleanup(
        ApplyAlcoholLookupCleanupDto dto,
        CancellationToken cancellationToken)
    {
        var field = Trim(dto.Field);
        var currentValue = Trim(dto.CurrentValue);
        if (field is null || currentValue is null)
        {
            return BadRequest("Field and current value are required.");
        }

        if (!TryGetExpectedSuggestion(field, currentValue, out var expectedSuggestion) ||
            !SuggestionMatches(expectedSuggestion, dto.SuggestedValue))
        {
            return BadRequest("Lookup cleanup can only apply current suggested cleanup values.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var result = field.ToLowerInvariant() switch
        {
            "country" => await ApplyCountryCleanup(currentValue, expectedSuggestion, cancellationToken),
            "region" => await ApplyRegionCleanup(currentValue, expectedSuggestion, cancellationToken),
            _ => null
        };

        if (result is null)
        {
            return BadRequest("Only country and region cleanup suggestions can be applied right now.");
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return result;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("lookups/merge")]
    public async Task<ActionResult<MergeAlcoholLookupResultDto>> MergeLookup(
        MergeAlcoholLookupDto dto,
        CancellationToken cancellationToken)
    {
        var field = Trim(dto.Field);
        var sourceValue = Trim(dto.SourceValue);
        var targetValue = Trim(dto.TargetValue);
        if (field is null || sourceValue is null)
        {
            return BadRequest("Field and source value are required.");
        }

        if (targetValue is not null && string.Equals(sourceValue, targetValue, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Source and target values must be different.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var result = field.ToLowerInvariant() switch
        {
            "category" => await MergeCategories(sourceValue, targetValue, cancellationToken),
            "type" => await MergeTypes(sourceValue, targetValue, cancellationToken),
            "style" => await MergeStyles(sourceValue, targetValue, cancellationToken),
            "location" => await MergeLocations(sourceValue, targetValue, cancellationToken),
            "country" => await MergeCountries(sourceValue, targetValue, cancellationToken),
            "region" => await MergeRegions(sourceValue, targetValue, cancellationToken),
            _ => null
        };

        if (result is null)
        {
            return BadRequest("Lookup field must be category, type, style, location, country, or region.");
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return result;
    }

    [AllowAnonymous]
    [HttpGet("product-duplicates")]
    public async Task<ActionResult<AlcoholProductDuplicateReportDto>> ProductDuplicates(CancellationToken cancellationToken)
    {
        var products = await LoadProductsForDuplicateReview(tracking: false, cancellationToken);
        var clusters = BuildProductDuplicateClusters(products);
        return new AlcoholProductDuplicateReportDto(
            clusters.Count,
            clusters.Sum(cluster => cluster.ProductRows),
            clusters);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("product-duplicates/merge")]
    public async Task<ActionResult<MergeAlcoholProductDuplicatesResultDto>> MergeProductDuplicates(
        MergeAlcoholProductDuplicatesDto dto,
        CancellationToken cancellationToken)
    {
        var productIds = dto.ProductIds
            .Append(dto.TargetProductId)
            .Distinct()
            .ToList();
        if (productIds.Count < 2)
        {
            return BadRequest("At least two product rows are required for a duplicate merge.");
        }

        if (!productIds.Contains(dto.TargetProductId))
        {
            return BadRequest("Target product must be included in the duplicate merge.");
        }

        var products = await LoadProductsForDuplicateReview(tracking: true, cancellationToken);
        var selected = products
            .Where(product => productIds.Contains(product.ID))
            .ToList();
        if (selected.Count != productIds.Count)
        {
            return NotFound("One or more product rows were not found.");
        }

        var target = selected.Single(product => product.ID == dto.TargetProductId);
        var targetKey = ProductDuplicateKey(target);
        if (selected.Any(product => ProductDuplicateKey(product) != targetKey))
        {
            return BadRequest("Only product rows with the same normalized duplicate key can be merged.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var movedInventoryRows = 0;
        var movedRatingRows = 0;
        var movedValueRows = 0;
        var sourceProducts = selected
            .Where(product => product.ID != target.ID)
            .ToList();
        foreach (var source in sourceProducts)
        {
            foreach (var count in source.Counts)
            {
                count.AlcoholID = target.ID;
                movedInventoryRows += 1;
            }

            foreach (var rating in source.Ratings)
            {
                rating.AlcoholID = target.ID;
                movedRatingRows += 1;
            }

            foreach (var value in source.Values)
            {
                value.AlcoholID = target.ID;
                movedValueRows += 1;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        foreach (var source in sourceProducts)
        {
            context.AlcoholProducts.Remove(source);
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new MergeAlcoholProductDuplicatesResultDto(
            target.ID,
            selected.Count - 1,
            movedInventoryRows,
            movedRatingRows,
            movedValueRows);
    }

    [AllowAnonymous]
    [HttpGet("report")]
    public async Task<ActionResult<AlcoholReportDto>> Report(CancellationToken cancellationToken)
    {
        var items = await LoadNormalizedItems(cancellationToken);

        var wanted = items
            .Where(item => item.StatusID == WantedStatus)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.Name)
            .ToList();

        var cleanup = items
            .Where(NeedsCleanup)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.Name)
            .ToList();
        var priceReview = items
            .Where(item => item.StatusID == OwnedStatus && !item.Price.HasValue)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.Name)
            .Take(50)
            .ToList();
        var ratingReview = items
            .Where(item => item.StatusID == OwnedStatus && !item.Rating.HasValue)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.Name)
            .Take(50)
            .ToList();
        var highValue = items
            .Where(item => item.Price.HasValue && (item.QuantityOnHand ?? 0m) > 0m)
            .OrderByDescending(item => (item.Price ?? 0m) * (item.QuantityOnHand ?? 0m))
            .ThenBy(item => item.Name)
            .Take(10)
            .ToList();
        var topRated = items
            .Where(item => item.Rating.HasValue)
            .OrderByDescending(item => item.Rating)
            .ThenBy(item => item.Name)
            .Take(10)
            .ToList();
        var vintageReview = items
            .Where(item =>
                item.Category.Equals("Wine", StringComparison.OrdinalIgnoreCase) &&
                string.IsNullOrWhiteSpace(item.VintageOrYear))
            .OrderBy(item => item.Country)
            .ThenBy(item => item.Region)
            .ThenBy(item => item.Name)
            .Take(50)
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
            items.Count(item => string.IsNullOrWhiteSpace(item.Location) || item.Location == NoLocation),
            cleanup.Count,
            BuildBreakdown(items, item => item.Category, "Uncategorized"),
            BuildBreakdown(items, item => item.Type, "No type"),
            BuildBreakdown(items, item => item.Style, "No style"),
            BuildBreakdown(items, item => item.Country, "No country"),
            BuildBreakdown(items, item => item.Region, "No region"),
            BuildBreakdown(items, item => item.Location, NoLocation),
            BuildBreakdown(items, item => StatusLabel(item.StatusID), "Unknown"),
            priceReview,
            ratingReview,
            highValue,
            topRated,
            vintageReview,
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

        var product = await FindOrCreateProduct(dto, cancellationToken);
        var location = await FindOrCreateLocation(dto.Location, cancellationToken);
        var count = new AlcoholCount
        {
            Alcohol = product,
            Location = location,
            Qty = dto.QuantityOnHand ?? 0m,
            StatusID = NormalizeStatus(dto.StatusID),
            Notes = Trim(dto.Notes)
        };

        context.AlcoholCounts.Add(count);
        ApplyRatingAndValue(product, dto);
        await context.SaveChangesAsync(cancellationToken);

        var created = await LoadCount(count.ID, tracking: false, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = count.ID }, ToDto(created ?? count));
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

        var count = await LoadCount(id, tracking: true, cancellationToken);
        if (count is null)
        {
            return NotFound();
        }

        var category = await FindOrCreateCategory(dto.Category, cancellationToken);
        var type = await FindOrCreateType(dto.Type, category, cancellationToken);
        var style = await FindOrCreateStyle(dto.Style, type, cancellationToken);
        var region = await FindOrCreateRegion(dto.Region, dto.Country, cancellationToken);
        var product = count.Alcohol ?? new AlcoholProduct();
        ApplyProduct(product, dto, category, type, style, region);
        count.Alcohol = product;
        count.Location = await FindOrCreateLocation(dto.Location, cancellationToken);
        count.Qty = dto.QuantityOnHand ?? 0m;
        count.StatusID = NormalizeStatus(dto.StatusID);
        count.Notes = Trim(dto.Notes);
        ApplyRatingAndValue(product, dto);

        await context.SaveChangesAsync(cancellationToken);

        var updated = await LoadCount(id, tracking: false, cancellationToken);
        return ToDto(updated ?? count);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var count = await context.AlcoholCounts.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (count is null)
        {
            return NotFound();
        }

        context.AlcoholCounts.Remove(count);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<List<AlcoholItemDto>> LoadNormalizedItems(CancellationToken cancellationToken)
    {
        var counts = await context.AlcoholCounts
            .AsNoTracking()
            .Include(count => count.Location)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Category)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Type)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Style)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Region)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Ratings)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Values)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return counts.Select(ToDto).ToList();
    }

    private Task<AlcoholCount?> LoadCount(int id, bool tracking, CancellationToken cancellationToken)
    {
        var query = context.AlcoholCounts
            .Include(count => count.Location)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Category)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Type)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Style)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Region)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Ratings)
            .Include(count => count.Alcohol).ThenInclude(product => product!.Values)
            .AsSplitQuery()
            .AsQueryable();

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return query.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
    }

    private async Task<List<AlcoholProduct>> LoadProductsForDuplicateReview(bool tracking, CancellationToken cancellationToken)
    {
        var query = context.AlcoholProducts
            .Include(product => product.Category)
            .Include(product => product.Type)
            .Include(product => product.Style)
            .Include(product => product.Region)
            .Include(product => product.Counts).ThenInclude(count => count.Location)
            .Include(product => product.Ratings)
            .Include(product => product.Values)
            .AsSplitQuery()
            .AsQueryable();

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return await query.ToListAsync(cancellationToken);
    }

    private static List<AlcoholProductDuplicateClusterDto> BuildProductDuplicateClusters(IEnumerable<AlcoholProduct> products) =>
        products
            .GroupBy(ProductDuplicateKey)
            .Where(group => group.Count() > 1)
            .Select(group =>
            {
                var orderedMembers = group
                    .OrderByDescending(product => product.Counts.Count)
                    .ThenBy(product => product.ID)
                    .ToList();
                var first = orderedMembers.First();
                var members = orderedMembers
                    .Select(ToDuplicateMember)
                    .ToList();

                return new AlcoholProductDuplicateClusterDto(
                    first.Product,
                    first.Category?.Category ?? "Uncategorized",
                    first.Producer,
                    first.Style?.Name,
                    first.Type?.Type,
                    first.Variety,
                    first.Color,
                    first.Country ?? first.Region?.Country,
                    first.Region?.Region,
                    first.VintageOrYear,
                    first.Size,
                    members.Count,
                    members.Sum(member => member.InventoryRows),
                    members.Sum(member => member.Quantity),
                    members);
            })
            .OrderByDescending(cluster => cluster.InventoryRows)
            .ThenBy(cluster => cluster.Category)
            .ThenBy(cluster => cluster.Product)
            .ToList();

    private static AlcoholProductDuplicateMemberDto ToDuplicateMember(AlcoholProduct product)
    {
        var locations = product.Counts
            .Select(count => count.Location?.Location)
            .Where(location => !string.IsNullOrWhiteSpace(location))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(location => location)
            .ToList();
        var price = product.Values
            .OrderByDescending(value => value.AsOfDate)
            .ThenByDescending(value => value.ID)
            .Select(value => (decimal?)value.Price)
            .FirstOrDefault();
        var rating = product.Ratings
            .Where(value => value.Rating.HasValue)
            .Average(value => value.Rating);

        return new AlcoholProductDuplicateMemberDto(
            product.ID,
            product.Counts.Count,
            product.Counts.Sum(count => count.Qty),
            locations.Count == 0 ? null : string.Join(", ", locations),
            price,
            rating,
            product.Notes,
            product.SourceSheet,
            product.SourceRowLabel);
    }

    private static string ProductDuplicateKey(AlcoholProduct product) =>
        string.Join('\u001f', new[]
        {
            KeyPart(product.Product),
            KeyPart(product.Category?.Category),
            KeyPart(product.Producer),
            KeyPart(product.Style?.Name),
            KeyPart(product.Type?.Type),
            KeyPart(product.Variety),
            KeyPart(product.Color),
            KeyPart(product.Country ?? product.Region?.Country),
            KeyPart(product.Region?.Region),
            KeyPart(product.VintageOrYear),
            KeyPart(product.Size)
        });

    private static string ImportDuplicateKey(AlcoholItemDto item) =>
        string.Join('\u001f', new[]
        {
            KeyPart(item.Category),
            KeyPart(item.Name),
            KeyPart(item.Producer),
            KeyPart(item.VintageOrYear),
            KeyPart(item.Size)
        });

    private async Task<AlcoholProduct> FindOrCreateProduct(UpsertAlcoholItemDto dto, CancellationToken cancellationToken)
    {
        var category = await FindOrCreateCategory(dto.Category, cancellationToken);
        var type = await FindOrCreateType(dto.Type, category, cancellationToken);
        var style = await FindOrCreateStyle(dto.Style, type, cancellationToken);
        var region = await FindOrCreateRegion(dto.Region, dto.Country, cancellationToken);
        var productName = dto.Name.Trim();
        var producer = Trim(dto.Producer);
        var variety = Trim(dto.Variety);
        var color = Trim(dto.Color);
        var country = Trim(dto.Country);
        var vintageOrYear = Trim(dto.VintageOrYear);
        var size = Trim(dto.Size);

        var existing = await context.AlcoholProducts
            .Include(product => product.Ratings)
            .Include(product => product.Values)
            .FirstOrDefaultAsync(product =>
                product.Product == productName &&
                product.CategoryID == category.ID &&
                product.TypeID == (type == null ? null : type.ID) &&
                product.StyleID == (style == null ? null : style.ID) &&
                product.RegionID == (region == null ? null : region.ID) &&
                product.Producer == producer &&
                product.Variety == variety &&
                product.Color == color &&
                product.Country == country &&
                product.VintageOrYear == vintageOrYear &&
                product.Size == size,
                cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var product = new AlcoholProduct();
        ApplyProduct(product, dto, category, type, style, region);
        context.AlcoholProducts.Add(product);
        return product;
    }

    private static void ApplyProduct(
        AlcoholProduct product,
        UpsertAlcoholItemDto dto,
        AlcoholCategory category,
        AlcoholType? type,
        AlcoholStyle? style,
        AlcoholRegion? region)
    {
        product.Product = dto.Name.Trim();
        product.Category = category;
        product.Type = type;
        product.Style = style;
        product.Region = region;
        product.Producer = Trim(dto.Producer);
        product.Variety = Trim(dto.Variety);
        product.Color = Trim(dto.Color);
        product.Country = Trim(dto.Country);
        product.VintageOrYear = Trim(dto.VintageOrYear);
        product.Size = Trim(dto.Size);
        product.Notes = Trim(dto.Notes);
        product.SourceSheet = Trim(dto.SourceSheet);
        product.SourceRowLabel = Trim(dto.SourceRowLabel);
    }

    private void ApplyRatingAndValue(AlcoholProduct product, UpsertAlcoholItemDto dto)
    {
        if (dto.Rating.HasValue)
        {
            var rating = product.Ratings.FirstOrDefault();
            if (rating is null)
            {
                product.Ratings.Add(new AlcoholRating { Rating = dto.Rating });
            }
            else
            {
                rating.Rating = dto.Rating;
            }
        }
        else
        {
            context.AlcoholRatings.RemoveRange(product.Ratings);
        }

        if (dto.Price.HasValue)
        {
            var value = product.Values.FirstOrDefault();
            if (value is null)
            {
                product.Values.Add(new AlcoholValue { Price = dto.Price.Value });
            }
            else
            {
                value.Price = dto.Price.Value;
            }
        }
        else
        {
            context.AlcoholValues.RemoveRange(product.Values);
        }
    }

    private async Task<AlcoholCategory> FindOrCreateCategory(string categoryName, CancellationToken cancellationToken)
    {
        var name = categoryName.Trim();
        var category = await context.AlcoholCategories.FirstOrDefaultAsync(item => item.Category == name, cancellationToken);
        if (category is not null)
        {
            return category;
        }

        category = new AlcoholCategory { Category = name };
        context.AlcoholCategories.Add(category);
        return category;
    }

    private async Task<AlcoholType?> FindOrCreateType(string? typeName, AlcoholCategory category, CancellationToken cancellationToken)
    {
        var name = Trim(typeName);
        if (name is null)
        {
            return null;
        }

        var type = await context.AlcoholTypes.FirstOrDefaultAsync(
            item => item.Type == name && item.CategoryID == category.ID,
            cancellationToken);

        if (type is not null)
        {
            return type;
        }

        type = new AlcoholType { Type = name, Category = category };
        context.AlcoholTypes.Add(type);
        return type;
    }

    private async Task<AlcoholStyle?> FindOrCreateStyle(string? styleName, AlcoholType? type, CancellationToken cancellationToken)
    {
        var name = Trim(styleName);
        if (name is null)
        {
            return null;
        }

        var style = await context.AlcoholStyles.FirstOrDefaultAsync(
            item => item.Name == name && item.TypeID == (type == null ? null : type.ID),
            cancellationToken);

        if (style is not null)
        {
            return style;
        }

        style = new AlcoholStyle { Name = name, Type = type };
        context.AlcoholStyles.Add(style);
        return style;
    }

    private async Task<AlcoholRegion?> FindOrCreateRegion(string? regionName, string? countryName, CancellationToken cancellationToken)
    {
        var name = Trim(regionName);
        if (name is null)
        {
            return null;
        }

        var country = Trim(countryName);
        var region = await context.AlcoholRegions.FirstOrDefaultAsync(
            item => item.Region == name && item.Country == country,
            cancellationToken);

        if (region is not null)
        {
            return region;
        }

        region = new AlcoholRegion { Region = name, Country = country };
        context.AlcoholRegions.Add(region);
        return region;
    }

    private async Task<AlcoholLocation> FindOrCreateLocation(string? locationName, CancellationToken cancellationToken)
    {
        var name = Trim(locationName) ?? NoLocation;
        var location = await context.AlcoholLocations.FirstOrDefaultAsync(item => item.Location == name, cancellationToken);
        if (location is not null)
        {
            return location;
        }

        location = new AlcoholLocation { Location = name };
        context.AlcoholLocations.Add(location);
        return location;
    }

    private static IEnumerable<AlcoholItemDto> ApplyStatusFilter(IEnumerable<AlcoholItemDto> query, string? status)
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

        if (dto.Rating is < 0 or > 100)
        {
            return "Rating must be between 0 and 100.";
        }

        return dto.QuantityOnHand < 0 ? "Quantity cannot be negative." : null;
    }

    private static bool NeedsCleanup(AlcoholItemDto item)
    {
        if (item.StatusID != OwnedStatus && item.StatusID != WantedStatus)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(item.Location) || item.Location == NoLocation)
        {
            return true;
        }

        if (item.Category.Equals("Wine", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(item.Variety) &&
            string.IsNullOrWhiteSpace(item.Color))
        {
            return true;
        }

        return item.Price is < 0 || item.Rating is < 0 or > 100 || item.QuantityOnHand is < 0;
    }

    private static IReadOnlyList<AlcoholBreakdownDto> BuildBreakdown(
        IEnumerable<AlcoholItemDto> items,
        Func<AlcoholItemDto, string?> labelSelector,
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

    private static AlcoholItemDto ToDto(AlcoholCount count)
    {
        var product = count.Alcohol;
        var price = product?.Values
            .OrderByDescending(value => value.AsOfDate)
            .ThenByDescending(value => value.ID)
            .Select(value => (decimal?)value.Price)
            .FirstOrDefault();
        var rating = product?.Ratings
            .Where(value => value.Rating.HasValue)
            .Average(value => value.Rating);

        return new AlcoholItemDto(
            count.ID,
            product?.Category?.Category ?? "Uncategorized",
            product?.Product ?? string.Empty,
            product?.Producer,
            product?.Style?.Name,
            product?.Type?.Type,
            product?.Variety,
            product?.Color,
            product?.Country ?? product?.Region?.Country,
            product?.Region?.Region,
            product?.VintageOrYear,
            product?.Size,
            price,
            rating,
            count.Qty,
            count.Location?.Location,
            count.StatusID,
            count.Notes ?? product?.Notes,
            product?.SourceSheet,
            product?.SourceRowLabel);
    }

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

    private static void AddCleanupSuggestions(
        ICollection<AlcoholLookupCleanupSuggestionDto> suggestions,
        string field,
        IEnumerable<string?> values,
        IReadOnlyDictionary<string, string?> cleanupMap,
        string reason)
    {
        var grouped = values
            .Select(Trim)
            .Where(value => value is not null)
            .GroupBy(value => value!, StringComparer.OrdinalIgnoreCase)
            .Select(group => new { Value = group.Key, Count = group.Count() });

        foreach (var group in grouped)
        {
            if (cleanupMap.TryGetValue(group.Value, out var suggested))
            {
                suggestions.Add(new AlcoholLookupCleanupSuggestionDto(
                    field,
                    group.Value,
                    suggested,
                    group.Count,
                    suggested is null ? "Imported placeholder should be cleared." : reason));
                continue;
            }

            if (IsSuspiciousLookupValue(group.Value))
            {
                suggestions.Add(new AlcoholLookupCleanupSuggestionDto(
                    field,
                    group.Value,
                    null,
                    group.Count,
                    "Value looks like an import placeholder or abbreviation and should be reviewed."));
            }
        }
    }

    private static bool IsSuspiciousLookupValue(string value)
    {
        if (value.Length <= 1)
        {
            return true;
        }

        return value.All(character => !char.IsLetterOrDigit(character));
    }

    private async Task<MergeAlcoholLookupResultDto> MergeCategories(
        string sourceValue,
        string? targetValue,
        CancellationToken cancellationToken)
    {
        var sourceCategories = await context.AlcoholCategories
            .Where(category => category.Category == sourceValue)
            .ToListAsync(cancellationToken);
        var targetCategory = targetValue is null
            ? null
            : await FindOrCreateCategory(targetValue, cancellationToken);
        var updatedRows = 0;
        var removedRows = 0;

        foreach (var source in sourceCategories.Where(category => category.ID != targetCategory?.ID))
        {
            var products = await context.AlcoholProducts
                .Where(product => product.CategoryID == source.ID)
                .ToListAsync(cancellationToken);
            foreach (var product in products)
            {
                product.Category = targetCategory;
            }

            var types = await context.AlcoholTypes
                .Where(type => type.CategoryID == source.ID)
                .ToListAsync(cancellationToken);
            foreach (var type in types)
            {
                type.Category = targetCategory;
            }

            context.AlcoholCategories.Remove(source);
            updatedRows += products.Count + types.Count;
            removedRows += 1;
        }

        return new MergeAlcoholLookupResultDto("Category", sourceValue, targetCategory?.Category, updatedRows, removedRows);
    }

    private async Task<MergeAlcoholLookupResultDto> MergeTypes(
        string sourceValue,
        string? targetValue,
        CancellationToken cancellationToken)
    {
        var sourceTypes = await context.AlcoholTypes
            .Where(type => type.Type == sourceValue)
            .ToListAsync(cancellationToken);
        var updatedRows = 0;
        var removedRows = 0;

        foreach (var source in sourceTypes)
        {
            AlcoholType? targetType = null;
            if (targetValue is not null)
            {
                targetType = await context.AlcoholTypes.FirstOrDefaultAsync(
                    type => type.ID != source.ID && type.Type == targetValue && type.CategoryID == source.CategoryID,
                    cancellationToken);
                if (targetType is null)
                {
                    targetType = new AlcoholType { Type = targetValue, CategoryID = source.CategoryID };
                    context.AlcoholTypes.Add(targetType);
                }
            }

            var products = await context.AlcoholProducts
                .Where(product => product.TypeID == source.ID)
                .ToListAsync(cancellationToken);
            foreach (var product in products)
            {
                product.Type = targetType;
            }

            var styles = await context.AlcoholStyles
                .Where(style => style.TypeID == source.ID)
                .ToListAsync(cancellationToken);
            foreach (var style in styles)
            {
                style.Type = targetType;
            }

            context.AlcoholTypes.Remove(source);
            updatedRows += products.Count + styles.Count;
            removedRows += 1;
        }

        return new MergeAlcoholLookupResultDto("Type", sourceValue, targetValue, updatedRows, removedRows);
    }

    private async Task<MergeAlcoholLookupResultDto> MergeStyles(
        string sourceValue,
        string? targetValue,
        CancellationToken cancellationToken)
    {
        var sourceStyles = await context.AlcoholStyles
            .Where(style => style.Name == sourceValue)
            .ToListAsync(cancellationToken);
        var updatedRows = 0;
        var removedRows = 0;

        foreach (var source in sourceStyles)
        {
            AlcoholStyle? targetStyle = null;
            if (targetValue is not null)
            {
                targetStyle = await context.AlcoholStyles.FirstOrDefaultAsync(
                    style => style.ID != source.ID && style.Name == targetValue && style.TypeID == source.TypeID,
                    cancellationToken);
                if (targetStyle is null)
                {
                    targetStyle = new AlcoholStyle { Name = targetValue, TypeID = source.TypeID };
                    context.AlcoholStyles.Add(targetStyle);
                }
            }

            var products = await context.AlcoholProducts
                .Where(product => product.StyleID == source.ID)
                .ToListAsync(cancellationToken);
            foreach (var product in products)
            {
                product.Style = targetStyle;
            }

            context.AlcoholStyles.Remove(source);
            updatedRows += products.Count;
            removedRows += 1;
        }

        return new MergeAlcoholLookupResultDto("Style", sourceValue, targetValue, updatedRows, removedRows);
    }

    private async Task<MergeAlcoholLookupResultDto> MergeLocations(
        string sourceValue,
        string? targetValue,
        CancellationToken cancellationToken)
    {
        var sourceLocations = await context.AlcoholLocations
            .Where(location => location.Location == sourceValue)
            .ToListAsync(cancellationToken);
        var targetLocation = targetValue is null
            ? null
            : await FindOrCreateLocation(targetValue, cancellationToken);
        var updatedRows = 0;
        var removedRows = 0;

        foreach (var source in sourceLocations.Where(location => location.ID != targetLocation?.ID))
        {
            var counts = await context.AlcoholCounts
                .Where(count => count.LocationID == source.ID)
                .ToListAsync(cancellationToken);
            foreach (var count in counts)
            {
                count.Location = targetLocation;
            }

            context.AlcoholLocations.Remove(source);
            updatedRows += counts.Count;
            removedRows += 1;
        }

        return new MergeAlcoholLookupResultDto("Location", sourceValue, targetLocation?.Location, updatedRows, removedRows);
    }

    private async Task<MergeAlcoholLookupResultDto> MergeCountries(
        string sourceValue,
        string? targetValue,
        CancellationToken cancellationToken)
    {
        var result = await ApplyCountryCleanup(sourceValue, targetValue, cancellationToken);
        return new MergeAlcoholLookupResultDto(result.Field, result.CurrentValue, result.SuggestedValue, result.UpdatedRows, result.RemovedRows);
    }

    private async Task<MergeAlcoholLookupResultDto> MergeRegions(
        string sourceValue,
        string? targetValue,
        CancellationToken cancellationToken)
    {
        var result = await ApplyRegionCleanup(sourceValue, targetValue, cancellationToken);
        return new MergeAlcoholLookupResultDto(result.Field, result.CurrentValue, result.SuggestedValue, result.UpdatedRows, result.RemovedRows);
    }

    private async Task<ApplyAlcoholLookupCleanupResultDto> ApplyCountryCleanup(
        string currentValue,
        string? suggestedValue,
        CancellationToken cancellationToken)
    {
        var normalizedSuggestion = Trim(suggestedValue);
        var products = await context.AlcoholProducts
            .Where(product => product.Country == currentValue)
            .ToListAsync(cancellationToken);
        foreach (var product in products)
        {
            product.Country = normalizedSuggestion;
        }

        var updatedRows = products.Count;
        var removedRows = 0;
        var regions = await context.AlcoholRegions
            .Where(region => region.Country == currentValue)
            .ToListAsync(cancellationToken);

        foreach (var region in regions)
        {
            if (normalizedSuggestion is null)
            {
                region.Country = null;
                updatedRows += 1;
                continue;
            }

            var target = await context.AlcoholRegions.FirstOrDefaultAsync(
                item => item.ID != region.ID && item.Region == region.Region && item.Country == normalizedSuggestion,
                cancellationToken);

            if (target is null)
            {
                region.Country = normalizedSuggestion;
                updatedRows += 1;
                continue;
            }

            var affectedProducts = await context.AlcoholProducts
                .Where(product => product.RegionID == region.ID)
                .ToListAsync(cancellationToken);
            foreach (var product in affectedProducts)
            {
                product.Region = target;
            }

            context.AlcoholRegions.Remove(region);
            updatedRows += affectedProducts.Count;
            removedRows += 1;
        }

        return new ApplyAlcoholLookupCleanupResultDto("Country", currentValue, normalizedSuggestion, updatedRows, removedRows);
    }

    private async Task<ApplyAlcoholLookupCleanupResultDto> ApplyRegionCleanup(
        string currentValue,
        string? suggestedValue,
        CancellationToken cancellationToken)
    {
        var normalizedSuggestion = Trim(suggestedValue);
        var regions = await context.AlcoholRegions
            .Where(region => region.Region == currentValue)
            .ToListAsync(cancellationToken);
        var updatedRows = 0;
        var removedRows = 0;

        foreach (var region in regions)
        {
            var affectedProducts = await context.AlcoholProducts
                .Where(product => product.RegionID == region.ID)
                .ToListAsync(cancellationToken);

            if (normalizedSuggestion is null)
            {
                foreach (var product in affectedProducts)
                {
                    product.Region = null;
                }

                context.AlcoholRegions.Remove(region);
                updatedRows += affectedProducts.Count;
                removedRows += 1;
                continue;
            }

            var target = await context.AlcoholRegions.FirstOrDefaultAsync(
                item => item.ID != region.ID && item.Region == normalizedSuggestion && item.Country == region.Country,
                cancellationToken);

            if (target is null)
            {
                region.Region = normalizedSuggestion;
                updatedRows += affectedProducts.Count + 1;
                continue;
            }

            foreach (var product in affectedProducts)
            {
                product.Region = target;
            }

            context.AlcoholRegions.Remove(region);
            updatedRows += affectedProducts.Count;
            removedRows += 1;
        }

        return new ApplyAlcoholLookupCleanupResultDto("Region", currentValue, normalizedSuggestion, updatedRows, removedRows);
    }

    private static bool TryGetExpectedSuggestion(string field, string currentValue, out string? suggestion)
    {
        suggestion = null;
        return field.ToLowerInvariant() switch
        {
            "country" => CountryCleanupMap.TryGetValue(currentValue, out suggestion),
            "region" => RegionCleanupMap.TryGetValue(currentValue, out suggestion),
            _ => false
        };
    }

    private static bool SuggestionMatches(string? expected, string? actual) =>
        string.Equals(Trim(expected), Trim(actual), StringComparison.OrdinalIgnoreCase);

    private static bool Contains(string? value, string term) =>
        value?.Contains(term, StringComparison.OrdinalIgnoreCase) == true;

    private static string StatusLabel(string? status) => status switch
    {
        OwnedStatus => "Owned",
        WantedStatus => "Wanted",
        _ => "Unknown"
    };

    private static string NormalizeStatus(string? status)
    {
        var normalized = Trim(status)?.ToUpperInvariant();
        return normalized is OwnedStatus or WantedStatus ? normalized : OwnedStatus;
    }

    private static string KeyPart(string? value) => Trim(value)?.ToUpperInvariant() ?? string.Empty;

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
