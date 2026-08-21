using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/toys")]
public class ToysController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<ToyFigureDto>> List(
        [FromQuery] string? q,
        [FromQuery] int? companyId,
        [FromQuery] int? lineId,
        [FromQuery] int? seriesId,
        [FromQuery] bool? inBox,
        [FromQuery] string? status = OwnedStatus,
        [FromQuery] string? sort = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = FigureIncludes().AsNoTracking();
        query = ApplyStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(figure =>
                figure.Name.Contains(term) ||
                figure.Line!.Name.Contains(term) ||
                (figure.Series != null && figure.Series.Name.Contains(term)) ||
                (figure.Line.Company != null && figure.Line.Company.Name.Contains(term)));
        }

        if (companyId is not null)
        {
            query = query.Where(figure => figure.Line != null && figure.Line.CompanyID == companyId);
        }

        if (lineId is not null)
        {
            query = query.Where(figure => figure.LineID == lineId);
        }

        if (seriesId is not null)
        {
            query = query.Where(figure => figure.SeriesID == seriesId);
        }

        if (inBox is not null)
        {
            query = query.Where(figure => figure.InBox == inBox);
        }

        query = sort?.ToLowerInvariant() switch
        {
            "company" => query.OrderBy(figure => figure.Line!.Company!.Name).ThenBy(figure => figure.Line!.Name).ThenBy(figure => figure.Name),
            "-company" => query.OrderByDescending(figure => figure.Line!.Company!.Name).ThenBy(figure => figure.Line!.Name).ThenBy(figure => figure.Name),
            "line" => query.OrderBy(figure => figure.Line!.Name).ThenBy(figure => figure.Series!.Name).ThenBy(figure => figure.Name),
            "-line" => query.OrderByDescending(figure => figure.Line!.Name).ThenBy(figure => figure.Series!.Name).ThenBy(figure => figure.Name),
            "series" => query.OrderBy(figure => figure.Series!.Name).ThenBy(figure => figure.Line!.Name).ThenBy(figure => figure.Name),
            "-series" => query.OrderByDescending(figure => figure.Series!.Name).ThenBy(figure => figure.Line!.Name).ThenBy(figure => figure.Name),
            "qty" => query.OrderBy(figure => figure.Qty).ThenBy(figure => figure.Name),
            "-qty" => query.OrderByDescending(figure => figure.Qty).ThenBy(figure => figure.Name),
            "-name" => query.OrderByDescending(figure => figure.Name),
            _ => query.OrderBy(figure => figure.Name)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(figure => ToDto(figure))
            .ToListAsync(cancellationToken);

        return new PagedResult<ToyFigureDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ToyFigureDto>> Get(int id, CancellationToken cancellationToken)
    {
        var figure = await FigureIncludes()
            .AsNoTracking()
            .FirstOrDefaultAsync(figure => figure.ID == id, cancellationToken);

        return figure is null ? NotFound() : ToDto(figure);
    }

    [AllowAnonymous]
    [HttpGet("companies")]
    public async Task<IEnumerable<ToyLookupDto>> GetCompanies(CancellationToken cancellationToken) =>
        await context.ToyCompanies
            .OrderBy(company => company.Name)
            .Select(company => new ToyLookupDto(company.ID, company.Name))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("lines")]
    public async Task<IEnumerable<ToyLookupDto>> GetLines([FromQuery] int? companyId, CancellationToken cancellationToken)
    {
        var query = context.ToyLines.AsNoTracking();
        if (companyId is not null)
        {
            query = query.Where(line => line.CompanyID == companyId);
        }

        return await query
            .OrderBy(line => line.Name)
            .Select(line => new ToyLookupDto(line.ID, line.Name))
            .ToListAsync(cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("series")]
    public async Task<IEnumerable<ToyLookupDto>> GetSeries([FromQuery] int? lineId, CancellationToken cancellationToken)
    {
        if (lineId is not null)
        {
            return await context.ToyLineSeries
                .AsNoTracking()
                .Where(link => link.LineID == lineId)
                .Include(link => link.Series)
                .OrderBy(link => link.Series!.Name)
                .Select(link => new ToyLookupDto(link.SeriesID, link.Series!.Name))
                .ToListAsync(cancellationToken);
        }

        return await context.ToySeries
            .AsNoTracking()
            .OrderBy(series => series.Name)
            .Select(series => new ToyLookupDto(series.ID, series.Name))
            .ToListAsync(cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<ToyFigureDto>> Create(UpsertToyFigureDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var line = await ResolveLine(dto, cancellationToken);
        var series = await ResolveSeries(dto, cancellationToken);
        var figure = new ToyFigure();
        ApplySave(figure, dto, line, series);
        context.ToyFigures.Add(figure);
        await EnsureLineSeries(line, series, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = figure.ID }, await LoadDto(figure.ID, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ToyFigureDto>> Update(int id, UpsertToyFigureDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var figure = await context.ToyFigures.FindAsync([id], cancellationToken);
        if (figure is null)
        {
            return NotFound();
        }

        var line = await ResolveLine(dto, cancellationToken);
        var series = await ResolveSeries(dto, cancellationToken);
        ApplySave(figure, dto, line, series);
        await EnsureLineSeries(line, series, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var figure = await context.ToyFigures.FindAsync([id], cancellationToken);
        if (figure is null)
        {
            return NotFound();
        }

        context.ToyFigures.Remove(figure);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<ToyFigure> FigureIncludes() =>
        context.ToyFigures
            .Include(figure => figure.Line)!.ThenInclude(line => line!.Company)
            .Include(figure => figure.Series);

    private static IQueryable<ToyFigure> ApplyStatusFilter(IQueryable<ToyFigure> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "all" => query,
            "want" or "wanted" or "w" => query.Where(figure => figure.StatusID == WantedStatus),
            "unknown" => query.Where(figure => figure.StatusID != OwnedStatus && figure.StatusID != WantedStatus),
            _ => query.Where(figure => figure.StatusID == null || figure.StatusID == OwnedStatus)
        };
    }

    private async Task<ToyLine> ResolveLine(UpsertToyFigureDto dto, CancellationToken cancellationToken)
    {
        if (dto.LineId is not null)
        {
            return await context.ToyLines.FirstAsync(line => line.ID == dto.LineId, cancellationToken);
        }

        var name = string.IsNullOrWhiteSpace(dto.LineName) ? "Uncategorized" : dto.LineName.Trim();
        var company = await ResolveCompany(dto, cancellationToken);
        var existing = await context.ToyLines.FirstOrDefaultAsync(line => line.Name == name && line.CompanyID == company.ID, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new ToyLine { Name = name, Company = company };
        context.ToyLines.Add(created);
        return created;
    }

    private async Task<ToyCompany> ResolveCompany(UpsertToyFigureDto dto, CancellationToken cancellationToken)
    {
        if (dto.CompanyId is not null)
        {
            return await context.ToyCompanies.FirstAsync(company => company.ID == dto.CompanyId, cancellationToken);
        }

        var name = string.IsNullOrWhiteSpace(dto.CompanyName) ? "Unknown" : dto.CompanyName.Trim();
        var existing = await context.ToyCompanies.FirstOrDefaultAsync(company => company.Name == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new ToyCompany { Name = name };
        context.ToyCompanies.Add(created);
        return created;
    }

    private async Task<ToySeries?> ResolveSeries(UpsertToyFigureDto dto, CancellationToken cancellationToken)
    {
        if (dto.SeriesId is not null)
        {
            return await context.ToySeries.FirstAsync(series => series.ID == dto.SeriesId, cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(dto.SeriesName))
        {
            return null;
        }

        var name = dto.SeriesName.Trim();
        var existing = await context.ToySeries.FirstOrDefaultAsync(series => series.Name == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new ToySeries { Name = name };
        context.ToySeries.Add(created);
        return created;
    }

    private async Task EnsureLineSeries(ToyLine line, ToySeries? series, CancellationToken cancellationToken)
    {
        if (series is null)
        {
            return;
        }

        if (line.ID == 0 || series.ID == 0)
        {
            context.ToyLineSeries.Add(new ToyLineSeries { Line = line, Series = series });
            return;
        }

        var exists = await context.ToyLineSeries.AnyAsync(link => link.LineID == line.ID && link.SeriesID == series.ID, cancellationToken);
        if (!exists)
        {
            context.ToyLineSeries.Add(new ToyLineSeries { LineID = line.ID, SeriesID = series.ID });
        }
    }

    private static void ApplySave(ToyFigure figure, UpsertToyFigureDto dto, ToyLine line, ToySeries? series)
    {
        figure.Name = dto.Name.Trim();
        figure.Qty = dto.Qty.GetValueOrDefault(1);
        figure.Line = line;
        figure.Series = series;
        figure.InBox = dto.InBox ?? true;
        figure.StatusID = NormalizeStatus(dto.StatusID);
    }

    private async Task<ToyFigureDto> LoadDto(int id, CancellationToken cancellationToken)
    {
        var figure = await FigureIncludes()
            .AsNoTracking()
            .FirstAsync(figure => figure.ID == id, cancellationToken);

        return ToDto(figure);
    }

    private static ToyFigureDto ToDto(ToyFigure figure) => new(
        figure.ID,
        figure.Name.Trim(),
        figure.Qty,
        figure.LineID,
        figure.Line?.Name.Trim() ?? "(Unknown)",
        figure.SeriesID,
        figure.Series?.Name.Trim(),
        figure.Line?.CompanyID,
        figure.Line?.Company?.Name.Trim(),
        figure.InBox,
        figure.StatusID ?? OwnedStatus);

    private static string? Validate(UpsertToyFigureDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Name is required.";
        }

        return null;
    }

    private static string NormalizeStatus(string? value) =>
        value?.Trim().Equals(WantedStatus, StringComparison.OrdinalIgnoreCase) == true ? WantedStatus : OwnedStatus;
}
