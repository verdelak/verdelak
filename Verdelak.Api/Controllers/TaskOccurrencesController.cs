using Verdelak.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/occurrences")]
    public class TaskOccurrencesController : ControllerBase
    {
        private static readonly HashSet<string> OccurrenceStatuses = ["Scheduled", "Completed", "Missed", "Skipped"];
        private readonly VerdelakDbContext _context;

        public TaskOccurrencesController(VerdelakDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetOccurrences([FromQuery] int? taskId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var query = _context.TaskOccurrences.AsQueryable();

            if (taskId.HasValue)
                query = query.Where(o => o.TaskID == taskId.Value);

            if (from.HasValue)
                query = query.Where(o => o.ScheduledDate >= from.Value);

            if (to.HasValue)
                query = query.Where(o => o.ScheduledDate <= to.Value);

            var results = await query.ToListAsync();
            return Ok(results);
        }

        [HttpGet("activity")]
        public async Task<ActionResult<IEnumerable<TaskOccurrenceActivityDto>>> GetActivity(
            [FromQuery] string? taskType,
            [FromQuery] int take = 25,
            [FromQuery] int daysBack = 60,
            [FromQuery] int daysForward = 30)
        {
            take = Math.Clamp(take, 1, 100);
            daysBack = Math.Clamp(daysBack, 0, 365);
            daysForward = Math.Clamp(daysForward, 0, 365);

            var from = DateTime.Today.AddDays(-daysBack);
            var to = DateTime.Today.AddDays(daysForward);
            var query = _context.TaskOccurrences
                .AsNoTracking()
                .Include(occurrence => occurrence.ScheduledTask)
                    .ThenInclude(task => task.Tags)
                .Where(occurrence => occurrence.ScheduledDate >= from && occurrence.ScheduledDate <= to);

            if (!string.IsNullOrWhiteSpace(taskType))
            {
                query = query.Where(occurrence => occurrence.ScheduledTask.TaskType == taskType);
            }

            var rows = await query
                .OrderByDescending(occurrence => occurrence.CompletedDate ?? occurrence.ScheduledDate)
                .ThenByDescending(occurrence => occurrence.OccurrenceID)
                .Take(take)
                .Select(occurrence => new TaskOccurrenceActivityDto(
                    occurrence.OccurrenceID,
                    occurrence.TaskID,
                    occurrence.ScheduledTask.Title,
                    occurrence.ScheduledTask.TaskType,
                    occurrence.ScheduledDate,
                    occurrence.CompletedDate,
                    occurrence.Status,
                    occurrence.Notes,
                    occurrence.ScheduledTask.Tags.Select(tag => tag.Tag)))
                .ToListAsync();

            return Ok(rows);
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateOccurrence(int id, [FromBody] TaskOccurrenceUpdateDto patchDto)
        {
            var existing = await _context.TaskOccurrences
                .Include(occurrence => occurrence.ScheduledTask)
                .SingleOrDefaultAsync(occurrence => occurrence.OccurrenceID == id);
            if (existing == null) return NotFound();

            var originalStatus = existing.Status;
            var originalScheduledDate = existing.ScheduledDate.Date;

            var targetStatus = string.IsNullOrWhiteSpace(patchDto.Status)
                ? null
                : patchDto.Status.Trim();
            if (targetStatus is not null && !OccurrenceStatuses.Contains(targetStatus))
            {
                return BadRequest("Occurrence status must be Scheduled, Completed, Missed, or Skipped.");
            }

            if (patchDto.ScheduledDate.HasValue && targetStatus is null)
            {
                targetStatus = "Scheduled";
            }

            if (targetStatus is not null)
            {
                var transitionError = ValidateStatusTransition(originalStatus, targetStatus, patchDto.ScheduledDate.HasValue);
                if (transitionError is not null)
                {
                    return BadRequest(transitionError);
                }

                existing.Status = targetStatus;
                if (targetStatus == "Completed" && !patchDto.CompletedDate.HasValue)
                {
                    existing.CompletedDate = DateTime.Now;
                }
                else if (targetStatus is "Scheduled" or "Skipped" or "Missed")
                {
                    existing.CompletedDate = null;
                }
            }

            if (patchDto.ScheduledDate.HasValue)
            {
                var newDate = patchDto.ScheduledDate.Value.Date;
                var duplicate = await _context.TaskOccurrences.AnyAsync(occurrence =>
                    occurrence.OccurrenceID != existing.OccurrenceID
                    && occurrence.TaskID == existing.TaskID
                    && occurrence.ScheduledDate.Date == newDate);
                if (duplicate)
                {
                    return Conflict("That task already has an occurrence on the selected date.");
                }

                existing.ScheduledDate = newDate;
            }

            if (patchDto.CompletedDate.HasValue)
            {
                existing.CompletedDate = patchDto.CompletedDate;
            }

            if (patchDto.Notes is not null)
            {
                existing.Notes = string.IsNullOrWhiteSpace(patchDto.Notes) ? null : patchDto.Notes.Trim();
            }
            else
            {
                existing.Notes = DefaultNotes(existing, originalStatus, originalScheduledDate);
            }

            await ReflectSourceChange(existing, originalStatus);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        private static string? ValidateStatusTransition(string originalStatus, string targetStatus, bool isReschedule)
        {
            if (targetStatus == "Completed" && originalStatus is not "Scheduled" and not "Missed")
            {
                return "Only scheduled or missed occurrences can be completed. Reopen the occurrence first.";
            }

            if (targetStatus == "Skipped" && originalStatus is not "Scheduled" and not "Missed")
            {
                return "Only scheduled or missed occurrences can be skipped. Reopen the occurrence first.";
            }

            if (targetStatus == "Scheduled")
            {
                return null;
            }

            if (targetStatus == originalStatus && !isReschedule)
            {
                return null;
            }

            return null;
        }

        private static string? DefaultNotes(TaskOccurrence occurrence, string originalStatus, DateTime originalScheduledDate)
        {
            if (occurrence.Status == "Completed" && originalStatus != "Completed")
            {
                return "Completed from the shared schedule.";
            }

            if (occurrence.Status == "Skipped" && originalStatus != "Skipped")
            {
                return "Skipped from the shared schedule.";
            }

            if (occurrence.ScheduledDate.Date != originalScheduledDate)
            {
                return $"Moved from {originalScheduledDate:yyyy-MM-dd}.";
            }

            if (occurrence.Status == "Scheduled" && originalStatus != "Scheduled")
            {
                return "Reopened from the shared schedule.";
            }

            return occurrence.Notes;
        }

        private async Task ReflectSourceChange(TaskOccurrence occurrence, string originalStatus)
        {
            if (occurrence.ScheduledTask.TaskType != "Backup")
            {
                return;
            }

            var job = await _context.BackupJobs
                .FirstOrDefaultAsync(job => job.TaskID == occurrence.TaskID);
            if (job is null)
            {
                return;
            }

            if (occurrence.Status != "Completed")
            {
                if (originalStatus == "Completed")
                {
                    await _context.BackupJobLogs
                        .Where(log => log.OccurrenceID == occurrence.OccurrenceID && log.BackupJobID == job.BackupJobID)
                        .ExecuteDeleteAsync();

                    job.LastRun = await _context.BackupJobLogs
                        .Where(log => log.BackupJobID == job.BackupJobID && log.Success)
                        .OrderByDescending(log => log.Timestamp)
                        .Select(log => (DateTime?)log.Timestamp)
                        .FirstOrDefaultAsync();
                }

                return;
            }

            var completedAt = occurrence.CompletedDate ?? DateTime.Now;
            job.LastRun = completedAt;

            var existingLog = await _context.BackupJobLogs
                .FirstOrDefaultAsync(log => log.OccurrenceID == occurrence.OccurrenceID && log.BackupJobID == job.BackupJobID);
            if (existingLog is not null)
            {
                existingLog.Timestamp = completedAt;
                existingLog.Success = true;
                existingLog.Message = occurrence.Notes ?? "Completed from the master schedule.";
                return;
            }

            _context.BackupJobLogs.Add(new BackupJobLog
            {
                BackupJobID = job.BackupJobID,
                OccurrenceID = occurrence.OccurrenceID,
                Timestamp = completedAt,
                Success = true,
                Message = occurrence.Notes ?? "Completed from the shared schedule."
            });
        }
    }
}

