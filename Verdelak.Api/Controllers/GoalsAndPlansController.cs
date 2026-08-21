using System.Text;
using System.Xml.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/goals-plans")]
public class GoalsAndPlansController(VerdelakDbContext context) : ControllerBase
{
    private static readonly HashSet<string> QueueSections =
    [
        "Listen",
        "Puzzles",
        "Read",
        "Video Games",
        "Watch"
    ];
    private static readonly HashSet<string> ItemTypes =
    [
        PlanItemTypes.Section,
        PlanItemTypes.Project,
        PlanItemTypes.Task,
        PlanItemTypes.QueueItem,
        PlanItemTypes.Milestone
    ];
    private static readonly HashSet<string> PlanningWindowTypes =
    [
        PlanItemPlanningWindowTypes.Unscheduled,
        PlanItemPlanningWindowTypes.Year,
        PlanItemPlanningWindowTypes.Quarter,
        PlanItemPlanningWindowTypes.Month,
        PlanItemPlanningWindowTypes.Week,
        PlanItemPlanningWindowTypes.Day,
        PlanItemPlanningWindowTypes.DateRange
    ];
    private static readonly HashSet<string> ScheduleSurfaceModes =
    [
        PlanItemScheduleSurfaceModes.Never,
        PlanItemScheduleSurfaceModes.ActiveGoalsOnly,
        PlanItemScheduleSurfaceModes.DuringTargetWindow,
        PlanItemScheduleSurfaceModes.NearTargetEnd,
        PlanItemScheduleSurfaceModes.PinnedToSchedule
    ];
    private static readonly HashSet<string> RolloverPolicies =
    [
        PlanItemRolloverPolicies.Normal,
        PlanItemRolloverPolicies.Never,
        PlanItemRolloverPolicies.Always,
        PlanItemRolloverPolicies.RepeatNextYear
    ];
    private static readonly HashSet<string> DependencyTypes =
    [
        PlanItemDependencyTypes.FinishToFinish,
        PlanItemDependencyTypes.FinishToStart,
        PlanItemDependencyTypes.StartToFinish,
        PlanItemDependencyTypes.StartToStart
    ];
    private static readonly HashSet<string> AnnualPlanStatuses =
    [
        AnnualPlanStatus.Draft,
        AnnualPlanStatus.Active,
        AnnualPlanStatus.Archived
    ];

    [HttpGet("plans")]
    public async Task<ActionResult<IEnumerable<AnnualPlanSummaryDto>>> GetPlans(CancellationToken cancellationToken)
    {
        var plans = await context.AnnualPlans
            .AsNoTracking()
            .OrderByDescending(plan => plan.Year)
            .ThenBy(plan => plan.Title)
            .Select(plan => new AnnualPlanSummaryDto(
                plan.Id,
                plan.Year,
                plan.Title,
                plan.Status,
                plan.SourceSystem,
                plan.SourceFileName,
                plan.ImportedAtUtc,
                plan.PlanItems.Count,
                plan.PlanItems.Count(item => item.IsSummary),
                plan.PlanItems.Count(item => item.PercentComplete >= 100),
                plan.PlanItems.Count(item => item.Notes != null && item.Notes != string.Empty)))
            .ToListAsync(cancellationToken);

        return plans;
    }

    [HttpPost("plans")]
    public async Task<ActionResult<AnnualPlanSummaryDto>> CreatePlan(
        AnnualPlanCreateDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.Year is < 1900 or > 3000)
        {
            return BadRequest("Plan year must be between 1900 and 3000.");
        }

        if (await context.AnnualPlans.AnyAsync(plan => plan.Year == dto.Year, cancellationToken))
        {
            return Conflict($"Annual plan {dto.Year} already exists.");
        }

        var title = string.IsNullOrWhiteSpace(dto.Title)
            ? $"Goals and Plans {dto.Year}"
            : dto.Title.Trim();
        var plan = new AnnualPlan
        {
            Year = dto.Year,
            Title = title,
            Status = AnnualPlanStatus.Draft,
            SourceSystem = "ManualFutureBulkAdd"
        };
        plan.PlanItems.Add(new PlanItem
        {
            AnnualPlan = plan,
            SortOrder = 0,
            OutlineLevel = 0,
            ItemType = PlanItemTypes.Project,
            Title = title,
            PercentComplete = 0,
            IsSummary = true,
            IsMilestone = false,
            Status = PlanItemStatus.NotStarted,
            PlanningWindowType = PlanItemPlanningWindowTypes.Year,
            ScheduleSurfaceMode = PlanItemScheduleSurfaceModes.Never,
            RolloverPolicy = PlanItemRolloverPolicies.Normal
        });

        context.AnnualPlans.Add(plan);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetPlanItems), new { id = plan.Id }, await Summary(plan.Id, cancellationToken));
    }

    [HttpPut("plans/{id:int}/status")]
    public async Task<ActionResult<AnnualPlanSummaryDto>> UpdatePlanStatus(
        int id,
        AnnualPlanStatusUpdateDto dto,
        CancellationToken cancellationToken)
    {
        if (!AnnualPlanStatuses.Contains(dto.Status))
        {
            return BadRequest("Annual plan status must be Draft, Active, or Archived.");
        }

        var plan = await context.AnnualPlans.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (plan is null)
        {
            return NotFound();
        }

        if (dto.Status == AnnualPlanStatus.Active)
        {
            await DemoteOtherActivePlans(id, cancellationToken);
        }

        plan.Status = dto.Status;
        await context.SaveChangesAsync(cancellationToken);
        return await Summary(plan.Id, cancellationToken);
    }

    [HttpPost("plans/rollover")]
    public async Task<ActionResult<AnnualPlanRolloverResultDto>> RolloverPlan(
        AnnualPlanRolloverRequestDto dto,
        CancellationToken cancellationToken)
    {
        var analysisResult = await AnalyzeRollover(dto, cancellationToken);
        if (analysisResult.Error is not null)
        {
            return analysisResult.Error;
        }

        var analysis = analysisResult.Analysis!;
        var plan = new AnnualPlan
        {
            Year = dto.Year,
            Title = analysis.TargetTitle,
            Status = AnnualPlanStatus.Draft,
            SourceSystem = "AnnualPlanRollover"
        };
        var rolledBySourceId = new Dictionary<int, PlanItem>();

        foreach (var sourceItem in analysis.RolledSources)
        {
            var rolledItem = new PlanItem
            {
                AnnualPlan = plan,
                ParentPlanItem = sourceItem.ParentPlanItemId.HasValue
                    ? rolledBySourceId.GetValueOrDefault(sourceItem.ParentPlanItemId.Value)
                    : null,
                SortOrder = plan.PlanItems.Count,
                OutlineLevel = sourceItem.OutlineLevel,
                ItemType = sourceItem.ItemType,
                Title = sourceItem.OutlineLevel == 0 ? plan.Title : sourceItem.Title,
                TopLevelSection = sourceItem.TopLevelSection,
                Notes = sourceItem.Notes,
                PercentComplete = RolledPercentComplete(sourceItem),
                IsSummary = sourceItem.IsSummary,
                IsMilestone = sourceItem.IsMilestone,
                Status = StatusFor(RolledPercentComplete(sourceItem)),
                PlanningWindowType = sourceItem.PlanningWindowType,
                TargetStartDate = ShiftYear(sourceItem.TargetStartDate, analysis.YearDelta),
                TargetEndDate = ShiftYear(sourceItem.TargetEndDate, analysis.YearDelta),
                ScheduleSurfaceMode = sourceItem.ScheduleSurfaceMode,
                RolloverPolicy = sourceItem.RolloverPolicy
            };

            plan.PlanItems.Add(rolledItem);
            rolledBySourceId[sourceItem.Id] = rolledItem;
        }

        foreach (var sourceItem in analysis.RolledSources)
        {
            var rolledItem = rolledBySourceId[sourceItem.Id];
            foreach (var dependency in sourceItem.ImportedPredecessors)
            {
                if (!dependency.PredecessorPlanItemId.HasValue
                    || !rolledBySourceId.TryGetValue(dependency.PredecessorPlanItemId.Value, out var rolledPredecessor))
                {
                    continue;
                }

                rolledItem.ImportedPredecessors.Add(new PlanItemPredecessor
                {
                    PredecessorPlanItem = rolledPredecessor,
                    DependencyType = dependency.DependencyType,
                    LagMinutes = dependency.LagMinutes
                });
            }
        }

        context.AnnualPlans.Add(plan);
        await context.SaveChangesAsync(cancellationToken);

        var summary = await Summary(plan.Id, cancellationToken);
        return CreatedAtAction(
            nameof(GetPlanItems),
            new { id = plan.Id },
            new AnnualPlanRolloverResultDto(summary, plan.PlanItems.Count, analysis.RetainedDependencyCount));
    }

    [HttpPost("plans/rollover/preview")]
    public async Task<ActionResult<AnnualPlanRolloverPreviewDto>> PreviewRollover(
        AnnualPlanRolloverRequestDto dto,
        CancellationToken cancellationToken)
    {
        var analysisResult = await AnalyzeRollover(dto, cancellationToken);
        if (analysisResult.Error is not null)
        {
            return analysisResult.Error;
        }

        var analysis = analysisResult.Analysis!;
        return new AnnualPlanRolloverPreviewDto(
            analysis.SourcePlan.Id,
            analysis.SourcePlan.Year,
            dto.Year,
            analysis.TargetTitle,
            analysis.SourceItems.Count,
            analysis.RolledSources.Count,
            analysis.RolledWorkItemCount,
            analysis.RolledStructureItemCount,
            analysis.CompletedWorkItemCount,
            analysis.RetainedDependencyCount,
            analysis.DroppedDependencyCount,
            analysis.Sections);
    }

    [HttpGet("plans/archive-comparison")]
    public async Task<ActionResult<AnnualPlanArchiveComparisonDto>> CompareArchivedPlans(
        [FromQuery] int leftPlanId,
        [FromQuery] int rightPlanId,
        CancellationToken cancellationToken)
    {
        if (leftPlanId == rightPlanId)
        {
            return BadRequest("Choose two different archived years to compare.");
        }

        var plans = await context.AnnualPlans
            .AsNoTracking()
            .Where(plan => plan.Id == leftPlanId || plan.Id == rightPlanId)
            .ToListAsync(cancellationToken);
        var leftPlan = plans.SingleOrDefault(plan => plan.Id == leftPlanId);
        var rightPlan = plans.SingleOrDefault(plan => plan.Id == rightPlanId);
        if (leftPlan is null || rightPlan is null)
        {
            return NotFound();
        }

        if (leftPlan.Status != AnnualPlanStatus.Archived || rightPlan.Status != AnnualPlanStatus.Archived)
        {
            return BadRequest("Archive comparison reports require two archived annual plans.");
        }

        var leftItems = await ComparisonPlanItems(leftPlanId, cancellationToken);
        var rightItems = await ComparisonPlanItems(rightPlanId, cancellationToken);
        var leftSummary = await Summary(leftPlanId, cancellationToken);
        var rightSummary = await Summary(rightPlanId, cancellationToken);

        return new AnnualPlanArchiveComparisonDto(
            leftSummary,
            rightSummary,
            ComparisonMetrics(leftItems, rightItems),
            ComparisonSections(leftItems, rightItems));
    }

    [HttpGet("plans/{id:int}/items")]
    public async Task<ActionResult<IEnumerable<PlanItemDto>>> GetPlanItems(int id, CancellationToken cancellationToken)
    {
        var exists = await context.AnnualPlans.AnyAsync(plan => plan.Id == id, cancellationToken);
        if (!exists)
        {
            return NotFound();
        }

        var items = await context.PlanItems
            .AsNoTracking()
            .Where(item => item.AnnualPlanId == id)
            .OrderBy(item => item.SortOrder)
            .Select(item => new PlanItemDto(
                item.Id,
                item.ParentPlanItemId,
                item.SortOrder,
                item.OutlineLevel,
                item.ItemType,
                item.Title,
                item.TopLevelSection,
                item.Notes,
                item.PercentComplete,
                item.IsSummary,
                item.IsMilestone,
                item.Status,
                item.PlanningWindowType,
                item.TargetStartDate,
                item.TargetEndDate,
                item.ScheduleSurfaceMode,
                item.RolloverPolicy,
                item.SourceManualSchedule,
                item.ImportedStart,
                item.ImportedFinish,
                item.ImportedDuration,
                item.ImportedPredecessors.Count,
                item.ImportedPredecessors.Count(dependency =>
                    dependency.PredecessorPlanItem != null
                    && dependency.PredecessorPlanItem.PercentComplete < 100)))
            .ToListAsync(cancellationToken);

        return items;
    }

    [HttpGet("plans/{id:int}/schedule-preview")]
    public async Task<ActionResult<IEnumerable<GoalSchedulePreviewItemDto>>> GetSchedulePreview(
        int id,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken cancellationToken)
    {
        if (from == default || to == default || from.Date > to.Date)
        {
            return BadRequest("Choose a valid schedule preview date range.");
        }

        var exists = await context.AnnualPlans.AnyAsync(plan => plan.Id == id, cancellationToken);
        if (!exists)
        {
            return NotFound();
        }

        var scopeStart = from.Date;
        var scopeEnd = to.Date;
        var items = await context.PlanItems
            .AsNoTracking()
            .Where(item => item.AnnualPlanId == id
                && item.OutlineLevel > 0
                && !item.IsSummary
                && item.PercentComplete < 100
                && item.ScheduleSurfaceMode != PlanItemScheduleSurfaceModes.Never)
            .OrderBy(item => item.SortOrder)
            .ToListAsync(cancellationToken);

        return items
            .Where(item => SurfacesOnSchedule(item, scopeStart, scopeEnd))
            .Select(item => new GoalSchedulePreviewItemDto(
                item.Id,
                item.Title,
                item.TopLevelSection,
                item.ItemType,
                item.PercentComplete,
                item.PlanningWindowType,
                item.TargetStartDate,
                item.TargetEndDate,
                item.ScheduleSurfaceMode,
                ScheduleSurfaceReason(item)))
            .ToList();
    }

    [HttpGet("plans/{id:int}/export/project-xml")]
    public async Task<IActionResult> ExportProjectXml(int id, CancellationToken cancellationToken)
    {
        var plan = await context.AnnualPlans
            .AsNoTracking()
            .Include(item => item.PlanItems)
                .ThenInclude(item => item.ImportedPredecessors)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (plan is null)
        {
            return NotFound();
        }

        var document = ProjectXml(plan);
        var fileName = $"goals-and-plans-{plan.Year}.xml";
        return File(
            Encoding.UTF8.GetBytes(document.ToString(SaveOptions.None)),
            "application/xml",
            fileName);
    }

    [HttpGet("plans/{id:int}/export/project-xml/validate")]
    public async Task<ActionResult<ProjectXmlRoundTripValidationDto>> ValidateProjectXmlRoundTrip(
        int id,
        CancellationToken cancellationToken)
    {
        var plan = await context.AnnualPlans
            .AsNoTracking()
            .Include(item => item.PlanItems)
                .ThenInclude(item => item.ImportedPredecessors)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (plan is null)
        {
            return NotFound();
        }

        var document = ProjectXml(plan);
        var planCounts = PlanProjectXmlCounts(plan);
        var exportedCounts = ExportedProjectXmlCounts(document);
        var mismatches = ProjectXmlCountMismatches(planCounts, exportedCounts);

        return new ProjectXmlRoundTripValidationDto(
            mismatches.Count == 0,
            planCounts,
            exportedCounts,
            mismatches);
    }

    [HttpPut("items/{id:int}")]
    public async Task<ActionResult<PlanItemDto>> UpdatePlanItem(
        int id,
        PlanItemUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var titleValidation = ValidateTitle(dto.Title);
        if (titleValidation is not null)
        {
            return BadRequest(titleValidation);
        }

        var validation = ValidateEditableFields(
            dto.ItemType,
            dto.PercentComplete,
            dto.PlanningWindowType,
            dto.TargetStartDate,
            dto.TargetEndDate,
            dto.ScheduleSurfaceMode,
            dto.RolloverPolicy);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.PlanItems
            .Include(planItem => planItem.ImportedPredecessors)
                .ThenInclude(dependency => dependency.PredecessorPlanItem)
            .SingleOrDefaultAsync(planItem => planItem.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        if (await IsArchivedPlan(item.AnnualPlanId, cancellationToken))
        {
            return ArchivedPlanConflict();
        }

        var previousTitle = item.Title;
        item.Title = dto.Title.Trim();
        item.ItemType = dto.ItemType;
        item.PercentComplete = dto.PercentComplete;
        item.Notes = TrimToNull(dto.Notes);
        item.PlanningWindowType = dto.PlanningWindowType;
        item.TargetStartDate = dto.TargetStartDate;
        item.TargetEndDate = dto.TargetEndDate;
        item.ScheduleSurfaceMode = dto.ScheduleSurfaceMode;
        item.RolloverPolicy = dto.RolloverPolicy;
        item.Status = StatusFor(dto.PercentComplete);
        item.IsSummary = dto.ItemType is PlanItemTypes.Section or PlanItemTypes.Project;
        item.IsMilestone = dto.ItemType == PlanItemTypes.Milestone;

        if (item.OutlineLevel == 1 && previousTitle != item.Title)
        {
            item.TopLevelSection = item.Title;
            var sectionItems = await context.PlanItems
                .Where(planItem => planItem.AnnualPlanId == item.AnnualPlanId && planItem.TopLevelSection == previousTitle)
                .ToListAsync(cancellationToken);
            foreach (var sectionItem in sectionItems)
            {
                sectionItem.TopLevelSection = item.Title;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        return ToDto(item);
    }

    [HttpDelete("items/{id:int}")]
    public async Task<ActionResult<PlanItemDeleteResultDto>> DeletePlanItem(int id, CancellationToken cancellationToken)
    {
        var planItems = await context.PlanItems
            .Where(item => item.Id == id || item.AnnualPlanId == context.PlanItems
                .Where(planItem => planItem.Id == id)
                .Select(planItem => planItem.AnnualPlanId)
                .FirstOrDefault())
            .OrderBy(item => item.SortOrder)
            .ToListAsync(cancellationToken);
        var item = planItems.SingleOrDefault(planItem => planItem.Id == id);
        if (item is null)
        {
            return NotFound();
        }

        if (await IsArchivedPlan(item.AnnualPlanId, cancellationToken))
        {
            return ArchivedPlanConflict();
        }

        if (item.OutlineLevel == 0)
        {
            return BadRequest("The annual plan root cannot be deleted.");
        }

        var deleting = planItems
            .Where(candidate => IsDescendantOrSelf(candidate, item, planItems))
            .OrderByDescending(candidate => candidate.OutlineLevel)
            .ThenByDescending(candidate => candidate.SortOrder)
            .ToList();
        var deletedIds = deleting.Select(candidate => candidate.Id).ToHashSet();
        var removedSortOrders = deleting.Select(candidate => candidate.SortOrder).OrderBy(sortOrder => sortOrder).ToList();

        var deletingDependencies = await context.PlanItemPredecessors
            .Where(dependency =>
                deletedIds.Contains(dependency.PlanItemId)
                || dependency.PredecessorPlanItemId.HasValue && deletedIds.Contains(dependency.PredecessorPlanItemId.Value))
            .ToListAsync(cancellationToken);
        context.PlanItemPredecessors.RemoveRange(deletingDependencies);
        context.PlanItems.RemoveRange(deleting);
        foreach (var remaining in planItems.Where(candidate => !deletedIds.Contains(candidate.Id)))
        {
            remaining.SortOrder -= removedSortOrders.Count(sortOrder => sortOrder < remaining.SortOrder);
        }

        await context.SaveChangesAsync(cancellationToken);
        return new PlanItemDeleteResultDto(deleting.Count);
    }

    [HttpPut("items/{id:int}/move")]
    public async Task<ActionResult<PlanItemMoveResultDto>> MovePlanItem(
        int id,
        PlanItemMoveDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.Placement is not ("LastChild" or "Before" or "After"))
        {
            return BadRequest("Placement must be LastChild, Before, or After.");
        }

        var planId = await context.PlanItems
            .Where(item => item.Id == id)
            .Select(item => (int?)item.AnnualPlanId)
            .SingleOrDefaultAsync(cancellationToken);
        if (!planId.HasValue)
        {
            return NotFound();
        }

        if (await IsArchivedPlan(planId.Value, cancellationToken))
        {
            return ArchivedPlanConflict();
        }

        var planItems = await context.PlanItems
            .Where(item => item.AnnualPlanId == planId.Value)
            .OrderBy(item => item.SortOrder)
            .ToListAsync(cancellationToken);
        var item = planItems.Single(planItem => planItem.Id == id);
        if (item.OutlineLevel == 0)
        {
            return BadRequest("The annual plan root cannot be moved.");
        }

        var parent = planItems.SingleOrDefault(planItem => planItem.Id == dto.ParentPlanItemId);
        if (parent is null)
        {
            return BadRequest("Choose a parent item from the selected annual plan.");
        }

        var moving = planItems
            .Where(candidate => IsDescendantOrSelf(candidate, item, planItems))
            .OrderBy(candidate => candidate.SortOrder)
            .ToList();
        var movingIds = moving.Select(candidate => candidate.Id).ToHashSet();
        if (movingIds.Contains(parent.Id))
        {
            return BadRequest("A plan item cannot be moved under itself or one of its descendants.");
        }

        PlanItem? reference = null;
        if (dto.Placement is "Before" or "After")
        {
            if (!dto.ReferencePlanItemId.HasValue)
            {
                return BadRequest("Choose a sibling item for Before or After placement.");
            }

            reference = planItems.SingleOrDefault(planItem => planItem.Id == dto.ReferencePlanItemId.Value);
            if (reference is null || reference.ParentPlanItemId != parent.Id || movingIds.Contains(reference.Id))
            {
                return BadRequest("The reference item must be a sibling outside the moved subtree.");
            }
        }

        var remaining = planItems
            .Where(candidate => !movingIds.Contains(candidate.Id))
            .OrderBy(candidate => candidate.SortOrder)
            .ToList();
        var insertionIndex = dto.Placement switch
        {
            "Before" => remaining.FindIndex(candidate => candidate.Id == reference!.Id),
            "After" => remaining.FindLastIndex(candidate => IsDescendantOrSelf(candidate, reference!, remaining)) + 1,
            _ => remaining.FindLastIndex(candidate => IsDescendantOrSelf(candidate, parent, remaining)) + 1
        };
        if (insertionIndex < 0)
        {
            return BadRequest("The move destination could not be found.");
        }

        item.ParentPlanItemId = parent.Id;
        var outlineDelta = parent.OutlineLevel + 1 - item.OutlineLevel;
        var topLevelSection = NewTopLevelSection(item, parent);
        foreach (var movingItem in moving)
        {
            movingItem.OutlineLevel += outlineDelta;
            movingItem.TopLevelSection = topLevelSection;
        }

        remaining.InsertRange(insertionIndex, moving);
        for (var sortOrder = 0; sortOrder < remaining.Count; sortOrder++)
        {
            remaining[sortOrder].SortOrder = sortOrder;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new PlanItemMoveResultDto(moving.Count);
    }

    [HttpPost("plans/{id:int}/items/bulk")]
    public async Task<ActionResult<IEnumerable<PlanItemDto>>> BulkCreatePlanItems(
        int id,
        PlanItemBulkCreateRequestDto request,
        CancellationToken cancellationToken)
    {
        if (await IsArchivedPlan(id, cancellationToken))
        {
            return ArchivedPlanConflict();
        }

        if (request.Items.Count == 0)
        {
            return BadRequest("Stage at least one plan item before adding it.");
        }

        if (request.Items.Count > 2000)
        {
            return BadRequest("Add no more than 2,000 plan items at once.");
        }

        var parent = await context.PlanItems
            .SingleOrDefaultAsync(item => item.AnnualPlanId == id && item.Id == request.ParentPlanItemId, cancellationToken);
        if (parent is null)
        {
            return BadRequest("Choose a parent item from the selected annual plan.");
        }

        foreach (var item in request.Items)
        {
            var titleValidation = ValidateTitle(item.Title);
            if (titleValidation is not null)
            {
                return BadRequest(titleValidation);
            }

            var validation = ValidateEditableFields(
                item.ItemType,
                item.PercentComplete,
                item.PlanningWindowType,
                item.TargetStartDate,
                item.TargetEndDate,
                item.ScheduleSurfaceMode,
                item.RolloverPolicy);
            if (validation is not null)
            {
                return BadRequest(validation);
            }

            var outlineLevel = EffectiveImportedOutlineLevel(item);
            if (outlineLevel is < 1 or > 50)
            {
                return BadRequest("Imported outline levels must be between 1 and 50.");
            }
        }

        var planItems = await context.PlanItems
            .Where(item => item.AnnualPlanId == id)
            .OrderBy(item => item.SortOrder)
            .ToListAsync(cancellationToken);
        var insertionIndex = planItems.FindLastIndex(item => IsDescendantOrSelf(item, parent, planItems)) + 1;

        foreach (var existing in planItems.Where(item => item.SortOrder >= insertionIndex))
        {
            existing.SortOrder += request.Items.Count;
        }

        var created = new List<PlanItem>();
        var hierarchyParents = new Dictionary<int, PlanItem>();
        var usesImportedHierarchy = request.Items.Any(item => EffectiveImportedOutlineLevel(item).HasValue);

        foreach (var (dto, offset) in request.Items.Select((dto, offset) => (dto, offset)))
        {
            var importedLevel = usesImportedHierarchy ? EffectiveImportedOutlineLevel(dto) ?? 1 : 1;
            if (importedLevel > 1 && !hierarchyParents.ContainsKey(importedLevel - 1))
            {
                return BadRequest("Imported outline hierarchy cannot skip levels.");
            }

            var itemParent = importedLevel == 1 ? parent : hierarchyParents[importedLevel - 1];
            var item = new PlanItem
            {
                AnnualPlanId = id,
                SortOrder = insertionIndex + offset,
                OutlineLevel = itemParent.OutlineLevel + 1,
                ItemType = dto.ItemType,
                Title = dto.Title.Trim(),
                TopLevelSection = TopLevelSectionFor(itemParent, dto),
                Notes = TrimToNull(dto.Notes),
                PercentComplete = dto.PercentComplete,
                IsSummary = dto.ItemType is PlanItemTypes.Section or PlanItemTypes.Project,
                IsMilestone = dto.ItemType == PlanItemTypes.Milestone,
                Status = StatusFor(dto.PercentComplete),
                PlanningWindowType = dto.PlanningWindowType,
                TargetStartDate = dto.TargetStartDate,
                TargetEndDate = dto.TargetEndDate,
                ScheduleSurfaceMode = dto.ScheduleSurfaceMode,
                RolloverPolicy = dto.RolloverPolicy
            };

            if (itemParent.Id > 0)
            {
                item.ParentPlanItemId = itemParent.Id;
            }
            else
            {
                item.ParentPlanItem = itemParent;
            }

            created.Add(item);
            hierarchyParents[importedLevel] = item;
            foreach (var staleLevel in hierarchyParents.Keys.Where(level => level > importedLevel).ToList())
            {
                hierarchyParents.Remove(staleLevel);
            }
        }

        context.PlanItems.AddRange(created);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetPlanItems),
            new { id },
            created.Select(ToDto).ToList());
    }

    [HttpGet("items/{id:int}/dependencies")]
    public async Task<ActionResult<PlanItemDependenciesDto>> GetPlanItemDependencies(
        int id,
        CancellationToken cancellationToken)
    {
        var item = await context.PlanItems
            .AsNoTracking()
            .SingleOrDefaultAsync(planItem => planItem.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        var predecessorEntities = await context.PlanItemPredecessors
            .AsNoTracking()
            .Include(dependency => dependency.PredecessorPlanItem)
            .Where(dependency => dependency.PlanItemId == id)
            .OrderBy(dependency => dependency.PredecessorPlanItem!.SortOrder)
            .ThenBy(dependency => dependency.PredecessorSourceTaskUid)
            .ToListAsync(cancellationToken);
        var successorEntities = await context.PlanItemPredecessors
            .AsNoTracking()
            .Include(dependency => dependency.PlanItem)
            .Where(dependency => dependency.PredecessorPlanItemId == id)
            .OrderBy(dependency => dependency.PlanItem.SortOrder)
            .ToListAsync(cancellationToken);

        return new PlanItemDependenciesDto(
            id,
            predecessorEntities.Select(ToPredecessorDto).ToList(),
            successorEntities.Select(ToSuccessorDto).ToList());
    }

    [HttpPost("items/{id:int}/dependencies")]
    public async Task<ActionResult<PlanItemDependencyDto>> AddPlanItemDependency(
        int id,
        PlanItemDependencyCreateDto dto,
        CancellationToken cancellationToken)
    {
        var dependencyValidation = ValidateDependencyFields(dto.DependencyType, dto.LagMinutes);
        if (dependencyValidation is not null)
        {
            return BadRequest(dependencyValidation);
        }

        var item = await context.PlanItems
            .SingleOrDefaultAsync(planItem => planItem.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        var predecessor = await context.PlanItems
            .SingleOrDefaultAsync(planItem =>
                planItem.Id == dto.PredecessorPlanItemId
                && planItem.AnnualPlanId == item.AnnualPlanId,
                cancellationToken);
        if (predecessor is null)
        {
            return BadRequest("Choose a predecessor from the selected annual plan.");
        }

        if (predecessor.Id == item.Id)
        {
            return BadRequest("A plan item cannot depend on itself.");
        }

        if (await context.PlanItemPredecessors.AnyAsync(
            dependency => dependency.PlanItemId == item.Id && dependency.PredecessorPlanItemId == predecessor.Id,
            cancellationToken))
        {
            return Conflict("That predecessor dependency already exists.");
        }

        var dependencyPairs = await context.PlanItemPredecessors
            .Where(dependency =>
                dependency.PredecessorPlanItemId.HasValue
                && dependency.PlanItem.AnnualPlanId == item.AnnualPlanId)
            .Select(dependency => new { dependency.PlanItemId, PredecessorPlanItemId = dependency.PredecessorPlanItemId!.Value })
            .ToListAsync(cancellationToken);
        if (CreatesDependencyCycle(item.Id, predecessor.Id, dependencyPairs.Select(pair => (pair.PlanItemId, pair.PredecessorPlanItemId))))
        {
            return BadRequest("That dependency would create a cycle.");
        }

        var dependency = new PlanItemPredecessor
        {
            PlanItemId = item.Id,
            PredecessorPlanItemId = predecessor.Id,
            DependencyType = dto.DependencyType,
            LagMinutes = dto.LagMinutes
        };
        context.PlanItemPredecessors.Add(dependency);
        await context.SaveChangesAsync(cancellationToken);

        dependency.PredecessorPlanItem = predecessor;
        return CreatedAtAction(
            nameof(GetPlanItemDependencies),
            new { id },
            ToPredecessorDto(dependency));
    }

    [HttpPut("items/{id:int}/dependencies/{dependencyId:int}")]
    public async Task<ActionResult<PlanItemDependencyDto>> UpdatePlanItemDependency(
        int id,
        int dependencyId,
        PlanItemDependencyUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var validation = ValidateDependencyFields(dto.DependencyType, dto.LagMinutes);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var dependency = await context.PlanItemPredecessors
            .Include(candidate => candidate.PredecessorPlanItem)
            .Include(candidate => candidate.PlanItem)
            .SingleOrDefaultAsync(candidate => candidate.Id == dependencyId && candidate.PlanItemId == id, cancellationToken);
        if (dependency is null)
        {
            return NotFound();
        }

        if (await IsArchivedPlan(dependency.PlanItem.AnnualPlanId, cancellationToken))
        {
            return ArchivedPlanConflict();
        }

        dependency.DependencyType = dto.DependencyType;
        dependency.LagMinutes = dto.LagMinutes;
        await context.SaveChangesAsync(cancellationToken);
        return ToPredecessorDto(dependency);
    }

    [HttpDelete("items/{id:int}/dependencies/{dependencyId:int}")]
    public async Task<IActionResult> DeletePlanItemDependency(
        int id,
        int dependencyId,
        CancellationToken cancellationToken)
    {
        var dependency = await context.PlanItemPredecessors
            .Include(candidate => candidate.PlanItem)
            .SingleOrDefaultAsync(candidate => candidate.Id == dependencyId && candidate.PlanItemId == id, cancellationToken);
        if (dependency is null)
        {
            return NotFound();
        }

        if (await IsArchivedPlan(dependency.PlanItem.AnnualPlanId, cancellationToken))
        {
            return ArchivedPlanConflict();
        }

        context.PlanItemPredecessors.Remove(dependency);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("plans/import/project-xml")]
    public async Task<ActionResult<ProjectXmlImportResultDto>> ImportProjectXml(
        [FromForm] ProjectXmlImportRequest request,
        CancellationToken cancellationToken)
    {
        if (request.File.Length == 0)
        {
            return BadRequest("Choose a Microsoft Project XML file to import.");
        }

        XDocument document;
        await using (var stream = request.File.OpenReadStream())
        {
            document = await XDocument.LoadAsync(stream, LoadOptions.None, cancellationToken);
        }

        var ns = document.Root?.Name.Namespace;
        if (document.Root is null || document.Root.Name.LocalName != "Project" || ns is null)
        {
            return BadRequest("The uploaded file is not a Microsoft Project XML document.");
        }

        var taskElements = document.Root.Element(ns + "Tasks")?.Elements(ns + "Task").ToList() ?? [];
        if (taskElements.Count == 0)
        {
            return BadRequest("The Project XML file does not contain tasks.");
        }

        var sourceStart = ReadDate(document.Root.Element(ns + "StartDate")?.Value);
        var year = request.Year ?? sourceStart?.Year;
        if (!year.HasValue || year.Value < 1900 || year.Value > 3000)
        {
            return BadRequest("Provide the annual plan year for this Project import.");
        }

        var existingPlan = await context.AnnualPlans
            .Include(plan => plan.PlanItems)
            .FirstOrDefaultAsync(plan => plan.Year == year.Value, cancellationToken);

        if (existingPlan is not null)
        {
            if (existingPlan.Status == AnnualPlanStatus.Archived)
            {
                return Conflict("Archived annual plans cannot be replaced. Mark this year as draft or active first.");
            }

            if (!request.ReplaceExisting)
            {
                return Conflict($"An annual plan already exists for {year.Value}. Choose replace to import this year again.");
            }

            context.AnnualPlans.Remove(existingPlan);
            await context.SaveChangesAsync(cancellationToken);
        }

        var plan = new AnnualPlan
        {
            Year = year.Value,
            Title = ReadText(document.Root.Element(ns + "Title")) ?? $"Goals and Plans {year.Value}",
            Status = AnnualPlanStatus.Active,
            SourceSystem = "MicrosoftProjectXml",
            SourceFileName = request.File.FileName,
            SourceCreatedAt = ReadDate(document.Root.Element(ns + "CreationDate")?.Value),
            SourceLastSavedAt = ReadDate(document.Root.Element(ns + "LastSaved")?.Value),
            ImportedAtUtc = DateTime.UtcNow
        };

        await DemoteOtherActivePlans(null, cancellationToken);

        var orderedItems = new List<PlanItem>();
        var taskUidItems = new Dictionary<int, PlanItem>();
        var taskPredecessors = new List<(PlanItem Item, IReadOnlyCollection<XElement> Links)>();
        var skippedPredecessors = 0;
        var levelStack = new Dictionary<int, PlanItem>();
        var topLevelSections = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var taskElement in taskElements)
        {
            var outlineLevel = ReadInt(taskElement.Element(ns + "OutlineLevel"));
            var title = ReadText(taskElement.Element(ns + "Name"));
            if (string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            var sourceTaskUid = ReadNullableInt(taskElement.Element(ns + "UID"));
            var isSummary = ReadBool(taskElement.Element(ns + "Summary"));
            var isMilestone = ReadBool(taskElement.Element(ns + "Milestone"));
            var parent = outlineLevel > 0 && levelStack.TryGetValue(outlineLevel - 1, out var parentItem)
                ? parentItem
                : null;
            var topLevelSection = outlineLevel switch
            {
                0 => null,
                1 => title,
                _ => parent?.TopLevelSection
            };

            if (outlineLevel == 1)
            {
                topLevelSections.Add(title);
            }

            var percentComplete = Math.Clamp(ReadInt(taskElement.Element(ns + "PercentComplete")), 0, 100);
            var item = new PlanItem
            {
                AnnualPlan = plan,
                ParentPlanItem = parent,
                SortOrder = orderedItems.Count,
                OutlineLevel = outlineLevel,
                ItemType = ItemType(outlineLevel, topLevelSection, isSummary, isMilestone),
                Title = title,
                TopLevelSection = topLevelSection,
                Notes = TrimToNull(taskElement.Element(ns + "Notes")?.Value),
                PercentComplete = percentComplete,
                IsSummary = isSummary,
                IsMilestone = isMilestone,
                Status = StatusFor(percentComplete),
                SourceTaskUid = sourceTaskUid,
                SourceTaskId = ReadNullableInt(taskElement.Element(ns + "ID")),
                SourceManualSchedule = ReadBool(taskElement.Element(ns + "Manual")),
                ImportedStart = ReadDate(taskElement.Element(ns + "Start")?.Value),
                ImportedFinish = ReadDate(taskElement.Element(ns + "Finish")?.Value),
                ImportedDuration = TrimToNull(taskElement.Element(ns + "Duration")?.Value)
            };

            plan.PlanItems.Add(item);
            orderedItems.Add(item);
            levelStack[outlineLevel] = item;
            foreach (var deeperLevel in levelStack.Keys.Where(level => level > outlineLevel).ToList())
            {
                levelStack.Remove(deeperLevel);
            }

            if (sourceTaskUid.HasValue)
            {
                taskUidItems[sourceTaskUid.Value] = item;
            }

            var links = taskElement.Elements(ns + "PredecessorLink").ToList();
            if (links.Count > 0)
            {
                taskPredecessors.Add((item, links));
            }
        }

        foreach (var (item, links) in taskPredecessors)
        {
            foreach (var link in links)
            {
                var predecessorUid = ReadNullableInt(link.Element(ns + "PredecessorUID"));
                if (!predecessorUid.HasValue || !taskUidItems.ContainsKey(predecessorUid.Value))
                {
                    skippedPredecessors++;
                    continue;
                }

                item.ImportedPredecessors.Add(new PlanItemPredecessor
                {
                    PredecessorPlanItem = taskUidItems[predecessorUid.Value],
                    PredecessorSourceTaskUid = predecessorUid.Value,
                    DependencyType = ProjectDependencyType(link.Element(ns + "Type")?.Value),
                    LagMinutes = ProjectLagMinutes(link.Element(ns + "LinkLag")?.Value),
                    ImportedLinkType = TrimToNull(link.Element(ns + "Type")?.Value),
                    ImportedLagFormat = ReadNullableInt(link.Element(ns + "LagFormat"))
                });
            }
        }

        context.AnnualPlans.Add(plan);
        await context.SaveChangesAsync(cancellationToken);

        var summary = await Summary(plan.Id, cancellationToken);
        return CreatedAtAction(
            nameof(GetPlanItems),
            new { id = plan.Id },
            new ProjectXmlImportResultDto(
                summary,
                orderedItems.Count,
                orderedItems.Count(item => item.Notes is not null),
                orderedItems.Count(item => item.SourceManualSchedule),
                orderedItems.Sum(item => item.ImportedPredecessors.Count),
                skippedPredecessors,
                topLevelSections.OrderBy(section => section).ToList()));
    }

    private async Task<List<PlanItem>> ComparisonPlanItems(int planId, CancellationToken cancellationToken)
    {
        return await context.PlanItems
            .AsNoTracking()
            .Include(item => item.ImportedPredecessors)
                .ThenInclude(dependency => dependency.PredecessorPlanItem)
            .Where(item => item.AnnualPlanId == planId)
            .OrderBy(item => item.SortOrder)
            .ToListAsync(cancellationToken);
    }

    private static IReadOnlyCollection<AnnualPlanArchiveComparisonMetricDto> ComparisonMetrics(
        IReadOnlyCollection<PlanItem> leftItems,
        IReadOnlyCollection<PlanItem> rightItems)
    {
        var leftLeafWork = leftItems.Where(IsLeafWork).ToList();
        var rightLeafWork = rightItems.Where(IsLeafWork).ToList();
        var rows = new List<(string Metric, int Left, int Right)>
        {
            ("Outline items", leftItems.Count, rightItems.Count),
            ("Leaf work", leftLeafWork.Count, rightLeafWork.Count),
            ("Complete leaf work", leftLeafWork.Count(item => item.PercentComplete >= 100), rightLeafWork.Count(item => item.PercentComplete >= 100)),
            ("Open leaf work", leftLeafWork.Count(item => item.PercentComplete < 100), rightLeafWork.Count(item => item.PercentComplete < 100)),
            ("Completion percent", CompletionPercent(leftLeafWork), CompletionPercent(rightLeafWork)),
            ("Average percent complete", AveragePercent(leftLeafWork), AveragePercent(rightLeafWork)),
            ("Not started", leftLeafWork.Count(item => item.PercentComplete <= 0), rightLeafWork.Count(item => item.PercentComplete <= 0)),
            ("In progress", leftLeafWork.Count(item => item.PercentComplete > 0 && item.PercentComplete < 100), rightLeafWork.Count(item => item.PercentComplete > 0 && item.PercentComplete < 100)),
            ("Scheduled", leftLeafWork.Count(item => item.ScheduleSurfaceMode != PlanItemScheduleSurfaceModes.Never), rightLeafWork.Count(item => item.ScheduleSurfaceMode != PlanItemScheduleSurfaceModes.Never)),
            ("Unscheduled", leftLeafWork.Count(item => item.ScheduleSurfaceMode == PlanItemScheduleSurfaceModes.Never && item.PercentComplete < 100), rightLeafWork.Count(item => item.ScheduleSurfaceMode == PlanItemScheduleSurfaceModes.Never && item.PercentComplete < 100)),
            ("Milestones", leftLeafWork.Count(item => item.IsMilestone), rightLeafWork.Count(item => item.IsMilestone)),
            ("Notes", leftLeafWork.Count(item => !string.IsNullOrWhiteSpace(item.Notes)), rightLeafWork.Count(item => !string.IsNullOrWhiteSpace(item.Notes))),
            ("Dependencies", leftLeafWork.Sum(item => item.ImportedPredecessors.Count), rightLeafWork.Sum(item => item.ImportedPredecessors.Count)),
            ("Blocked open work", leftLeafWork.Count(IsBlockedOpenWork), rightLeafWork.Count(IsBlockedOpenWork))
        };

        return rows
            .Select(row => new AnnualPlanArchiveComparisonMetricDto(row.Metric, row.Left, row.Right, row.Right - row.Left))
            .ToList();
    }

    private static IReadOnlyCollection<AnnualPlanArchiveComparisonSectionDto> ComparisonSections(
        IReadOnlyCollection<PlanItem> leftItems,
        IReadOnlyCollection<PlanItem> rightItems)
    {
        var leftGroups = leftItems.Where(IsLeafWork).GroupBy(SectionName).ToDictionary(group => group.Key, group => group.ToList());
        var rightGroups = rightItems.Where(IsLeafWork).GroupBy(SectionName).ToDictionary(group => group.Key, group => group.ToList());

        return leftGroups.Keys
            .Union(rightGroups.Keys)
            .OrderBy(section => section)
            .Select(section =>
            {
                var left = leftGroups.GetValueOrDefault(section) ?? [];
                var right = rightGroups.GetValueOrDefault(section) ?? [];
                var leftComplete = left.Count(item => item.PercentComplete >= 100);
                var rightComplete = right.Count(item => item.PercentComplete >= 100);
                var leftOpen = left.Count - leftComplete;
                var rightOpen = right.Count - rightComplete;
                var leftCompletion = CompletionPercent(left);
                var rightCompletion = CompletionPercent(right);
                return new AnnualPlanArchiveComparisonSectionDto(
                    section,
                    left.Count,
                    right.Count,
                    right.Count - left.Count,
                    leftComplete,
                    rightComplete,
                    rightComplete - leftComplete,
                    leftOpen,
                    rightOpen,
                    rightOpen - leftOpen,
                    leftCompletion,
                    rightCompletion,
                    rightCompletion - leftCompletion);
            })
            .ToList();
    }

    private static bool IsLeafWork(PlanItem item)
    {
        return item.OutlineLevel > 0 && !item.IsSummary;
    }

    private static bool IsBlockedOpenWork(PlanItem item)
    {
        return item.PercentComplete < 100
            && item.ImportedPredecessors.Any(dependency => dependency.PredecessorPlanItem is not null
                && dependency.PredecessorPlanItem.PercentComplete < 100);
    }

    private static string SectionName(PlanItem item)
    {
        return string.IsNullOrWhiteSpace(item.TopLevelSection) ? "Plan root" : item.TopLevelSection;
    }

    private static int CompletionPercent(IReadOnlyCollection<PlanItem> items)
    {
        return items.Count == 0 ? 0 : (int)Math.Round(items.Count(item => item.PercentComplete >= 100) * 100m / items.Count);
    }

    private static int AveragePercent(IReadOnlyCollection<PlanItem> items)
    {
        return items.Count == 0 ? 0 : (int)Math.Round(items.Average(item => item.PercentComplete));
    }

    private async Task<AnnualPlanSummaryDto> Summary(int planId, CancellationToken cancellationToken)
    {
        return await context.AnnualPlans
            .AsNoTracking()
            .Where(plan => plan.Id == planId)
            .Select(plan => new AnnualPlanSummaryDto(
                plan.Id,
                plan.Year,
                plan.Title,
                plan.Status,
                plan.SourceSystem,
                plan.SourceFileName,
                plan.ImportedAtUtc,
                plan.PlanItems.Count,
                plan.PlanItems.Count(item => item.IsSummary),
                plan.PlanItems.Count(item => item.PercentComplete >= 100),
                plan.PlanItems.Count(item => item.Notes != null && item.Notes != string.Empty)))
            .SingleAsync(cancellationToken);
    }

    private async Task DemoteOtherActivePlans(int? activePlanId, CancellationToken cancellationToken)
    {
        var activePlans = await context.AnnualPlans
            .Where(plan => plan.Status == AnnualPlanStatus.Active && (!activePlanId.HasValue || plan.Id != activePlanId.Value))
            .ToListAsync(cancellationToken);

        foreach (var activePlan in activePlans)
        {
            activePlan.Status = AnnualPlanStatus.Draft;
        }
    }

    private Task<bool> IsArchivedPlan(int planId, CancellationToken cancellationToken)
    {
        return context.AnnualPlans
            .AnyAsync(plan => plan.Id == planId && plan.Status == AnnualPlanStatus.Archived, cancellationToken);
    }

    private ConflictObjectResult ArchivedPlanConflict()
    {
        return Conflict("Archived annual plans are read-only. Mark this year as draft or active before changing it.");
    }

    private async Task<RolloverAnalysisResult> AnalyzeRollover(
        AnnualPlanRolloverRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.Year < 1900 || dto.Year > 3000)
        {
            return new RolloverAnalysisResult(null, BadRequest("Provide a year between 1900 and 3000 for the new annual plan."));
        }

        if (await context.AnnualPlans.AnyAsync(plan => plan.Year == dto.Year, cancellationToken))
        {
            return new RolloverAnalysisResult(null, Conflict($"An annual plan already exists for {dto.Year}."));
        }

        var sourcePlan = await context.AnnualPlans
            .AsNoTracking()
            .Include(plan => plan.PlanItems)
                .ThenInclude(item => item.ImportedPredecessors)
            .SingleOrDefaultAsync(plan => plan.Id == dto.SourcePlanId, cancellationToken);
        if (sourcePlan is null)
        {
            return new RolloverAnalysisResult(null, NotFound("Choose an annual plan to roll over."));
        }

        var sourceItems = sourcePlan.PlanItems
            .OrderBy(item => item.SortOrder)
            .ToList();
        if (sourceItems.Count == 0)
        {
            return new RolloverAnalysisResult(null, BadRequest("The source annual plan does not contain items to roll over."));
        }

        var sourceById = sourceItems.ToDictionary(item => item.Id);
        var rolledSourceIds = sourceItems
            .Where(item => item.OutlineLevel == 0 || IsRolloverWorkItem(item) || IsAlwaysRolloverStructure(item))
            .Select(item => item.Id)
            .ToHashSet();
        foreach (var sourceItem in sourceItems.Where(item => rolledSourceIds.Contains(item.Id)).ToList())
        {
            AddAncestorIds(sourceItem, sourceById, rolledSourceIds);
        }

        var rolledSources = sourceItems
            .Where(item => rolledSourceIds.Contains(item.Id))
            .ToList();
        var retainedDependencies = rolledSources
            .SelectMany(item => item.ImportedPredecessors)
            .Count(dependency => dependency.PredecessorPlanItemId.HasValue
                && rolledSourceIds.Contains(dependency.PredecessorPlanItemId.Value));
        var droppedDependencies = rolledSources
            .SelectMany(item => item.ImportedPredecessors)
            .Count(dependency => !dependency.PredecessorPlanItemId.HasValue
                || !rolledSourceIds.Contains(dependency.PredecessorPlanItemId.Value));
        var sections = rolledSources
            .Where(IsRolloverWorkItem)
            .GroupBy(item => item.TopLevelSection ?? "Plan root")
            .OrderBy(group => group.Key)
            .Select(group => new AnnualPlanRolloverSectionPreviewDto(group.Key, group.Count()))
            .ToList();

        return new RolloverAnalysisResult(
            new RolloverAnalysis(
                sourcePlan,
                sourceItems,
                rolledSources,
                TrimToNull(dto.Title) ?? $"Goals and Plans {dto.Year}",
                dto.Year - sourcePlan.Year,
                rolledSources.Count(IsRolloverWorkItem),
                rolledSources.Count(item => !IsRolloverWorkItem(item)),
                sourceItems.Count(item => IsLeafWorkItem(item) && item.PercentComplete >= 100 && !rolledSourceIds.Contains(item.Id)),
                retainedDependencies,
                droppedDependencies,
                sections),
            null);
    }

    private static bool IsLeafWorkItem(PlanItem item)
    {
        return item.OutlineLevel > 0 && !item.IsSummary;
    }

    private static bool SurfacesOnSchedule(PlanItem item, DateTime scopeStart, DateTime scopeEnd)
    {
        return item.ScheduleSurfaceMode switch
        {
            PlanItemScheduleSurfaceModes.ActiveGoalsOnly => true,
            PlanItemScheduleSurfaceModes.PinnedToSchedule => true,
            PlanItemScheduleSurfaceModes.DuringTargetWindow => WindowOverlaps(
                item.TargetStartDate,
                item.TargetEndDate,
                scopeStart,
                scopeEnd),
            PlanItemScheduleSurfaceModes.NearTargetEnd => item.TargetEndDate.HasValue
                && item.TargetEndDate.Value.Date >= scopeStart
                && item.TargetEndDate.Value.Date.AddDays(-7) <= scopeEnd,
            _ => false
        };
    }

    private static bool WindowOverlaps(DateTime? start, DateTime? end, DateTime scopeStart, DateTime scopeEnd)
    {
        return (start.HasValue || end.HasValue)
            && (!start.HasValue || start.Value.Date <= scopeEnd)
            && (!end.HasValue || end.Value.Date >= scopeStart);
    }

    private static string ScheduleSurfaceReason(PlanItem item)
    {
        return item.ScheduleSurfaceMode switch
        {
            PlanItemScheduleSurfaceModes.ActiveGoalsOnly => "Always visible while the goal item remains open.",
            PlanItemScheduleSurfaceModes.PinnedToSchedule => "Pinned to the schedule while the goal item remains open.",
            PlanItemScheduleSurfaceModes.DuringTargetWindow => "Target window overlaps the schedule range.",
            PlanItemScheduleSurfaceModes.NearTargetEnd => "Within one week of the target end.",
            _ => "Not scheduled."
        };
    }

    private static bool IsRolloverWorkItem(PlanItem item)
    {
        return IsLeafWorkItem(item)
            && item.RolloverPolicy != PlanItemRolloverPolicies.Never
            && (item.PercentComplete < 100
                || item.RolloverPolicy is PlanItemRolloverPolicies.Always or PlanItemRolloverPolicies.RepeatNextYear);
    }

    private static bool IsAlwaysRolloverStructure(PlanItem item)
    {
        return item.IsSummary && item.RolloverPolicy == PlanItemRolloverPolicies.Always;
    }

    private static int RolledPercentComplete(PlanItem item)
    {
        return item.RolloverPolicy == PlanItemRolloverPolicies.RepeatNextYear
            ? 0
            : item.PercentComplete;
    }

    private static void AddAncestorIds(PlanItem item, IReadOnlyDictionary<int, PlanItem> sourceById, ISet<int> rolledSourceIds)
    {
        var parentId = item.ParentPlanItemId;
        while (parentId.HasValue && sourceById.TryGetValue(parentId.Value, out var parent))
        {
            rolledSourceIds.Add(parent.Id);
            parentId = parent.ParentPlanItemId;
        }
    }

    private static DateTime? ShiftYear(DateTime? value, int yearDelta)
    {
        return value?.AddYears(yearDelta);
    }

    private sealed record RolloverAnalysisResult(
        RolloverAnalysis? Analysis,
        ActionResult? Error
    );

    private sealed record RolloverAnalysis(
        AnnualPlan SourcePlan,
        IReadOnlyList<PlanItem> SourceItems,
        IReadOnlyList<PlanItem> RolledSources,
        string TargetTitle,
        int YearDelta,
        int RolledWorkItemCount,
        int RolledStructureItemCount,
        int CompletedWorkItemCount,
        int RetainedDependencyCount,
        int DroppedDependencyCount,
        IReadOnlyCollection<AnnualPlanRolloverSectionPreviewDto> Sections
    );

    private static PlanItemDto ToDto(PlanItem item)
    {
        return new PlanItemDto(
            item.Id,
            item.ParentPlanItemId,
            item.SortOrder,
            item.OutlineLevel,
            item.ItemType,
            item.Title,
            item.TopLevelSection,
            item.Notes,
            item.PercentComplete,
            item.IsSummary,
            item.IsMilestone,
            item.Status,
            item.PlanningWindowType,
            item.TargetStartDate,
            item.TargetEndDate,
            item.ScheduleSurfaceMode,
            item.RolloverPolicy,
            item.SourceManualSchedule,
            item.ImportedStart,
            item.ImportedFinish,
            item.ImportedDuration,
            item.ImportedPredecessors.Count,
            item.ImportedPredecessors.Count(dependency =>
                dependency.PredecessorPlanItem is not null
                && dependency.PredecessorPlanItem.PercentComplete < 100));
    }

    private static PlanItemDependencyDto ToPredecessorDto(PlanItemPredecessor dependency)
    {
        return new PlanItemDependencyDto(
            dependency.Id,
            dependency.PlanItemId,
            dependency.PredecessorPlanItemId,
            dependency.PredecessorSourceTaskUid,
            dependency.DependencyType,
            dependency.LagMinutes,
            dependency.ImportedLinkType,
            dependency.ImportedLagFormat,
            dependency.PredecessorPlanItem?.Title,
            dependency.PredecessorPlanItem?.TopLevelSection,
            dependency.PredecessorPlanItem?.OutlineLevel,
            dependency.PredecessorPlanItem?.ItemType,
            dependency.PredecessorPlanItem?.Status);
    }

    private static PlanItemDependencyDto ToSuccessorDto(PlanItemPredecessor dependency)
    {
        return new PlanItemDependencyDto(
            dependency.Id,
            dependency.PlanItemId,
            dependency.PredecessorPlanItemId,
            dependency.PredecessorSourceTaskUid,
            dependency.DependencyType,
            dependency.LagMinutes,
            dependency.ImportedLinkType,
            dependency.ImportedLagFormat,
            dependency.PlanItem.Title,
            dependency.PlanItem.TopLevelSection,
            dependency.PlanItem.OutlineLevel,
            dependency.PlanItem.ItemType,
            dependency.PlanItem.Status);
    }

    private static bool CreatesDependencyCycle(
        int itemId,
        int predecessorId,
        IEnumerable<(int PlanItemId, int PredecessorPlanItemId)> dependencies)
    {
        var predecessorsByItem = dependencies
            .GroupBy(dependency => dependency.PlanItemId)
            .ToDictionary(group => group.Key, group => group.Select(dependency => dependency.PredecessorPlanItemId).ToList());
        var pending = new Stack<int>();
        var visited = new HashSet<int>();
        pending.Push(predecessorId);

        while (pending.Count > 0)
        {
            var current = pending.Pop();
            if (current == itemId)
            {
                return true;
            }

            if (!visited.Add(current) || !predecessorsByItem.TryGetValue(current, out var currentPredecessors))
            {
                continue;
            }

            foreach (var currentPredecessor in currentPredecessors)
            {
                pending.Push(currentPredecessor);
            }
        }

        return false;
    }

    private static bool IsDescendantOrSelf(PlanItem candidate, PlanItem parent, IReadOnlyCollection<PlanItem> planItems)
    {
        if (candidate.Id == parent.Id)
        {
            return true;
        }

        var itemById = planItems.ToDictionary(item => item.Id);
        var parentId = candidate.ParentPlanItemId;
        while (parentId.HasValue && itemById.TryGetValue(parentId.Value, out var ancestor))
        {
            if (ancestor.Id == parent.Id)
            {
                return true;
            }

            parentId = ancestor.ParentPlanItemId;
        }

        return false;
    }

    private static string? TopLevelSectionFor(PlanItem parent, PlanItemBulkCreateDto item)
    {
        if (parent.OutlineLevel == 0 && item.ItemType == PlanItemTypes.Section)
        {
            return item.Title.Trim();
        }

        if (parent.OutlineLevel == 1)
        {
            return parent.Title;
        }

        return parent.TopLevelSection;
    }

    private static int? EffectiveImportedOutlineLevel(PlanItemBulkCreateDto item)
    {
        if (item.OutlineLevel.HasValue)
        {
            return item.OutlineLevel.Value;
        }

        var outlineNumber = TrimToNull(item.OutlineNumber);
        if (outlineNumber is null)
        {
            return null;
        }

        var parts = outlineNumber
            .Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length == 0 || parts.Any(part => !int.TryParse(part, out _))
            ? null
            : parts.Length;
    }

    private static string? NewTopLevelSection(PlanItem item, PlanItem parent)
    {
        if (parent.OutlineLevel == 0)
        {
            return item.Title;
        }

        if (parent.OutlineLevel == 1)
        {
            return parent.Title;
        }

        return parent.TopLevelSection;
    }

    private static string? ValidateEditableFields(
        string itemType,
        int percentComplete,
        string planningWindowType,
        DateTime? targetStartDate,
        DateTime? targetEndDate,
        string scheduleSurfaceMode,
        string rolloverPolicy)
    {
        if (!ItemTypes.Contains(itemType))
        {
            return "Item type must be Section, Project, Task, QueueItem, or Milestone.";
        }

        if (percentComplete < 0 || percentComplete > 100)
        {
            return "Percent complete must be between 0 and 100.";
        }

        if (!PlanningWindowTypes.Contains(planningWindowType))
        {
            return "Planning window type is not valid.";
        }

        if (!ScheduleSurfaceModes.Contains(scheduleSurfaceMode))
        {
            return "Schedule surface mode is not valid.";
        }

        if (!RolloverPolicies.Contains(rolloverPolicy))
        {
            return "Rollover policy must be Normal, Never, Always, or RepeatNextYear.";
        }

        if (targetStartDate.HasValue && targetEndDate.HasValue && targetStartDate > targetEndDate)
        {
            return "Target start date must be on or before target end date.";
        }

        return null;
    }

    private static string? ValidateTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return "Every plan item needs a title.";
        }

        return title.Trim().Length > 500
            ? "Plan item titles must be 500 characters or fewer."
            : null;
    }

    private static string? ValidateDependencyFields(string dependencyType, int lagMinutes)
    {
        if (!DependencyTypes.Contains(dependencyType))
        {
            return "Dependency type must be FF, FS, SF, or SS.";
        }

        return lagMinutes is < -525600 or > 525600
            ? "Dependency lag must stay within plus or minus one year of minutes."
            : null;
    }

    private static string ItemType(int outlineLevel, string? topLevelSection, bool isSummary, bool isMilestone)
    {
        if (isMilestone)
        {
            return PlanItemTypes.Milestone;
        }

        if (outlineLevel == 1)
        {
            return PlanItemTypes.Section;
        }

        if (isSummary || outlineLevel == 0)
        {
            return PlanItemTypes.Project;
        }

        return topLevelSection is not null && QueueSections.Contains(topLevelSection)
            ? PlanItemTypes.QueueItem
            : PlanItemTypes.Task;
    }

    private static string StatusFor(int percentComplete)
    {
        return percentComplete switch
        {
            >= 100 => PlanItemStatus.Complete,
            > 0 => PlanItemStatus.InProgress,
            _ => PlanItemStatus.NotStarted
        };
    }

    private static string? ReadText(XElement? element) => TrimToNull(element?.Value);

    private static int ReadInt(XElement? element) => int.TryParse(element?.Value, out var value) ? value : 0;

    private static int? ReadNullableInt(XElement? element) => int.TryParse(element?.Value, out var value) ? value : null;

    private static bool ReadBool(XElement? element) => element?.Value is "1" or "true" or "True";

    private static DateTime? ReadDate(string? value) => DateTime.TryParse(value, out var date) ? date : null;

    private static string? TrimToNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string ProjectDependencyType(string? value)
    {
        return value switch
        {
            "0" => PlanItemDependencyTypes.FinishToFinish,
            "2" => PlanItemDependencyTypes.StartToFinish,
            "3" => PlanItemDependencyTypes.StartToStart,
            _ => PlanItemDependencyTypes.FinishToStart
        };
    }

    private static int ProjectLagMinutes(string? value)
    {
        return int.TryParse(value, out var linkLagTenthsMinutes)
            ? linkLagTenthsMinutes / 10
            : 0;
    }

    private static XDocument ProjectXml(AnnualPlan plan)
    {
        XNamespace ns = "http://schemas.microsoft.com/project";
        var tasks = plan.PlanItems
            .OrderBy(item => item.SortOrder)
            .ToList();
        var exportUids = tasks
            .Select((item, index) => new { item.Id, Uid = item.OutlineLevel == 0 ? 0 : index })
            .ToDictionary(item => item.Id, item => item.Uid);
        var outlineNumbers = ProjectOutlineNumbers(tasks);
        var projectStart = tasks
            .Select(ProjectStart)
            .Where(date => date.HasValue)
            .Min() ?? new DateTime(plan.Year, 1, 1, 8, 0, 0);
        var projectFinish = tasks
            .Select(ProjectFinish)
            .Where(date => date.HasValue)
            .Max() ?? new DateTime(plan.Year, 12, 31, 17, 0, 0);

        return new XDocument(
            new XDeclaration("1.0", "UTF-8", "yes"),
            new XElement(ns + "Project",
                new XElement(ns + "SaveVersion", 14),
                new XElement(ns + "Name", $"goals-and-plans-{plan.Year}.xml"),
                new XElement(ns + "Title", plan.Title),
                new XElement(ns + "CreationDate", ProjectDate(plan.CreatedAtUtc.ToLocalTime())),
                new XElement(ns + "LastSaved", ProjectDate(DateTime.Now)),
                new XElement(ns + "ScheduleFromStart", 1),
                new XElement(ns + "StartDate", ProjectDate(projectStart)),
                new XElement(ns + "FinishDate", ProjectDate(projectFinish)),
                new XElement(ns + "CalendarUID", 1),
                new XElement(ns + "DefaultStartTime", "08:00:00"),
                new XElement(ns + "DefaultFinishTime", "17:00:00"),
                new XElement(ns + "MinutesPerDay", 480),
                new XElement(ns + "MinutesPerWeek", 2400),
                new XElement(ns + "DaysPerMonth", 20),
                new XElement(ns + "NewTasksAreManual", 1),
                StandardProjectCalendar(ns),
                new XElement(ns + "Tasks",
                    tasks.Select((item, index) => ProjectTask(ns, item, index, exportUids, outlineNumbers)))));
    }

    private static XElement ProjectTask(
        XNamespace ns,
        PlanItem item,
        int index,
        IReadOnlyDictionary<int, int> exportUids,
        IReadOnlyDictionary<int, string> outlineNumbers)
    {
        var start = ProjectStart(item);
        var finish = ProjectFinish(item);
        var duration = ProjectDuration(item, start, finish);
        var isManual = ProjectManual(item);
        return new XElement(ns + "Task",
            new XElement(ns + "UID", exportUids[item.Id]),
            new XElement(ns + "ID", item.OutlineLevel == 0 ? 0 : index),
            new XElement(ns + "Name", item.Title),
            new XElement(ns + "Active", 1),
            new XElement(ns + "Manual", isManual ? 1 : 0),
            new XElement(ns + "OutlineNumber", outlineNumbers[item.Id]),
            new XElement(ns + "OutlineLevel", item.OutlineLevel),
            start.HasValue ? new XElement(ns + "Start", ProjectDate(start.Value)) : null,
            finish.HasValue ? new XElement(ns + "Finish", ProjectDate(finish.Value)) : null,
            start.HasValue ? new XElement(ns + "ManualStart", ProjectDate(start.Value)) : null,
            finish.HasValue ? new XElement(ns + "ManualFinish", ProjectDate(finish.Value)) : null,
            duration is not null ? new XElement(ns + "Duration", duration) : null,
            duration is not null ? new XElement(ns + "ManualDuration", duration) : null,
            new XElement(ns + "PercentComplete", Math.Clamp(item.PercentComplete, 0, 100)),
            item.IsSummary ? new XElement(ns + "Summary", 1) : null,
            item.IsMilestone ? new XElement(ns + "Milestone", 1) : null,
            TrimToNull(item.Notes) is { } notes ? new XElement(ns + "Notes", notes) : null,
            item.ImportedPredecessors
                .Where(dependency => dependency.PredecessorPlanItemId.HasValue
                    && exportUids.ContainsKey(dependency.PredecessorPlanItemId.Value))
                .Select(dependency => ProjectPredecessorLink(ns, dependency, exportUids[dependency.PredecessorPlanItemId!.Value])));
    }

    private static Dictionary<int, string> ProjectOutlineNumbers(IReadOnlyCollection<PlanItem> tasks)
    {
        var itemById = tasks.ToDictionary(item => item.Id);
        var childNumbers = new Dictionary<int, int>();
        var outlineNumbers = new Dictionary<int, string>();

        foreach (var item in tasks.OrderBy(item => item.SortOrder))
        {
            if (item.OutlineLevel == 0)
            {
                outlineNumbers[item.Id] = "0";
                continue;
            }

            var parentKey = item.ParentPlanItemId ?? 0;
            childNumbers[parentKey] = childNumbers.GetValueOrDefault(parentKey) + 1;
            var parentNumber = parentKey != 0 && itemById.ContainsKey(parentKey)
                ? outlineNumbers.GetValueOrDefault(parentKey, "0")
                : "0";
            outlineNumbers[item.Id] = parentNumber == "0"
                ? $"{childNumbers[parentKey]}"
                : $"{parentNumber}.{childNumbers[parentKey]}";
        }

        return outlineNumbers;
    }

    private static XElement ProjectPredecessorLink(XNamespace ns, PlanItemPredecessor dependency, int predecessorUid)
    {
        return new XElement(ns + "PredecessorLink",
            new XElement(ns + "PredecessorUID", predecessorUid),
            new XElement(ns + "Type", ProjectDependencyTypeCode(dependency.DependencyType)),
            new XElement(ns + "LinkLag", dependency.LagMinutes * 10),
            new XElement(ns + "LagFormat", dependency.ImportedLagFormat ?? 7));
    }

    private static XElement StandardProjectCalendar(XNamespace ns)
    {
        return new XElement(ns + "Calendars",
            new XElement(ns + "Calendar",
                new XElement(ns + "UID", 1),
                new XElement(ns + "Name", "Standard"),
                new XElement(ns + "IsBaseCalendar", 1),
                new XElement(ns + "BaseCalendarUID", -1)));
    }

    private static DateTime? ProjectStart(PlanItem item)
    {
        var value = item.TargetStartDate ?? item.TargetEndDate ?? item.ImportedStart;
        return value.HasValue ? AtProjectStart(value.Value) : null;
    }

    private static DateTime? ProjectFinish(PlanItem item)
    {
        var value = item.TargetEndDate ?? item.TargetStartDate ?? item.ImportedFinish;
        return value.HasValue ? AtProjectFinish(value.Value) : null;
    }

    private static DateTime AtProjectStart(DateTime value)
    {
        return value.Date.AddHours(8);
    }

    private static DateTime AtProjectFinish(DateTime value)
    {
        return value.Date.AddHours(17);
    }

    private static string? ProjectDuration(PlanItem item, DateTime? start, DateTime? finish)
    {
        if (item.IsMilestone)
        {
            return "PT0H0M0S";
        }

        if (item.TargetStartDate.HasValue || item.TargetEndDate.HasValue)
        {
            if (start.HasValue && finish.HasValue)
            {
                var hours = Math.Max(1, (int)Math.Ceiling((finish.Value - start.Value).TotalHours));
                return $"PT{hours}H0M0S";
            }
        }

        return TrimToNull(item.ImportedDuration);
    }

    private static bool ProjectManual(PlanItem item)
    {
        return item.TargetStartDate.HasValue
            || item.TargetEndDate.HasValue
            || item.SourceManualSchedule;
    }

    private static string ProjectDate(DateTime value)
    {
        return value.ToString("yyyy-MM-ddTHH:mm:ss");
    }

    private static int ProjectDependencyTypeCode(string dependencyType)
    {
        return dependencyType switch
        {
            PlanItemDependencyTypes.FinishToFinish => 0,
            PlanItemDependencyTypes.StartToFinish => 2,
            PlanItemDependencyTypes.StartToStart => 3,
            _ => 1
        };
    }

    private static ProjectXmlValidationCountsDto PlanProjectXmlCounts(AnnualPlan plan)
    {
        var tasks = plan.PlanItems.ToList();
        var exportIds = tasks.Select(item => item.Id).ToHashSet();
        return new ProjectXmlValidationCountsDto(
            tasks.Count,
            tasks.Count(item => TrimToNull(item.Notes) is not null),
            tasks.Count(ProjectManual),
            tasks.Sum(item => item.ImportedPredecessors.Count(dependency =>
                dependency.PredecessorPlanItemId.HasValue
                && exportIds.Contains(dependency.PredecessorPlanItemId.Value))),
            tasks.Count(item => item.IsMilestone),
            tasks.Count(item => item.PercentComplete > 0));
    }

    private static ProjectXmlValidationCountsDto ExportedProjectXmlCounts(XDocument document)
    {
        var ns = document.Root!.Name.Namespace;
        var tasks = document.Root
            .Element(ns + "Tasks")
            ?.Elements(ns + "Task")
            .ToList() ?? [];

        return new ProjectXmlValidationCountsDto(
            tasks.Count,
            tasks.Count(task => TrimToNull(task.Element(ns + "Notes")?.Value) is not null),
            tasks.Count(task => ReadBool(task.Element(ns + "Manual"))),
            tasks.Sum(task => task.Elements(ns + "PredecessorLink").Count()),
            tasks.Count(task => ReadBool(task.Element(ns + "Milestone"))),
            tasks.Count(task => ReadInt(task.Element(ns + "PercentComplete")) > 0));
    }

    private static IReadOnlyCollection<ProjectXmlValidationMismatchDto> ProjectXmlCountMismatches(
        ProjectXmlValidationCountsDto expected,
        ProjectXmlValidationCountsDto actual)
    {
        var mismatches = new List<ProjectXmlValidationMismatchDto>();
        AddMismatch(mismatches, "Tasks", expected.TaskCount, actual.TaskCount);
        AddMismatch(mismatches, "Notes", expected.NoteCount, actual.NoteCount);
        AddMismatch(mismatches, "Manual tasks", expected.ManualTaskCount, actual.ManualTaskCount);
        AddMismatch(mismatches, "Predecessor links", expected.PredecessorLinkCount, actual.PredecessorLinkCount);
        AddMismatch(mismatches, "Milestones", expected.MilestoneCount, actual.MilestoneCount);
        AddMismatch(mismatches, "Non-zero percent complete", expected.NonZeroPercentCompleteCount, actual.NonZeroPercentCompleteCount);
        return mismatches;
    }

    private static void AddMismatch(
        ICollection<ProjectXmlValidationMismatchDto> mismatches,
        string field,
        int expected,
        int actual)
    {
        if (expected != actual)
        {
            mismatches.Add(new ProjectXmlValidationMismatchDto(field, expected, actual));
        }
    }
}
