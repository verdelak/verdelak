using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Dtos;

public record AnnualPlanSummaryDto(
    int Id,
    int Year,
    string Title,
    string Status,
    string? SourceSystem,
    string? SourceFileName,
    DateTime? ImportedAtUtc,
    int ItemCount,
    int SummaryCount,
    int CompleteCount,
    int NoteCount
);

public record AnnualPlanStatusUpdateDto(
    string Status
);

public record AnnualPlanCreateDto(
    int Year,
    string? Title
);

public record AnnualPlanRolloverRequestDto(
    int SourcePlanId,
    int Year,
    string? Title
);

public record AnnualPlanRolloverResultDto(
    AnnualPlanSummaryDto Plan,
    int RolledItemCount,
    int RolledDependencyCount
);

public record AnnualPlanRolloverSectionPreviewDto(
    string Section,
    int ItemCount
);

public record AnnualPlanRolloverPreviewDto(
    int SourcePlanId,
    int SourceYear,
    int TargetYear,
    string TargetTitle,
    int SourceItemCount,
    int RolledItemCount,
    int RolledWorkItemCount,
    int RolledStructureItemCount,
    int CompletedWorkItemCount,
    int RetainedDependencyCount,
    int DroppedDependencyCount,
    IReadOnlyCollection<AnnualPlanRolloverSectionPreviewDto> Sections
);

public record AnnualPlanArchiveComparisonMetricDto(
    string Metric,
    int LeftValue,
    int RightValue,
    int Delta
);

public record AnnualPlanArchiveComparisonSectionDto(
    string Section,
    int LeftLeafWorkCount,
    int RightLeafWorkCount,
    int LeafWorkDelta,
    int LeftCompletedLeafWorkCount,
    int RightCompletedLeafWorkCount,
    int CompletedLeafWorkDelta,
    int LeftOpenLeafWorkCount,
    int RightOpenLeafWorkCount,
    int OpenLeafWorkDelta,
    int LeftCompletionPercent,
    int RightCompletionPercent,
    int CompletionPercentDelta
);

public record AnnualPlanArchiveComparisonDto(
    AnnualPlanSummaryDto LeftPlan,
    AnnualPlanSummaryDto RightPlan,
    IReadOnlyCollection<AnnualPlanArchiveComparisonMetricDto> Metrics,
    IReadOnlyCollection<AnnualPlanArchiveComparisonSectionDto> Sections
);

public record PlanItemDto(
    int Id,
    int? ParentPlanItemId,
    int SortOrder,
    int OutlineLevel,
    string ItemType,
    string Title,
    string? TopLevelSection,
    string? Notes,
    int PercentComplete,
    bool IsSummary,
    bool IsMilestone,
    string Status,
    string PlanningWindowType,
    DateTime? TargetStartDate,
    DateTime? TargetEndDate,
    string ScheduleSurfaceMode,
    string RolloverPolicy,
    bool SourceManualSchedule,
    DateTime? ImportedStart,
    DateTime? ImportedFinish,
    string? ImportedDuration,
    int ImportedPredecessorCount,
    int UnfinishedPredecessorCount
);

public record GoalSchedulePreviewItemDto(
    int PlanItemId,
    string Title,
    string? TopLevelSection,
    string ItemType,
    int PercentComplete,
    string PlanningWindowType,
    DateTime? TargetStartDate,
    DateTime? TargetEndDate,
    string ScheduleSurfaceMode,
    string SurfaceReason
);

public record PlanItemUpdateDto(
    string Title,
    string ItemType,
    int PercentComplete,
    string? Notes,
    string PlanningWindowType,
    DateTime? TargetStartDate,
    DateTime? TargetEndDate,
    string ScheduleSurfaceMode,
    string RolloverPolicy
);

public record PlanItemBulkCreateDto(
    string Title,
    string ItemType,
    int PercentComplete,
    string? Notes,
    string PlanningWindowType,
    DateTime? TargetStartDate,
    DateTime? TargetEndDate,
    string ScheduleSurfaceMode,
    string RolloverPolicy,
    int? OutlineLevel,
    string? OutlineNumber
);

public record PlanItemBulkCreateRequestDto(
    int ParentPlanItemId,
    IReadOnlyCollection<PlanItemBulkCreateDto> Items
);

public record PlanItemDeleteResultDto(
    int DeletedCount
);

public record PlanItemMoveDto(
    int ParentPlanItemId,
    string Placement,
    int? ReferencePlanItemId
);

public record PlanItemMoveResultDto(
    int MovedCount
);

public record PlanItemDependencyDto(
    int Id,
    int PlanItemId,
    int? PredecessorPlanItemId,
    int? PredecessorSourceTaskUid,
    string DependencyType,
    int LagMinutes,
    string? ImportedLinkType,
    int? ImportedLagFormat,
    string? Title,
    string? TopLevelSection,
    int? OutlineLevel,
    string? ItemType,
    string? Status
);

public record PlanItemDependenciesDto(
    int PlanItemId,
    IReadOnlyCollection<PlanItemDependencyDto> Predecessors,
    IReadOnlyCollection<PlanItemDependencyDto> Successors
);

public record PlanItemDependencyCreateDto(
    int PredecessorPlanItemId,
    string DependencyType,
    int LagMinutes
);

public record PlanItemDependencyUpdateDto(
    string DependencyType,
    int LagMinutes
);

public record ProjectXmlImportResultDto(
    AnnualPlanSummaryDto Plan,
    int ImportedTaskCount,
    int ImportedNoteCount,
    int ImportedManualTaskCount,
    int ImportedPredecessorCount,
    int SkippedPredecessorCount,
    IReadOnlyCollection<string> TopLevelSections
);

public record ProjectXmlRoundTripValidationDto(
    bool IsValid,
    ProjectXmlValidationCountsDto PlanCounts,
    ProjectXmlValidationCountsDto ExportedXmlCounts,
    IReadOnlyCollection<ProjectXmlValidationMismatchDto> Mismatches
);

public record ProjectXmlValidationCountsDto(
    int TaskCount,
    int NoteCount,
    int ManualTaskCount,
    int PredecessorLinkCount,
    int MilestoneCount,
    int NonZeroPercentCompleteCount
);

public record ProjectXmlValidationMismatchDto(
    string Field,
    int Expected,
    int Actual
);

public class ProjectXmlImportRequest
{
    [Required]
    public IFormFile File { get; set; } = default!;

    public int? Year { get; set; }

    public bool ReplaceExisting { get; set; }
}
