using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/gardening")]
public class GardeningController(VerdelakDbContext context) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("seeds")]
    public async Task<ActionResult<IEnumerable<GardenSeedDto>>> GetSeeds(
        [FromQuery] string? q = null,
        [FromQuery] bool? indoor = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.GardenSeeds.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(seed =>
                seed.Name.Contains(term) ||
                (seed.Description != null && seed.Description.Contains(term)) ||
                (seed.Notes != null && seed.Notes.Contains(term)));
        }

        if (indoor.HasValue)
        {
            query = query.Where(seed => seed.Indoor == indoor.Value);
        }

        var seeds = await query.OrderBy(seed => seed.Name).ToListAsync(cancellationToken);
        var inventory = await context.GardenSeedInventory
            .AsNoTracking()
            .ToDictionaryAsync(item => item.SeedID, cancellationToken);

        return seeds.Select(seed => ToDto(seed, inventory.GetValueOrDefault(seed.ID))).ToList();
    }

    [AllowAnonymous]
    [HttpGet("seeds/export.csv")]
    public async Task<IActionResult> ExportSeeds(CancellationToken cancellationToken)
    {
        var seeds = await context.GardenSeeds
            .AsNoTracking()
            .OrderBy(seed => seed.Name)
            .ToListAsync(cancellationToken);
        var inventory = await context.GardenSeedInventory
            .AsNoTracking()
            .ToDictionaryAsync(item => item.SeedID, cancellationToken);

        var csv = new StringBuilder();
        csv.AppendLine("Name,Description,PlantDate,Indoor,SecondPlantDate,Notes,Qty,Reorder");
        foreach (var seed in seeds)
        {
            var stock = inventory.GetValueOrDefault(seed.ID);
            csv.AppendLine(string.Join(',', new[]
            {
                Csv(seed.Name),
                Csv(seed.Description),
                Csv(seed.PlantDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)),
                seed.Indoor ? "true" : "false",
                Csv(seed.SecondPlantDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)),
                Csv(seed.Notes),
                stock?.Qty.ToString(CultureInfo.InvariantCulture) ?? "0",
                stock?.Reorder == true ? "true" : "false"
            }));
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"garden-seeds-{DateTime.Today:yyyyMMdd}.csv");
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("seeds/import")]
    public async Task<ActionResult<GardenSeedImportResultDto>> ImportSeeds(GardenSeedImportDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Csv))
        {
            return BadRequest("CSV content is required.");
        }

        var rows = ParseCsv(dto.Csv).ToList();
        if (rows.Count < 2)
        {
            return BadRequest("CSV must include a header and at least one seed row.");
        }

        var headers = rows[0]
            .Select((header, index) => new { Header = NormalizeHeader(header), Index = index })
            .Where(item => !string.IsNullOrWhiteSpace(item.Header))
            .ToDictionary(item => item.Header, item => item.Index, StringComparer.OrdinalIgnoreCase);
        if (!headers.ContainsKey("name"))
        {
            return BadRequest("CSV must include a Name column.");
        }

        var existingSeeds = await context.GardenSeeds.ToListAsync(cancellationToken);
        var seedsByName = existingSeeds.ToDictionary(seed => seed.Name.Trim(), StringComparer.OrdinalIgnoreCase);
        var pendingInventory = new List<(GardenSeed Seed, string? Qty, string? Reorder)>();
        var created = 0;
        var updated = 0;
        var skipped = 0;
        var errors = new List<string>();
        var rowResults = new List<GardenSeedImportRowResultDto>();

        for (var rowIndex = 1; rowIndex < rows.Count; rowIndex++)
        {
            var row = rows[rowIndex];
            var name = CsvValue(row, headers, "name");
            if (string.IsNullOrWhiteSpace(name))
            {
                skipped++;
                errors.Add($"Row {rowIndex + 1}: missing Name.");
                rowResults.Add(new GardenSeedImportRowResultDto(rowIndex + 1, null, "Skipped", "Missing Name."));
                continue;
            }

            if (name.Trim().Length > 50)
            {
                skipped++;
                errors.Add($"Row {rowIndex + 1}: Name must be 50 characters or fewer.");
                rowResults.Add(new GardenSeedImportRowResultDto(rowIndex + 1, name.Trim(), "Skipped", "Name must be 50 characters or fewer."));
                continue;
            }

            var exists = seedsByName.TryGetValue(name.Trim(), out var seed);
            if (exists && !dto.UpdateExisting)
            {
                skipped++;
                rowResults.Add(new GardenSeedImportRowResultDto(rowIndex + 1, name.Trim(), "Skipped", "Seed already exists and update existing is off."));
                continue;
            }

            var rowAction = seed is null ? "Created" : "Updated";

            if (seed is null)
            {
                seed = new GardenSeed { Name = name.Trim() };
                context.GardenSeeds.Add(seed);
                seedsByName[seed.Name] = seed;
                created++;
            }
            else
            {
                updated++;
            }

            seed.Name = name.Trim();
            seed.Description = Trim(CsvValue(row, headers, "description"));
            seed.PlantDate = ParseDate(CsvValue(row, headers, "plantdate"));
            seed.Indoor = ParseBool(CsvValue(row, headers, "indoor"));
            seed.SecondPlantDate = ParseDate(CsvValue(row, headers, "secondplantdate"));
            seed.Notes = Trim(CsvValue(row, headers, "notes"));

            var qtyValue = CsvValue(row, headers, "qty");
            var reorderValue = CsvValue(row, headers, "reorder");
            if (!string.IsNullOrWhiteSpace(qtyValue) || !string.IsNullOrWhiteSpace(reorderValue))
            {
                pendingInventory.Add((seed, qtyValue, reorderValue));
            }
        
            rowResults.Add(new GardenSeedImportRowResultDto(rowIndex + 1, seed.Name, rowAction, string.IsNullOrWhiteSpace(qtyValue) && string.IsNullOrWhiteSpace(reorderValue)
                ? $"{rowAction} seed."
                : $"{rowAction} seed and queued inventory update."));
        }

        await context.SaveChangesAsync(cancellationToken);
        var inventoryBySeedId = await context.GardenSeedInventory.ToDictionaryAsync(item => item.SeedID, cancellationToken);
        foreach (var item in pendingInventory)
        {
            if (!inventoryBySeedId.TryGetValue(item.Seed.ID, out var inventory))
            {
                inventory = new GardenSeedInventory { SeedID = item.Seed.ID };
                context.GardenSeedInventory.Add(inventory);
                inventoryBySeedId[item.Seed.ID] = inventory;
            }

            inventory.Qty = ParseShort(item.Qty);
            inventory.Reorder = ParseBool(item.Reorder);
        }

        await context.SaveChangesAsync(cancellationToken);
        return new GardenSeedImportResultDto(created, updated, skipped, errors, rowResults);
    }

    [AllowAnonymous]
    [HttpGet("seeds/{id:int}")]
    public async Task<ActionResult<GardenSeedDto>> GetSeed(int id, CancellationToken cancellationToken)
    {
        var seed = await context.GardenSeeds.AsNoTracking().SingleOrDefaultAsync(seed => seed.ID == id, cancellationToken);
        if (seed is null)
        {
            return NotFound();
        }

        var inventory = await context.GardenSeedInventory.AsNoTracking().SingleOrDefaultAsync(item => item.SeedID == id, cancellationToken);
        return ToDto(seed, inventory);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("seeds")]
    public async Task<ActionResult<GardenSeedDto>> CreateSeed(GardenSeedUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var seed = new GardenSeed();
        Apply(seed, dto);
        context.GardenSeeds.Add(seed);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetSeed), new { id = seed.ID }, ToDto(seed, null));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("seeds/{id:int}")]
    public async Task<ActionResult<GardenSeedDto>> UpdateSeed(int id, GardenSeedUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var seed = await context.GardenSeeds.SingleOrDefaultAsync(seed => seed.ID == id, cancellationToken);
        if (seed is null)
        {
            return NotFound();
        }

        Apply(seed, dto);
        await context.SaveChangesAsync(cancellationToken);
        var inventory = await context.GardenSeedInventory.AsNoTracking().SingleOrDefaultAsync(item => item.SeedID == id, cancellationToken);
        return ToDto(seed, inventory);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("seeds/{id:int}")]
    public async Task<IActionResult> DeleteSeed(int id, CancellationToken cancellationToken)
    {
        var seed = await context.GardenSeeds.SingleOrDefaultAsync(seed => seed.ID == id, cancellationToken);
        if (seed is null)
        {
            return NotFound();
        }

        var isUsed = await context.GardenSeedTrayPlants.AnyAsync(item => item.SeedId == id, cancellationToken)
            || await context.GardenPlotPlants.AnyAsync(item => item.SeedID == id, cancellationToken);
        if (isUsed)
        {
            return Conflict("Cannot delete a seed that is used by tray or plot plantings.");
        }

        var inventory = await context.GardenSeedInventory.SingleOrDefaultAsync(item => item.SeedID == id, cancellationToken);
        if (inventory is not null)
        {
            context.GardenSeedInventory.Remove(inventory);
        }

        context.GardenSeeds.Remove(seed);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("seeds/{seedId:int}/inventory")]
    public async Task<ActionResult<GardenSeedInventoryDto>> UpsertSeedInventory(
        int seedId,
        GardenSeedInventoryUpsertDto dto,
        CancellationToken cancellationToken)
    {
        if (!await context.GardenSeeds.AnyAsync(seed => seed.ID == seedId, cancellationToken))
        {
            return NotFound();
        }

        if (dto.Qty < 0)
        {
            return BadRequest("Quantity cannot be negative.");
        }

        var inventory = await context.GardenSeedInventory.SingleOrDefaultAsync(item => item.SeedID == seedId, cancellationToken);
        if (inventory is null)
        {
            inventory = new GardenSeedInventory { SeedID = seedId };
            context.GardenSeedInventory.Add(inventory);
        }

        inventory.Qty = dto.Qty;
        inventory.Reorder = dto.Reorder;
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(inventory);
    }

    [AllowAnonymous]
    [HttpGet("trays")]
    public async Task<ActionResult<IEnumerable<GardenSeedTrayDto>>> GetTrays(CancellationToken cancellationToken)
    {
        var dimensionRows = await context.GardenSeedTrayDimensions
            .AsNoTracking()
            .OrderByDescending(item => item.ID)
            .ToListAsync(cancellationToken);
        var dimensions = dimensionRows
            .GroupBy(item => item.TrayID)
            .ToDictionary(group => group.Key, group => group.First());

        var trays = await context.GardenSeedTrays
            .AsNoTracking()
            .OrderBy(tray => tray.TrayName)
            .ToListAsync(cancellationToken);
        return trays.Select(tray => ToDto(tray, dimensions.GetValueOrDefault(tray.ID))).ToList();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("trays")]
    public async Task<ActionResult<GardenSeedTrayDto>> CreateTray(GardenSeedTrayUpsertDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.TrayName))
        {
            return BadRequest("Tray name is required.");
        }

        var tray = new GardenSeedTray { TrayName = dto.TrayName.Trim() };
        context.GardenSeedTrays.Add(tray);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetTrays), ToDto(tray, null));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("trays/{id:int}")]
    public async Task<ActionResult<GardenSeedTrayDto>> UpdateTray(int id, GardenSeedTrayUpsertDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.TrayName))
        {
            return BadRequest("Tray name is required.");
        }

        var tray = await context.GardenSeedTrays.SingleOrDefaultAsync(tray => tray.ID == id, cancellationToken);
        if (tray is null)
        {
            return NotFound();
        }

        tray.TrayName = dto.TrayName.Trim();
        await context.SaveChangesAsync(cancellationToken);
        var dimensions = await context.GardenSeedTrayDimensions.AsNoTracking().OrderByDescending(item => item.ID).FirstOrDefaultAsync(item => item.TrayID == id, cancellationToken);
        return ToDto(tray, dimensions);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("trays/{id:int}")]
    public async Task<IActionResult> DeleteTray(int id, CancellationToken cancellationToken)
    {
        var tray = await context.GardenSeedTrays.SingleOrDefaultAsync(tray => tray.ID == id, cancellationToken);
        if (tray is null)
        {
            return NotFound();
        }

        if (await context.GardenSeedTrayDimensions.AnyAsync(item => item.TrayID == id, cancellationToken))
        {
            return Conflict("Cannot delete a tray with dimensions. Delete or move related tray data first.");
        }

        context.GardenSeedTrays.Remove(tray);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("tray-dimensions")]
    public async Task<ActionResult<GardenSeedTrayDimensionDto>> CreateTrayDimension(GardenSeedTrayDimensionUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var dimensions = new GardenSeedTrayDimension();
        Apply(dimensions, dto);
        context.GardenSeedTrayDimensions.Add(dimensions);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(dimensions);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("tray-dimensions/{id:int}")]
    public async Task<ActionResult<GardenSeedTrayDimensionDto>> UpdateTrayDimension(int id, GardenSeedTrayDimensionUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var dimensions = await context.GardenSeedTrayDimensions.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (dimensions is null)
        {
            return NotFound();
        }

        Apply(dimensions, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(dimensions);
    }

    [AllowAnonymous]
    [HttpGet("tray-plants")]
    public async Task<ActionResult<IEnumerable<GardenSeedTrayPlantDto>>> GetTrayPlants(
        [FromQuery] int? trayId = null,
        [FromQuery] short? year = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.GardenSeedTrayPlants.AsNoTracking();
        if (trayId.HasValue)
        {
            query = query.Where(item => item.TrayID == trayId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(item => item.Year == year.Value);
        }

        var plants = await query.OrderBy(item => item.TrayID).ThenBy(item => item.TraySlotID).ToListAsync(cancellationToken);
        return await WithSeedNames(plants, item => item.SeedId, ToDto, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("tray-plants")]
    public async Task<ActionResult<GardenSeedTrayPlantDto>> CreateTrayPlant(GardenSeedTrayPlantUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = new GardenSeedTrayPlant();
        Apply(item, dto);
        context.GardenSeedTrayPlants.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadTrayPlant(item.ID, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("tray-plants/{id:int}")]
    public async Task<ActionResult<GardenSeedTrayPlantDto>> UpdateTrayPlant(int id, GardenSeedTrayPlantUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.GardenSeedTrayPlants.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        Apply(item, dto);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadTrayPlant(item.ID, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("tray-plants/{id:int}")]
    public async Task<IActionResult> DeleteTrayPlant(int id, CancellationToken cancellationToken)
    {
        var item = await context.GardenSeedTrayPlants.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.GardenSeedTrayPlants.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("tray-plants/copy-year/preview")]
    public async Task<ActionResult<GardenYearCopyPreviewDto>> PreviewCopyTrayPlants(GardenYearCopyRequestDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateCopyRequest(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var sourceQuery = context.GardenSeedTrayPlants.AsNoTracking().Where(item => item.Year == dto.FromYear);
        var destinationQuery = context.GardenSeedTrayPlants.AsNoTracking().Where(item => item.Year == dto.ToYear);
        if (dto.ScopeId.HasValue)
        {
            sourceQuery = sourceQuery.Where(item => item.TrayID == dto.ScopeId.Value);
            destinationQuery = destinationQuery.Where(item => item.TrayID == dto.ScopeId.Value);
        }

        var source = await sourceQuery.ToListAsync(cancellationToken);
        var existing = await destinationQuery.ToListAsync(cancellationToken);
        var existingKeys = existing.Select(item => (item.TrayID, item.TraySlotID)).ToHashSet();
        var skipped = dto.OverwriteExisting ? 0 : source.Count(item => existingKeys.Contains((item.TrayID, item.TraySlotID)));
        var copied = dto.OverwriteExisting ? source.Count : source.Count - skipped;
        var deleted = dto.OverwriteExisting ? existing.Count : 0;

        return new GardenYearCopyPreviewDto(source.Count, existing.Count, copied, skipped, deleted);
    }
    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("tray-plants/copy-year")]
    public async Task<ActionResult<GardenYearCopyResultDto>> CopyTrayPlants(GardenYearCopyRequestDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateCopyRequest(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var sourceQuery = context.GardenSeedTrayPlants.AsNoTracking().Where(item => item.Year == dto.FromYear);
        var destinationQuery = context.GardenSeedTrayPlants.Where(item => item.Year == dto.ToYear);
        if (dto.ScopeId.HasValue)
        {
            sourceQuery = sourceQuery.Where(item => item.TrayID == dto.ScopeId.Value);
            destinationQuery = destinationQuery.Where(item => item.TrayID == dto.ScopeId.Value);
        }

        var source = await sourceQuery.ToListAsync(cancellationToken);
        var existing = await destinationQuery.ToListAsync(cancellationToken);
        var deleted = 0;
        if (dto.OverwriteExisting && existing.Count > 0)
        {
            context.GardenSeedTrayPlants.RemoveRange(existing);
            deleted = existing.Count;
            existing.Clear();
        }

        var existingKeys = existing.Select(item => (item.TrayID, item.TraySlotID)).ToHashSet();
        var copied = 0;
        var skipped = 0;
        foreach (var item in source)
        {
            if (existingKeys.Contains((item.TrayID, item.TraySlotID)))
            {
                skipped++;
                continue;
            }

            context.GardenSeedTrayPlants.Add(new GardenSeedTrayPlant
            {
                TrayID = item.TrayID,
                TraySlotID = item.TraySlotID,
                SeedId = item.SeedId,
                Year = dto.ToYear,
                PlantDate = ShiftYear(item.PlantDate, dto.ToYear),
                Success = false,
                Planning = true
            });
            copied++;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new GardenYearCopyResultDto(copied, skipped, deleted);
    }

    [AllowAnonymous]
    [HttpGet("plots")]
    public async Task<ActionResult<IEnumerable<GardenPlotDto>>> GetPlots(CancellationToken cancellationToken)
    {
        var dimensions = await context.GardenPlotDimensions
            .AsNoTracking()
            .OrderByDescending(item => item.ID)
            .ToListAsync(cancellationToken);
        var latestDimensions = dimensions.FirstOrDefault();

        var plots = await context.GardenPlots
            .AsNoTracking()
            .OrderBy(plot => plot.GardenName)
            .ToListAsync(cancellationToken);
        return plots.Select(plot => ToDto(plot, latestDimensions)).ToList();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("plots")]
    public async Task<ActionResult<GardenPlotDto>> CreatePlot(GardenPlotUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var plot = new GardenPlot();
        Apply(plot, dto);
        context.GardenPlots.Add(plot);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetPlots), ToDto(plot, null));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("plots/{id:int}")]
    public async Task<ActionResult<GardenPlotDto>> UpdatePlot(int id, GardenPlotUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var plot = await context.GardenPlots.SingleOrDefaultAsync(plot => plot.ID == id, cancellationToken);
        if (plot is null)
        {
            return NotFound();
        }

        Apply(plot, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(plot, null);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("plot-dimensions")]
    public async Task<ActionResult<GardenPlotDimensionDto>> CreatePlotDimension(GardenPlotDimensionUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var dimensions = new GardenPlotDimension();
        Apply(dimensions, dto);
        context.GardenPlotDimensions.Add(dimensions);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(dimensions);
    }

    [AllowAnonymous]
    [HttpGet("plot-plants")]
    public async Task<ActionResult<IEnumerable<GardenPlotPlantDto>>> GetPlotPlants(
        [FromQuery] int? gardenPlotId = null,
        [FromQuery] short? year = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.GardenPlotPlants.AsNoTracking();
        if (gardenPlotId.HasValue)
        {
            query = query.Where(item => item.GardenPlotID == gardenPlotId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(item => item.Year == year.Value);
        }

        var plants = await query.OrderBy(item => item.GardenPlotID).ThenBy(item => item.TraySlotID).ToListAsync(cancellationToken);
        return await WithSeedNames(plants, item => item.SeedID, ToDto, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("plot-plants")]
    public async Task<ActionResult<GardenPlotPlantDto>> CreatePlotPlant(GardenPlotPlantUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = new GardenPlotPlant();
        Apply(item, dto);
        context.GardenPlotPlants.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadPlotPlant(item.ID, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("plot-plants/{id:int}")]
    public async Task<ActionResult<GardenPlotPlantDto>> UpdatePlotPlant(int id, GardenPlotPlantUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.GardenPlotPlants.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        Apply(item, dto);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadPlotPlant(item.ID, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("plot-plants/{id:int}")]
    public async Task<IActionResult> DeletePlotPlant(int id, CancellationToken cancellationToken)
    {
        var item = await context.GardenPlotPlants.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.GardenPlotPlants.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("plot-plants/copy-year/preview")]
    public async Task<ActionResult<GardenYearCopyPreviewDto>> PreviewCopyPlotPlants(GardenYearCopyRequestDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateCopyRequest(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var sourceQuery = context.GardenPlotPlants.AsNoTracking().Where(item => item.Year == dto.FromYear);
        var destinationQuery = context.GardenPlotPlants.AsNoTracking().Where(item => item.Year == dto.ToYear);
        if (dto.ScopeId.HasValue)
        {
            sourceQuery = sourceQuery.Where(item => item.GardenPlotID == dto.ScopeId.Value);
            destinationQuery = destinationQuery.Where(item => item.GardenPlotID == dto.ScopeId.Value);
        }

        var source = await sourceQuery.ToListAsync(cancellationToken);
        var existing = await destinationQuery.ToListAsync(cancellationToken);
        var existingKeys = existing.Select(item => (item.GardenPlotID, item.TraySlotID)).ToHashSet();
        var skipped = dto.OverwriteExisting ? 0 : source.Count(item => existingKeys.Contains((item.GardenPlotID, item.TraySlotID)));
        var copied = dto.OverwriteExisting ? source.Count : source.Count - skipped;
        var deleted = dto.OverwriteExisting ? existing.Count : 0;

        return new GardenYearCopyPreviewDto(source.Count, existing.Count, copied, skipped, deleted);
    }
    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("plot-plants/copy-year")]
    public async Task<ActionResult<GardenYearCopyResultDto>> CopyPlotPlants(GardenYearCopyRequestDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateCopyRequest(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var sourceQuery = context.GardenPlotPlants.AsNoTracking().Where(item => item.Year == dto.FromYear);
        var destinationQuery = context.GardenPlotPlants.Where(item => item.Year == dto.ToYear);
        if (dto.ScopeId.HasValue)
        {
            sourceQuery = sourceQuery.Where(item => item.GardenPlotID == dto.ScopeId.Value);
            destinationQuery = destinationQuery.Where(item => item.GardenPlotID == dto.ScopeId.Value);
        }

        var source = await sourceQuery.ToListAsync(cancellationToken);
        var existing = await destinationQuery.ToListAsync(cancellationToken);
        var deleted = 0;
        if (dto.OverwriteExisting && existing.Count > 0)
        {
            context.GardenPlotPlants.RemoveRange(existing);
            deleted = existing.Count;
            existing.Clear();
        }

        var existingKeys = existing.Select(item => (item.GardenPlotID, item.TraySlotID)).ToHashSet();
        var copied = 0;
        var skipped = 0;
        foreach (var item in source)
        {
            if (existingKeys.Contains((item.GardenPlotID, item.TraySlotID)))
            {
                skipped++;
                continue;
            }

            context.GardenPlotPlants.Add(new GardenPlotPlant
            {
                GardenPlotID = item.GardenPlotID,
                TraySlotID = item.TraySlotID,
                SeedID = item.SeedID,
                Year = dto.ToYear,
                PlantDate = item.PlantDate.HasValue ? ShiftYear(item.PlantDate.Value, dto.ToYear) : null,
                Success = false,
                Qty = item.Qty,
                Planning = true
            });
            copied++;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new GardenYearCopyResultDto(copied, skipped, deleted);
    }

    [AllowAnonymous]
    [HttpGet("year-comparison")]
    public async Task<ActionResult<GardenYearComparisonDto>> GetYearComparison(
        [FromQuery] short year,
        [FromQuery] short? compareYear = null,
        CancellationToken cancellationToken = default)
    {
        if (year <= 0)
        {
            year = (short)DateTime.Today.Year;
        }

        var priorYear = compareYear.HasValue && compareYear.Value > 0 ? compareYear.Value : (short)(year - 1);
        var current = await BuildSeasonSummary(year, cancellationToken);
        var previous = await BuildSeasonSummary(priorYear, cancellationToken);
        var cropComparisons = await BuildCropComparisons(year, priorYear, cancellationToken);
        var areaComparisons = await BuildAreaComparisons(year, priorYear, cancellationToken);
        var delta = new GardenYearSeasonDeltaDto(
            current.CropCount - previous.CropCount,
            current.TrayCells - previous.TrayCells,
            current.BedCells - previous.BedCells,
            current.SuccessfulPlantings - previous.SuccessfulPlantings,
            (short)(current.PlannedQuantity - previous.PlannedQuantity),
            current.HarvestEntries - previous.HarvestEntries,
            current.HarvestQuantity - previous.HarvestQuantity);

        return new GardenYearComparisonDto(year, priorYear, current, previous, delta, cropComparisons, areaComparisons);
    }
    [AllowAnonymous]
    [HttpGet("harvests")]
    public async Task<ActionResult<IEnumerable<GardenHarvestDto>>> GetHarvests(
        [FromQuery] int? gardenPlotId = null,
        [FromQuery] int? seedId = null,
        [FromQuery] short? year = null,
        [FromQuery] int? take = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.GardenHarvests.AsNoTracking();
        if (gardenPlotId.HasValue)
        {
            query = query.Where(item => item.GardenPlotID == gardenPlotId.Value);
        }

        if (seedId.HasValue)
        {
            query = query.Where(item => item.SeedID == seedId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(item => item.Year == year.Value);
        }

        var ordered = query.OrderByDescending(item => item.HarvestDate).ThenByDescending(item => item.ID);
        var harvests = take.HasValue
            ? await ordered.Take(Math.Clamp(take.Value, 1, 200)).ToListAsync(cancellationToken)
            : await ordered.ToListAsync(cancellationToken);
        return await WithHarvestNames(harvests, cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("harvests/report")]
    public async Task<ActionResult<GardenHarvestReportDto>> GetHarvestReport(
        [FromQuery] int? gardenPlotId = null,
        [FromQuery] int? seedId = null,
        [FromQuery] short? year = null,
        CancellationToken cancellationToken = default)
    {
        var rows = await HarvestReportRows(gardenPlotId, seedId, year, cancellationToken);
        var recent = rows
            .OrderByDescending(row => row.Harvest.HarvestDate)
            .ThenByDescending(row => row.Harvest.ID)
            .Take(25)
            .Select(row => ToDto(row.Harvest, row.SeedName, row.PlotName))
            .ToList();

        var monthlySummaries = rows
            .GroupBy(row => new { row.Harvest.Year, row.Harvest.HarvestDate.Month })
            .OrderByDescending(group => group.Key.Year)
            .ThenBy(group => group.Key.Month)
            .Select(group => new GardenHarvestMonthlySummaryDto(
                group.Key.Year,
                group.Key.Month,
                CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(group.Key.Month),
                group.Count(),
                group.Sum(row => row.Harvest.Quantity ?? 0),
                group.Max(row => row.Harvest.HarvestDate)))
            .ToList();

        var cropSummaries = rows
            .GroupBy(row => new { row.Harvest.SeedID, row.SeedName })
            .OrderByDescending(group => group.Sum(row => row.Harvest.Quantity ?? 0))
            .ThenBy(group => group.Key.SeedName)
            .Select(group => new GardenHarvestCropSummaryDto(
                group.Key.SeedID,
                group.Key.SeedName,
                group.Count(),
                group.Sum(row => row.Harvest.Quantity ?? 0),
                group.Max(row => row.Harvest.HarvestDate)))
            .ToList();

        var areaSummaries = rows
            .GroupBy(row => new { row.Harvest.GardenPlotID, row.PlotName })
            .OrderByDescending(group => group.Sum(row => row.Harvest.Quantity ?? 0))
            .ThenBy(group => group.Key.PlotName)
            .Select(group => new GardenHarvestAreaSummaryDto(
                group.Key.GardenPlotID,
                group.Key.PlotName,
                group.Count(),
                group.Sum(row => row.Harvest.Quantity ?? 0),
                group.Max(row => row.Harvest.HarvestDate)))
            .ToList();

        return new GardenHarvestReportDto(
            year,
            rows.Count,
            rows.Sum(row => row.Harvest.Quantity ?? 0),
            monthlySummaries,
            cropSummaries,
            areaSummaries,
            recent);
    }

    [AllowAnonymous]
    [HttpGet("harvests/export.csv")]
    public async Task<IActionResult> ExportHarvestsCsv(
        [FromQuery] int? gardenPlotId = null,
        [FromQuery] int? seedId = null,
        [FromQuery] short? year = null,
        CancellationToken cancellationToken = default)
    {
        var rows = await HarvestReportRows(gardenPlotId, seedId, year, cancellationToken);
        var csvRows = new List<IReadOnlyList<string?>>
        {
            new[] { "Year", "Date", "Garden Area", "Crop", "Quantity", "Notes" }
        };
        csvRows.AddRange(rows
            .OrderByDescending(row => row.Harvest.HarvestDate)
            .ThenBy(row => row.SeedName)
            .Select(row => new[]
            {
                row.Harvest.Year?.ToString(CultureInfo.InvariantCulture),
                row.Harvest.HarvestDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                row.PlotName,
                row.SeedName,
                row.Harvest.Quantity?.ToString(CultureInfo.InvariantCulture),
                row.Harvest.Notes
            }));

        var csv = string.Join(Environment.NewLine, csvRows.Select(row => string.Join(",", row.Select(CsvEscape))));
        var suffix = year.HasValue ? $"-{year.Value}" : string.Empty;
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", $"garden-harvests{suffix}.csv");
    }
    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("harvests")]
    public async Task<ActionResult<GardenHarvestDto>> CreateHarvest(GardenHarvestUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var harvest = new GardenHarvest();
        Apply(harvest, dto);
        context.GardenHarvests.Add(harvest);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadHarvest(harvest.ID, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("harvests/{id:int}")]
    public async Task<ActionResult<GardenHarvestDto>> UpdateHarvest(int id, GardenHarvestUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var harvest = await context.GardenHarvests.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (harvest is null)
        {
            return NotFound();
        }

        Apply(harvest, dto);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadHarvest(harvest.ID, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("harvests/{id:int}")]
    public async Task<IActionResult> DeleteHarvest(int id, CancellationToken cancellationToken)
    {
        var harvest = await context.GardenHarvests.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (harvest is null)
        {
            return NotFound();
        }

        context.GardenHarvests.Remove(harvest);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
    [AllowAnonymous]
    [HttpGet("notes")]
    public async Task<ActionResult<IEnumerable<GardenNoteDto>>> GetNotes(
        [FromQuery] int? gardenPlotId = null,
        [FromQuery] short? year = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.GardenNotes.AsNoTracking();
        if (gardenPlotId.HasValue)
        {
            query = query.Where(note => note.GardenPlotID == gardenPlotId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(note => note.Year == year.Value);
        }

        return await query
            .OrderByDescending(note => note.Year)
            .ThenByDescending(note => note.Date)
            .Select(note => ToDto(note))
            .ToListAsync(cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("notes/report")]
    public async Task<ActionResult<GardenNoteReportDto>> GetNoteReport(
        [FromQuery] int? gardenPlotId = null,
        [FromQuery] short? year = null,
        CancellationToken cancellationToken = default)
    {
        var rows = await NoteReportRows(gardenPlotId, year, cancellationToken);
        var recent = rows
            .OrderByDescending(row => row.Note.Date)
            .Take(25)
            .Select(row => ToDto(row.Note))
            .ToList();

        var monthlySummaries = rows
            .GroupBy(row => new { row.Note.Year, row.Note.Date.Month })
            .OrderByDescending(group => group.Key.Year)
            .ThenBy(group => group.Key.Month)
            .Select(group => new GardenNoteMonthlySummaryDto(
                group.Key.Year,
                group.Key.Month,
                CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(group.Key.Month),
                group.Count(),
                group.Max(row => row.Note.Date)))
            .ToList();

        var areaSummaries = rows
            .GroupBy(row => new { row.Note.GardenPlotID, row.PlotName })
            .OrderBy(group => group.Key.PlotName)
            .Select(group => new GardenNoteAreaSummaryDto(
                group.Key.GardenPlotID,
                group.Key.PlotName,
                group.Count(),
                group.Max(row => row.Note.Date)))
            .ToList();

        return new GardenNoteReportDto(year, rows.Count, monthlySummaries, areaSummaries, recent);
    }

    [AllowAnonymous]
    [HttpGet("notes/export.csv")]
    public async Task<IActionResult> ExportNotesCsv(
        [FromQuery] int? gardenPlotId = null,
        [FromQuery] short? year = null,
        CancellationToken cancellationToken = default)
    {
        var rows = await NoteReportRows(gardenPlotId, year, cancellationToken);
        var csvRows = new List<IReadOnlyList<string?>>
        {
            new[] { "Year", "Date", "Garden Area", "Note" }
        };
        csvRows.AddRange(rows
            .OrderByDescending(row => row.Note.Date)
            .Select(row => new[]
            {
                row.Note.Year?.ToString(CultureInfo.InvariantCulture),
                row.Note.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                row.PlotName,
                row.Note.Note
            }));

        var csv = string.Join(Environment.NewLine, csvRows.Select(row => string.Join(",", row.Select(CsvEscape))));
        var suffix = year.HasValue ? $"-{year.Value}" : string.Empty;
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", $"garden-diary{suffix}.csv");
    }
    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("notes")]
    public async Task<ActionResult<GardenNoteDto>> CreateNote(GardenNoteUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var note = new GardenNote();
        Apply(note, dto);
        context.GardenNotes.Add(note);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(note);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("notes/{id:int}")]
    public async Task<ActionResult<GardenNoteDto>> UpdateNote(int id, GardenNoteUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var note = await context.GardenNotes.SingleOrDefaultAsync(note => note.ID == id, cancellationToken);
        if (note is null)
        {
            return NotFound();
        }

        Apply(note, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(note);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("notes/{id:int}")]
    public async Task<IActionResult> DeleteNote(int id, CancellationToken cancellationToken)
    {
        var note = await context.GardenNotes.SingleOrDefaultAsync(note => note.ID == id, cancellationToken);
        if (note is null)
        {
            return NotFound();
        }

        context.GardenNotes.Remove(note);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<GardenYearSeasonSummaryDto> BuildSeasonSummary(short year, CancellationToken cancellationToken)
    {
        var trayRows = await context.GardenSeedTrayPlants.AsNoTracking().Where(item => item.Year == year).ToListAsync(cancellationToken);
        var bedRows = await context.GardenPlotPlants.AsNoTracking().Where(item => item.Year == year).ToListAsync(cancellationToken);
        var harvestRows = await context.GardenHarvests.AsNoTracking().Where(item => item.Year == year).ToListAsync(cancellationToken);
        var crops = trayRows.Select(item => item.SeedId)
            .Concat(bedRows.Select(item => item.SeedID))
            .Concat(harvestRows.Select(item => item.SeedID))
            .Distinct()
            .Count();

        return new GardenYearSeasonSummaryDto(
            year,
            crops,
            trayRows.Count,
            trayRows.Count(item => !item.Planning),
            trayRows.Count(item => item.Planning),
            bedRows.Count,
            bedRows.Count(item => !item.Planning),
            bedRows.Count(item => item.Planning),
            trayRows.Count(item => item.Success) + bedRows.Count(item => item.Success),
            (short)bedRows.Sum(item => item.Qty ?? 0),
            harvestRows.Count,
            harvestRows.Sum(item => item.Quantity ?? 0));
    }

    private async Task<List<GardenYearCropComparisonDto>> BuildCropComparisons(short year, short compareYear, CancellationToken cancellationToken)
    {
        var years = new[] { year, compareYear };
        var trayRows = await context.GardenSeedTrayPlants.AsNoTracking().Where(item => years.Contains(item.Year)).ToListAsync(cancellationToken);
        var bedRows = await context.GardenPlotPlants.AsNoTracking().Where(item => years.Contains(item.Year)).ToListAsync(cancellationToken);
        var harvestRows = await context.GardenHarvests.AsNoTracking().Where(item => item.Year.HasValue && years.Contains(item.Year.Value)).ToListAsync(cancellationToken);
        var seedIds = trayRows.Select(item => item.SeedId)
            .Concat(bedRows.Select(item => item.SeedID))
            .Concat(harvestRows.Select(item => item.SeedID))
            .Distinct()
            .ToList();
        var names = await context.GardenSeeds.AsNoTracking()
            .Where(seed => seedIds.Contains(seed.ID))
            .ToDictionaryAsync(seed => seed.ID, seed => seed.Name, cancellationToken);

        return seedIds.Select(seedId => new GardenYearCropComparisonDto(
                seedId,
                names.GetValueOrDefault(seedId) ?? "Unknown seed",
                trayRows.Count(item => item.Year == year && item.SeedId == seedId),
                trayRows.Count(item => item.Year == compareYear && item.SeedId == seedId),
                bedRows.Count(item => item.Year == year && item.SeedID == seedId),
                bedRows.Count(item => item.Year == compareYear && item.SeedID == seedId),
                (short)bedRows.Where(item => item.Year == year && item.SeedID == seedId).Sum(item => item.Qty ?? 0),
                (short)bedRows.Where(item => item.Year == compareYear && item.SeedID == seedId).Sum(item => item.Qty ?? 0),
                harvestRows.Where(item => item.Year == year && item.SeedID == seedId).Sum(item => item.Quantity ?? 0),
                harvestRows.Where(item => item.Year == compareYear && item.SeedID == seedId).Sum(item => item.Quantity ?? 0)))
            .OrderByDescending(item => item.CurrentHarvestQuantity)
            .ThenByDescending(item => item.CurrentPlannedQuantity)
            .ThenBy(item => item.SeedName)
            .ToList();
    }

    private async Task<List<GardenYearAreaComparisonDto>> BuildAreaComparisons(short year, short compareYear, CancellationToken cancellationToken)
    {
        var years = new[] { year, compareYear };
        var bedRows = await context.GardenPlotPlants.AsNoTracking().Where(item => years.Contains(item.Year)).ToListAsync(cancellationToken);
        var harvestRows = await context.GardenHarvests.AsNoTracking().Where(item => item.Year.HasValue && years.Contains(item.Year.Value)).ToListAsync(cancellationToken);
        var plotIds = bedRows.Select(item => item.GardenPlotID)
            .Concat(harvestRows.Select(item => item.GardenPlotID))
            .Distinct()
            .ToList();
        var names = await context.GardenPlots.AsNoTracking()
            .Where(plot => plotIds.Contains(plot.ID))
            .ToDictionaryAsync(plot => plot.ID, plot => plot.GardenName, cancellationToken);

        return plotIds.Select(plotId => new GardenYearAreaComparisonDto(
                plotId,
                names.GetValueOrDefault(plotId) ?? "Garden area",
                bedRows.Count(item => item.Year == year && item.GardenPlotID == plotId),
                bedRows.Count(item => item.Year == compareYear && item.GardenPlotID == plotId),
                (short)bedRows.Where(item => item.Year == year && item.GardenPlotID == plotId).Sum(item => item.Qty ?? 0),
                (short)bedRows.Where(item => item.Year == compareYear && item.GardenPlotID == plotId).Sum(item => item.Qty ?? 0),
                harvestRows.Where(item => item.Year == year && item.GardenPlotID == plotId).Sum(item => item.Quantity ?? 0),
                harvestRows.Where(item => item.Year == compareYear && item.GardenPlotID == plotId).Sum(item => item.Quantity ?? 0)))
            .OrderByDescending(item => item.CurrentHarvestQuantity)
            .ThenByDescending(item => item.CurrentPlannedQuantity)
            .ThenBy(item => item.GardenPlotName)
            .ToList();
    }
    private async Task<List<GardenHarvestReportRow>> HarvestReportRows(
        int? gardenPlotId,
        int? seedId,
        short? year,
        CancellationToken cancellationToken)
    {
        var query = context.GardenHarvests.AsNoTracking();
        if (gardenPlotId.HasValue)
        {
            query = query.Where(item => item.GardenPlotID == gardenPlotId.Value);
        }

        if (seedId.HasValue)
        {
            query = query.Where(item => item.SeedID == seedId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(item => item.Year == year.Value);
        }

        return await query
            .Join(
                context.GardenPlots.AsNoTracking(),
                harvest => harvest.GardenPlotID,
                plot => plot.ID,
                (harvest, plot) => new { Harvest = harvest, PlotName = plot.GardenName })
            .Join(
                context.GardenSeeds.AsNoTracking(),
                row => row.Harvest.SeedID,
                seed => seed.ID,
                (row, seed) => new GardenHarvestReportRow(row.Harvest, row.PlotName, seed.Name))
            .OrderByDescending(row => row.Harvest.HarvestDate)
            .ToListAsync(cancellationToken);
    }
    private async Task<List<GardenNoteReportRow>> NoteReportRows(
        int? gardenPlotId,
        short? year,
        CancellationToken cancellationToken)
    {
        var query = context.GardenNotes.AsNoTracking();
        if (gardenPlotId.HasValue)
        {
            query = query.Where(note => note.GardenPlotID == gardenPlotId.Value);
        }

        if (year.HasValue)
        {
            query = query.Where(note => note.Year == year.Value);
        }

        return await query
            .Join(
                context.GardenPlots.AsNoTracking(),
                note => note.GardenPlotID,
                plot => plot.ID,
                (note, plot) => new GardenNoteReportRow(note, plot.GardenName))
            .OrderByDescending(row => row.Note.Date)
            .ToListAsync(cancellationToken);
    }

    private static string CsvEscape(string? value)
    {
        var text = value ?? string.Empty;
        return text.Contains(',') || text.Contains('"') || text.Contains('\n') || text.Contains('\r')
            ? $"\"{text.Replace("\"", "\"\"")}\""
            : text;
    }
    private async Task<ActionResult<GardenSeedTrayPlantDto>> LoadTrayPlant(int id, CancellationToken cancellationToken)
    {
        var item = await context.GardenSeedTrayPlants.AsNoTracking().SingleAsync(item => item.ID == id, cancellationToken);
        var seedName = await SeedName(item.SeedId, cancellationToken);
        return ToDto(item, seedName);
    }

    private async Task<ActionResult<GardenPlotPlantDto>> LoadPlotPlant(int id, CancellationToken cancellationToken)
    {
        var item = await context.GardenPlotPlants.AsNoTracking().SingleAsync(item => item.ID == id, cancellationToken);
        var seedName = await SeedName(item.SeedID, cancellationToken);
        return ToDto(item, seedName);
    }
    private async Task<ActionResult<GardenHarvestDto>> LoadHarvest(int id, CancellationToken cancellationToken)
    {
        var item = await context.GardenHarvests.AsNoTracking().SingleAsync(item => item.ID == id, cancellationToken);
        return (await WithHarvestNames(new[] { item }, cancellationToken)).Single();
    }

    private async Task<List<GardenHarvestDto>> WithHarvestNames(IReadOnlyCollection<GardenHarvest> harvests, CancellationToken cancellationToken)
    {
        var seedIds = harvests.Select(item => item.SeedID).Distinct().ToList();
        var plotIds = harvests.Select(item => item.GardenPlotID).Distinct().ToList();
        var seedNames = await context.GardenSeeds
            .AsNoTracking()
            .Where(seed => seedIds.Contains(seed.ID))
            .ToDictionaryAsync(seed => seed.ID, seed => seed.Name, cancellationToken);
        var plotNames = await context.GardenPlots
            .AsNoTracking()
            .Where(plot => plotIds.Contains(plot.ID))
            .ToDictionaryAsync(plot => plot.ID, plot => plot.GardenName, cancellationToken);

        return harvests.Select(item => ToDto(
            item,
            seedNames.GetValueOrDefault(item.SeedID),
            plotNames.GetValueOrDefault(item.GardenPlotID))).ToList();
    }

    private async Task<List<TDto>> WithSeedNames<TEntity, TDto>(
        IReadOnlyCollection<TEntity> items,
        Func<TEntity, int> seedId,
        Func<TEntity, string?, TDto> map,
        CancellationToken cancellationToken)
    {
        var seedIds = items.Select(seedId).Distinct().ToList();
        var seedNames = await context.GardenSeeds
            .AsNoTracking()
            .Where(seed => seedIds.Contains(seed.ID))
            .ToDictionaryAsync(seed => seed.ID, seed => seed.Name, cancellationToken);

        return items.Select(item => map(item, seedNames.GetValueOrDefault(seedId(item)))).ToList();
    }

    private async Task<string?> SeedName(int seedId, CancellationToken cancellationToken)
    {
        return await context.GardenSeeds
            .AsNoTracking()
            .Where(seed => seed.ID == seedId)
            .Select(seed => seed.Name)
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static GardenSeedDto ToDto(GardenSeed seed, GardenSeedInventory? inventory) =>
        new(seed.ID, seed.Name, seed.Description, seed.PlantDate, seed.Indoor, seed.SecondPlantDate, seed.Notes, inventory is null ? null : ToDto(inventory));

    private static GardenSeedInventoryDto ToDto(GardenSeedInventory item) => new(item.SeedID, item.Qty, item.Reorder);

    private static GardenSeedTrayDto ToDto(GardenSeedTray tray, GardenSeedTrayDimension? dimensions) =>
        new(tray.ID, tray.TrayName, dimensions is null ? null : ToDto(dimensions));

    private static GardenSeedTrayDimensionDto ToDto(GardenSeedTrayDimension item) =>
        new(item.ID, item.TrayID, item.SlotsWide, item.SlotsDeep);

    private static GardenSeedTrayPlantDto ToDto(GardenSeedTrayPlant item, string? seedName) =>
        new(item.ID, item.TrayID, item.TraySlotID, item.SeedId, seedName, item.Year, item.PlantDate, item.Success, item.Planning);

    private static GardenPlotDto ToDto(GardenPlot plot, GardenPlotDimension? dimensions) =>
        new(plot.ID, plot.GardenName, plot.Description, dimensions is null ? null : ToDto(dimensions));

    private static GardenPlotDimensionDto ToDto(GardenPlotDimension item) =>
        new(item.ID, item.TraySlotsWide, item.SlotsDeep, item.Notes);

    private static GardenPlotPlantDto ToDto(GardenPlotPlant item, string? seedName) =>
        new(item.ID, item.GardenPlotID, item.TraySlotID, item.SeedID, seedName, item.Year, item.PlantDate, item.Success, item.Qty, item.Planning);

    private static GardenNoteDto ToDto(GardenNote note) => new(note.ID, note.GardenPlotID, note.Note, note.Date, note.Year);
    private static GardenHarvestDto ToDto(GardenHarvest harvest, string? seedName, string? plotName) =>
        new(harvest.ID, harvest.GardenPlotID, plotName, harvest.SeedID, seedName, harvest.HarvestDate, harvest.Year, harvest.Quantity, harvest.Notes);

    private static void Apply(GardenSeed seed, GardenSeedUpsertDto dto)
    {
        seed.Name = dto.Name.Trim();
        seed.Description = Trim(dto.Description);
        seed.PlantDate = dto.PlantDate;
        seed.Indoor = dto.Indoor;
        seed.SecondPlantDate = dto.SecondPlantDate;
        seed.Notes = Trim(dto.Notes);
    }

    private static void Apply(GardenSeedTrayDimension item, GardenSeedTrayDimensionUpsertDto dto)
    {
        item.TrayID = dto.TrayId;
        item.SlotsWide = dto.SlotsWide;
        item.SlotsDeep = dto.SlotsDeep;
    }

    private static void Apply(GardenSeedTrayPlant item, GardenSeedTrayPlantUpsertDto dto)
    {
        item.TrayID = dto.TrayId;
        item.TraySlotID = dto.TraySlotId;
        item.SeedId = dto.SeedId;
        item.Year = dto.Year;
        item.PlantDate = dto.PlantDate;
        item.Success = dto.Success;
        item.Planning = dto.Planning;
    }

    private static void Apply(GardenPlot plot, GardenPlotUpsertDto dto)
    {
        plot.GardenName = dto.GardenName.Trim();
        plot.Description = Trim(dto.Description);
    }

    private static void Apply(GardenPlotDimension item, GardenPlotDimensionUpsertDto dto)
    {
        item.TraySlotsWide = dto.TraySlotsWide;
        item.SlotsDeep = dto.SlotsDeep;
        item.Notes = Trim(dto.Notes);
    }

    private static void Apply(GardenPlotPlant item, GardenPlotPlantUpsertDto dto)
    {
        item.GardenPlotID = dto.GardenPlotId;
        item.TraySlotID = dto.TraySlotId;
        item.SeedID = dto.SeedId;
        item.Year = dto.Year;
        item.PlantDate = dto.PlantDate;
        item.Success = dto.Success;
        item.Qty = dto.Qty;
        item.Planning = dto.Planning;
    }

    private static void Apply(GardenNote note, GardenNoteUpsertDto dto)
    {
        note.GardenPlotID = dto.GardenPlotId;
        note.Note = Trim(dto.Note);
        note.Date = dto.Date == default ? DateTime.Today : dto.Date.Date;
        note.Year = dto.Year;
    }
    private static void Apply(GardenHarvest harvest, GardenHarvestUpsertDto dto)
    {
        harvest.GardenPlotID = dto.GardenPlotId;
        harvest.SeedID = dto.SeedId;
        harvest.HarvestDate = dto.HarvestDate == default ? DateTime.Today : dto.HarvestDate.Date;
        harvest.Year = dto.Year ?? (short)harvest.HarvestDate.Year;
        harvest.Quantity = dto.Quantity;
        harvest.Notes = Trim(dto.Notes);
    }

    private static string? Validate(GardenSeedUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Seed name is required.";
        }

        return dto.Name.Trim().Length > 50 ? "Seed name must be 50 characters or fewer." : null;
    }

    private static string? Validate(GardenPlotUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.GardenName))
        {
            return "Garden name is required.";
        }

        return dto.GardenName.Trim().Length > 50 ? "Garden name must be 50 characters or fewer." : null;
    }

    private async Task<string?> Validate(GardenSeedTrayDimensionUpsertDto dto, CancellationToken cancellationToken)
    {
        if (dto.SlotsWide <= 0 || dto.SlotsDeep <= 0)
        {
            return "Tray dimensions must be positive.";
        }

        return await context.GardenSeedTrays.AnyAsync(tray => tray.ID == dto.TrayId, cancellationToken)
            ? null
            : "Tray was not found.";
    }

    private async Task<string?> Validate(GardenSeedTrayPlantUpsertDto dto, CancellationToken cancellationToken)
    {
        if (dto.Year <= 0)
        {
            return "Year is required.";
        }

        if (!await context.GardenSeedTrays.AnyAsync(tray => tray.ID == dto.TrayId, cancellationToken))
        {
            return "Tray was not found.";
        }

        if (!await context.GardenSeeds.AnyAsync(seed => seed.ID == dto.SeedId, cancellationToken))
        {
            return "Seed was not found.";
        }

        return dto.TraySlotId <= 0 ? "Tray slot is required." : null;
    }

    private static string? Validate(GardenPlotDimensionUpsertDto dto)
    {
        return dto.TraySlotsWide <= 0 || dto.SlotsDeep <= 0
            ? "Plot dimensions must be positive."
            : null;
    }

    private async Task<string?> Validate(GardenPlotPlantUpsertDto dto, CancellationToken cancellationToken)
    {
        if (dto.Year <= 0)
        {
            return "Year is required.";
        }

        if (!await context.GardenPlots.AnyAsync(plot => plot.ID == dto.GardenPlotId, cancellationToken))
        {
            return "Garden plot was not found.";
        }

        if (!await context.GardenSeeds.AnyAsync(seed => seed.ID == dto.SeedId, cancellationToken))
        {
            return "Seed was not found.";
        }

        if (dto.Qty < 0)
        {
            return "Quantity cannot be negative.";
        }

        return dto.TraySlotId <= 0 ? "Plot slot is required." : null;
    }

    private async Task<string?> Validate(GardenNoteUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.GardenPlots.AnyAsync(plot => plot.ID == dto.GardenPlotId, cancellationToken))
        {
            return "Garden plot was not found.";
        }

        return null;
    }
    private async Task<string?> Validate(GardenHarvestUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.GardenPlots.AnyAsync(plot => plot.ID == dto.GardenPlotId, cancellationToken))
        {
            return "Garden plot was not found.";
        }

        if (!await context.GardenSeeds.AnyAsync(seed => seed.ID == dto.SeedId, cancellationToken))
        {
            return "Seed was not found.";
        }

        if (dto.Quantity < 0)
        {
            return "Quantity cannot be negative.";
        }

        return null;
    }

    private static string? ValidateCopyRequest(GardenYearCopyRequestDto dto)
    {
        if (dto.FromYear <= 0 || dto.ToYear <= 0)
        {
            return "From and target years are required.";
        }

        if (dto.FromYear == dto.ToYear)
        {
            return "From and target years must be different.";
        }

        return null;
    }

    private static DateTime ShiftYear(DateTime value, short targetYear)
    {
        var month = value.Month;
        var day = value.Day;
        if (month == 2 && day == 29 && !DateTime.IsLeapYear(targetYear))
        {
            day = 28;
        }

        return new DateTime(targetYear, month, day);
    }

    private static string Csv(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        return value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r')
            ? "\"" + value.Replace("\"", "\"\"") + "\""
            : value;
    }

    private static IEnumerable<IReadOnlyList<string>> ParseCsv(string csv)
    {
        using var reader = new StringReader(csv);
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            yield return ParseCsvLine(line);
        }
    }

    private static IReadOnlyList<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        var current = new StringBuilder();
        var quoted = false;
        for (var index = 0; index < line.Length; index++)
        {
            var character = line[index];
            if (character == '"')
            {
                if (quoted && index + 1 < line.Length && line[index + 1] == '"')
                {
                    current.Append('"');
                    index++;
                }
                else
                {
                    quoted = !quoted;
                }
                continue;
            }

            if (character == ',' && !quoted)
            {
                values.Add(current.ToString());
                current.Clear();
                continue;
            }

            current.Append(character);
        }

        values.Add(current.ToString());
        return values;
    }

    private static string NormalizeHeader(string value) => value.Trim().Replace(" ", string.Empty).Replace("_", string.Empty).ToLowerInvariant();

    private static string? CsvValue(IReadOnlyList<string> row, Dictionary<string, int> headers, string name)
    {
        return headers.TryGetValue(name, out var index) && index < row.Count ? row[index].Trim() : null;
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed)
            ? parsed.Date
            : null;
    }

    private static bool ParseBool(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim().ToLowerInvariant();
        return normalized is "true" or "yes" or "y" or "1" or "x";
    }

    private static short ParseShort(string? value)
    {
        return short.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) && parsed > 0
            ? parsed
            : (short)0;
    }
    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
sealed record GardenNoteReportRow(GardenNote Note, string PlotName);
sealed record GardenHarvestReportRow(GardenHarvest Harvest, string PlotName, string SeedName);


















