using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/master-schedule")]
public class MasterScheduleController(VerdelakDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MasterScheduleItemDto>>> Get(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken cancellationToken)
    {
        if (from == default || to == default || from.Date > to.Date)
        {
            return BadRequest("Choose a valid master schedule date range.");
        }

        var start = from.Date;
        var end = to.Date;
        var scheduled = await ScheduledOccurrences(start, end, cancellationToken);
        var goals = await GoalItems(start, end, cancellationToken);

        return scheduled
            .Concat(goals)
            .OrderBy(item => item.ScheduledDate)
            .ThenBy(item => item.Source)
            .ThenBy(item => item.Title)
            .ToList();
    }

    [HttpPost("goals/{id:int}/complete")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CompleteGoalItem(int id, GoalCompleteActionDto dto, CancellationToken cancellationToken)
    {
        var item = await context.PlanItems
            .Include(planItem => planItem.AnnualPlan)
            .SingleOrDefaultAsync(planItem => planItem.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        if (item.AnnualPlan.Status != AnnualPlanStatus.Active)
        {
            return Conflict("Only active plan items can be completed from the master schedule.");
        }

        if (item.OutlineLevel == 0 || item.IsSummary)
        {
            return BadRequest("Only goal work items can be completed from the master schedule.");
        }

        item.PercentComplete = 100;
        item.Status = PlanItemStatus.Complete;
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            item.Notes = AppendScheduleNote(item.Notes, dto.Notes, "Completed from the shared schedule.");
        }

        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPatch("goals/{id:int}/progress")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateGoalProgress(int id, GoalProgressUpdateDto dto, CancellationToken cancellationToken)
    {
        if (dto.PercentComplete is < 0 or > 100)
        {
            return BadRequest("Percent complete must be between 0 and 100.");
        }

        var item = await context.PlanItems
            .Include(planItem => planItem.AnnualPlan)
            .SingleOrDefaultAsync(planItem => planItem.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        if (item.AnnualPlan.Status != AnnualPlanStatus.Active)
        {
            return Conflict("Only active plan items can be updated from the master schedule.");
        }

        if (item.OutlineLevel == 0 || item.IsSummary)
        {
            return BadRequest("Only goal work items can be updated from the master schedule.");
        }

        item.PercentComplete = dto.PercentComplete;
        item.Status = dto.PercentComplete >= 100
            ? PlanItemStatus.Complete
            : dto.PercentComplete > 0
                ? PlanItemStatus.InProgress
                : PlanItemStatus.NotStarted;
        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }


    [HttpPatch("goals/{id:int}/schedule")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RescheduleGoalItem(int id, GoalScheduleActionDto dto, CancellationToken cancellationToken)
    {
        if (!dto.ScheduledDate.HasValue)
        {
            return BadRequest("Choose a schedule date for the goal item.");
        }

        var itemResult = await LoadActiveGoalWorkItem(id, cancellationToken);
        if (itemResult.Error is not null)
        {
            return itemResult.Error;
        }

        var item = itemResult.Item!;
        var scheduledDate = dto.ScheduledDate.Value.Date;
        var previousDate = GoalDisplayDate(item, scheduledDate, scheduledDate).Date;
        item.TargetStartDate = scheduledDate;
        item.TargetEndDate = scheduledDate;
        item.PlanningWindowType = PlanItemPlanningWindowTypes.Day;
        item.ScheduleSurfaceMode = PlanItemScheduleSurfaceModes.PinnedToSchedule;
        item.Notes = AppendScheduleNote(item.Notes, dto.Notes, $"Rescheduled from {previousDate:yyyy-MM-dd} to {scheduledDate:yyyy-MM-dd} from the shared schedule.");

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("goals/{id:int}/skip")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SkipGoalItem(int id, GoalScheduleActionDto dto, CancellationToken cancellationToken)
    {
        var itemResult = await LoadActiveGoalWorkItem(id, cancellationToken);
        if (itemResult.Error is not null)
        {
            return itemResult.Error;
        }

        var item = itemResult.Item!;
        item.ScheduleSurfaceMode = PlanItemScheduleSurfaceModes.Never;
        item.Notes = AppendScheduleNote(item.Notes, dto.Notes, "Skipped from the shared schedule.");

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<IReadOnlyCollection<MasterScheduleItemDto>> ScheduledOccurrences(
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken)
    {
        var occurrences = await context.TaskOccurrences
            .AsNoTracking()
            .Include(occurrence => occurrence.ScheduledTask)
                .ThenInclude(task => task.Tags)
            .Where(occurrence => occurrence.ScheduledDate.Date >= start && occurrence.ScheduledDate.Date <= end)
            .OrderBy(occurrence => occurrence.ScheduledDate)
            .ThenBy(occurrence => occurrence.ScheduledTask.Title)
            .ToListAsync(cancellationToken);

        return occurrences
            .Select(occurrence =>
            {
                var actions = OccurrenceActions(occurrence.Status);
                return new MasterScheduleItemDto(
                    $"occurrence-{occurrence.OccurrenceID}",
                    ScheduleSource(occurrence.ScheduledTask.TaskType),
                    ScheduleSourceType(occurrence.ScheduledTask),
                    occurrence.TaskID,
                    occurrence.OccurrenceID,
                    occurrence.ScheduledTask.Title,
                    occurrence.ScheduledTask.Description,
                    occurrence.ScheduledDate,
                    occurrence.ScheduledDate,
                    occurrence.ScheduledDate,
                    occurrence.Status,
                    null,
                    actions.CanComplete,
                    actions.CanMove,
                    actions.CanSkip,
                    actions.CanReopen);
            })
            .ToList();
    }


    private static OccurrenceActionState OccurrenceActions(string status)
    {
        var normalized = string.IsNullOrWhiteSpace(status) ? "Scheduled" : status.Trim();
        return normalized switch
        {
            "Completed" => new(false, false, false, true),
            "Skipped" => new(false, true, false, true),
            "Missed" => new(true, true, true, true),
            _ => new(true, true, true, false)
        };
    }

    private static string ScheduleSource(string taskType) => taskType switch
    {
        "Backup" => "Backups",
        "Fish" => "Fish",
        "Gardening" => "Gardening",
        _ => "Chores"
    };

    private static string ScheduleSourceType(ScheduledTask task)
    {
        if (task.TaskType == "Chore")
        {
            return task.Tags
                .Select(tag => tag.Tag)
                .FirstOrDefault() ?? "Household";
        }

        return task.TaskType;
    }

    private async Task<GoalWorkItemResult> LoadActiveGoalWorkItem(int id, CancellationToken cancellationToken)
    {
        var item = await context.PlanItems
            .Include(planItem => planItem.AnnualPlan)
            .SingleOrDefaultAsync(planItem => planItem.Id == id, cancellationToken);
        if (item is null)
        {
            return new(null, NotFound());
        }

        if (item.AnnualPlan.Status != AnnualPlanStatus.Active)
        {
            return new(null, Conflict("Only active plan items can be changed from the master schedule."));
        }

        if (item.OutlineLevel == 0 || item.IsSummary)
        {
            return new(null, BadRequest("Only goal work items can be changed from the master schedule."));
        }

        if (item.PercentComplete >= 100)
        {
            return new(null, Conflict("Completed goal items must be reopened from Goals and Plans before schedule changes."));
        }

        return new(item, null);
    }

    private static string? AppendScheduleNote(string? existingNotes, string? actionNotes, string fallbackNote)
    {
        var note = string.IsNullOrWhiteSpace(actionNotes) ? fallbackNote : actionNotes.Trim();
        if (string.IsNullOrWhiteSpace(existingNotes))
        {
            return note;
        }

        return $"{existingNotes.Trim()}\n{note}";
    }
    private async Task<IReadOnlyCollection<MasterScheduleItemDto>> GoalItems(
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken)
    {
        var canCompleteGoals = User.IsInRole("Admin");
        var activePlanId = await context.AnnualPlans
            .AsNoTracking()
            .Where(plan => plan.Status == AnnualPlanStatus.Active)
            .Select(plan => (int?)plan.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (!activePlanId.HasValue)
        {
            return [];
        }

        var items = await context.PlanItems
            .AsNoTracking()
            .Where(item => item.AnnualPlanId == activePlanId.Value
                && item.OutlineLevel > 0
                && !item.IsSummary
                && item.PercentComplete < 100)
            .OrderBy(item => item.SortOrder)
            .ToListAsync(cancellationToken);

        return items
            .Where(item => SurfacesOnSchedule(item, start, end))
            .Select(item => new MasterScheduleItemDto(
                $"goal-{item.Id}",
                "Goals",
                item.TopLevelSection ?? "Plan root",
                item.Id,
                null,
                item.Title,
                ScheduleDetail(item),
                GoalDisplayDate(item, start, end),
                GoalStartDate(item)?.Date,
                GoalEndDate(item)?.Date,
                item.Status,
                item.PercentComplete,
                canCompleteGoals,
                canCompleteGoals,
                canCompleteGoals,
                false))
            .ToList();
    }

    private static DateTime GoalDisplayDate(PlanItem item, DateTime start, DateTime end)
    {
        var itemEnd = GoalEndDate(item);
        var itemStart = GoalStartDate(item);

        if (itemEnd.HasValue && itemEnd.Value.Date >= start && itemEnd.Value.Date <= end)
        {
            return itemEnd.Value.Date;
        }

        if (itemStart.HasValue && itemStart.Value.Date >= start && itemStart.Value.Date <= end)
        {
            return itemStart.Value.Date;
        }

        return start;
    }

    private static bool SurfacesOnSchedule(PlanItem item, DateTime start, DateTime end)
    {
        var itemStart = GoalStartDate(item);
        var itemEnd = GoalEndDate(item);

        return item.ScheduleSurfaceMode switch
        {
            PlanItemScheduleSurfaceModes.ActiveGoalsOnly => true,
            PlanItemScheduleSurfaceModes.PinnedToSchedule => true,
            PlanItemScheduleSurfaceModes.DuringTargetWindow => WindowOverlaps(itemStart, itemEnd, start, end),
            PlanItemScheduleSurfaceModes.NearTargetEnd => itemEnd.HasValue
                && itemEnd.Value.Date >= start
                && itemEnd.Value.Date.AddDays(-7) <= end,
            _ => WindowOverlaps(item.ImportedStart, item.ImportedFinish, start, end)
        };
    }

    private static bool WindowOverlaps(DateTime? itemStart, DateTime? itemEnd, DateTime start, DateTime end)
    {
        return (itemStart.HasValue || itemEnd.HasValue)
            && (!itemStart.HasValue || itemStart.Value.Date <= end)
            && (!itemEnd.HasValue || itemEnd.Value.Date >= start);
    }

    private static string ScheduleDetail(PlanItem item)
    {
        return item.ScheduleSurfaceMode switch
        {
            PlanItemScheduleSurfaceModes.ActiveGoalsOnly => "Active goal item",
            PlanItemScheduleSurfaceModes.PinnedToSchedule => "Pinned goal item",
            PlanItemScheduleSurfaceModes.DuringTargetWindow => $"{item.PlanningWindowType} goal window",
            PlanItemScheduleSurfaceModes.NearTargetEnd => "Goal target end is near",
            _ when item.ImportedStart.HasValue || item.ImportedFinish.HasValue => "Imported Project schedule",
            _ => "Goal item"
        };
    }

    private static DateTime? GoalStartDate(PlanItem item)
    {
        return item.TargetStartDate ?? item.ImportedStart;
    }

    private static DateTime? GoalEndDate(PlanItem item)
    {
        return item.TargetEndDate ?? item.ImportedFinish ?? item.ImportedStart;
    }
}

record OccurrenceActionState(bool CanComplete, bool CanMove, bool CanSkip, bool CanReopen);


record GoalWorkItemResult(PlanItem? Item, ActionResult? Error);



