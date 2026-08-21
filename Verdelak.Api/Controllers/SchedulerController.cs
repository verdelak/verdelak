
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Verdelak.Api.Data;
using Verdelak.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileSystemGlobbing.Internal;
using Microsoft.Extensions.Logging;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Backup.Api.Controllers
{

    public class SchedulerService
    {
        private readonly VerdelakDbContext _context;

        public SchedulerService(VerdelakDbContext context)
        {
            _context = context;
        }

        public async Task<int> GenerateOccurrences(DateTime fromDate, DateTime toDate, int? taskId = null)
        {
            var tasks = _context.ScheduledTasks
                .Where(t => t.IsActive && (!taskId.HasValue || t.TaskID == taskId.Value))
                .ToList();

            int created = 0;
            foreach (var task in tasks)
            {
                var dates = MissingDatesForTask(task, fromDate, toDate);
                foreach (var date in dates)
                {
                    _context.TaskOccurrences.Add(new TaskOccurrence
                    {
                        TaskID = task.TaskID,
                        ScheduledDate = date,
                        Status = "Scheduled"
                    });
                    created++;
                }
            }

            await _context.SaveChangesAsync();
            return created;
        }

        public int PreviewMissingOccurrences(DateTime fromDate, DateTime toDate, int taskId)
        {
            var task = _context.ScheduledTasks.SingleOrDefault(t => t.IsActive && t.TaskID == taskId);
            return task is null ? 0 : MissingDatesForTask(task, fromDate, toDate).Count;
        }

        private List<DateTime> MissingDatesForTask(ScheduledTask task, DateTime fromDate, DateTime toDate)
        {
            var start = task.StartDate.Date > fromDate.Date ? task.StartDate.Date : fromDate.Date;
            var end = task.EndDate.HasValue && task.EndDate.Value.Date < toDate.Date
                ? task.EndDate.Value.Date
                : toDate.Date;
            if (end < start)
            {
                return [];
            }

            return GetDatesForTask(task.ScheduleType, task.RecurrencePattern, start, end)
                .Where(date => !_context.TaskOccurrences.Any(o => o.TaskID == task.TaskID && o.ScheduledDate.Date == date))
                .ToList();
        }

        private List<DateTime> GetDatesForTask(string scheduleType, string pattern, DateTime start, DateTime end)
        {
            var dates = new List<DateTime>();

            if (scheduleType == "OneTime")
            {
                if (DateTime.TryParse(pattern, out var oneTimeDate) && oneTimeDate.Date >= start && oneTimeDate.Date <= end)
                {
                    dates.Add(oneTimeDate.Date);
                }
            }
            else if (scheduleType == "Daily")
            {
                var interval = int.TryParse(PatternValue(pattern, "interval"), out var parsedInterval)
                    ? Math.Clamp(parsedInterval, 1, 365)
                    : 1;
                var anchor = DateTime.TryParse(PatternValue(pattern, "anchor"), out var parsedAnchor)
                    ? parsedAnchor.Date
                    : start.Date;

                for (var date = start; date <= end; date = date.AddDays(1))
                {
                    if (((date.Date - anchor).Days % interval) == 0)
                    {
                        dates.Add(date);
                    }
                }
            }
            else if (scheduleType == "Interval")
            {
                var unit = PatternValue(pattern, "unit")?.ToLowerInvariant() ?? "days";
                var interval = int.TryParse(PatternValue(pattern, "interval"), out var parsedInterval)
                    ? Math.Clamp(parsedInterval, 1, 365)
                    : 1;
                var anchor = DateTime.TryParse(PatternValue(pattern, "anchor"), out var parsedAnchor)
                    ? parsedAnchor.Date
                    : start.Date;

                if (unit is "weeks" or "week")
                {
                    interval *= 7;
                }

                if (unit is "months" or "month")
                {
                    for (var date = anchor; date <= end; date = date.AddMonths(interval))
                    {
                        if (date >= start)
                        {
                            dates.Add(date.Date);
                        }
                    }
                }
                else
                {
                    for (var date = start; date <= end; date = date.AddDays(1))
                    {
                        if (((date.Date - anchor).Days % interval) == 0)
                        {
                            dates.Add(date.Date);
                        }
                    }
                }
            }
            else if (scheduleType == "Weekly")
            {
                var daysOfWeek = PatternValue(pattern, "days")?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    ?? PatternBody(pattern).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var validDays = daysOfWeek.Select(ParseDayOfWeek).Where(day => day.HasValue).Select(day => day!.Value).ToHashSet();
                if (validDays.Count == 0)
                {
                    validDays.Add(DayOfWeek.Sunday);
                }

                for (var date = start; date <= end; date = date.AddDays(1))
                {
                    if (validDays.Contains(date.DayOfWeek))
                        dates.Add(date);
                }
            }
            else if (scheduleType == "Monthly")
            {
                var days = PatternValue(pattern, "day")?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    ?? PatternBody(pattern).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var daysInt = days
                    .Select(d => int.TryParse(d.Trim(), out var val) ? val : 1)
                    .Where(day => day >= 1 && day <= 31)
                    .DefaultIfEmpty(1)
                    .ToList();
                var interval = int.TryParse(PatternValue(pattern, "interval"), out var parsedInterval)
                    ? Math.Clamp(parsedInterval, 1, 24)
                    : 1;

                for (var date = new DateTime(start.Year, start.Month, 1); date <= end; date = date.AddMonths(1))
                {
                    var monthOffset = ((date.Year - start.Year) * 12) + date.Month - start.Month;
                    if (monthOffset % interval != 0)
                    {
                        continue;
                    }

                    foreach (var day in daysInt)
                    {
                        if (DateTime.DaysInMonth(date.Year, date.Month) >= day)
                            dates.Add(new DateTime(date.Year, date.Month, day));
                    }
                }
            }
            else if (scheduleType == "Cron")
            {
                // Placeholder: Extend with NCrontab or similar parser
            }

            return dates;
        }

        private static string PatternBody(string pattern)
        {
            var separator = pattern.IndexOf(':');
            return separator >= 0 ? pattern[(separator + 1)..] : pattern;
        }

        private static string? PatternValue(string pattern, string key)
        {
            return PatternBody(pattern)
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(part => part.Split('=', 2, StringSplitOptions.TrimEntries))
                .Where(parts => parts.Length == 2)
                .Where(parts => string.Equals(parts[0], key, StringComparison.OrdinalIgnoreCase))
                .Select(parts => parts[1])
                .FirstOrDefault();
        }

        private static DayOfWeek? ParseDayOfWeek(string value)
        {
            return value.Trim().ToLowerInvariant() switch
            {
                "sun" or "sunday" => DayOfWeek.Sunday,
                "mon" or "monday" => DayOfWeek.Monday,
                "tue" or "tues" or "tuesday" => DayOfWeek.Tuesday,
                "wed" or "wednesday" => DayOfWeek.Wednesday,
                "thu" or "thur" or "thurs" or "thursday" => DayOfWeek.Thursday,
                "fri" or "friday" => DayOfWeek.Friday,
                "sat" or "saturday" => DayOfWeek.Saturday,
                _ => Enum.TryParse<DayOfWeek>(value.Trim(), true, out var day) ? day : null
            };
        }
    }


    public class BackgroundSchedulerService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public BackgroundSchedulerService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine($"[BackgroundSchedulerService] Starting scheduler at {DateTime.Now}");
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<VerdelakDbContext>();
                var scheduler = new SchedulerService(context);

                var lastRun = context.Set<SchedulerRunHistory>().FirstOrDefault();
                if (lastRun != null && lastRun.LastRunDate.Date == DateTime.Now.Date)
                {
                    Console.WriteLine("[BackgroundSchedulerService] Scheduler already ran today. Skipping this cycle.");
                    await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
                    continue;
                }

                var now = DateTime.Now;
                var rangeEnd = now.AddDays(7);
                int created = await scheduler.GenerateOccurrences(now, rangeEnd);
                if (lastRun == null)
                {
                    context.Add(new SchedulerRunHistory { LastRunDate = DateTime.Now });
                }
                else
                {
                    lastRun.LastRunDate = DateTime.Now;
                    context.Update(lastRun);
                }
                await context.SaveChangesAsync();
                Console.WriteLine($"[BackgroundSchedulerService] {created} occurrences scheduled between {now:d} and {rangeEnd:d}.");

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }


}


