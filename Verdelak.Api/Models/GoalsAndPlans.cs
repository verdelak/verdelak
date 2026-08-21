namespace Verdelak.Api.Models;

public class AnnualPlan
{
    public int Id { get; set; }
    public int Year { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = AnnualPlanStatus.Active;
    public string? SourceSystem { get; set; }
    public string? SourceFileName { get; set; }
    public DateTime? SourceCreatedAt { get; set; }
    public DateTime? SourceLastSavedAt { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ImportedAtUtc { get; set; }
    public ICollection<PlanItem> PlanItems { get; set; } = [];
}

public static class AnnualPlanStatus
{
    public const string Draft = "Draft";
    public const string Active = "Active";
    public const string Archived = "Archived";
}

public class PlanItem
{
    public int Id { get; set; }
    public int AnnualPlanId { get; set; }
    public AnnualPlan AnnualPlan { get; set; } = null!;
    public int? ParentPlanItemId { get; set; }
    public PlanItem? ParentPlanItem { get; set; }
    public ICollection<PlanItem> ChildPlanItems { get; set; } = [];
    public int SortOrder { get; set; }
    public int OutlineLevel { get; set; }
    public string ItemType { get; set; } = PlanItemTypes.Task;
    public string Title { get; set; } = string.Empty;
    public string? TopLevelSection { get; set; }
    public string? Notes { get; set; }
    public int PercentComplete { get; set; }
    public bool IsSummary { get; set; }
    public bool IsMilestone { get; set; }
    public string Status { get; set; } = PlanItemStatus.NotStarted;
    public string PlanningWindowType { get; set; } = PlanItemPlanningWindowTypes.Unscheduled;
    public DateTime? TargetStartDate { get; set; }
    public DateTime? TargetEndDate { get; set; }
    public string ScheduleSurfaceMode { get; set; } = PlanItemScheduleSurfaceModes.Never;
    public string RolloverPolicy { get; set; } = PlanItemRolloverPolicies.Normal;
    public int? SourceTaskUid { get; set; }
    public int? SourceTaskId { get; set; }
    public bool SourceManualSchedule { get; set; }
    public DateTime? ImportedStart { get; set; }
    public DateTime? ImportedFinish { get; set; }
    public string? ImportedDuration { get; set; }
    public ICollection<PlanItemPredecessor> ImportedPredecessors { get; set; } = [];
    public ICollection<PlanItemPredecessor> SuccessorDependencies { get; set; } = [];
}

public static class PlanItemTypes
{
    public const string Section = "Section";
    public const string Project = "Project";
    public const string Task = "Task";
    public const string QueueItem = "QueueItem";
    public const string Milestone = "Milestone";
}

public static class PlanItemStatus
{
    public const string NotStarted = "NotStarted";
    public const string InProgress = "InProgress";
    public const string Complete = "Complete";
}

public static class PlanItemPlanningWindowTypes
{
    public const string Unscheduled = "Unscheduled";
    public const string Year = "Year";
    public const string Quarter = "Quarter";
    public const string Month = "Month";
    public const string Week = "Week";
    public const string Day = "Day";
    public const string DateRange = "DateRange";
}

public static class PlanItemScheduleSurfaceModes
{
    public const string Never = "Never";
    public const string ActiveGoalsOnly = "ActiveGoalsOnly";
    public const string DuringTargetWindow = "DuringTargetWindow";
    public const string NearTargetEnd = "NearTargetEnd";
    public const string PinnedToSchedule = "PinnedToSchedule";
}

public static class PlanItemRolloverPolicies
{
    public const string Normal = "Normal";
    public const string Never = "Never";
    public const string Always = "Always";
    public const string RepeatNextYear = "RepeatNextYear";
}

public class PlanItemPredecessor
{
    public int Id { get; set; }
    public int PlanItemId { get; set; }
    public PlanItem PlanItem { get; set; } = null!;
    public int? PredecessorPlanItemId { get; set; }
    public PlanItem? PredecessorPlanItem { get; set; }
    public int? PredecessorSourceTaskUid { get; set; }
    public string DependencyType { get; set; } = PlanItemDependencyTypes.FinishToStart;
    public int LagMinutes { get; set; }
    public string? ImportedLinkType { get; set; }
    public int? ImportedLagFormat { get; set; }
}

public static class PlanItemDependencyTypes
{
    public const string FinishToFinish = "FF";
    public const string FinishToStart = "FS";
    public const string StartToFinish = "SF";
    public const string StartToStart = "SS";
}
