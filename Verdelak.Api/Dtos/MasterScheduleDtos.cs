namespace Verdelak.Api.Dtos;

public record MasterScheduleItemDto(
    string Id,
    string Source,
    string SourceType,
    int SourceId,
    int? OccurrenceId,
    string Title,
    string? Detail,
    DateTime ScheduledDate,
    DateTime? WindowStart,
    DateTime? WindowEnd,
    string Status,
    int? PercentComplete,
    bool CanComplete,
    bool CanMove,
    bool CanSkip,
    bool CanReopen
);

public record GoalProgressUpdateDto(int PercentComplete);

public record GoalCompleteActionDto(string? Notes);

public record GoalScheduleActionDto(
    DateTime? ScheduledDate,
    string? Notes
);

public record TaskOccurrenceUpdateDto(
    string? Status,
    DateTime? ScheduledDate,
    DateTime? CompletedDate,
    string? Notes
);

public record TaskOccurrenceActivityDto(
    int OccurrenceID,
    int TaskID,
    string TaskTitle,
    string TaskType,
    DateTime ScheduledDate,
    DateTime? CompletedDate,
    string Status,
    string? Notes,
    IEnumerable<string> Tags
);


public record ScheduleGenerationResultDto(
    DateTime From,
    DateTime To,
    int ActiveTaskCount,
    int CreatedCount,
    IEnumerable<ScheduleGenerationSourceSummaryDto> Sources,
    IEnumerable<ScheduleGenerationTaskSummaryDto> Tasks,
    int MissingCount = 0
);

public record ScheduleGenerationSourceSummaryDto(
    string Source,
    int ActiveTaskCount,
    int CreatedCount,
    int MissingCount = 0
);

public record ScheduleGenerationTaskSummaryDto(
    int TaskID,
    string Title,
    string TaskType,
    string Source,
    int MissingCount,
    int CreatedCount
);

