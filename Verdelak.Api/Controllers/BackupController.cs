using Verdelak.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Models;
using Verdelak.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
namespace Verdelak.Api.Controllers
{

        [ApiController]
        [Authorize(Roles = "Admin")]
        [Route("api/backups")]
        public class BackupController : ControllerBase
        {
        private readonly VerdelakDbContext _context;

            public BackupController(VerdelakDbContext context)
            { 
                _context = context;
            }

        [HttpGet("sources")]
        public async Task<IActionResult> GetSources()
        {
            var sources = await _context.BackupSources.ToListAsync();
            return Ok(sources);
        }

        [HttpPost("sources")]
        public async Task<IActionResult> CreateSource([FromBody] BackupSource dto)
        {
            _context.BackupSources.Add(dto);
            await _context.SaveChangesAsync();
            return Ok(dto);
        }

        [HttpGet("destinations")]
        public async Task<IActionResult> GetDestinations()
        {
            var destinations = await _context.BackupDestinations.ToListAsync();
            return Ok(destinations);
        }

        [HttpPost("destinations")]
        public async Task<IActionResult> CreateDestination([FromBody] BackupDestination dto)
        {
            _context.BackupDestinations.Add(dto);
            await _context.SaveChangesAsync();
            return Ok(dto);
        }

        [HttpGet("jobs")]
        public async Task<IActionResult> GetJobs([FromQuery] int? taskId)
        {
            var query = _context.BackupJobs
                .Include(j => j.ScheduledTask)
                .Include(j => j.BackupSource)
                .Include(j => j.BackupDestination)
                .AsQueryable();

            if (taskId.HasValue)
                query = query.Where(j => j.TaskID == taskId.Value);

            var jobs = await query
                .OrderBy(j => j.BackupSource.Name)
                .ThenBy(j => j.BackupDestination.Name)
                .ToListAsync();

            var jobIds = jobs.Select(j => j.BackupJobID).ToList();
            var latestLogs = await _context.BackupJobLogs
                .Where(l => jobIds.Contains(l.BackupJobID))
                .OrderByDescending(l => l.Timestamp)
                .ThenByDescending(l => l.LogID)
                .ToListAsync();

            var latestLogsByJob = latestLogs
                .GroupBy(l => l.BackupJobID)
                .ToDictionary(g => g.Key, g => g.First());

            var summaries = jobs.Select(j =>
            {
                latestLogsByJob.TryGetValue(j.BackupJobID, out var latestLog);

                return new BackupJobSummaryDto(
                    j.BackupJobID,
                    j.TaskID,
                    j.ScheduledTask?.Title,
                    j.ScheduledTask?.ScheduleType,
                    j.ScheduledTask?.RecurrencePattern,
                    j.ScheduledTask?.IsActive,
                    j.SourceID,
                    j.BackupSource?.Name,
                    j.BackupSource?.PathOrURI,
                    j.BackupSource?.Type,
                    j.DestinationID,
                    j.BackupDestination?.Name,
                    j.BackupDestination?.PathOrURI,
                    j.BackupDestination?.Type,
                    j.CompressionEnabled,
                    j.EncryptionEnabled,
                    j.VerifyAfterCopy,
                    j.LastRun,
                    latestLog?.Timestamp,
                    latestLog?.Success,
                    latestLog?.Message,
                    j.Notes);
            });

            return Ok(summaries);
        }

        [HttpPost("jobs")]
        public async Task<IActionResult> CreateJob([FromBody] BackupJobCreateDto dto)
        {
            // Optional FK checks to return friendly 400s:
            if (!await _context.ScheduledTasks.AnyAsync(t => t.TaskID == dto.TaskID))
                return BadRequest(new { error = "Invalid TaskID" });
            if (!await _context.BackupSources.AnyAsync(s => s.SourceID == dto.SourceID))
                return BadRequest(new { error = "Invalid SourceID" });
            if (!await _context.BackupDestinations.AnyAsync(d => d.DestinationID == dto.DestinationID))
                return BadRequest(new { error = "Invalid DestinationID" });

            var job = new BackupJob
            {
                TaskID = dto.TaskID,
                SourceID = dto.SourceID,
                DestinationID = dto.DestinationID,
                CompressionEnabled = dto.CompressionEnabled,
                EncryptionEnabled = dto.EncryptionEnabled,
                VerifyAfterCopy = dto.VerifyAfterCopy,
                Notes = dto.Notes
            };

            _context.BackupJobs.Add(job);
            await _context.SaveChangesAsync();

            // (Optional) add a GET by id and return CreatedAtAction
            return Ok(job);
        }

        [HttpPost("logs")]
        public async Task<IActionResult> LogBackupResult([FromBody] BackupLogCreateDto dto)
        {
            var job = await _context.BackupJobs.FindAsync(dto.BackupJobID);
            if (job is null)
                return NotFound(new { error = "Backup job was not found." });

            var timestamp = dto.Timestamp ?? DateTime.Now;
            var log = new BackupJobLog
            {
                BackupJobID = dto.BackupJobID,
                OccurrenceID = dto.OccurrenceID,
                Timestamp = timestamp,
                Success = dto.Success,
                Message = dto.Message,
                BytesCopied = dto.BytesCopied,
                DurationSeconds = dto.DurationSeconds
            };

            _context.BackupJobLogs.Add(log);
            if (dto.Success)
            {
                job.LastRun = timestamp;
            }

            await _context.SaveChangesAsync();
            return Ok(ToLogDto(log));
        }

        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs([FromQuery] int? jobId)
        {
            var query = _context.BackupJobLogs.AsQueryable();

            if (jobId.HasValue)
                query = query.Where(l => l.BackupJobID == jobId);

            var logs = await query
                .OrderByDescending(l => l.Timestamp)
                .ThenByDescending(l => l.LogID)
                .ToListAsync();

            return Ok(logs.Select(ToLogDto));
        }

        [HttpGet("reports/health")]
        public async Task<ActionResult<BackupHealthReportDto>> GetHealthReport([FromQuery] int dueSoonDays = 7)
        {
            var today = DateTime.Today;
            dueSoonDays = Math.Clamp(dueSoonDays, 0, 365);

            var jobs = await _context.BackupJobs
                .Include(j => j.ScheduledTask)
                .Include(j => j.BackupSource)
                .Include(j => j.BackupDestination)
                .AsNoTracking()
                .OrderBy(j => j.BackupSource.Name)
                .ThenBy(j => j.BackupDestination.Name)
                .ToListAsync();

            var jobIds = jobs.Select(job => job.BackupJobID).ToList();
            var logs = await _context.BackupJobLogs
                .AsNoTracking()
                .Where(log => jobIds.Contains(log.BackupJobID))
                .OrderByDescending(log => log.Timestamp)
                .ThenByDescending(log => log.LogID)
                .ToListAsync();

            var latestAttemptsByJob = logs
                .GroupBy(log => log.BackupJobID)
                .ToDictionary(group => group.Key, group => group.First());
            var latestSuccessByJob = logs
                .Where(log => log.Success)
                .GroupBy(log => log.BackupJobID)
                .ToDictionary(group => group.Key, group => group.First());

            var items = jobs.Select(job =>
            {
                latestAttemptsByJob.TryGetValue(job.BackupJobID, out var latestAttempt);
                latestSuccessByJob.TryGetValue(job.BackupJobID, out var latestSuccess);

                var task = job.ScheduledTask;
                var isActive = task?.IsActive ?? false;
                var expectedEveryDays = ExpectedEveryDays(task?.ScheduleType, task?.RecurrencePattern);
                var frequencyLabel = FrequencyLabel(task?.ScheduleType, task?.RecurrencePattern, expectedEveryDays);
                var lastCompletedAt = latestSuccess?.Timestamp ?? job.LastRun;
                DateTime? nextDueAt = lastCompletedAt.HasValue && expectedEveryDays.HasValue
                    ? lastCompletedAt.Value.Date.AddDays(expectedEveryDays.Value)
                    : null;
                var daysSinceLastCompleted = lastCompletedAt.HasValue
                    ? (int?)(today - lastCompletedAt.Value.Date).Days
                    : null;
                var daysUntilDue = nextDueAt.HasValue
                    ? (int?)(nextDueAt.Value.Date - today).Days
                    : null;
                var health = HealthStatus(isActive, lastCompletedAt, expectedEveryDays, daysUntilDue, dueSoonDays);

                return new BackupHealthReportItemDto(
                    job.BackupJobID,
                    job.TaskID,
                    task?.Title,
                    isActive,
                    job.BackupSource?.Name ?? "Unknown source",
                    job.BackupSource?.PathOrURI,
                    job.BackupDestination?.Name ?? "Unknown destination",
                    job.BackupDestination?.PathOrURI,
                    task?.ScheduleType,
                    task?.RecurrencePattern,
                    frequencyLabel,
                    expectedEveryDays,
                    lastCompletedAt,
                    latestAttempt?.Timestamp,
                    latestAttempt?.Success,
                    nextDueAt,
                    daysSinceLastCompleted,
                    daysUntilDue,
                    health.Status,
                    health.Message);
            }).ToList();

            return new BackupHealthReportDto(
                DateTime.Now,
                items.Count,
                items.Count(item => item.IsActive),
                items.Count(item => item.HealthStatus == "Healthy"),
                items.Count(item => item.HealthStatus == "DueSoon"),
                items.Count(item => item.HealthStatus == "Overdue"),
                items.Count(item => item.HealthStatus == "NeverCompleted"),
                items.Count(item => item.HealthStatus == "UnknownFrequency"),
                items);
        }

        private static BackupLogDto ToLogDto(BackupJobLog log) => new(
            log.LogID,
            log.BackupJobID,
            log.OccurrenceID,
            log.Timestamp,
            log.Success,
            log.Message,
            log.BytesCopied,
            log.DurationSeconds);

        private static int? ExpectedEveryDays(string? scheduleType, string? recurrencePattern)
        {
            if (string.IsNullOrWhiteSpace(scheduleType))
            {
                return null;
            }

            return scheduleType.Trim() switch
            {
                "OneTime" => null,
                "Daily" => IntervalValue(recurrencePattern, 1, 365),
                "Weekly" => 7,
                "Monthly" => 30 * IntervalValue(recurrencePattern, 1, 24),
                "Interval" => IntervalDays(recurrencePattern),
                _ => null
            };
        }

        private static int IntervalDays(string? recurrencePattern)
        {
            var interval = IntervalValue(recurrencePattern, 1, 365);
            var unit = PatternValue(recurrencePattern, "unit")?.ToLowerInvariant() ?? "days";

            return unit switch
            {
                "week" or "weeks" => interval * 7,
                "month" or "months" => interval * 30,
                _ => interval
            };
        }

        private static int IntervalValue(string? recurrencePattern, int fallback, int max)
        {
            return int.TryParse(PatternValue(recurrencePattern, "interval"), out var parsed)
                ? Math.Clamp(parsed, 1, max)
                : fallback;
        }

        private static string FrequencyLabel(string? scheduleType, string? recurrencePattern, int? expectedEveryDays)
        {
            if (string.IsNullOrWhiteSpace(scheduleType))
            {
                return "No schedule";
            }

            if (scheduleType == "Weekly")
            {
                var days = PatternValue(recurrencePattern, "days") ?? PatternBody(recurrencePattern);
                return string.IsNullOrWhiteSpace(days) ? "Weekly" : $"Weekly: {days}";
            }

            if (scheduleType == "OneTime")
            {
                return "One-time";
            }

            return expectedEveryDays.HasValue
                ? $"Every {expectedEveryDays.Value} day{(expectedEveryDays.Value == 1 ? string.Empty : "s")}"
                : scheduleType;
        }

        private static (string Status, string Message) HealthStatus(
            bool isActive,
            DateTime? lastCompletedAt,
            int? expectedEveryDays,
            int? daysUntilDue,
            int dueSoonDays)
        {
            if (!isActive)
            {
                return ("Inactive", "This backup job is inactive.");
            }

            if (!lastCompletedAt.HasValue)
            {
                return ("NeverCompleted", "No successful backup has been logged.");
            }

            if (!expectedEveryDays.HasValue)
            {
                return ("UnknownFrequency", "No repeat frequency could be calculated.");
            }

            if (daysUntilDue < 0)
            {
                return ("Overdue", $"Overdue by {Math.Abs(daysUntilDue.Value)} day{(Math.Abs(daysUntilDue.Value) == 1 ? string.Empty : "s")}.");
            }

            if (daysUntilDue <= dueSoonDays)
            {
                return ("DueSoon", $"Due in {daysUntilDue} day{(daysUntilDue == 1 ? string.Empty : "s")}.");
            }

            return ("Healthy", "Backup freshness is within the expected frequency.");
        }

        private static string PatternBody(string? pattern)
        {
            if (string.IsNullOrWhiteSpace(pattern))
            {
                return string.Empty;
            }

            var separator = pattern.IndexOf(':');
            return separator >= 0 ? pattern[(separator + 1)..] : pattern;
        }

        private static string? PatternValue(string? pattern, string key)
        {
            return PatternBody(pattern)
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(part => part.Split('=', 2, StringSplitOptions.TrimEntries))
                .Where(parts => parts.Length == 2)
                .Where(parts => string.Equals(parts[0], key, StringComparison.OrdinalIgnoreCase))
                .Select(parts => parts[1])
                .FirstOrDefault();
        }
    }
}
