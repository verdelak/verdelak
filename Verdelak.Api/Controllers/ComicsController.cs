using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/comics")]
public class ComicsController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<ComicIssueDto>> List(
        [FromQuery] string? q,
        [FromQuery] int? seriesId,
        [FromQuery] short? issueNumber,
        [FromQuery] short? month,
        [FromQuery] string? year,
        [FromQuery] bool? special,
        [FromQuery] bool? graphicNovel,
        [FromQuery] bool? variant,
        [FromQuery] string? status = OwnedStatus,
        [FromQuery] string? sort = "series",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = IssueIncludes().AsNoTracking();
        query = ApplyStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(issue =>
                (issue.Name != null && issue.Name.Contains(term)) ||
                (issue.Notes != null && issue.Notes.Contains(term)) ||
                issue.Series!.Title.Contains(term));
        }

        if (seriesId is not null)
        {
            query = query.Where(issue => issue.SeriesID == seriesId);
        }

        if (issueNumber is not null)
        {
            query = query.Where(issue => issue.IssueNumber == issueNumber);
        }

        if (month is not null)
        {
            query = query.Where(issue => issue.IssueMonth == month);
        }

        if (!string.IsNullOrWhiteSpace(year))
        {
            var normalizedYear = year.Trim();
            query = query.Where(issue => issue.IssueYear == normalizedYear);
        }

        if (special is not null)
        {
            query = query.Where(issue => issue.isSpecial == special);
        }

        if (graphicNovel is not null)
        {
            query = query.Where(issue => issue.isGraphicNovel == graphicNovel);
        }

        if (variant is not null)
        {
            query = query.Where(issue => issue.isVariant == variant);
        }

        query = sort?.ToLowerInvariant() switch
        {
            "year" => query.OrderBy(issue => issue.IssueYear).ThenBy(issue => issue.IssueMonth).ThenBy(issue => issue.Series!.Title).ThenBy(issue => issue.IssueNumber).ThenBy(issue => issue.Name),
            "-year" => query.OrderByDescending(issue => issue.IssueYear).ThenByDescending(issue => issue.IssueMonth).ThenBy(issue => issue.Series!.Title).ThenBy(issue => issue.IssueNumber).ThenBy(issue => issue.Name),
            "issue" => query.OrderBy(issue => issue.IssueNumber).ThenBy(issue => issue.Name),
            "-issue" => query.OrderByDescending(issue => issue.IssueNumber).ThenBy(issue => issue.Name),
            "title" => query.OrderBy(issue => issue.Name).ThenBy(issue => issue.Series!.Title),
            "-title" => query.OrderByDescending(issue => issue.Name).ThenBy(issue => issue.Series!.Title),
            "-series" => query.OrderByDescending(issue => issue.Series!.Title).ThenBy(issue => issue.IssueYear).ThenBy(issue => issue.IssueMonth).ThenBy(issue => issue.IssueNumber).ThenBy(issue => issue.Name),
            _ => query.OrderBy(issue => issue.Series!.Title).ThenBy(issue => issue.IssueYear).ThenBy(issue => issue.IssueMonth).ThenBy(issue => issue.IssueNumber).ThenBy(issue => issue.Name)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(issue => ToDto(issue))
            .ToListAsync(cancellationToken);

        return new PagedResult<ComicIssueDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ComicIssueDto>> Get(int id, CancellationToken cancellationToken)
    {
        var issue = await IssueIncludes()
            .AsNoTracking()
            .FirstOrDefaultAsync(issue => issue.ID == id, cancellationToken);

        return issue is null ? NotFound() : ToDto(issue);
    }

    [AllowAnonymous]
    [HttpGet("want-list")]
    public async Task<IEnumerable<ComicWantListItemDto>> GetWantList(CancellationToken cancellationToken)
    {
        var wantedIssues = await IssueIncludes()
            .AsNoTracking()
            .Where(issue => issue.Statuses.Any(status => status.StatusID == WantedStatus))
            .OrderBy(issue => issue.Series!.Title)
            .ThenBy(issue => issue.IssueNumber)
            .ThenBy(issue => issue.IssueYear)
            .ThenBy(issue => issue.Name)
            .Select(issue => ToWantListDto(issue))
            .ToListAsync(cancellationToken);

        var seriesIdsWithIssues = await context.ComicIssues
            .AsNoTracking()
            .Select(issue => issue.SeriesID)
            .Distinct()
            .ToListAsync(cancellationToken);

        var titleOnlyWants = await context.ComicSeries
            .AsNoTracking()
            .Where(series => !seriesIdsWithIssues.Contains(series.ID))
            .OrderBy(series => series.Title)
            .Select(series => new ComicWantListItemDto(
                series.ID,
                series.Title,
                series.Notes,
                null,
                null,
                null,
                null,
                null,
                false,
                false,
                false,
                series.Notes,
                null,
                "Title wanted"))
            .ToListAsync(cancellationToken);

        return wantedIssues
            .Concat(titleOnlyWants)
            .OrderBy(item => item.Series)
            .ThenBy(item => item.IssueNumber ?? short.MaxValue)
            .ThenBy(item => item.IssueYear)
            .ThenBy(item => item.Name)
            .ToList();
    }

    [AllowAnonymous]
    [HttpGet("series")]
    public async Task<IEnumerable<ComicSeriesDto>> GetSeries(CancellationToken cancellationToken) =>
        await context.ComicSeries
            .AsNoTracking()
            .OrderBy(series => series.Title)
            .Select(series => new ComicSeriesDto(series.ID, series.Title, series.Notes))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("series-report")]
    public async Task<IEnumerable<ComicSeriesReportDto>> GetSeriesReport(CancellationToken cancellationToken)
    {
        var rows = await context.ComicSeries
            .AsNoTracking()
            .OrderBy(series => series.Title)
            .Select(series => new ComicSeriesReportDto(
                series.ID,
                series.Title,
                series.Notes,
                context.ComicIssues.Count(issue => issue.SeriesID == series.ID),
                context.ComicIssues.Count(issue => issue.SeriesID == series.ID && issue.Statuses.Any(status => status.StatusID == OwnedStatus)),
                context.ComicIssues.Count(issue => issue.SeriesID == series.ID && issue.Statuses.Any(status => status.StatusID == WantedStatus)),
                context.ComicIssues.Count(issue => issue.SeriesID == series.ID && issue.isSpecial),
                context.ComicIssues.Count(issue => issue.SeriesID == series.ID && issue.isGraphicNovel),
                context.ComicIssues.Count(issue => issue.SeriesID == series.ID && issue.isVariant),
                context.ComicValues
                    .Where(value => value.Issue != null && value.Issue.SeriesID == series.ID)
                    .Select(value => (decimal?)value.Price)
                    .Sum() ?? 0m))
            .ToListAsync(cancellationToken);

        return rows;
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("series")]
    public async Task<ActionResult<ComicSeriesDto>> CreateSeries(UpsertComicSeriesDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest("Title is required.");
        }

        var title = dto.Title.Trim();
        var existing = await context.ComicSeries
            .FirstOrDefaultAsync(series => series.Title == title, cancellationToken);

        if (existing is not null)
        {
            return Conflict("A comic title with that name already exists.");
        }

        var series = new ComicSeries
        {
            Title = title,
            Notes = Clean(dto.Notes)
        };

        context.ComicSeries.Add(series);
        await context.SaveChangesAsync(cancellationToken);

        return new ComicSeriesDto(series.ID, series.Title, series.Notes);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<ComicIssueDto>> Create(UpsertComicIssueDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var series = await ResolveSeries(dto, cancellationToken);
        var issue = new ComicIssue();
        ApplySave(issue, dto, series);
        context.ComicIssues.Add(issue);
        await context.SaveChangesAsync(cancellationToken);

        await UpsertStatus(issue.ID, dto, cancellationToken);
        await UpsertValue(issue.ID, dto, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = issue.ID }, await LoadDto(issue.ID, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ComicIssueDto>> Update(int id, UpsertComicIssueDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var issue = await context.ComicIssues.FindAsync([id], cancellationToken);
        if (issue is null)
        {
            return NotFound();
        }

        var series = await ResolveSeries(dto, cancellationToken);
        ApplySave(issue, dto, series);
        await UpsertStatus(id, dto, cancellationToken);
        await UpsertValue(id, dto, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var issue = await context.ComicIssues
            .Include(item => item.Statuses)
            .Include(item => item.Values)
            .FirstOrDefaultAsync(item => item.ID == id, cancellationToken);

        if (issue is null)
        {
            return NotFound();
        }

        context.ComicStatuses.RemoveRange(issue.Statuses);
        context.ComicValues.RemoveRange(issue.Values);
        context.ComicIssues.Remove(issue);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<ComicIssue> IssueIncludes() =>
        context.ComicIssues
            .Include(issue => issue.Series)
            .Include(issue => issue.Statuses)
            .Include(issue => issue.Values);

    private static IQueryable<ComicIssue> ApplyStatusFilter(IQueryable<ComicIssue> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "all" => query,
            "want" or "wanted" or "w" => query.Where(issue => issue.Statuses.Any(status => status.StatusID == WantedStatus)),
            "unknown" => query.Where(issue => !issue.Statuses.Any() || issue.Statuses.Any(status => status.StatusID != OwnedStatus && status.StatusID != WantedStatus)),
            _ => query.Where(issue => !issue.Statuses.Any() || issue.Statuses.Any(status => status.StatusID == OwnedStatus))
        };
    }

    private async Task<ComicSeries> ResolveSeries(UpsertComicIssueDto dto, CancellationToken cancellationToken)
    {
        if (dto.SeriesId is not null)
        {
            return await context.ComicSeries.FirstAsync(series => series.ID == dto.SeriesId, cancellationToken);
        }

        var title = string.IsNullOrWhiteSpace(dto.SeriesTitle) ? "Uncategorized" : dto.SeriesTitle.Trim();
        var existing = await context.ComicSeries.FirstOrDefaultAsync(series => series.Title == title, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new ComicSeries { Title = title };
        context.ComicSeries.Add(created);
        return created;
    }

    private async Task UpsertStatus(int issueId, UpsertComicIssueDto dto, CancellationToken cancellationToken)
    {
        var status = await context.ComicStatuses
            .OrderBy(item => item.ID)
            .FirstOrDefaultAsync(item => item.IssueID == issueId, cancellationToken);

        if (status is null)
        {
            status = new ComicStatus { IssueID = issueId };
            context.ComicStatuses.Add(status);
        }

        status.StatusID = NormalizeStatus(dto.StatusID);
        status.Rating = dto.Rating;
    }

    private async Task UpsertValue(int issueId, UpsertComicIssueDto dto, CancellationToken cancellationToken)
    {
        if (dto.StoredID is null && dto.Price is null)
        {
            return;
        }

        var value = await context.ComicValues
            .OrderBy(item => item.ID)
            .FirstOrDefaultAsync(item => item.IssueID == issueId, cancellationToken);

        if (value is null)
        {
            value = new ComicValue { IssueID = issueId };
            context.ComicValues.Add(value);
        }

        value.StoredID = dto.StoredID ?? value.StoredID;
        value.Price = dto.Price ?? value.Price;
    }

    private static void ApplySave(ComicIssue issue, UpsertComicIssueDto dto, ComicSeries series)
    {
        issue.Series = series;
        issue.IssueNumber = dto.IssueNumber;
        issue.isSpecial = dto.IsSpecial ?? false;
        issue.Name = Clean(dto.Name);
        issue.IssueMonth = dto.IssueMonth;
        issue.IssueYear = Clean(dto.IssueYear);
        issue.isGraphicNovel = dto.IsGraphicNovel ?? false;
        issue.isVariant = dto.IsVariant ?? false;
        issue.Notes = Clean(dto.Notes);
    }

    private async Task<ComicIssueDto> LoadDto(int id, CancellationToken cancellationToken)
    {
        var issue = await IssueIncludes()
            .AsNoTracking()
            .FirstAsync(issue => issue.ID == id, cancellationToken);

        return ToDto(issue);
    }

    private static ComicIssueDto ToDto(ComicIssue issue)
    {
        var status = issue.Statuses.OrderBy(item => item.ID).FirstOrDefault();
        var values = issue.Values
            .OrderBy(value => value.StoredID)
            .ThenBy(value => value.ID)
            .Select(value => new ComicValueDto(value.ID, value.StoredID, value.Price))
            .ToList();

        return new ComicIssueDto(
            issue.ID,
            issue.SeriesID,
            issue.Series?.Title ?? "(Unknown)",
            issue.IssueNumber,
            issue.isSpecial,
            issue.Name,
            issue.IssueMonth,
            issue.IssueYear?.Trim(),
            issue.isGraphicNovel,
            issue.isVariant,
            issue.Notes,
            status?.StatusID ?? OwnedStatus,
            status?.Rating,
            values,
            FormatDisplayLabel(issue));
    }

    private static ComicWantListItemDto ToWantListDto(ComicIssue issue)
    {
        var status = issue.Statuses.OrderBy(item => item.ID).FirstOrDefault();

        return new ComicWantListItemDto(
            issue.SeriesID,
            issue.Series?.Title ?? "(Unknown)",
            issue.Series?.Notes,
            issue.ID,
            issue.IssueNumber,
            issue.IssueMonth is null ? null : MonthName(issue.IssueMonth.Value),
            issue.IssueYear?.Trim(),
            issue.Name,
            issue.isSpecial,
            issue.isGraphicNovel,
            issue.isVariant,
            issue.Notes,
            status?.Rating,
            FormatDisplayLabel(issue));
    }

    private static string FormatDisplayLabel(ComicIssue issue)
    {
        var parts = new List<string>();
        if (issue.IssueNumber is not null)
        {
            parts.Add($"#{issue.IssueNumber}");
        }

        if (issue.IssueMonth is not null && !string.IsNullOrWhiteSpace(issue.IssueYear))
        {
            parts.Add($"{MonthName(issue.IssueMonth.Value)} {issue.IssueYear.Trim()}");
        }
        else if (!string.IsNullOrWhiteSpace(issue.IssueYear))
        {
            parts.Add(issue.IssueYear.Trim());
        }

        if (!string.IsNullOrWhiteSpace(issue.Name))
        {
            parts.Add(issue.Name.Trim());
        }

        if (issue.isSpecial)
        {
            parts.Add("Special");
        }

        if (issue.isGraphicNovel)
        {
            parts.Add("Graphic Novel");
        }

        if (issue.isVariant)
        {
            parts.Add("Variant");
        }

        return parts.Count == 0 ? $"Comic {issue.ID}" : string.Join(" - ", parts);
    }

    private static string? Validate(UpsertComicIssueDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.IssueYear) && dto.IssueYear.Trim().Length > 4)
        {
            return "Issue year must be four characters or fewer.";
        }

        return null;
    }

    private static string NormalizeStatus(string? value) =>
        value?.Trim().Equals(WantedStatus, StringComparison.OrdinalIgnoreCase) == true ? WantedStatus : OwnedStatus;

    private static string MonthName(short month) =>
        month is >= 1 and <= 12
            ? new DateTime(2000, month, 1).ToString("MMMM")
            : month.ToString();

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

