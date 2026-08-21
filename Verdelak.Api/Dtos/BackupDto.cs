namespace Verdelak.Api.Dtos
{
    public record ScheduledTaskCreateDto(
        string Title,
        string? Description,
        string TaskType,
        bool IsActive,
        string ScheduleType,
        DateTime StartDate,
        DateTime? EndDate,
        string RecurrencePattern
    );

    public record BackupJobCreateDto(
        int TaskID,
        int SourceID,
        int DestinationID,
        bool CompressionEnabled,
        bool EncryptionEnabled,
        bool VerifyAfterCopy,
        string? Notes
    );

    public record BackupJobSummaryDto(
        int BackupJobID,
        int TaskID,
        string? TaskTitle,
        string? ScheduleType,
        string? RecurrencePattern,
        bool? TaskIsActive,
        int SourceID,
        string? SourceName,
        string? SourcePathOrURI,
        string? SourceType,
        int DestinationID,
        string? DestinationName,
        string? DestinationPathOrURI,
        string? DestinationType,
        bool CompressionEnabled,
        bool EncryptionEnabled,
        bool VerifyAfterCopy,
        DateTime? LastRun,
        DateTime? LastLogTimestamp,
        bool? LastLogSuccess,
        string? LastLogMessage,
        string? Notes
    );

    public record BackupLogCreateDto(
        int BackupJobID,
        int? OccurrenceID,
        DateTime? Timestamp,
        bool Success,
        string? Message,
        long? BytesCopied,
        int? DurationSeconds
    );

    public record BackupLogDto(
        int LogID,
        int BackupJobID,
        int? OccurrenceID,
        DateTime Timestamp,
        bool Success,
        string? Message,
        long? BytesCopied,
        int? DurationSeconds
    );

    public record BackupHealthReportDto(
        DateTime GeneratedAt,
        int TotalJobs,
        int ActiveJobs,
        int HealthyJobs,
        int DueSoonJobs,
        int OverdueJobs,
        int NeverCompletedJobs,
        int UnknownFrequencyJobs,
        IEnumerable<BackupHealthReportItemDto> Items
    );

    public record BackupHealthReportItemDto(
        int BackupJobID,
        int TaskID,
        string? TaskTitle,
        bool IsActive,
        string SourceName,
        string? SourcePathOrURI,
        string DestinationName,
        string? DestinationPathOrURI,
        string? ScheduleType,
        string? RecurrencePattern,
        string FrequencyLabel,
        int? ExpectedEveryDays,
        DateTime? LastCompletedAt,
        DateTime? LastAttemptAt,
        bool? LastAttemptSucceeded,
        DateTime? NextDueAt,
        int? DaysSinceLastCompleted,
        int? DaysUntilDue,
        string HealthStatus,
        string HealthMessage
    );
}
