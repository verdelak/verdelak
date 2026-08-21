using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models
{
    public class ScheduledTask
    {
        [Key]
        public int TaskID { get; set; }

        [Required]
        public string Title { get; set; }

        public string? Description { get; set; }

        public string TaskType { get; set; }

        public bool IsActive { get; set; }

        public string ScheduleType { get; set; } // OneTime, Daily, Weekly, etc.

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string RecurrencePattern { get; set; }

        public DateTime? LastGenerated { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public ICollection<TaskOccurrence> Occurrences { get; set; }
        public ICollection<ScheduledTaskTag> Tags { get; set; }
    }

    public class TaskOccurrence
    {
        [Key]
        public int OccurrenceID { get; set; }

        [ForeignKey("ScheduledTask")]
        public int TaskID { get; set; }

        public DateTime ScheduledDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public string Status { get; set; } // Scheduled, Completed, Missed, Skipped

        public string? Notes { get; set; }

        public ScheduledTask ScheduledTask { get; set; }
    }

    public class ScheduledTaskTag
    {
        public int TaskID { get; set; }
        public string Tag { get; set; }

        public ScheduledTask ScheduledTask { get; set; }
    }

    public class BackupSource
    {
        [Key]
        public int SourceID { get; set; }

        public string Name { get; set; }

        public string PathOrURI { get; set; }

        public string Type { get; set; } // Folder, Drive, Cloud, etc.

        public string? Notes { get; set; }
    }

    public class BackupDestination
    {
        [Key]
        public int DestinationID { get; set; }

        public string Name { get; set; }

        public string PathOrURI { get; set; }

        public string Type { get; set; }

        public string? Notes { get; set; }
    }

    public class BackupJob
    {
        [Key]
        public int BackupJobID { get; set; }

        [ForeignKey("ScheduledTask")]
        public int TaskID { get; set; }

        [ForeignKey("BackupSource")]
        public int SourceID { get; set; }

        [ForeignKey("BackupDestination")]
        public int DestinationID { get; set; }

        public bool CompressionEnabled { get; set; }

        public bool EncryptionEnabled { get; set; }

        public bool VerifyAfterCopy { get; set; }

        public DateTime? LastRun { get; set; }

        public string? Notes { get; set; }

        public ScheduledTask ScheduledTask { get; set; }
        public BackupSource BackupSource { get; set; }
        public BackupDestination BackupDestination { get; set; }
    }

    public class BackupJobLog
    {
        [Key]
        public int LogID { get; set; }

        [ForeignKey("BackupJob")]
        public int BackupJobID { get; set; }

        [ForeignKey("TaskOccurrence")]
        public int? OccurrenceID { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.Now;

        public bool Success { get; set; }

        public string? Message { get; set; }

        public long? BytesCopied { get; set; }

        public int? DurationSeconds { get; set; }

        public BackupJob BackupJob { get; set; }
        public TaskOccurrence? TaskOccurrence { get; set; }
    }


    public class SchedulerRunHistory
    {
        [Key]
        public int Id { get; set; }
        public DateTime LastRunDate { get; set; }
    }

 
}
