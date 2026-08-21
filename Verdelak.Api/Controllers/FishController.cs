using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/fish")]
public class FishController(VerdelakDbContext context) : ControllerBase
{
    [HttpGet("tanks")]
    public async Task<ActionResult<IEnumerable<FishTankDto>>> GetTanks(CancellationToken cancellationToken)
    {
        return await context.FishTanks
            .AsNoTracking()
            .OrderByDescending(tank => tank.IsSetup)
            .ThenByDescending(tank => tank.IsActive)
            .ThenBy(tank => tank.Location)
            .ThenBy(tank => tank.Gallons)
            .Select(tank => ToDto(tank))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("tanks")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishTankDto>> CreateTank(FishTankUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var tank = new FishTank();
        Apply(tank, dto);
        context.FishTanks.Add(tank);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetTanks), new { id = tank.Id }, ToDto(tank));
    }

    [HttpPut("tanks/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishTankDto>> UpdateTank(int id, FishTankUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var tank = await context.FishTanks.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (tank is null)
        {
            return NotFound();
        }

        Apply(tank, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(tank);
    }

    [HttpDelete("tanks/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteTank(int id, CancellationToken cancellationToken)
    {
        var tank = await context.FishTanks.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (tank is null)
        {
            return NotFound();
        }

        context.FishTanks.Remove(tank);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("tank-logs")]
    public async Task<ActionResult<IEnumerable<FishTankLogDto>>> GetTankLogs(
        [FromQuery] int? tankId,
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 200);
        var query = context.FishTankLogs
            .AsNoTracking()
            .Include(log => log.FishTank)
            .AsQueryable();

        if (tankId.HasValue)
        {
            query = query.Where(log => log.FishTankId == tankId.Value);
        }

        return await query
            .OrderByDescending(log => log.LoggedAt)
            .ThenByDescending(log => log.Id)
            .Take(take)
            .Select(log => ToDto(log))
            .ToListAsync(cancellationToken);
    }

    [HttpGet("tank-history")]
    public async Task<ActionResult<IEnumerable<FishTankHistoryItemDto>>> GetTankHistory(
        [FromQuery] int? tankId,
        [FromQuery] int take = 200,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 500);

        var logsQuery = context.FishTankLogs
            .AsNoTracking()
            .Include(log => log.FishTank)
            .AsQueryable();

        if (tankId.HasValue)
        {
            logsQuery = logsQuery.Where(log => log.FishTankId == tankId.Value);
        }

        var logItems = await logsQuery
            .OrderByDescending(log => log.LoggedAt)
            .ThenByDescending(log => log.Id)
            .Take(take)
            .Select(log => new FishTankHistoryItemDto(
                $"log-{log.Id}",
                log.FishTankId,
                log.FishTank!.Name,
                log.LoggedAt,
                "Reading",
                log.LogType,
                null,
                log.Temperature,
                log.Ammonia,
                log.Nitrite,
                log.Nitrate,
                log.Ph,
                log.Gh,
                log.Kh,
                null,
                log.Notes))
            .ToListAsync(cancellationToken);

        var taskQuery =
            from occurrence in context.TaskOccurrences.AsNoTracking()
            join fishTask in context.FishTankTasks.AsNoTracking() on occurrence.TaskID equals fishTask.TaskId
            join tank in context.FishTanks.AsNoTracking() on fishTask.FishTankId equals tank.Id
            join scheduledTask in context.ScheduledTasks.AsNoTracking() on occurrence.TaskID equals scheduledTask.TaskID
            where occurrence.Status == "Completed"
                || occurrence.Status == "Skipped"
                || occurrence.Status == "Missed"
                || occurrence.Notes != null
            select new
            {
                occurrence.OccurrenceID,
                fishTask.FishTankId,
                TankName = tank.Name,
                OccurredAt = occurrence.CompletedDate ?? occurrence.ScheduledDate,
                scheduledTask.Title,
                fishTask.TaskCategory,
                occurrence.Status,
                occurrence.Notes
            };

        if (tankId.HasValue)
        {
            taskQuery = taskQuery.Where(item => item.FishTankId == tankId.Value);
        }

        var taskRows = await taskQuery
            .OrderByDescending(item => item.OccurredAt)
            .Take(take)
            .ToListAsync(cancellationToken);

        var taskItems = taskRows
            .Select(item => new FishTankHistoryItemDto(
                $"task-{item.OccurrenceID}",
                item.FishTankId,
                item.TankName,
                item.OccurredAt,
                "Task",
                item.Title,
                item.TaskCategory,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                item.Status,
                item.Notes))
            .ToList();

        var livestockQuery = context.FishLivestockEvents
            .AsNoTracking()
            .Include(ev => ev.FishTank)
            .Include(ev => ev.DestinationFishTank)
            .AsQueryable();

        if (tankId.HasValue)
        {
            livestockQuery = livestockQuery.Where(ev => ev.FishTankId == tankId.Value || ev.DestinationFishTankId == tankId.Value);
        }

        var livestockItems = await livestockQuery
            .OrderByDescending(ev => ev.EventDate)
            .ThenByDescending(ev => ev.Id)
            .Take(take)
            .Select(ev => new FishTankHistoryItemDto(
                $"livestock-{ev.Id}",
                ev.FishTankId,
                ev.FishTank!.Name,
                ev.EventDate,
                "Livestock",
                $"{ev.EventType}: {ev.CommonName}",
                ev.DestinationFishTank == null ? ev.FishTank!.Name : ev.FishTank!.Name + " -> " + ev.DestinationFishTank.Name,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                ev.UpdatesStock ? "Stock updated" : "Log only",
                ev.Notes))
            .ToListAsync(cancellationToken);

        var productUsageQuery = context.FishAquariumProductUsage
            .AsNoTracking()
            .Include(usage => usage.FishAquariumProduct)
                .ThenInclude(product => product!.FishTank)
            .Where(usage => usage.FishAquariumProduct != null && usage.FishAquariumProduct.FishTankId.HasValue)
            .AsQueryable();

        if (tankId.HasValue)
        {
            productUsageQuery = productUsageQuery.Where(usage => usage.FishAquariumProduct!.FishTankId == tankId.Value);
        }

        var productUsageRows = await productUsageQuery
            .OrderByDescending(usage => usage.UsedAt)
            .ThenByDescending(usage => usage.Id)
            .Take(take)
            .ToListAsync(cancellationToken);

        var productUsageItems = productUsageRows
            .Where(usage => usage.FishAquariumProduct?.FishTankId.HasValue == true)
            .Select(usage => new FishTankHistoryItemDto(
                $"product-usage-{usage.Id}",
                usage.FishAquariumProduct!.FishTankId!.Value,
                usage.FishAquariumProduct.FishTank?.Name ?? string.Empty,
                usage.UsedAt,
                "Product",
                $"{usage.UsageType}: {usage.FishAquariumProduct.Name}",
                usage.FishAquariumProduct.Category,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                usage.AddToShoppingList ? $"Shopping: {usage.ShoppingCategory}" : null,
                usage.Notes))
            .ToList();

        return logItems
            .Concat(taskItems)
            .Concat(livestockItems)
            .Concat(productUsageItems)
            .OrderByDescending(item => item.OccurredAt)
            .Take(take)
            .ToList();
    }

    [HttpPost("tank-logs")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishTankLogDto>> CreateTankLog(FishTankLogUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var log = new FishTankLog();
        Apply(log, dto);
        context.FishTankLogs.Add(log);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(log).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetTankLogs), new { tankId = log.FishTankId }, ToDto(log));
    }

    [HttpPut("tank-logs/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishTankLogDto>> UpdateTankLog(int id, FishTankLogUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var log = await context.FishTankLogs
            .Include(item => item.FishTank)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (log is null)
        {
            return NotFound();
        }

        Apply(log, dto);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(log).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        return ToDto(log);
    }

    [HttpDelete("tank-logs/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteTankLog(int id, CancellationToken cancellationToken)
    {
        var log = await context.FishTankLogs.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (log is null)
        {
            return NotFound();
        }

        context.FishTankLogs.Remove(log);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("stock")]
    public async Task<ActionResult<IEnumerable<FishStockDto>>> GetStock(
        [FromQuery] int? tankId,
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = context.FishStock
            .AsNoTracking()
            .Include(stock => stock.FishTank)
            .AsQueryable();

        if (tankId.HasValue)
        {
            query = query.Where(stock => stock.FishTankId == tankId.Value);
        }

        if (!includeInactive)
        {
            query = query.Where(stock => stock.IsActive);
        }

        return await query
            .OrderBy(stock => stock.FishTank!.Location)
            .ThenBy(stock => stock.FishTank!.Name)
            .ThenBy(stock => stock.CommonName)
            .Select(stock => ToDto(stock))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("stock")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishStockDto>> CreateStock(FishStockUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var stock = new FishStock();
        Apply(stock, dto);
        context.FishStock.Add(stock);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(stock).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetStock), new { tankId = stock.FishTankId }, ToDto(stock));
    }

    [HttpPut("stock/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishStockDto>> UpdateStock(int id, FishStockUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var stock = await context.FishStock
            .Include(item => item.FishTank)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (stock is null)
        {
            return NotFound();
        }

        Apply(stock, dto);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(stock).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        return ToDto(stock);
    }

    [HttpDelete("stock/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteStock(int id, CancellationToken cancellationToken)
    {
        var stock = await context.FishStock.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (stock is null)
        {
            return NotFound();
        }

        context.FishStock.Remove(stock);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("species-profiles")]
    public async Task<ActionResult<IEnumerable<FishSpeciesProfileDto>>> GetSpeciesProfiles(
        [FromQuery] string? q,
        [FromQuery] bool foodsOnly = false,
        CancellationToken cancellationToken = default)
    {
        var query = context.FishSpeciesProfiles
            .AsNoTracking()
            .Include(profile => profile.Foods)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(profile =>
                profile.CommonName.Contains(term) ||
                (profile.ScientificName != null && profile.ScientificName.Contains(term)) ||
                profile.Foods.Any(food => food.FoodName.Contains(term)));
        }

        if (foodsOnly)
        {
            query = query.Where(profile => profile.Foods.Any());
        }

        var profiles = await query
            .OrderBy(profile => profile.CommonName)
            .ThenBy(profile => profile.ScientificName)
            .ToListAsync(cancellationToken);

        return profiles.Select(ToDto).ToList();
    }

    [HttpPost("species-profiles")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishSpeciesProfileDto>> CreateSpeciesProfile(FishSpeciesProfileUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var profile = new FishSpeciesProfile();
        Apply(profile, dto);
        context.FishSpeciesProfiles.Add(profile);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetSpeciesProfiles), new { id = profile.Id }, ToDto(profile));
    }

    [HttpPut("species-profiles/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishSpeciesProfileDto>> UpdateSpeciesProfile(int id, FishSpeciesProfileUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var profile = await context.FishSpeciesProfiles
            .Include(item => item.Foods)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (profile is null)
        {
            return NotFound();
        }

        Apply(profile, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(profile);
    }

    [HttpDelete("species-profiles/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSpeciesProfile(int id, CancellationToken cancellationToken)
    {
        var profile = await context.FishSpeciesProfiles.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (profile is null)
        {
            return NotFound();
        }

        context.FishSpeciesProfiles.Remove(profile);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("species-profiles/{profileId:int}/foods")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishSpeciesFoodDto>> CreateSpeciesFood(int profileId, FishSpeciesFoodUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(profileId, dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var food = new FishSpeciesFood { FishSpeciesProfileId = profileId };
        Apply(food, dto);
        context.FishSpeciesFoods.Add(food);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetSpeciesProfiles), new { id = profileId }, ToDto(food));
    }

    [HttpPut("species-foods/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishSpeciesFoodDto>> UpdateSpeciesFood(int id, FishSpeciesFoodUpsertDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.FoodName))
        {
            return BadRequest("Food name is required.");
        }

        var food = await context.FishSpeciesFoods.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (food is null)
        {
            return NotFound();
        }

        Apply(food, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(food);
    }

    [HttpDelete("species-foods/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSpeciesFood(int id, CancellationToken cancellationToken)
    {
        var food = await context.FishSpeciesFoods.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (food is null)
        {
            return NotFound();
        }

        context.FishSpeciesFoods.Remove(food);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("reports/species-profile-gaps")]
    public async Task<ActionResult<IEnumerable<FishSpeciesProfileGapDto>>> GetSpeciesProfileGaps(CancellationToken cancellationToken)
    {
        var profiles = await context.FishSpeciesProfiles
            .AsNoTracking()
            .Include(profile => profile.Foods)
            .ToListAsync(cancellationToken);

        var stock = await context.FishStock
            .AsNoTracking()
            .Include(item => item.FishTank)
            .Where(item => item.IsActive)
            .ToListAsync(cancellationToken);

        var gaps = new List<FishSpeciesProfileGapDto>();
        foreach (var stockItem in stock)
        {
            var profile = profiles.FirstOrDefault(profile => SpeciesMatches(profile, stockItem));
            if (profile is null)
            {
                gaps.Add(new FishSpeciesProfileGapDto(
                    null,
                    stockItem.Id,
                    stockItem.FishTankId,
                    stockItem.FishTank?.Name,
                    stockItem.CommonName,
                    stockItem.ScientificName,
                    "Missing Profile",
                    "Current stock has no matching species profile."));
            }
        }

        foreach (var profile in profiles)
        {
            var matchingStock = stock.Where(stockItem => SpeciesMatches(profile, stockItem)).ToList();
            if (matchingStock.Count == 0)
            {
                gaps.Add(new FishSpeciesProfileGapDto(
                    profile.Id,
                    null,
                    null,
                    null,
                    profile.CommonName,
                    profile.ScientificName,
                    "No Current Stock",
                    "Species profile does not match any active current stock entry."));
            }

            if (profile.Foods.Count == 0)
            {
                gaps.Add(new FishSpeciesProfileGapDto(
                    profile.Id,
                    null,
                    null,
                    null,
                    profile.CommonName,
                    profile.ScientificName,
                    "Missing Foods",
                    "Species profile has no individual food rows."));
            }

            foreach (var missingField in MissingProfileFields(profile))
            {
                gaps.Add(new FishSpeciesProfileGapDto(
                    profile.Id,
                    null,
                    null,
                    null,
                    profile.CommonName,
                    profile.ScientificName,
                    "Incomplete Profile",
                    $"Missing {missingField}."));
            }
        }

        return gaps
            .OrderBy(gap => gap.GapType)
            .ThenBy(gap => gap.CommonName)
            .ToList();
    }

    [HttpGet("tank-tasks")]
    public async Task<ActionResult<IEnumerable<FishTankTaskDto>>> GetTankTasks(
        [FromQuery] int? tankId,
        [FromQuery] bool includeInactive = true,
        CancellationToken cancellationToken = default)
    {
        var query = context.FishTankTasks
            .AsNoTracking()
            .Include(task => task.FishTank)
            .Include(task => task.ScheduledTask)
            .AsQueryable();

        if (tankId.HasValue)
        {
            query = query.Where(task => task.FishTankId == tankId.Value);
        }

        if (!includeInactive)
        {
            query = query.Where(task => task.ScheduledTask != null && task.ScheduledTask.IsActive);
        }

        return await query
            .OrderBy(task => task.FishTank!.Location)
            .ThenBy(task => task.FishTank!.Name)
            .ThenBy(task => task.TaskCategory)
            .ThenBy(task => task.ScheduledTask!.Title)
            .Select(task => ToDto(task))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("tank-tasks")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishTankTaskDto>> CreateTankTask(FishTankTaskUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var tank = await context.FishTanks.SingleAsync(item => item.Id == dto.FishTankId, cancellationToken);
        var scheduledTask = new ScheduledTask();
        Apply(scheduledTask, dto, tank.Name);
        context.ScheduledTasks.Add(scheduledTask);
        await context.SaveChangesAsync(cancellationToken);

        var fishTask = new FishTankTask { TaskId = scheduledTask.TaskID };
        Apply(fishTask, dto);
        context.FishTankTasks.Add(fishTask);
        context.ScheduledTaskTags.Add(new ScheduledTaskTag { TaskID = scheduledTask.TaskID, Tag = dto.TaskCategory.Trim() });
        context.ScheduledTaskTags.Add(new ScheduledTaskTag { TaskID = scheduledTask.TaskID, Tag = tank.Name });
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(fishTask).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        await context.Entry(fishTask).Reference(item => item.ScheduledTask).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetTankTasks), new { tankId = fishTask.FishTankId }, ToDto(fishTask));
    }

    [HttpPut("tank-tasks/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishTankTaskDto>> UpdateTankTask(int id, FishTankTaskUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var fishTask = await context.FishTankTasks
            .Include(item => item.ScheduledTask)
            .Include(item => item.FishTank)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (fishTask is null || fishTask.ScheduledTask is null)
        {
            return NotFound();
        }

        var tank = await context.FishTanks.SingleAsync(item => item.Id == dto.FishTankId, cancellationToken);
        Apply(fishTask, dto);
        Apply(fishTask.ScheduledTask, dto, tank.Name);
        var existingTags = context.ScheduledTaskTags.Where(tag => tag.TaskID == fishTask.TaskId);
        context.ScheduledTaskTags.RemoveRange(existingTags);
        context.ScheduledTaskTags.Add(new ScheduledTaskTag { TaskID = fishTask.TaskId, Tag = dto.TaskCategory.Trim() });
        context.ScheduledTaskTags.Add(new ScheduledTaskTag { TaskID = fishTask.TaskId, Tag = tank.Name });
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(fishTask).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        await context.Entry(fishTask).Reference(item => item.ScheduledTask).LoadAsync(cancellationToken);
        return ToDto(fishTask);
    }

    [HttpDelete("tank-tasks/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteTankTask(int id, CancellationToken cancellationToken)
    {
        var fishTask = await context.FishTankTasks
            .Include(item => item.ScheduledTask)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (fishTask is null)
        {
            return NotFound();
        }

        if (fishTask.ScheduledTask is not null)
        {
            context.ScheduledTasks.Remove(fishTask.ScheduledTask);
        }
        else
        {
            context.FishTankTasks.Remove(fishTask);
        }

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("livestock-events")]
    public async Task<ActionResult<IEnumerable<FishLivestockEventDto>>> GetLivestockEvents(
        [FromQuery] int? tankId,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 300);
        var query = context.FishLivestockEvents
            .AsNoTracking()
            .Include(ev => ev.FishTank)
            .Include(ev => ev.DestinationFishTank)
            .AsQueryable();

        if (tankId.HasValue)
        {
            query = query.Where(ev => ev.FishTankId == tankId.Value || ev.DestinationFishTankId == tankId.Value);
        }

        return await query
            .OrderByDescending(ev => ev.EventDate)
            .ThenByDescending(ev => ev.Id)
            .Take(take)
            .Select(ev => ToDto(ev))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("livestock-events")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishLivestockEventDto>> CreateLivestockEvent(FishLivestockEventUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var livestockEvent = new FishLivestockEvent();
        Apply(livestockEvent, dto);
        context.FishLivestockEvents.Add(livestockEvent);
        if (livestockEvent.UpdatesStock)
        {
            await ApplyStockImpact(livestockEvent, 1, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await context.Entry(livestockEvent).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        await context.Entry(livestockEvent).Reference(item => item.DestinationFishTank).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetLivestockEvents), new { tankId = livestockEvent.FishTankId }, ToDto(livestockEvent));
    }

    [HttpPut("livestock-events/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishLivestockEventDto>> UpdateLivestockEvent(int id, FishLivestockEventUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var livestockEvent = await context.FishLivestockEvents
            .Include(item => item.FishTank)
            .Include(item => item.DestinationFishTank)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (livestockEvent is null)
        {
            return NotFound();
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        if (livestockEvent.UpdatesStock)
        {
            await ApplyStockImpact(livestockEvent, -1, cancellationToken);
        }

        Apply(livestockEvent, dto);
        if (livestockEvent.UpdatesStock)
        {
            await ApplyStockImpact(livestockEvent, 1, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await context.Entry(livestockEvent).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        await context.Entry(livestockEvent).Reference(item => item.DestinationFishTank).LoadAsync(cancellationToken);
        return ToDto(livestockEvent);
    }

    [HttpDelete("livestock-events/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteLivestockEvent(int id, CancellationToken cancellationToken)
    {
        var livestockEvent = await context.FishLivestockEvents.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (livestockEvent is null)
        {
            return NotFound();
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        if (livestockEvent.UpdatesStock)
        {
            await ApplyStockImpact(livestockEvent, -1, cancellationToken);
        }

        context.FishLivestockEvents.Remove(livestockEvent);
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<FishAquariumProductDto>>> GetProducts(
        [FromQuery] int? tankId,
        [FromQuery] string? category,
        [FromQuery] bool includeInactive = true,
        CancellationToken cancellationToken = default)
    {
        var query = context.FishAquariumProducts
            .AsNoTracking()
            .Include(product => product.FishTank)
            .AsQueryable();

        if (tankId.HasValue)
        {
            query = query.Where(product => product.FishTankId == tankId.Value);
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var trimmedCategory = category.Trim();
            query = query.Where(product => product.Category == trimmedCategory);
        }

        if (!includeInactive)
        {
            query = query.Where(product => product.IsActive);
        }

        return await query
            .OrderBy(product => product.Category)
            .ThenBy(product => product.Name)
            .ThenBy(product => product.ExpirationDate)
            .Select(product => ToDto(product))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("products")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishAquariumProductDto>> CreateProduct(FishAquariumProductUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var product = new FishAquariumProduct();
        Apply(product, dto);
        context.FishAquariumProducts.Add(product);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(product).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetProducts), new { tankId = product.FishTankId }, ToDto(product));
    }

    [HttpPut("products/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishAquariumProductDto>> UpdateProduct(int id, FishAquariumProductUpsertDto dto, CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var product = await context.FishAquariumProducts
            .Include(item => item.FishTank)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        Apply(product, dto);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(product).Reference(item => item.FishTank).LoadAsync(cancellationToken);
        return ToDto(product);
    }

    [HttpDelete("products/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProduct(int id, CancellationToken cancellationToken)
    {
        var product = await context.FishAquariumProducts.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        context.FishAquariumProducts.Remove(product);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("products/{id:int}/shopping-list-candidate")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShoppingListItemDto>> AddProductShoppingCandidate(
        int id,
        FishProductShoppingCandidateRequestDto dto,
        CancellationToken cancellationToken)
    {
        var product = await context.FishAquariumProducts
            .Include(item => item.FishTank)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        var existing = await context.ShoppingListItems.SingleOrDefaultAsync(item =>
            item.SourceArea == "Fish"
            && item.SourceType == "Aquarium Product"
            && item.SourceId == product.Id
            && item.Status == "Needed",
            cancellationToken);

        if (existing is not null)
        {
            existing.ItemName = product.Name;
            existing.Category = "Pet";
            existing.Quantity = product.Quantity is > 0 ? product.Quantity : null;
            existing.Unit = product.Unit;
            existing.Reason = Clean(dto.Reason) ?? "Product replacement candidate";
            existing.Notes = ShoppingListNotes(product);
            await context.SaveChangesAsync(cancellationToken);
            return ToDto(existing);
        }

        var item = new ShoppingListItem
        {
            ItemName = product.Name,
            Category = "Pet",
            Status = "Needed",
            Quantity = product.Quantity is > 0 ? product.Quantity : null,
            Unit = product.Unit,
            SourceArea = "Fish",
            SourceType = "Aquarium Product",
            SourceId = product.Id,
            Reason = Clean(dto.Reason) ?? "Product replacement candidate",
            Notes = ShoppingListNotes(product),
            CreatedAt = DateTime.UtcNow
        };

        context.ShoppingListItems.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(AddProductShoppingCandidate), new { id = product.Id }, ToDto(item));
    }

    [HttpGet("product-usage")]
    public async Task<ActionResult<IEnumerable<FishAquariumProductUsageDto>>> GetProductUsage(
        [FromQuery] int? productId,
        [FromQuery] bool shoppingOnly = false,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 300);
        var query = context.FishAquariumProductUsage
            .AsNoTracking()
            .Include(usage => usage.FishAquariumProduct)
            .AsQueryable();

        if (productId.HasValue)
        {
            query = query.Where(usage => usage.FishAquariumProductId == productId.Value);
        }

        if (shoppingOnly)
        {
            query = query.Where(usage => usage.AddToShoppingList);
        }

        var usageLogs = await query
            .OrderByDescending(usage => usage.UsedAt)
            .ThenByDescending(usage => usage.Id)
            .Take(take)
            .ToListAsync(cancellationToken);

        return usageLogs.Select(ToDto).ToList();
    }

    [HttpPost("product-usage")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishAquariumProductUsageDto>> CreateProductUsage(
        FishAquariumProductUsageUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var product = await context.FishAquariumProducts
            .SingleAsync(item => item.Id == dto.FishAquariumProductId, cancellationToken);
        var usage = new FishAquariumProductUsage();
        Apply(usage, dto);
        ApplyProductUsage(product, usage);
        context.FishAquariumProductUsage.Add(usage);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(usage).Reference(item => item.FishAquariumProduct).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetProductUsage), new { productId = usage.FishAquariumProductId }, ToDto(usage));
    }

    [HttpPut("product-usage/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FishAquariumProductUsageDto>> UpdateProductUsage(
        int id,
        FishAquariumProductUsageUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = await Validate(dto, cancellationToken);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var usage = await context.FishAquariumProductUsage
            .Include(item => item.FishAquariumProduct)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (usage is null)
        {
            return NotFound();
        }

        Apply(usage, dto);
        var product = await context.FishAquariumProducts
            .SingleAsync(item => item.Id == dto.FishAquariumProductId, cancellationToken);
        ApplyProductUsage(product, usage);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(usage).Reference(item => item.FishAquariumProduct).LoadAsync(cancellationToken);
        return ToDto(usage);
    }

    [HttpDelete("product-usage/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProductUsage(int id, CancellationToken cancellationToken)
    {
        var usage = await context.FishAquariumProductUsage.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (usage is null)
        {
            return NotFound();
        }

        context.FishAquariumProductUsage.Remove(usage);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static string? Validate(FishTankUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Tank name is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.Location))
        {
            return "Tank location is required.";
        }

        if (dto.Gallons is <= 0)
        {
            return "Tank gallons must be greater than zero when provided.";
        }

        return null;
    }

    private static void Apply(FishTank tank, FishTankUpsertDto dto)
    {
        tank.Name = dto.Name.Trim();
        tank.Gallons = dto.Gallons;
        tank.Location = dto.Location.Trim();
        tank.IsSetup = dto.IsSetup;
        tank.IsActive = dto.IsActive;
        tank.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static FishTankDto ToDto(FishTank tank)
    {
        return new FishTankDto(
            tank.Id,
            tank.Name,
            tank.Gallons,
            tank.Location,
            tank.IsSetup,
            tank.IsActive,
            tank.Notes);
    }

    private async Task<string?> Validate(FishTankLogUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.FishTanks.AnyAsync(tank => tank.Id == dto.FishTankId, cancellationToken))
        {
            return "Tank is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.LogType))
        {
            return "Log type is required.";
        }

        if (dto.Temperature is <= 0)
        {
            return "Temperature must be greater than zero when provided.";
        }

        if (dto.Ph is < 0 or > 14)
        {
            return "pH must be between 0 and 14 when provided.";
        }

        if (dto.Ammonia is < 0 || dto.Nitrite is < 0 || dto.Nitrate is < 0 || dto.Gh is < 0 || dto.Kh is < 0)
        {
            return "Water readings cannot be negative.";
        }

        return null;
    }

    private async Task<string?> Validate(FishStockUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.FishTanks.AnyAsync(tank => tank.Id == dto.FishTankId, cancellationToken))
        {
            return "Tank is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.CommonName))
        {
            return "Common name is required.";
        }

        if (dto.Quantity < 0)
        {
            return "Quantity cannot be negative.";
        }

        return null;
    }

    private static string? Validate(FishSpeciesProfileUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CommonName))
        {
            return "Common name is required.";
        }

        return null;
    }

    private async Task<string?> Validate(int profileId, FishSpeciesFoodUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.FishSpeciesProfiles.AnyAsync(profile => profile.Id == profileId, cancellationToken))
        {
            return "Species profile is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.FoodName))
        {
            return "Food name is required.";
        }

        return null;
    }

    private async Task<string?> Validate(FishTankTaskUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.FishTanks.AnyAsync(tank => tank.Id == dto.FishTankId, cancellationToken))
        {
            return "Tank is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return "Task title is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.TaskCategory))
        {
            return "Task category is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.ScheduleType))
        {
            return "Schedule type is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.RecurrencePattern))
        {
            return "Recurrence pattern is required.";
        }

        if (dto.EndDate.HasValue && dto.EndDate.Value.Date < dto.StartDate.Date)
        {
            return "End date must be after the start date.";
        }

        return null;
    }

    private async Task<string?> Validate(FishLivestockEventUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.FishTanks.AnyAsync(tank => tank.Id == dto.FishTankId, cancellationToken))
        {
            return "Tank is required.";
        }

        if (dto.DestinationFishTankId.HasValue &&
            !await context.FishTanks.AnyAsync(tank => tank.Id == dto.DestinationFishTankId.Value, cancellationToken))
        {
            return "Destination tank was not found.";
        }

        if (dto.DestinationFishTankId == dto.FishTankId)
        {
            return "Destination tank must be different from the source tank.";
        }

        var eventType = dto.EventType?.Trim();
        if (string.IsNullOrWhiteSpace(eventType))
        {
            return "Event type is required.";
        }

        if (!LivestockEventTypes.Contains(eventType, StringComparer.OrdinalIgnoreCase))
        {
            return "Event type must be Addition, Death, Move, or Quarantine.";
        }

        if (eventType.Equals("Move", StringComparison.OrdinalIgnoreCase) && !dto.DestinationFishTankId.HasValue)
        {
            return "Move events require a destination tank.";
        }

        if (string.IsNullOrWhiteSpace(dto.CommonName))
        {
            return "Common name is required.";
        }

        if (dto.Quantity <= 0)
        {
            return "Quantity must be greater than zero.";
        }

        return null;
    }

    private async Task<string?> Validate(FishAquariumProductUpsertDto dto, CancellationToken cancellationToken)
    {
        if (dto.FishTankId.HasValue &&
            !await context.FishTanks.AnyAsync(tank => tank.Id == dto.FishTankId.Value, cancellationToken))
        {
            return "Tank was not found.";
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Product name is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.Category))
        {
            return "Product category is required.";
        }

        if (!AquariumProductCategories.Contains(dto.Category.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            return "Product category must be Food, Medication, Treatment, Filter Media, Equipment, Test Kit, or Other.";
        }

        if (dto.Quantity is < 0)
        {
            return "Quantity cannot be negative.";
        }

        if (dto.PercentLeft is < 0 or > 100)
        {
            return "Percent left must be between 0 and 100.";
        }

        return null;
    }

    private async Task<string?> Validate(FishAquariumProductUsageUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!await context.FishAquariumProducts.AnyAsync(product => product.Id == dto.FishAquariumProductId, cancellationToken))
        {
            return "Aquarium product is required.";
        }

        var usageType = dto.UsageType?.Trim();
        if (string.IsNullOrWhiteSpace(usageType))
        {
            return "Usage type is required.";
        }

        if (!AquariumProductUsageTypes.Contains(usageType, StringComparer.OrdinalIgnoreCase))
        {
            return "Usage type must be Used, Opened, Replaced, Refilled, Discarded, or Other.";
        }

        if (dto.QuantityUsed is < 0 || dto.QuantityAfter is < 0)
        {
            return "Quantities cannot be negative.";
        }

        if (dto.PercentLeftAfter is < 0 or > 100)
        {
            return "Percent left must be between 0 and 100.";
        }

        return null;
    }

    private static void Apply(FishTankLog log, FishTankLogUpsertDto dto)
    {
        log.FishTankId = dto.FishTankId;
        log.LoggedAt = dto.LoggedAt == default ? DateTime.Now : dto.LoggedAt;
        log.LogType = dto.LogType.Trim();
        log.Temperature = dto.Temperature;
        log.Ammonia = dto.Ammonia;
        log.Nitrite = dto.Nitrite;
        log.Nitrate = dto.Nitrate;
        log.Ph = dto.Ph;
        log.Gh = dto.Gh;
        log.Kh = dto.Kh;
        log.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static FishTankLogDto ToDto(FishTankLog log)
    {
        return new FishTankLogDto(
            log.Id,
            log.FishTankId,
            log.FishTank?.Name ?? string.Empty,
            log.LoggedAt,
            log.LogType,
            log.Temperature,
            log.Ammonia,
            log.Nitrite,
            log.Nitrate,
            log.Ph,
            log.Gh,
            log.Kh,
            log.Notes);
    }

    private static void Apply(FishStock stock, FishStockUpsertDto dto)
    {
        stock.FishTankId = dto.FishTankId;
        stock.CommonName = dto.CommonName.Trim();
        stock.ScientificName = string.IsNullOrWhiteSpace(dto.ScientificName) ? null : dto.ScientificName.Trim();
        stock.AdultSize = string.IsNullOrWhiteSpace(dto.AdultSize) ? null : dto.AdultSize.Trim();
        stock.Temperament = string.IsNullOrWhiteSpace(dto.Temperament) ? null : dto.Temperament.Trim();
        stock.TemperaturePreference = string.IsNullOrWhiteSpace(dto.TemperaturePreference) ? null : dto.TemperaturePreference.Trim();
        stock.PhPreference = string.IsNullOrWhiteSpace(dto.PhPreference) ? null : dto.PhPreference.Trim();
        stock.Quantity = dto.Quantity;
        stock.IsActive = dto.IsActive;
        stock.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static FishStockDto ToDto(FishStock stock)
    {
        return new FishStockDto(
            stock.Id,
            stock.FishTankId,
            stock.FishTank?.Name ?? string.Empty,
            stock.CommonName,
            stock.ScientificName,
            stock.AdultSize,
            stock.Temperament,
            stock.TemperaturePreference,
            stock.PhPreference,
            stock.Quantity,
            stock.IsActive,
            stock.Notes);
    }

    private static void Apply(FishSpeciesProfile profile, FishSpeciesProfileUpsertDto dto)
    {
        profile.CommonName = dto.CommonName.Trim();
        profile.ScientificName = Clean(dto.ScientificName);
        profile.AdultSize = Clean(dto.AdultSize);
        profile.Temperament = Clean(dto.Temperament);
        profile.TemperaturePreference = Clean(dto.TemperaturePreference);
        profile.PhPreference = Clean(dto.PhPreference);
        profile.GhPreference = Clean(dto.GhPreference);
        profile.KhPreference = Clean(dto.KhPreference);
        profile.CareLevel = Clean(dto.CareLevel);
        profile.TankLevel = Clean(dto.TankLevel);
        profile.IsQuarantineRequired = dto.IsQuarantineRequired;
        profile.Notes = Clean(dto.Notes);
    }

    private static void Apply(FishSpeciesFood food, FishSpeciesFoodUpsertDto dto)
    {
        food.FoodName = dto.FoodName.Trim();
        food.FoodType = Clean(dto.FoodType);
        food.FeedingFrequency = Clean(dto.FeedingFrequency);
        food.IsStaple = dto.IsStaple;
        food.Notes = Clean(dto.Notes);
    }

    private static FishSpeciesProfileDto ToDto(FishSpeciesProfile profile)
    {
        return new FishSpeciesProfileDto(
            profile.Id,
            profile.CommonName,
            profile.ScientificName,
            profile.AdultSize,
            profile.Temperament,
            profile.TemperaturePreference,
            profile.PhPreference,
            profile.GhPreference,
            profile.KhPreference,
            profile.CareLevel,
            profile.TankLevel,
            profile.IsQuarantineRequired,
            profile.Notes,
            profile.Foods
                .OrderByDescending(food => food.IsStaple)
                .ThenBy(food => food.FoodName)
                .Select(ToDto)
                .ToList());
    }

    private static FishSpeciesFoodDto ToDto(FishSpeciesFood food)
    {
        return new FishSpeciesFoodDto(
            food.Id,
            food.FishSpeciesProfileId,
            food.FoodName,
            food.FoodType,
            food.FeedingFrequency,
            food.IsStaple,
            food.Notes);
    }

    private static bool SpeciesMatches(FishSpeciesProfile profile, FishStock stock)
    {
        if (!string.IsNullOrWhiteSpace(profile.ScientificName) &&
            !string.IsNullOrWhiteSpace(stock.ScientificName) &&
            string.Equals(profile.ScientificName.Trim(), stock.ScientificName.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(profile.CommonName.Trim(), stock.CommonName.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static IEnumerable<string> MissingProfileFields(FishSpeciesProfile profile)
    {
        if (string.IsNullOrWhiteSpace(profile.AdultSize))
        {
            yield return "adult size";
        }

        if (string.IsNullOrWhiteSpace(profile.Temperament))
        {
            yield return "temperament";
        }

        if (string.IsNullOrWhiteSpace(profile.TemperaturePreference))
        {
            yield return "temperature preference";
        }

        if (string.IsNullOrWhiteSpace(profile.PhPreference))
        {
            yield return "pH preference";
        }

        if (string.IsNullOrWhiteSpace(profile.GhPreference))
        {
            yield return "GH preference";
        }

        if (string.IsNullOrWhiteSpace(profile.KhPreference))
        {
            yield return "KH preference";
        }

        if (string.IsNullOrWhiteSpace(profile.CareLevel))
        {
            yield return "care level";
        }

        if (string.IsNullOrWhiteSpace(profile.TankLevel))
        {
            yield return "tank level";
        }
    }

    private static void Apply(FishTankTask task, FishTankTaskUpsertDto dto)
    {
        task.FishTankId = dto.FishTankId;
        task.TaskCategory = dto.TaskCategory.Trim();
        task.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static void Apply(ScheduledTask task, FishTankTaskUpsertDto dto, string tankName)
    {
        task.Title = dto.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(dto.Description)
            ? $"{tankName}: {dto.TaskCategory.Trim()}"
            : dto.Description.Trim();
        task.TaskType = "Fish";
        task.IsActive = dto.IsActive;
        task.ScheduleType = dto.ScheduleType.Trim();
        task.StartDate = dto.StartDate;
        task.EndDate = dto.EndDate;
        task.RecurrencePattern = dto.RecurrencePattern.Trim();
    }

    private static FishTankTaskDto ToDto(FishTankTask task)
    {
        var scheduledTask = task.ScheduledTask;
        return new FishTankTaskDto(
            task.Id,
            task.FishTankId,
            task.FishTank?.Name ?? string.Empty,
            task.TaskId,
            scheduledTask?.Title ?? string.Empty,
            scheduledTask?.Description,
            task.TaskCategory,
            scheduledTask?.IsActive ?? false,
            scheduledTask?.ScheduleType ?? string.Empty,
            scheduledTask?.StartDate ?? default,
            scheduledTask?.EndDate,
            scheduledTask?.RecurrencePattern ?? string.Empty,
            task.Notes);
    }

    private static readonly string[] LivestockEventTypes = ["Addition", "Death", "Move", "Quarantine"];
    private static readonly string[] AquariumProductCategories = ["Food", "Medication", "Treatment", "Filter Media", "Equipment", "Test Kit", "Other"];
    private static readonly string[] AquariumProductUsageTypes = ["Used", "Opened", "Replaced", "Refilled", "Discarded", "Other"];

    private static void Apply(FishLivestockEvent livestockEvent, FishLivestockEventUpsertDto dto)
    {
        livestockEvent.FishTankId = dto.FishTankId;
        livestockEvent.DestinationFishTankId = dto.DestinationFishTankId;
        livestockEvent.EventDate = dto.EventDate == default ? DateTime.Now : dto.EventDate;
        livestockEvent.EventType = dto.EventType.Trim();
        livestockEvent.CommonName = dto.CommonName.Trim();
        livestockEvent.ScientificName = string.IsNullOrWhiteSpace(dto.ScientificName) ? null : dto.ScientificName.Trim();
        livestockEvent.Quantity = dto.Quantity;
        livestockEvent.UpdatesStock = dto.UpdatesStock;
        livestockEvent.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private async Task ApplyStockImpact(FishLivestockEvent livestockEvent, int direction, CancellationToken cancellationToken)
    {
        if (livestockEvent.EventType.Equals("Addition", StringComparison.OrdinalIgnoreCase))
        {
            await AdjustStock(livestockEvent.FishTankId, livestockEvent, livestockEvent.Quantity * direction, cancellationToken);
            return;
        }

        if (livestockEvent.EventType.Equals("Death", StringComparison.OrdinalIgnoreCase))
        {
            await AdjustStock(livestockEvent.FishTankId, livestockEvent, -livestockEvent.Quantity * direction, cancellationToken);
            return;
        }

        if ((livestockEvent.EventType.Equals("Move", StringComparison.OrdinalIgnoreCase) ||
            livestockEvent.EventType.Equals("Quarantine", StringComparison.OrdinalIgnoreCase)) &&
            livestockEvent.DestinationFishTankId.HasValue)
        {
            await AdjustStock(livestockEvent.FishTankId, livestockEvent, -livestockEvent.Quantity * direction, cancellationToken);
            await AdjustStock(livestockEvent.DestinationFishTankId.Value, livestockEvent, livestockEvent.Quantity * direction, cancellationToken);
        }
    }

    private async Task AdjustStock(int tankId, FishLivestockEvent livestockEvent, int quantityDelta, CancellationToken cancellationToken)
    {
        var commonName = livestockEvent.CommonName.Trim();
        var scientificName = string.IsNullOrWhiteSpace(livestockEvent.ScientificName) ? null : livestockEvent.ScientificName.Trim();
        var commonNameLower = commonName.ToLower();
        var scientificNameLower = scientificName?.ToLower();

        var stock = await context.FishStock
            .Where(item => item.FishTankId == tankId)
            .Where(item => item.CommonName.ToLower() == commonNameLower)
            .Where(item => scientificNameLower == null
                ? item.ScientificName == null || item.ScientificName == ""
                : item.ScientificName != null && item.ScientificName.ToLower() == scientificNameLower)
            .SingleOrDefaultAsync(cancellationToken);

        if (stock is null)
        {
            if (quantityDelta <= 0)
            {
                return;
            }

            context.FishStock.Add(new FishStock
            {
                FishTankId = tankId,
                CommonName = commonName,
                ScientificName = scientificName,
                Quantity = quantityDelta,
                IsActive = true,
                Notes = "Created from livestock event."
            });
            return;
        }

        stock.Quantity = Math.Max(0, stock.Quantity + quantityDelta);
        stock.IsActive = stock.Quantity > 0;
    }

    private static FishLivestockEventDto ToDto(FishLivestockEvent livestockEvent)
    {
        return new FishLivestockEventDto(
            livestockEvent.Id,
            livestockEvent.FishTankId,
            livestockEvent.FishTank?.Name ?? string.Empty,
            livestockEvent.DestinationFishTankId,
            livestockEvent.DestinationFishTank?.Name,
            livestockEvent.EventDate,
            livestockEvent.EventType,
            livestockEvent.CommonName,
            livestockEvent.ScientificName,
            livestockEvent.Quantity,
            livestockEvent.UpdatesStock,
            livestockEvent.Notes);
    }

    private static void Apply(FishAquariumProduct product, FishAquariumProductUpsertDto dto)
    {
        product.FishTankId = dto.FishTankId;
        product.Name = dto.Name.Trim();
        product.Category = dto.Category.Trim();
        product.Quantity = dto.Quantity;
        product.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim();
        product.PercentLeft = dto.PercentLeft;
        product.ExpirationDate = dto.ExpirationDate;
        product.IsActive = dto.IsActive;
        product.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static FishAquariumProductDto ToDto(FishAquariumProduct product)
    {
        return new FishAquariumProductDto(
            product.Id,
            product.FishTankId,
            product.FishTank?.Name,
            product.Name,
            product.Category,
            product.Quantity,
            product.Unit,
            product.PercentLeft,
            product.ExpirationDate,
            product.IsActive,
            product.Notes);
    }

    private static void Apply(FishAquariumProductUsage usage, FishAquariumProductUsageUpsertDto dto)
    {
        usage.FishAquariumProductId = dto.FishAquariumProductId;
        usage.UsedAt = dto.UsedAt == default ? DateTime.Now : dto.UsedAt;
        usage.UsageType = dto.UsageType.Trim();
        usage.QuantityUsed = dto.QuantityUsed;
        usage.QuantityAfter = dto.QuantityAfter;
        usage.PercentLeftAfter = dto.PercentLeftAfter;
        usage.OpenedNewContainer = dto.OpenedNewContainer;
        usage.UpdateInventory = dto.UpdateInventory;
        usage.AddToShoppingList = dto.AddToShoppingList;
        usage.ShoppingCategory = string.IsNullOrWhiteSpace(dto.ShoppingCategory) ? "Pet" : dto.ShoppingCategory.Trim();
        usage.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
    }

    private static void ApplyProductUsage(FishAquariumProduct product, FishAquariumProductUsage usage)
    {
        if (!usage.UpdateInventory)
        {
            return;
        }

        if (usage.OpenedNewContainer && !usage.PercentLeftAfter.HasValue)
        {
            product.PercentLeft = 100;
        }

        if (usage.QuantityAfter.HasValue)
        {
            product.Quantity = usage.QuantityAfter;
        }

        if (usage.PercentLeftAfter.HasValue)
        {
            product.PercentLeft = usage.PercentLeftAfter;
        }

        if (product.Quantity is <= 0 || product.PercentLeft is <= 0)
        {
            product.IsActive = false;
        }
    }

    private static FishAquariumProductUsageDto ToDto(FishAquariumProductUsage usage)
    {
        var product = usage.FishAquariumProduct;
        return new FishAquariumProductUsageDto(
            usage.Id,
            usage.FishAquariumProductId,
            product?.Name ?? string.Empty,
            product?.Category ?? string.Empty,
            usage.UsedAt,
            usage.UsageType,
            usage.QuantityUsed,
            usage.QuantityAfter,
            usage.PercentLeftAfter,
            usage.OpenedNewContainer,
            usage.UpdateInventory,
            usage.AddToShoppingList,
            product?.Name ?? string.Empty,
            usage.ShoppingCategory,
            usage.Notes);
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

    private static string? Clean(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string ShoppingListNotes(FishAquariumProduct product)
    {
        var tank = product.FishTank?.Name ?? "General";
        return $"Fish supply replacement. Product category: {product.Category}. Tank: {tank}.";
    }
}
