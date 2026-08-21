using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/magazines")]
public class MagazinesController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<MagazineIssueDto>> List(
        [FromQuery] string? q,
        [FromQuery] int? seriesId,
        [FromQuery] short? year,
        [FromQuery] short? month,
        [FromQuery] string? season,
        [FromQuery] bool? special,
        [FromQuery] bool? alternate,
        [FromQuery] string? coverId,
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
                (issue.Title != null && issue.Title.Contains(term)) ||
                (issue.Info != null && issue.Info.Contains(term)) ||
                (issue.CoverID != null && issue.CoverID.Contains(term)) ||
                issue.Series!.Title.Contains(term));
        }

        if (seriesId is not null)
        {
            query = query.Where(issue => issue.SeriesId == seriesId);
        }

        if (year is not null)
        {
            query = query.Where(issue => issue.Year == year);
        }

        if (month is not null)
        {
            query = query.Where(issue => issue.Month == month);
        }

        if (!string.IsNullOrWhiteSpace(season))
        {
            var normalizedSeason = season.Trim();
            query = query.Where(issue => issue.Season == normalizedSeason);
        }

        if (special is not null)
        {
            query = query.Where(issue => issue.Special == special);
        }

        if (alternate is not null)
        {
            query = query.Where(issue => issue.Alternate == alternate);
        }

        if (!string.IsNullOrWhiteSpace(coverId))
        {
            var normalizedCover = coverId.Trim();
            query = query.Where(issue => issue.CoverID == normalizedCover);
        }

        query = sort?.ToLowerInvariant() switch
        {
            "year" => query.OrderBy(issue => issue.Year).ThenBy(issue => issue.Month).ThenBy(issue => issue.Number).ThenBy(issue => issue.Title),
            "-year" => query.OrderByDescending(issue => issue.Year).ThenByDescending(issue => issue.Month).ThenByDescending(issue => issue.Number).ThenBy(issue => issue.Title),
            "number" => query.OrderBy(issue => issue.Number).ThenBy(issue => issue.Title),
            "-number" => query.OrderByDescending(issue => issue.Number).ThenBy(issue => issue.Title),
            "title" => query.OrderBy(issue => issue.Title).ThenBy(issue => issue.Series!.Title),
            "-title" => query.OrderByDescending(issue => issue.Title).ThenBy(issue => issue.Series!.Title),
            "-series" => query.OrderByDescending(issue => issue.Series!.Title).ThenBy(issue => issue.Year).ThenBy(issue => issue.Month).ThenBy(issue => issue.Number).ThenBy(issue => issue.Title),
            _ => query.OrderBy(issue => issue.Series!.Title).ThenBy(issue => issue.Year).ThenBy(issue => issue.Month).ThenBy(issue => issue.Number).ThenBy(issue => issue.Title)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(issue => ToDto(issue))
            .ToListAsync(cancellationToken);

        return new PagedResult<MagazineIssueDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<MagazineIssueDto>> Get(int id, CancellationToken cancellationToken)
    {
        var issue = await IssueIncludes()
            .AsNoTracking()
            .FirstOrDefaultAsync(issue => issue.ID == id, cancellationToken);

        return issue is null ? NotFound() : ToDto(issue);
    }

    [AllowAnonymous]
    [HttpGet("series")]
    public async Task<IEnumerable<MagazineLookupDto>> GetSeries(CancellationToken cancellationToken) =>
        await context.MagazineSeries
            .OrderBy(series => series.Title)
            .Select(series => new MagazineLookupDto(series.ID, series.Title))
            .ToListAsync(cancellationToken);

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<MagazineIssueDto>> Create(UpsertMagazineIssueDto dto, CancellationToken cancellationToken)
    {
        var series = await ResolveSeries(dto, cancellationToken);
        var issue = new Magazine();
        ApplySave(issue, dto, series);
        context.Magazines.Add(issue);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = issue.ID }, await LoadDto(issue.ID, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<MagazineIssueDto>> Update(int id, UpsertMagazineIssueDto dto, CancellationToken cancellationToken)
    {
        var issue = await context.Magazines.FindAsync([id], cancellationToken);
        if (issue is null)
        {
            return NotFound();
        }

        var series = await ResolveSeries(dto, cancellationToken);
        ApplySave(issue, dto, series);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var issue = await context.Magazines.FindAsync([id], cancellationToken);
        if (issue is null)
        {
            return NotFound();
        }

        context.Magazines.Remove(issue);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<Magazine> IssueIncludes() =>
        context.Magazines.Include(issue => issue.Series);

    private static IQueryable<Magazine> ApplyStatusFilter(IQueryable<Magazine> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "all" => query,
            "want" or "wanted" or "w" => query.Where(issue => issue.StatusID == WantedStatus),
            "unknown" => query.Where(issue => issue.StatusID != OwnedStatus && issue.StatusID != WantedStatus),
            _ => query.Where(issue => issue.StatusID == OwnedStatus)
        };
    }

    private async Task<MagazineSeries> ResolveSeries(UpsertMagazineIssueDto dto, CancellationToken cancellationToken)
    {
        if (dto.SeriesId is not null)
        {
            return await context.MagazineSeries.FirstAsync(series => series.ID == dto.SeriesId, cancellationToken);
        }

        var title = string.IsNullOrWhiteSpace(dto.SeriesName) ? "Uncategorized" : dto.SeriesName.Trim();
        var existing = await context.MagazineSeries.FirstOrDefaultAsync(series => series.Title == title, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new MagazineSeries { Title = title };
        context.MagazineSeries.Add(created);
        return created;
    }

    private static void ApplySave(Magazine issue, UpsertMagazineIssueDto dto, MagazineSeries series)
    {
        issue.Number = dto.Number;
        issue.Month = dto.Month;
        issue.Year = dto.Year;
        issue.Season = Clean(dto.Season);
        issue.Title = Clean(dto.Title);
        issue.Special = dto.Special ?? false;
        issue.Alternate = dto.Alternate ?? false;
        issue.StatusID = NormalizeStatus(dto.StatusID);
        issue.Info = Clean(dto.Info);
        issue.Series = series;
        issue.CoverID = Clean(dto.CoverID);
    }

    private async Task<MagazineIssueDto> LoadDto(int id, CancellationToken cancellationToken)
    {
        var issue = await IssueIncludes()
            .AsNoTracking()
            .FirstAsync(issue => issue.ID == id, cancellationToken);

        return ToDto(issue);
    }

    private static MagazineIssueDto ToDto(Magazine issue) => new(
        issue.ID,
        issue.Number,
        issue.Month,
        issue.Year,
        issue.Season,
        issue.Title,
        issue.Special,
        issue.Alternate,
        issue.StatusID,
        issue.Info,
        issue.SeriesId,
        issue.Series?.Title ?? "(Unknown)",
        issue.CoverID?.Trim(),
        FormatDisplayLabel(issue));

    private static string FormatDisplayLabel(Magazine issue)
    {
        var parts = new List<string>();
        if (issue.Number is not null)
        {
            parts.Add($"#{issue.Number}");
        }

        if (issue.Month is not null && issue.Year is not null)
        {
            parts.Add($"{MonthName(issue.Month.Value)} {issue.Year}");
        }
        else if (!string.IsNullOrWhiteSpace(issue.Season) && issue.Year is not null)
        {
            parts.Add($"{issue.Season.Trim()} {issue.Year}");
        }
        else if (!string.IsNullOrWhiteSpace(issue.Season))
        {
            parts.Add(issue.Season.Trim());
        }
        else if (issue.Year is not null)
        {
            parts.Add(issue.Year.Value.ToString());
        }

        if (!string.IsNullOrWhiteSpace(issue.Title))
        {
            parts.Add(issue.Title.Trim());
        }

        if (issue.Special)
        {
            parts.Add("Special");
        }

        if (issue.Alternate)
        {
            parts.Add("Variant");
        }

        if (!string.IsNullOrWhiteSpace(issue.CoverID))
        {
            parts.Add($"Cover {issue.CoverID.Trim()}");
        }

        return parts.Count == 0 ? $"Issue {issue.ID}" : string.Join(" - ", parts);
    }

    private static string MonthName(short month) =>
        month is >= 1 and <= 12
            ? new DateTime(2000, month, 1).ToString("MMMM")
            : month.ToString();

    private static string NormalizeStatus(string? value) =>
        value?.Trim().Equals(WantedStatus, StringComparison.OrdinalIgnoreCase) == true ? WantedStatus : OwnedStatus;

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
