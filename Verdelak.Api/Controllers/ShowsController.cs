using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/shows")]
public class ShowsController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<ShowSeriesSummaryDto>> List(
        [FromQuery] string? q,
        [FromQuery] string? status = "all",
        [FromQuery] string? watch = "all",
        [FromQuery] string? sort = "title",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.ShowSeries
            .Include(series => series.Seasons)
                .ThenInclude(season => season.BoxSetSeasons)
                    .ThenInclude(link => link.BoxSet)
            .Include(series => series.BoxSets)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(series =>
                series.Title.Contains(term) ||
                (series.SortTitle != null && series.SortTitle.Contains(term)) ||
                (series.Notes != null && series.Notes.Contains(term)) ||
                series.Seasons.Any(season =>
                    season.SeasonLabel.Contains(term) ||
                    (season.Format != null && season.Format.Contains(term)) ||
                    (season.Notes != null && season.Notes.Contains(term))));
        }

        query = ApplyStatusFilter(query, status);
        query = ApplyWatchFilter(query, watch);

        query = sort?.ToLowerInvariant() switch
        {
            "-title" => query.OrderByDescending(series => series.SortTitle ?? series.Title),
            "owned" => query.OrderByDescending(series => series.Seasons.Count(season => season.StatusID == OwnedStatus)).ThenBy(series => series.SortTitle ?? series.Title),
            "wanted" => query.OrderByDescending(series => series.Seasons.Count(season => season.StatusID == WantedStatus)).ThenBy(series => series.SortTitle ?? series.Title),
            "watch" => query.OrderByDescending(series => series.WantToWatch || series.Seasons.Any(season => season.WantToWatch)).ThenBy(series => series.SortTitle ?? series.Title),
            _ => query.OrderBy(series => series.SortTitle ?? series.Title)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 500);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(series => ToSummaryDto(series))
            .ToListAsync(cancellationToken);

        return new PagedResult<ShowSeriesSummaryDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ShowSeriesDetailDto>> Get(int id, CancellationToken cancellationToken)
    {
        var series = await IncludeSeasons()
            .AsNoTracking()
            .FirstOrDefaultAsync(series => series.Id == id, cancellationToken);

        return series is null ? NotFound() : ToDetailDto(series);
    }

    [AllowAnonymous]
    [HttpGet("reports/summary")]
    public async Task<ShowReportSummaryDto> GetReportSummary(CancellationToken cancellationToken)
    {
        var series = await IncludeSeasonsAndBoxSets()
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        var seasons = series.SelectMany(item => item.Seasons).ToList();
        var scheduledGoalTitles = await ShowGoalItemsQuery()
            .Select(item => item.Title)
            .ToListAsync(cancellationToken);
        var scheduledGoalTitleSet = scheduledGoalTitles.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var scheduledGoalSeasonCount = series.Sum(item => item.Seasons
            .Count(season => scheduledGoalTitleSet.Contains(ShowGoalTitle(item.Title, season.SeasonLabel))));

        return new ShowReportSummaryDto(
            seasons.Count(season => season.StatusID == WantedStatus),
            seasons.Count(IsMissingSeason),
            series.Count(item => item.Seasons.Count == 0),
            seasons.Count(season => season.WantToWatch || !season.IsWatched),
            seasons.Count(season => season.WantToRewatch),
            scheduledGoalSeasonCount);
    }

    [AllowAnonymous]
    [HttpGet("reports/seasons")]
    public async Task<IEnumerable<ShowSeasonReportDto>> GetSeasonReport(
        [FromQuery] string? report = "wanted",
        [FromQuery] string? q = null,
        CancellationToken cancellationToken = default)
    {
        var query = IncludeSeasonsAndBoxSets().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(series =>
                series.Title.Contains(term) ||
                (series.SortTitle != null && series.SortTitle.Contains(term)) ||
                series.Seasons.Any(season => season.SeasonLabel.Contains(term)));
        }

        var series = await query
            .OrderBy(item => item.SortTitle ?? item.Title)
            .ToListAsync(cancellationToken);
        var scheduledGoalYearsByTitle = await ScheduledShowGoalYears(cancellationToken);
        var normalized = report?.Trim().ToLowerInvariant();
        var rows = series.SelectMany(item => item.Seasons.Select(season => ToSeasonReportDto(item, season, scheduledGoalYearsByTitle)));

        rows = normalized switch
        {
            "missing" => rows.Where(row => row.IsMissing),
            "watch" => rows.Where(row => row.WantToWatch || !row.IsWatched),
            "rewatch" => rows.Where(row => row.WantToRewatch),
            "unwatched" => rows.Where(row => !row.IsWatched),
            "scheduled" => rows.Where(row => row.ScheduledGoalYears.Any()),
            "unscheduled" => rows.Where(row => row.SeasonId != null && !row.ScheduledGoalYears.Any()),
            "all" => rows,
            _ => rows.Where(row => row.IsWanted)
        };

        var seasonRows = rows
            .OrderBy(row => row.SeriesTitle)
            .ThenBy(row => row.SeasonNumber ?? int.MaxValue)
            .ThenBy(row => row.SeasonLabel)
            .ToList();

        if (normalized is "missing" or "all")
        {
            seasonRows.AddRange(series
                .Where(item => item.Seasons.Count == 0)
                .Select(item => new ShowSeasonReportDto(
                    item.Id,
                    item.Title,
                    null,
                    null,
                    "No seasons entered",
                    null,
                    null,
                    false,
                    false,
                    false,
                    true,
                    false,
                    item.WantToWatch,
                    item.WantToRewatch,
                    [],
                    [])));
        }

        return seasonRows;
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<ShowSeriesDetailDto>> Create(UpsertShowSeriesDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateSeries(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var now = DateTime.UtcNow;
        var series = new ShowSeries
        {
            Title = dto.Title.Trim(),
            SortTitle = Trim(dto.SortTitle),
            Notes = Trim(dto.Notes),
            WantToWatch = dto.WantToWatch ?? false,
            WantToRewatch = dto.WantToRewatch ?? false,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        context.ShowSeries.Add(series);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = series.Id }, await LoadDetail(series.Id, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ShowSeriesDetailDto>> Update(int id, UpsertShowSeriesDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateSeries(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var series = await context.ShowSeries.FindAsync([id], cancellationToken);
        if (series is null)
        {
            return NotFound();
        }

        series.Title = dto.Title.Trim();
        series.SortTitle = Trim(dto.SortTitle);
        series.Notes = Trim(dto.Notes);
        series.WantToWatch = dto.WantToWatch ?? false;
        series.WantToRewatch = dto.WantToRewatch ?? false;
        series.UpdatedAtUtc = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDetail(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var series = await context.ShowSeries
            .Include(item => item.Seasons)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (series is null)
        {
            return NotFound();
        }

        var seasonIds = series.Seasons.Select(season => season.Id).ToList();
        if (seasonIds.Count > 0)
        {
            await context.ShowBoxSetSeasons
                .Where(link => seasonIds.Contains(link.ShowSeasonId))
                .ExecuteDeleteAsync(cancellationToken);
        }

        context.ShowSeries.Remove(series);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("{seriesId:int}/seasons")]
    public async Task<ActionResult<ShowSeriesDetailDto>> CreateSeason(int seriesId, UpsertShowSeasonDto dto, CancellationToken cancellationToken)
    {
        var series = await context.ShowSeries.FindAsync([seriesId], cancellationToken);
        if (series is null)
        {
            return NotFound();
        }

        var validation = ValidateSeason(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var now = DateTime.UtcNow;
        var season = new ShowSeason { ShowSeriesId = seriesId, CreatedAtUtc = now, UpdatedAtUtc = now };
        ApplySeason(season, dto);
        context.ShowSeasons.Add(season);
        series.UpdatedAtUtc = now;
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDetail(seriesId, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("{seriesId:int}/seasons/bulk")]
    public async Task<ActionResult<ShowSeriesDetailDto>> BulkCreateSeasons(int seriesId, BulkAddShowSeasonsDto dto, CancellationToken cancellationToken)
    {
        var series = await context.ShowSeries
            .Include(item => item.Seasons)
            .FirstOrDefaultAsync(item => item.Id == seriesId, cancellationToken);

        if (series is null)
        {
            return NotFound();
        }

        if (dto.StartSeason < 0 || dto.EndSeason < dto.StartSeason)
        {
            return BadRequest("Enter a valid season range.");
        }

        if (dto.EndSeason - dto.StartSeason > 100)
        {
            return BadRequest("Bulk season range cannot exceed 100 seasons.");
        }

        if (!string.IsNullOrWhiteSpace(dto.StatusID) && dto.StatusID.Trim().ToUpperInvariant() is not (OwnedStatus or WantedStatus))
        {
            return BadRequest("Season status must be H or W.");
        }

        var existingNumbers = series.Seasons
            .Where(season => season.SeasonNumber is not null)
            .Select(season => season.SeasonNumber!.Value)
            .ToHashSet();
        var now = DateTime.UtcNow;
        var status = dto.StatusID?.Trim().ToUpperInvariant() == WantedStatus ? WantedStatus : OwnedStatus;

        for (var seasonNumber = dto.StartSeason; seasonNumber <= dto.EndSeason; seasonNumber++)
        {
            if (existingNumbers.Contains(seasonNumber))
            {
                continue;
            }

            context.ShowSeasons.Add(new ShowSeason
            {
                ShowSeriesId = seriesId,
                SeasonNumber = seasonNumber,
                SeasonLabel = seasonNumber == 0 ? "Specials" : seasonNumber.ToString(),
                StatusID = status,
                Format = Trim(dto.Format),
                WantToWatch = dto.WantToWatch ?? false,
                WantToRewatch = dto.WantToRewatch ?? false,
                Notes = Trim(dto.Notes),
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            });
        }

        series.UpdatedAtUtc = now;
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDetail(seriesId, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("seasons/{seasonId:int}")]
    public async Task<ActionResult<ShowSeriesDetailDto>> UpdateSeason(int seasonId, UpsertShowSeasonDto dto, CancellationToken cancellationToken)
    {
        var season = await context.ShowSeasons.FindAsync([seasonId], cancellationToken);
        if (season is null)
        {
            return NotFound();
        }

        var validation = ValidateSeason(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        ApplySeason(season, dto);
        season.UpdatedAtUtc = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDetail(season.ShowSeriesId, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("seasons/{seasonId:int}")]
    public async Task<ActionResult<ShowSeriesDetailDto>> DeleteSeason(int seasonId, CancellationToken cancellationToken)
    {
        var season = await context.ShowSeasons.FindAsync([seasonId], cancellationToken);
        if (season is null)
        {
            return NotFound();
        }

        var seriesId = season.ShowSeriesId;
        await context.ShowBoxSetSeasons
            .Where(link => link.ShowSeasonId == seasonId)
            .ExecuteDeleteAsync(cancellationToken);
        context.ShowSeasons.Remove(season);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadDetail(seriesId, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("{seriesId:int}/boxsets")]
    public async Task<ActionResult<ShowSeriesDetailDto>> CreateBoxSet(int seriesId, UpsertShowBoxSetDto dto, CancellationToken cancellationToken)
    {
        var series = await IncludeSeasonsAndBoxSets()
            .FirstOrDefaultAsync(series => series.Id == seriesId, cancellationToken);

        if (series is null)
        {
            return NotFound();
        }

        var validation = ValidateBoxSet(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var now = DateTime.UtcNow;
        var boxSet = new ShowBoxSet
        {
            ShowSeriesId = seriesId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        await ApplyBoxSet(series, boxSet, dto, now, cancellationToken);
        context.ShowBoxSets.Add(boxSet);
        series.UpdatedAtUtc = now;
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDetail(seriesId, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("boxsets/{boxSetId:int}")]
    public async Task<ActionResult<ShowSeriesDetailDto>> UpdateBoxSet(int boxSetId, UpsertShowBoxSetDto dto, CancellationToken cancellationToken)
    {
        var boxSet = await context.ShowBoxSets
            .Include(item => item.Seasons)
            .FirstOrDefaultAsync(item => item.Id == boxSetId, cancellationToken);

        if (boxSet is null)
        {
            return NotFound();
        }

        var series = await IncludeSeasonsAndBoxSets()
            .FirstAsync(series => series.Id == boxSet.ShowSeriesId, cancellationToken);
        var validation = ValidateBoxSet(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var now = DateTime.UtcNow;
        boxSet.Seasons.Clear();
        await ApplyBoxSet(series, boxSet, dto, now, cancellationToken);
        boxSet.UpdatedAtUtc = now;
        series.UpdatedAtUtc = now;
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDetail(series.Id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("boxsets/{boxSetId:int}")]
    public async Task<ActionResult<ShowSeriesDetailDto>> DeleteBoxSet(int boxSetId, CancellationToken cancellationToken)
    {
        var boxSet = await context.ShowBoxSets.FindAsync([boxSetId], cancellationToken);
        if (boxSet is null)
        {
            return NotFound();
        }

        var seriesId = boxSet.ShowSeriesId;
        context.ShowBoxSets.Remove(boxSet);
        await context.SaveChangesAsync(cancellationToken);
        return await LoadDetail(seriesId, cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{seriesId:int}/goals")]
    public async Task<ActionResult<CreateShowGoalItemsResultDto>> CreateGoalItems(
        int seriesId,
        CreateShowGoalItemsDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.Year < 2000 || dto.Year > 2100)
        {
            return BadRequest("Choose a goal year between 2000 and 2100.");
        }

        var series = await IncludeSeasonsAndBoxSets()
            .AsNoTracking()
            .FirstOrDefaultAsync(series => series.Id == seriesId, cancellationToken);
        if (series is null)
        {
            return NotFound();
        }

        var requestedIds = (dto.SeasonIds ?? []).Where(id => id > 0).ToHashSet();
        var seasons = series.Seasons
            .Where(season => requestedIds.Count == 0
                ? season.WantToWatch || season.WantToRewatch || !season.IsWatched
                : requestedIds.Contains(season.Id))
            .OrderBy(season => season.SeasonNumber ?? int.MaxValue)
            .ThenBy(season => season.SeasonLabel)
            .ToList();
        if (seasons.Count == 0)
        {
            return BadRequest("Choose at least one season to add to Goals.");
        }

        foreach (var season in seasons)
        {
            season.Series = series;
        }

        return await CreateGoalItemsForSeasons(dto, seasons, cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("goals/batch")]
    public async Task<ActionResult<CreateShowGoalItemsResultDto>> CreateGoalItemsBatch(
        CreateShowGoalItemsDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.Year < 2000 || dto.Year > 2100)
        {
            return BadRequest("Choose a goal year between 2000 and 2100.");
        }

        var requestedIds = (dto.SeasonIds ?? []).Where(id => id > 0).ToHashSet();
        if (requestedIds.Count == 0)
        {
            return BadRequest("Choose at least one season to add to Goals.");
        }

        var seasons = await context.ShowSeasons
            .Include(season => season.Series)
            .Include(season => season.BoxSetSeasons)
                .ThenInclude(link => link.BoxSet)
            .Where(season => requestedIds.Contains(season.Id))
            .OrderBy(season => season.Series!.SortTitle ?? season.Series!.Title)
            .ThenBy(season => season.SeasonNumber ?? int.MaxValue)
            .ThenBy(season => season.SeasonLabel)
            .ToListAsync(cancellationToken);
        if (seasons.Count == 0)
        {
            return BadRequest("Choose at least one valid season to add to Goals.");
        }

        return await CreateGoalItemsForSeasons(dto, seasons, cancellationToken);
    }

    private IQueryable<ShowSeries> IncludeSeasons() =>
        context.ShowSeries.Include(series => series.Seasons);

    private IQueryable<ShowSeries> IncludeSeasonsAndBoxSets() =>
        context.ShowSeries
            .Include(series => series.Seasons)
                .ThenInclude(season => season.BoxSetSeasons)
                    .ThenInclude(link => link.BoxSet)
            .Include(series => series.BoxSets)
                .ThenInclude(boxSet => boxSet.Seasons)
                    .ThenInclude(link => link.Season);

    private static IQueryable<ShowSeries> ApplyStatusFilter(IQueryable<ShowSeries> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "owned" or "h" => query.Where(series => series.Seasons.Any(season => season.StatusID == OwnedStatus)),
            "wanted" or "want" or "w" => query.Where(series => series.Seasons.Any(season => season.StatusID == WantedStatus)),
            "missing" => query.Where(series => series.Seasons.Any(season => season.StatusID == WantedStatus) || !series.Seasons.Any()),
            _ => query
        };
    }

    private static IQueryable<ShowSeries> ApplyWatchFilter(IQueryable<ShowSeries> query, string? watch)
    {
        var normalized = watch?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "watch" => query.Where(series => series.WantToWatch || series.Seasons.Any(season => season.WantToWatch)),
            "rewatch" => query.Where(series => series.WantToRewatch || series.Seasons.Any(season => season.WantToRewatch)),
            "watched" => query.Where(series => series.Seasons.Any(season => season.IsWatched)),
            "unwatched" => query.Where(series => !series.Seasons.Any(season => season.IsWatched)),
            _ => query
        };
    }

    private async Task<ShowSeriesDetailDto> LoadDetail(int id, CancellationToken cancellationToken) =>
        ToDetailDto(await IncludeSeasonsAndBoxSets().AsNoTracking().SingleAsync(series => series.Id == id, cancellationToken));

    private static ShowSeriesSummaryDto ToSummaryDto(ShowSeries series) =>
        new(
            series.Id,
            series.Title,
            series.SortTitle,
            series.Notes,
            series.WantToWatch,
            series.WantToRewatch,
            series.Seasons.Count(season =>
                season.StatusID == OwnedStatus ||
                season.BoxSetSeasons.Any(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus)),
            series.Seasons.Count(season => season.StatusID == WantedStatus),
            series.Seasons.Count(season => season.IsWatched),
            series.Seasons.Count,
            series.LegacyShowsToWatchId);

    private static ShowSeriesDetailDto ToDetailDto(ShowSeries series) =>
        new(
            series.Id,
            series.Title,
            series.SortTitle,
            series.Notes,
            series.WantToWatch,
            series.WantToRewatch,
            series.LegacyShowsToWatchId,
            series.Seasons
                .OrderBy(season => season.SeasonNumber ?? int.MaxValue)
                .ThenBy(season => season.SeasonLabel)
                .Select(ToSeasonDto),
            series.BoxSets
                .OrderBy(boxSet => boxSet.Name)
                .Select(ToBoxSetDto),
            series.Seasons
                .OrderBy(season => season.SeasonNumber ?? int.MaxValue)
                .ThenBy(season => season.SeasonLabel)
                .Where(season => season.StatusID == WantedStatus
                    || !season.BoxSetSeasons.Any(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus))
                .Select(ToOwnershipGapDto));

    private static ShowSeasonDto ToSeasonDto(ShowSeason season) =>
        new(
            season.Id,
            season.ShowSeriesId,
            season.SeasonNumber,
            season.SeasonLabel,
            season.StatusID,
            season.Format,
            season.BoxSetSeasons.Any(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus),
            season.BoxSetSeasons
                .Where(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus)
                .Select(link => link.BoxSet!.Name)
                .OrderBy(name => name),
            season.IsWatched,
            season.WantToWatch,
            season.WantToRewatch,
            season.LastWatchedDate,
            season.Notes);

    private static ShowBoxSetDto ToBoxSetDto(ShowBoxSet boxSet) =>
        new(
            boxSet.Id,
            boxSet.ShowSeriesId,
            boxSet.Name,
            boxSet.StatusID,
            boxSet.Format,
            boxSet.IsCompleteSeries,
            boxSet.Notes,
            boxSet.Seasons.Select(link => link.ShowSeasonId).OrderBy(id => id),
            boxSet.Seasons
                .Where(link => link.Season is not null)
                .OrderBy(link => link.Season!.SeasonNumber ?? int.MaxValue)
                .ThenBy(link => link.Season!.SeasonLabel)
                .Select(link => link.Season!.SeasonLabel));

    private static ShowOwnershipGapDto ToOwnershipGapDto(ShowSeason season) =>
        new(
            season.Id,
            season.SeasonLabel,
            season.StatusID == OwnedStatus,
            season.BoxSetSeasons.Any(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus),
            season.StatusID == WantedStatus,
            season.Format,
            season.BoxSetSeasons
                .Where(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus)
                .Select(link => link.BoxSet!.Name)
                .OrderBy(name => name));

    private static ShowSeasonReportDto ToSeasonReportDto(ShowSeries series, ShowSeason season, IReadOnlyDictionary<string, IReadOnlyList<int>> scheduledGoalYearsByTitle)
    {
        var isDirectlyOwned = season.StatusID == OwnedStatus;
        var ownedBoxSetNames = season.BoxSetSeasons
            .Where(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus)
            .Select(link => link.BoxSet!.Name)
            .OrderBy(name => name)
            .ToList();
        var isOwnedByBoxSet = ownedBoxSetNames.Count > 0;
        var goalTitle = ShowGoalTitle(series.Title, season.SeasonLabel);
        var scheduledGoalYears = scheduledGoalYearsByTitle.TryGetValue(goalTitle, out var years) ? years : [];

        return new ShowSeasonReportDto(
            series.Id,
            series.Title,
            season.Id,
            season.SeasonNumber,
            season.SeasonLabel,
            season.StatusID,
            season.Format,
            isDirectlyOwned,
            isOwnedByBoxSet,
            season.StatusID == WantedStatus,
            !isDirectlyOwned && !isOwnedByBoxSet,
            season.IsWatched,
            season.WantToWatch,
            season.WantToRewatch,
            ownedBoxSetNames,
            scheduledGoalYears);
    }

    private IQueryable<PlanItem> ShowGoalItemsQuery() =>
        context.PlanItems
            .AsNoTracking()
            .Include(item => item.AnnualPlan)
            .Where(item => item.AnnualPlan.Status != AnnualPlanStatus.Archived)
            .Where(item => item.TopLevelSection == "Watch" || (item.ParentPlanItem != null && item.ParentPlanItem.Title == "Watch"))
            .Where(item => item.Title.StartsWith("Watch "));

    private async Task<IReadOnlyDictionary<string, IReadOnlyList<int>>> ScheduledShowGoalYears(CancellationToken cancellationToken)
    {
        var rows = await ShowGoalItemsQuery()
            .Select(item => new { item.Title, item.AnnualPlan.Year })
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(item => item.Title, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<int>)group.Select(item => item.Year).Distinct().OrderBy(year => year).ToList(),
                StringComparer.OrdinalIgnoreCase);
    }

    private static string ShowGoalTitle(string seriesTitle, string seasonLabel) =>
        $"Watch {seriesTitle} - {seasonLabel}";

    private static bool IsMissingSeason(ShowSeason season) =>
        season.StatusID != OwnedStatus &&
        !season.BoxSetSeasons.Any(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus);

    private async Task<ActionResult<CreateShowGoalItemsResultDto>> CreateGoalItemsForSeasons(
        CreateShowGoalItemsDto dto,
        IReadOnlyCollection<ShowSeason> seasons,
        CancellationToken cancellationToken)
    {
        var plan = await context.AnnualPlans
            .Include(plan => plan.PlanItems)
            .FirstOrDefaultAsync(plan => plan.Year == dto.Year && plan.Status != AnnualPlanStatus.Archived, cancellationToken);
        if (plan is null)
        {
            plan = new AnnualPlan
            {
                Year = dto.Year,
                Title = $"Goals and Plans {dto.Year}",
                Status = AnnualPlanStatus.Draft,
                SourceSystem = "Shows"
            };
            context.AnnualPlans.Add(plan);
        }

        var section = plan.PlanItems.FirstOrDefault(item =>
            item.ItemType == PlanItemTypes.Section &&
            item.Title == "Watch" &&
            item.ParentPlanItemId == null);
        if (section is null)
        {
            section = new PlanItem
            {
                AnnualPlan = plan,
                SortOrder = plan.PlanItems.Count == 0 ? 0 : plan.PlanItems.Max(item => item.SortOrder) + 1,
                OutlineLevel = 1,
                ItemType = PlanItemTypes.Section,
                Title = "Watch",
                TopLevelSection = "Watch",
                IsSummary = true,
                Status = PlanItemStatus.NotStarted,
                PlanningWindowType = PlanItemPlanningWindowTypes.Year,
                TargetStartDate = new DateTime(dto.Year, 1, 1),
                TargetEndDate = new DateTime(dto.Year, 12, 31),
                ScheduleSurfaceMode = PlanItemScheduleSurfaceModes.Never,
                RolloverPolicy = PlanItemRolloverPolicies.Normal
            };
            plan.PlanItems.Add(section);
        }

        var existingTitles = plan.PlanItems
            .Where(item => item.ParentPlanItem == section || item.ParentPlanItemId == section.Id)
            .Select(item => item.Title)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var nextSort = plan.PlanItems.Count == 0 ? 0 : plan.PlanItems.Max(item => item.SortOrder) + 1;
        var created = 0;
        var skipped = 0;
        var planningWindow = NormalizePlanningWindow(dto.PlanningWindowType);
        var scheduleSurfaceMode = NormalizeScheduleSurfaceMode(dto.ScheduleSurfaceMode);
        var isUnscheduled = scheduleSurfaceMode == PlanItemScheduleSurfaceModes.Never;
        DateTime? targetStart = isUnscheduled ? null : dto.TargetStartDate ?? new DateTime(dto.Year, 1, 1);
        DateTime? targetEnd = isUnscheduled ? null : dto.TargetEndDate ?? new DateTime(dto.Year, 12, 31);

        foreach (var season in seasons)
        {
            var seriesTitle = season.Series?.Title ?? "Show";
            var title = ShowGoalTitle(seriesTitle, season.SeasonLabel);
            if (existingTitles.Contains(title))
            {
                skipped += 1;
                continue;
            }

            plan.PlanItems.Add(new PlanItem
            {
                AnnualPlan = plan,
                ParentPlanItem = section,
                SortOrder = nextSort++,
                OutlineLevel = section.OutlineLevel + 1,
                ItemType = PlanItemTypes.QueueItem,
                Title = title,
                TopLevelSection = "Watch",
                Notes = $"Created from Shows. Format: {season.Format ?? "unknown"}. Status: {(season.StatusID == OwnedStatus || season.BoxSetSeasons.Any(link => link.BoxSet != null && link.BoxSet.StatusID == OwnedStatus) ? "owned" : "wanted")}.",
                PercentComplete = 0,
                IsSummary = false,
                IsMilestone = false,
                Status = PlanItemStatus.NotStarted,
                PlanningWindowType = isUnscheduled ? PlanItemPlanningWindowTypes.Unscheduled : planningWindow,
                TargetStartDate = targetStart,
                TargetEndDate = targetEnd,
                ScheduleSurfaceMode = scheduleSurfaceMode,
                RolloverPolicy = PlanItemRolloverPolicies.Normal
            });
            existingTitles.Add(title);
            created += 1;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new CreateShowGoalItemsResultDto(plan.Id, plan.Year, created, skipped, "Watch");
    }

    private static string? ValidateSeries(UpsertShowSeriesDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return "Title is required.";
        }

        return dto.Title.Trim().Length > 200 ? "Title must be 200 characters or fewer." : null;
    }

    private static string? ValidateSeason(UpsertShowSeasonDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.StatusID) && dto.StatusID.Trim().ToUpperInvariant() is not (OwnedStatus or WantedStatus))
        {
            return "Season status must be H or W.";
        }

        return dto.SeasonLabel?.Trim().Length > 100 ? "Season label must be 100 characters or fewer." : null;
    }

    private static string? ValidateBoxSet(UpsertShowBoxSetDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Boxset name is required.";
        }

        if (dto.Name.Trim().Length > 200)
        {
            return "Boxset name must be 200 characters or fewer.";
        }

        if (!string.IsNullOrWhiteSpace(dto.StatusID) && dto.StatusID.Trim().ToUpperInvariant() is not (OwnedStatus or WantedStatus))
        {
            return "Boxset status must be H or W.";
        }

        if (dto.StartSeason is not null && dto.EndSeason is not null && dto.EndSeason < dto.StartSeason)
        {
            return "End season must be greater than or equal to start season.";
        }

        return null;
    }

    private static void ApplySeason(ShowSeason season, UpsertShowSeasonDto dto)
    {
        season.SeasonNumber = dto.SeasonNumber;
        season.SeasonLabel = string.IsNullOrWhiteSpace(dto.SeasonLabel)
            ? dto.SeasonNumber?.ToString() ?? "Series"
            : dto.SeasonLabel.Trim();
        season.StatusID = dto.StatusID?.Trim().ToUpperInvariant() == WantedStatus ? WantedStatus : OwnedStatus;
        season.Format = Trim(dto.Format);
        season.IsWatched = dto.IsWatched ?? false;
        season.WantToWatch = dto.WantToWatch ?? false;
        season.WantToRewatch = dto.WantToRewatch ?? false;
        season.LastWatchedDate = dto.LastWatchedDate;
        season.Notes = Trim(dto.Notes);
    }

    private async Task ApplyBoxSet(ShowSeries series, ShowBoxSet boxSet, UpsertShowBoxSetDto dto, DateTime now, CancellationToken cancellationToken)
    {
        boxSet.Name = dto.Name.Trim();
        boxSet.StatusID = dto.StatusID?.Trim().ToUpperInvariant() == WantedStatus ? WantedStatus : OwnedStatus;
        boxSet.Format = Trim(dto.Format);
        boxSet.IsCompleteSeries = dto.IsCompleteSeries ?? false;
        boxSet.Notes = Trim(dto.Notes);

        var requestedSeasonIds = (dto.SeasonIds ?? [])
            .Where(id => id > 0)
            .ToHashSet();
        var linkedSeasonIds = new HashSet<int>();

        if (dto.StartSeason is not null && dto.EndSeason is not null)
        {
            for (var seasonNumber = dto.StartSeason.Value; seasonNumber <= dto.EndSeason.Value; seasonNumber++)
            {
                var season = series.Seasons.FirstOrDefault(item => item.SeasonNumber == seasonNumber);
                if (season is null)
                {
                    season = new ShowSeason
                    {
                        ShowSeriesId = series.Id,
                        SeasonNumber = seasonNumber,
                        SeasonLabel = seasonNumber == 0 ? "Specials" : seasonNumber.ToString(),
                        StatusID = boxSet.StatusID,
                        Format = boxSet.Format,
                        CreatedAtUtc = now,
                        UpdatedAtUtc = now
                    };
                    context.ShowSeasons.Add(season);
                    series.Seasons.Add(season);
                }

                boxSet.Seasons.Add(new ShowBoxSetSeason
                {
                    BoxSet = boxSet,
                    Season = season
                });
                linkedSeasonIds.Add(season.Id);
            }
        }

        if (dto.IsCompleteSeries == true)
        {
            foreach (var season in series.Seasons)
            {
                if (linkedSeasonIds.Add(season.Id))
                {
                    boxSet.Seasons.Add(new ShowBoxSetSeason
                    {
                        BoxSet = boxSet,
                        Season = season
                    });
                }
            }
        }

        if (requestedSeasonIds.Count == 0)
        {
            return;
        }

        var validIds = await context.ShowSeasons
            .Where(season => season.ShowSeriesId == series.Id && requestedSeasonIds.Contains(season.Id))
            .Select(season => season.Id)
            .ToListAsync(cancellationToken);

        foreach (var seasonId in validIds.Distinct())
        {
            if (!linkedSeasonIds.Add(seasonId))
            {
                continue;
            }

            boxSet.Seasons.Add(new ShowBoxSetSeason
            {
                BoxSet = boxSet,
                ShowSeasonId = seasonId
            });
        }
    }

    private static string NormalizePlanningWindow(string? value)
    {
        return value?.Trim() switch
        {
            PlanItemPlanningWindowTypes.Month => PlanItemPlanningWindowTypes.Month,
            PlanItemPlanningWindowTypes.Week => PlanItemPlanningWindowTypes.Week,
            PlanItemPlanningWindowTypes.Day => PlanItemPlanningWindowTypes.Day,
            PlanItemPlanningWindowTypes.DateRange => PlanItemPlanningWindowTypes.DateRange,
            PlanItemPlanningWindowTypes.Quarter => PlanItemPlanningWindowTypes.Quarter,
            _ => PlanItemPlanningWindowTypes.Year
        };
    }

    private static string NormalizeScheduleSurfaceMode(string? value)
    {
        return value?.Trim() switch
        {
            PlanItemScheduleSurfaceModes.ActiveGoalsOnly => PlanItemScheduleSurfaceModes.ActiveGoalsOnly,
            PlanItemScheduleSurfaceModes.NearTargetEnd => PlanItemScheduleSurfaceModes.NearTargetEnd,
            PlanItemScheduleSurfaceModes.PinnedToSchedule => PlanItemScheduleSurfaceModes.PinnedToSchedule,
            PlanItemScheduleSurfaceModes.Never => PlanItemScheduleSurfaceModes.Never,
            _ => PlanItemScheduleSurfaceModes.DuringTargetWindow
        };
    }

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}


