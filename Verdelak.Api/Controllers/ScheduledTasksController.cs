using Verdelak.Api.Data;
using Backup.Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Models;
using Verdelak.Api.Dtos;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/tasks")]
    public class ScheduledTasksController : ControllerBase
    {
        private readonly VerdelakDbContext _context;

        public ScheduledTasksController(VerdelakDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? tag, [FromQuery] bool? isActive, [FromQuery] string? taskType)
        {
            var query = _context.ScheduledTasks
                .Include(task => task.Tags)
                .AsQueryable();

            if (isActive.HasValue)
                query = query.Where(t => t.IsActive == isActive.Value);

            if (!string.IsNullOrWhiteSpace(taskType))
                query = query.Where(t => t.TaskType == taskType);

            if (!string.IsNullOrWhiteSpace(tag))
            {
                query = query.Where(t => _context.ScheduledTaskTags
                    .Where(tagEntry => tagEntry.Tag == tag)
                    .Select(tagEntry => tagEntry.TaskID)
                    .Contains(t.TaskID));
            }

            var tasks = await query
                .OrderBy(t => t.TaskType)
                .ThenBy(t => t.Title)
                .ToListAsync();
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var task = await _context.ScheduledTasks
                .Include(item => item.Tags)
                .SingleOrDefaultAsync(item => item.TaskID == id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ScheduledTaskCreateDto dto)
        {
            var entity = new ScheduledTask
            {
                Title = dto.Title,
                Description = dto.Description,
                TaskType = dto.TaskType,
                IsActive = dto.IsActive,
                ScheduleType = dto.ScheduleType,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                RecurrencePattern = dto.RecurrencePattern,
                // navigation props left at defaults (empty lists)
            };

            _context.ScheduledTasks.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ScheduledTaskCreateDto taskDto)
        {
            var existing = await _context.ScheduledTasks.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = taskDto.Title;
            existing.Description = taskDto.Description;
            existing.TaskType = taskDto.TaskType;
            existing.IsActive = taskDto.IsActive;
            existing.ScheduleType = taskDto.ScheduleType;
            existing.StartDate = taskDto.StartDate;
            existing.EndDate = taskDto.EndDate;
            existing.RecurrencePattern = taskDto.RecurrencePattern;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.ScheduledTasks
                .Include(task => task.Occurrences)
                .Include(task => task.Tags)
                .SingleOrDefaultAsync(task => task.TaskID == id);
            if (existing == null) return NotFound();

            _context.TaskOccurrences.RemoveRange(existing.Occurrences);
            _context.ScheduledTaskTags.RemoveRange(existing.Tags);
            _context.ScheduledTasks.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/generate-occurrences")]
        public async Task<IActionResult> GenerateOccurrences(
            int id,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var exists = await _context.ScheduledTasks.AnyAsync(task => task.TaskID == id);
            if (!exists) return NotFound();

            var start = (from ?? DateTime.Today).Date;
            var end = (to ?? DateTime.Today.AddDays(31)).Date;
            if (start > end) return BadRequest("Choose a valid occurrence generation date range.");

            var scheduler = new SchedulerService(_context);
            var created = await scheduler.GenerateOccurrences(start, end, id);
            return Ok(new { created });
        }

        [HttpGet("generate-occurrences/preview")]
        public async Task<IActionResult> PreviewOccurrencesForTasks(
            [FromQuery] string? taskType,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var generationPlan = await BuildGenerationPlan(taskType, from, to, createOccurrences: false);
            return generationPlan.Result is not null ? generationPlan.Result : Ok(generationPlan.Value);
        }

        [HttpPost("generate-occurrences")]
        public async Task<IActionResult> GenerateOccurrencesForTasks(
            [FromQuery] string? taskType,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var generationPlan = await BuildGenerationPlan(taskType, from, to, createOccurrences: true);
            return generationPlan.Result is not null ? generationPlan.Result : Ok(generationPlan.Value);
        }

        private async Task<ActionResult<ScheduleGenerationResultDto>> BuildGenerationPlan(
            string? taskType,
            DateTime? from,
            DateTime? to,
            bool createOccurrences)
        {
            var start = (from ?? DateTime.Today).Date;
            var end = (to ?? DateTime.Today.AddDays(31)).Date;
            if (start > end) return BadRequest("Choose a valid occurrence generation date range.");

            var query = _context.ScheduledTasks.Where(task => task.IsActive);
            if (!string.IsNullOrWhiteSpace(taskType))
            {
                query = query.Where(task => task.TaskType == taskType);
            }

            var tasks = await query
                .Select(task => new { task.TaskID, task.Title, task.TaskType })
                .OrderBy(task => task.TaskType)
                .ThenBy(task => task.Title)
                .ToListAsync();

            var scheduler = new SchedulerService(_context);
            var created = 0;
            var missing = 0;
            var sources = new Dictionary<string, ScheduleGenerationSourceSummaryDto>();
            var taskSummaries = new List<ScheduleGenerationTaskSummaryDto>();
            foreach (var task in tasks)
            {
                var taskMissing = scheduler.PreviewMissingOccurrences(start, end, task.TaskID);
                var taskCreated = createOccurrences ? await scheduler.GenerateOccurrences(start, end, task.TaskID) : 0;
                created += taskCreated;
                missing += taskMissing;

                var source = ScheduleSource(task.TaskType);
                taskSummaries.Add(new ScheduleGenerationTaskSummaryDto(
                    task.TaskID,
                    task.Title,
                    task.TaskType,
                    source,
                    taskMissing,
                    taskCreated));

                if (!sources.TryGetValue(source, out var summary))
                {
                    summary = new ScheduleGenerationSourceSummaryDto(source, 0, 0, 0);
                }

                sources[source] = summary with
                {
                    ActiveTaskCount = summary.ActiveTaskCount + 1,
                    CreatedCount = summary.CreatedCount + taskCreated,
                    MissingCount = summary.MissingCount + taskMissing
                };
            }

            return new ScheduleGenerationResultDto(start, end, tasks.Count, created, sources.Values.OrderBy(source => source.Source), taskSummaries, missing);
        }


        private static string ScheduleSource(string taskType) => taskType switch
        {
            "Backup" => "Backups",
            "Fish" => "Fish",
            "Gardening" => "Gardening",
            _ => "Chores"
        };
        [HttpPost("{id}/tags")]
        public async Task<IActionResult> AssignTags(int id, [FromBody] List<string> tags)
        {
            var existingTags = _context.ScheduledTaskTags.Where(t => t.TaskID == id);
            _context.ScheduledTaskTags.RemoveRange(existingTags);

            foreach (var tag in tags)
            {
                _context.ScheduledTaskTags.Add(new ScheduledTaskTag { TaskID = id, Tag = tag });
            }

            await _context.SaveChangesAsync();
            return Ok(tags);
        }
    }
}


