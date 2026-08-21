using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Xml.Linq;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/shopping-list")]
public class ShoppingListController(VerdelakDbContext context) : ControllerBase
{
    private static readonly string[] Statuses = ["Needed", "Purchased", "Skipped"];

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShoppingListItemDto>>> GetItems(
        [FromQuery] string? category,
        [FromQuery] string? status = "Needed",
        [FromQuery] string? sourceArea = null,
        [FromQuery] string? store = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.ShoppingListItems.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(item => item.Category == category.Trim());
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(item => item.Status == status.Trim());
        }

        if (!string.IsNullOrWhiteSpace(sourceArea) && !sourceArea.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var trimmedSourceArea = sourceArea.Trim();
            query = trimmedSourceArea.Equals("Manual", StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.SourceArea == null)
                : query.Where(item => item.SourceArea == trimmedSourceArea);
        }

        if (!string.IsNullOrWhiteSpace(store) && !store.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var trimmedStore = store.Trim();
            query = trimmedStore.Equals("Store not set", StringComparison.OrdinalIgnoreCase)
                ? query.Where(item => item.Store == null || item.Store == "")
                : query.Where(item => item.Store == trimmedStore);
        }

        return await query
            .OrderBy(item => item.Store ?? string.Empty)
            .ThenBy(item => item.Aisle ?? string.Empty)
            .ThenBy(item => item.SortOrder ?? int.MaxValue)
            .ThenBy(item => item.Category)
            .ThenBy(item => item.ItemName)
            .ThenByDescending(item => item.CreatedAt)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingListItemDto>> CreateItem(ShoppingListItemUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var existing = await FindOpenSourceItem(dto.SourceArea, dto.SourceType, dto.SourceId, cancellationToken);
        if (existing is not null)
        {
            Apply(existing, dto);
            await context.SaveChangesAsync(cancellationToken);
            return ToDto(existing);
        }

        var item = new ShoppingListItem { CreatedAt = DateTime.UtcNow };
        Apply(item, dto);
        context.ShoppingListItems.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetItems), new { id = item.Id }, ToDto(item));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingListItemDto>> UpdateItem(int id, ShoppingListItemUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.ShoppingListItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        Apply(item, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(item);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingListItemDto>> UpdateStatus(int id, ShoppingListItemStatusUpdateDto dto, CancellationToken cancellationToken)
    {
        var status = dto.Status?.Trim();
        if (string.IsNullOrWhiteSpace(status) || !Statuses.Contains(status, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest("Status must be Needed, Purchased, or Skipped.");
        }

        var item = await context.ShoppingListItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        item.Status = Statuses.Single(value => value.Equals(status, StringComparison.OrdinalIgnoreCase));
        item.CompletedAt = item.Status == "Needed" ? null : DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteItem(int id, CancellationToken cancellationToken)
    {
        var item = await context.ShoppingListItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.ShoppingListItems.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("completed")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingListClearCompletedResultDto>> ClearCompleted(
        [FromQuery] int olderThanDays,
        CancellationToken cancellationToken)
    {
        if (olderThanDays < 0)
        {
            return BadRequest("Older-than days cannot be negative.");
        }

        var cutoff = DateTime.UtcNow.Date.AddDays(-olderThanDays);
        var items = await context.ShoppingListItems
            .Where(item => (item.Status == "Purchased" || item.Status == "Skipped")
                && item.CompletedAt.HasValue
                && item.CompletedAt.Value.Date <= cutoff)
            .ToListAsync(cancellationToken);

        context.ShoppingListItems.RemoveRange(items);
        await context.SaveChangesAsync(cancellationToken);
        return new ShoppingListClearCompletedResultDto(items.Count);
    }

    [HttpGet("duplicates")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<ShoppingListDuplicateGroupDto>>> GetDuplicates(
        [FromQuery] string? status = "Needed",
        CancellationToken cancellationToken = default)
    {
        var normalizedStatus = NormalizeStatus(status);
        if (normalizedStatus is null)
        {
            return BadRequest("Status must be Needed, Purchased, Skipped, or All.");
        }

        var query = context.ShoppingListItems.AsNoTracking().AsQueryable();
        if (normalizedStatus != "All")
        {
            query = query.Where(item => item.Status == normalizedStatus);
        }

        var items = await query.ToListAsync(cancellationToken);
        return items
            .GroupBy(DuplicateKey)
            .Where(group => group.Count() > 1)
            .OrderBy(group => group.First().Store ?? string.Empty)
            .ThenBy(group => group.First().Aisle ?? string.Empty)
            .ThenBy(group => group.First().Category)
            .ThenBy(group => group.First().ItemName)
            .Select(group => ToDuplicateGroupDto(group.Key, group.OrderBy(item => item.CreatedAt).ToList()))
            .ToList();
    }

    [HttpPost("duplicates/merge")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingListMergeDuplicatesResultDto>> MergeDuplicates(CancellationToken cancellationToken)
    {
        var items = await context.ShoppingListItems
            .Where(item => item.Status == "Needed")
            .ToListAsync(cancellationToken);

        var duplicateGroups = items
            .GroupBy(DuplicateKey)
            .Where(group => group.Count() > 1)
            .ToList();

        var updated = 0;
        var removed = 0;

        foreach (var group in duplicateGroups)
        {
            var ordered = group.OrderBy(item => item.CreatedAt).ToList();
            var primary = ordered[0];
            var duplicates = ordered.Skip(1).ToList();
            var quantities = ordered.Select(item => item.Quantity).ToList();

            if (quantities.All(quantity => quantity.HasValue))
            {
                primary.Quantity = quantities.Sum(quantity => quantity!.Value);
            }

            primary.Notes = MergeText(
                primary.Notes,
                duplicates.Select(item => item.Notes),
                duplicates.Select(item => item.Reason));

            context.ShoppingListItems.RemoveRange(duplicates);
            updated += 1;
            removed += duplicates.Count;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new ShoppingListMergeDuplicatesResultDto(duplicateGroups.Count, updated, removed);
    }

    [HttpGet("history/summary")]
    public async Task<ActionResult<ShoppingListHistorySummaryDto>> GetHistorySummary(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var items = await BuildHistoryQuery(from, to)
            .Select(item => new ShoppingHistoryExportRow(
                item.CompletedAt!.Value,
                item.ItemName,
                item.Category,
                item.Status,
                item.Quantity,
                item.Unit,
                item.Store,
                item.Aisle,
                item.SourceArea,
                item.SourceType,
                item.Reason))
            .ToListAsync(cancellationToken);

        return BuildHistorySummary(items);
    }

    [HttpGet("history/export.csv")]
    public async Task<IActionResult> ExportHistoryCsv(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var rows = await GetHistoryRows(from, to, cancellationToken);
        var csv = BuildCsv(rows);
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", "shopping-history.csv");
    }

    [HttpGet("history/export.xlsx")]
    public async Task<IActionResult> ExportHistoryXlsx(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var rows = await GetHistoryRows(from, to, cancellationToken);
        return File(BuildXlsx(rows), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "shopping-history.xlsx");
    }

    [HttpGet("defaults")]
    public async Task<ActionResult<IEnumerable<ShoppingItemDefaultDto>>> GetDefaults(
        [FromQuery] bool frequentOnly = false,
        CancellationToken cancellationToken = default)
    {
        var query = context.ShoppingItemDefaults.AsNoTracking().AsQueryable();
        if (frequentOnly)
        {
            query = query.Where(item => item.IsFrequent);
        }

        return await query
            .OrderByDescending(item => item.IsFrequent)
            .ThenBy(item => item.Store ?? string.Empty)
            .ThenBy(item => item.Aisle ?? string.Empty)
            .ThenBy(item => item.SortOrder ?? int.MaxValue)
            .ThenBy(item => item.ItemName)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("defaults")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingItemDefaultDto>> CreateDefault(ShoppingItemDefaultUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var existing = await FindDefault(dto.ItemName, dto.Category, dto.Store, cancellationToken);
        if (existing is not null)
        {
            Apply(existing, dto);
            existing.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
            return Ok(ToDto(existing));
        }

        var item = new ShoppingItemDefault { CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Apply(item, dto);
        context.ShoppingItemDefaults.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(item));
    }

    [HttpPost("defaults/from-item/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingItemDefaultDto>> SaveDefaultFromItem(int id, CancellationToken cancellationToken)
    {
        var source = await context.ShoppingListItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (source is null)
        {
            return NotFound();
        }

        var existing = await FindDefault(source.ItemName, source.Category, source.Store, cancellationToken);
        if (existing is null)
        {
            existing = new ShoppingItemDefault { CreatedAt = DateTime.UtcNow };
            context.ShoppingItemDefaults.Add(existing);
        }

        existing.ItemName = source.ItemName;
        existing.Category = source.Category;
        existing.Quantity = source.Quantity;
        existing.Unit = source.Unit;
        existing.Store = source.Store;
        existing.Aisle = source.Aisle;
        existing.SortOrder = source.SortOrder;
        existing.Notes = source.Notes;
        existing.IsFrequent = true;
        existing.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(existing));
    }

    [HttpPut("defaults/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingItemDefaultDto>> UpdateDefault(int id, ShoppingItemDefaultUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.ShoppingItemDefaults.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        Apply(item, dto);
        item.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(item));
    }

    [HttpDelete("defaults/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDefault(int id, CancellationToken cancellationToken)
    {
        var item = await context.ShoppingItemDefaults.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.ShoppingItemDefaults.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("defaults/{id:int}/quick-add")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingListItemDto>> QuickAddDefault(int id, CancellationToken cancellationToken)
    {
        var source = await context.ShoppingItemDefaults.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (source is null)
        {
            return NotFound();
        }

        var item = await FindOpenManualItem(source.ItemName, source.Category, source.Unit, source.Store, source.Aisle, cancellationToken);
        if (item is null)
        {
            item = new ShoppingListItem { CreatedAt = DateTime.UtcNow, Status = "Needed" };
            context.ShoppingListItems.Add(item);
        }

        item.ItemName = source.ItemName;
        item.Category = source.Category;
        item.Quantity = source.Quantity;
        item.Unit = source.Unit;
        item.Store = source.Store;
        item.Aisle = source.Aisle;
        item.SortOrder = source.SortOrder;
        item.SourceArea = null;
        item.SourceType = null;
        item.SourceId = null;
        item.Reason = "Frequent item";
        item.Notes = source.Notes;
        item.Status = "Needed";
        item.CompletedAt = null;

        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(item));
    }

    [HttpGet("pantry")]
    public async Task<ActionResult<IEnumerable<PantryItemDto>>> GetPantryItems(
        [FromQuery] bool inStockOnly = false,
        CancellationToken cancellationToken = default)
    {
        var query = context.PantryItems.AsNoTracking().AsQueryable();
        if (inStockOnly)
        {
            query = query.Where(item => item.IsInStock);
        }

        return await query
            .OrderBy(item => item.Category)
            .ThenBy(item => item.ItemName)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("pantry")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PantryItemDto>> CreatePantryItem(PantryItemUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var existing = await FindPantryItem(dto.ItemName, dto.Category, dto.Unit, cancellationToken);
        if (existing is not null)
        {
            Apply(existing, dto);
            existing.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
            return Ok(ToDto(existing));
        }

        var item = new PantryItem { CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        Apply(item, dto);
        context.PantryItems.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(item));
    }

    [HttpPut("pantry/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PantryItemDto>> UpdatePantryItem(int id, PantryItemUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.PantryItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        Apply(item, dto);
        item.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(item));
    }

    [HttpDelete("pantry/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePantryItem(int id, CancellationToken cancellationToken)
    {
        var item = await context.PantryItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.PantryItems.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ShoppingListItem?> FindOpenSourceItem(
        string? sourceArea,
        string? sourceType,
        int? sourceId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sourceArea) || string.IsNullOrWhiteSpace(sourceType) || !sourceId.HasValue)
        {
            return null;
        }

        return await context.ShoppingListItems
            .SingleOrDefaultAsync(item =>
                item.SourceArea == sourceArea.Trim()
                && item.SourceType == sourceType.Trim()
                && item.SourceId == sourceId.Value
                && item.Status == "Needed",
                cancellationToken);
    }

    private async Task<ShoppingListItem?> FindOpenManualItem(
        string itemName,
        string category,
        string? unit,
        string? store,
        string? aisle,
        CancellationToken cancellationToken)
    {
        return await context.ShoppingListItems
            .FirstOrDefaultAsync(item =>
                item.SourceArea == null
                && item.Status == "Needed"
                && item.ItemName == itemName
                && item.Category == category
                && item.Unit == unit
                && item.Store == store
                && item.Aisle == aisle,
                cancellationToken);
    }

    private async Task<ShoppingItemDefault?> FindDefault(string itemName, string category, string? store, CancellationToken cancellationToken)
    {
        var name = itemName.Trim();
        var trimmedCategory = category.Trim();
        var trimmedStore = string.IsNullOrWhiteSpace(store) ? null : store.Trim();
        return await context.ShoppingItemDefaults
            .FirstOrDefaultAsync(item =>
                item.ItemName == name
                && item.Category == trimmedCategory
                && item.Store == trimmedStore,
                cancellationToken);
    }

    private async Task<PantryItem?> FindPantryItem(string itemName, string category, string? unit, CancellationToken cancellationToken)
    {
        var name = itemName.Trim();
        var trimmedCategory = category.Trim();
        var trimmedUnit = string.IsNullOrWhiteSpace(unit) ? null : unit.Trim();
        return await context.PantryItems
            .FirstOrDefaultAsync(item => item.ItemName == name && item.Category == trimmedCategory && item.Unit == trimmedUnit, cancellationToken);
    }

    private IQueryable<ShoppingListItem> BuildHistoryQuery(DateTime? from, DateTime? to)
    {
        var query = context.ShoppingListItems
            .AsNoTracking()
            .Where(item => (item.Status == "Purchased" || item.Status == "Skipped") && item.CompletedAt.HasValue);

        if (from.HasValue)
        {
            var fromDate = from.Value.Date;
            query = query.Where(item => item.CompletedAt!.Value.Date >= fromDate);
        }

        if (to.HasValue)
        {
            var toDate = to.Value.Date;
            query = query.Where(item => item.CompletedAt!.Value.Date <= toDate);
        }

        return query;
    }

    private async Task<List<ShoppingHistoryExportRow>> GetHistoryRows(DateTime? from, DateTime? to, CancellationToken cancellationToken)
    {
        return await BuildHistoryQuery(from, to)
            .OrderByDescending(item => item.CompletedAt)
            .ThenBy(item => item.Category)
            .ThenBy(item => item.ItemName)
            .Select(item => new ShoppingHistoryExportRow(
                item.CompletedAt!.Value,
                item.ItemName,
                item.Category,
                item.Status,
                item.Quantity,
                item.Unit,
                item.Store,
                item.Aisle,
                item.SourceArea,
                item.SourceType,
                item.Reason))
            .ToListAsync(cancellationToken);
    }

    private static ShoppingListHistorySummaryDto BuildHistorySummary(IReadOnlyCollection<ShoppingHistoryExportRow> rows)
    {
        var months = rows
            .GroupBy(row => new DateTime(row.CompletedAt.Year, row.CompletedAt.Month, 1))
            .OrderByDescending(group => group.Key)
            .Select(group => new ShoppingListHistoryMonthDto(
                group.Key.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                group.Count(row => row.Status == "Purchased"),
                group.Count(row => row.Status == "Skipped")))
            .ToList();

        var bySource = rows
            .GroupBy(row => string.IsNullOrWhiteSpace(row.SourceArea) ? "Manual" : row.SourceArea)
            .OrderByDescending(group => group.Count(row => row.Status == "Purchased"))
            .ThenBy(group => group.Key)
            .Select(group => new ShoppingListHistoryBucketDto(
                group.Key,
                group.Count(row => row.Status == "Purchased"),
                group.Count(row => row.Status == "Skipped")))
            .ToList();

        var byCategory = rows
            .GroupBy(row => row.Category)
            .OrderByDescending(group => group.Count(row => row.Status == "Purchased"))
            .ThenBy(group => group.Key)
            .Select(group => new ShoppingListHistoryBucketDto(
                group.Key,
                group.Count(row => row.Status == "Purchased"),
                group.Count(row => row.Status == "Skipped")))
            .ToList();

        return new ShoppingListHistorySummaryDto(months, bySource, byCategory);
    }

    private static string BuildCsv(IReadOnlyCollection<ShoppingHistoryExportRow> rows)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Completed,Item,Category,Status,Quantity,Unit,Store,Aisle,Source,Source Type,Reason");
        foreach (var row in rows)
        {
            builder.AppendLine(string.Join(",",
                Csv(row.CompletedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)),
                Csv(row.ItemName),
                Csv(row.Category),
                Csv(row.Status),
                Csv(row.Quantity?.ToString(CultureInfo.InvariantCulture)),
                Csv(row.Unit),
                Csv(row.Store),
                Csv(row.Aisle),
                Csv(string.IsNullOrWhiteSpace(row.SourceArea) ? "Manual" : row.SourceArea),
                Csv(row.SourceType),
                Csv(row.Reason)));
        }

        return builder.ToString();
    }

    private static byte[] BuildXlsx(IReadOnlyCollection<ShoppingHistoryExportRow> rows)
    {
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            AddZipEntry(archive, "[Content_Types].xml",
                """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>""");
            AddZipEntry(archive, "_rels/.rels",
                """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>""");
            AddZipEntry(archive, "xl/_rels/workbook.xml.rels",
                """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>""");
            AddZipEntry(archive, "xl/workbook.xml",
                """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Shopping History" sheetId="1" r:id="rId1"/></sheets></workbook>""");
            AddZipEntry(archive, "xl/worksheets/sheet1.xml", BuildWorksheetXml(rows));
        }

        return stream.ToArray();
    }

    private static string BuildWorksheetXml(IReadOnlyCollection<ShoppingHistoryExportRow> rows)
    {
        string[] headers = ["Completed", "Item", "Category", "Status", "Quantity", "Unit", "Store", "Aisle", "Source", "Source Type", "Reason"];
        var sheetRows = new List<XElement> { BuildWorksheetRow(1, headers) };
        var rowNumber = 2;

        foreach (var row in rows)
        {
            sheetRows.Add(BuildWorksheetRow(rowNumber++, [
                row.CompletedAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                row.ItemName,
                row.Category,
                row.Status,
                row.Quantity?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                row.Unit ?? string.Empty,
                row.Store ?? string.Empty,
                row.Aisle ?? string.Empty,
                string.IsNullOrWhiteSpace(row.SourceArea) ? "Manual" : row.SourceArea,
                row.SourceType ?? string.Empty,
                row.Reason ?? string.Empty
            ]));
        }

        XNamespace ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
        var worksheet = new XElement(ns + "worksheet",
            new XElement(ns + "sheetData", sheetRows));
        return new XDocument(new XDeclaration("1.0", "UTF-8", "yes"), worksheet).ToString(SaveOptions.DisableFormatting);
    }

    private static XElement BuildWorksheetRow(int rowNumber, IReadOnlyList<string> values)
    {
        XNamespace ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
        return new XElement(ns + "row",
            new XAttribute("r", rowNumber),
            values.Select((value, index) => new XElement(ns + "c",
                new XAttribute("r", $"{(char)('A' + index)}{rowNumber}"),
                new XAttribute("t", "inlineStr"),
                new XElement(ns + "is", new XElement(ns + "t", value)))));
    }

    private static void AddZipEntry(ZipArchive archive, string path, string contents)
    {
        var entry = archive.CreateEntry(path);
        using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
        writer.Write(contents);
    }

    private static string Csv(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        return $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }

    private static string? Validate(ShoppingListItemUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ItemName))
        {
            return "Item name is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            return "Category is required.";
        }

        if (dto.Quantity is < 0)
        {
            return "Quantity cannot be negative.";
        }

        return null;
    }

    private static string? Validate(ShoppingItemDefaultUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ItemName))
        {
            return "Item name is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            return "Category is required.";
        }

        if (dto.Quantity is < 0)
        {
            return "Quantity cannot be negative.";
        }

        return null;
    }

    private static string? Validate(PantryItemUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ItemName))
        {
            return "Item name is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            return "Category is required.";
        }

        if (dto.Quantity is < 0)
        {
            return "Quantity cannot be negative.";
        }

        return null;
    }

    private static void Apply(ShoppingListItem item, ShoppingListItemUpsertDto dto)
    {
        item.ItemName = dto.ItemName.Trim();
        item.Category = dto.Category.Trim();
        item.Quantity = dto.Quantity;
        item.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim();
        item.Store = string.IsNullOrWhiteSpace(dto.Store) ? null : dto.Store.Trim();
        item.Aisle = string.IsNullOrWhiteSpace(dto.Aisle) ? null : dto.Aisle.Trim();
        item.SortOrder = dto.SortOrder;
        item.SourceArea = string.IsNullOrWhiteSpace(dto.SourceArea) ? null : dto.SourceArea.Trim();
        item.SourceType = string.IsNullOrWhiteSpace(dto.SourceType) ? null : dto.SourceType.Trim();
        item.SourceId = dto.SourceId;
        item.Reason = string.IsNullOrWhiteSpace(dto.Reason) ? null : dto.Reason.Trim();
        item.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
        if (string.IsNullOrWhiteSpace(item.Status))
        {
            item.Status = "Needed";
        }
    }

    private static void Apply(ShoppingItemDefault item, ShoppingItemDefaultUpsertDto dto)
    {
        item.ItemName = dto.ItemName.Trim();
        item.Category = dto.Category.Trim();
        item.Quantity = dto.Quantity;
        item.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim();
        item.Store = string.IsNullOrWhiteSpace(dto.Store) ? null : dto.Store.Trim();
        item.Aisle = string.IsNullOrWhiteSpace(dto.Aisle) ? null : dto.Aisle.Trim();
        item.SortOrder = dto.SortOrder;
        item.IsFrequent = dto.IsFrequent;
        item.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static void Apply(PantryItem item, PantryItemUpsertDto dto)
    {
        item.ItemName = dto.ItemName.Trim();
        item.Category = dto.Category.Trim();
        item.Quantity = dto.Quantity;
        item.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim();
        item.Location = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location.Trim();
        item.ExpirationDate = dto.ExpirationDate;
        item.IsInStock = dto.IsInStock;
        item.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static ShoppingListItemDto ToDto(ShoppingListItem item)
    {
        return new ShoppingListItemDto(
            item.Id,
            item.ItemName,
            item.Category,
            item.Status,
            item.Quantity,
            item.Unit,
            item.Store,
            item.Aisle,
            item.SortOrder,
            item.SourceArea,
            item.SourceType,
            item.SourceId,
            item.Reason,
            item.Notes,
            item.CreatedAt,
            item.CompletedAt);
    }

    private static ShoppingItemDefaultDto ToDto(ShoppingItemDefault item)
    {
        return new ShoppingItemDefaultDto(
            item.Id,
            item.ItemName,
            item.Category,
            item.Quantity,
            item.Unit,
            item.Store,
            item.Aisle,
            item.SortOrder,
            item.IsFrequent,
            item.Notes,
            item.CreatedAt,
            item.UpdatedAt);
    }

    private static PantryItemDto ToDto(PantryItem item)
    {
        return new PantryItemDto(
            item.Id,
            item.ItemName,
            item.Category,
            item.Quantity,
            item.Unit,
            item.Location,
            item.ExpirationDate,
            item.IsInStock,
            item.Notes,
            item.CreatedAt,
            item.UpdatedAt);
    }

    private static string? NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status) || status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            return "All";
        }

        return Statuses.SingleOrDefault(value => value.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    private static string DuplicateKey(ShoppingListItem item)
    {
        return string.Join("|",
            NormalizeKey(item.ItemName),
            NormalizeKey(item.Category),
            NormalizeKey(item.Unit),
            NormalizeKey(item.Store),
            NormalizeKey(item.Aisle));
    }

    private static string NormalizeKey(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().ToUpperInvariant();
    }

    private static ShoppingListDuplicateGroupDto ToDuplicateGroupDto(string key, IReadOnlyCollection<ShoppingListItem> items)
    {
        var first = items.First();
        var totalQuantity = items.All(item => item.Quantity.HasValue)
            ? items.Sum(item => item.Quantity!.Value)
            : (decimal?)null;

        return new ShoppingListDuplicateGroupDto(
            key,
            first.ItemName,
            first.Category,
            first.Unit,
            first.Store,
            first.Aisle,
            items.Count,
            totalQuantity,
            items.Select(ToDto).ToList());
    }

    private static string? MergeText(string? primaryNotes, IEnumerable<string?> duplicateNotes, IEnumerable<string?> duplicateReasons)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(primaryNotes))
        {
            parts.Add(primaryNotes.Trim());
        }

        foreach (var value in duplicateNotes.Concat(duplicateReasons))
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                parts.Add(value.Trim());
            }
        }

        var distinct = parts.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        return distinct.Count == 0 ? null : string.Join(" | ", distinct);
    }

    private record ShoppingHistoryExportRow(
        DateTime CompletedAt,
        string ItemName,
        string Category,
        string Status,
        decimal? Quantity,
        string? Unit,
        string? Store,
        string? Aisle,
        string? SourceArea,
        string? SourceType,
        string? Reason);
}
