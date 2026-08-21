using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/miniatures")]
public class MiniaturesController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<MiniatureItemDto>> List(
        [FromQuery] string? q,
        [FromQuery] int? companyId,
        [FromQuery] int? systemId,
        [FromQuery] int? seriesId,
        [FromQuery] string? number,
        [FromQuery] string? subset,
        [FromQuery] string? rarity,
        [FromQuery] string? size,
        [FromQuery] string? type,
        [FromQuery] string? status = "all",
        [FromQuery] string? sort = "system",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = Includes().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                item.MiniName.Contains(term) ||
                (item.Num != null && item.Num.Contains(term)) ||
                (item.Subset != null && item.Subset.Contains(term)) ||
                (item.Type != null && item.Type.Contains(term)) ||
                (item.Series != null && item.Series.Series.Contains(term)) ||
                (item.Series != null && item.Series.System != null && item.Series.System.System.Contains(term)));
        }

        if (companyId is not null)
        {
            query = query.Where(item => item.Series != null && item.Series.System != null && item.Series.System.CompanyID == companyId);
        }

        if (systemId is not null)
        {
            query = query.Where(item => item.Series != null && item.Series.SystemID == systemId);
        }

        if (seriesId is not null)
        {
            query = query.Where(item => item.SeriesID == seriesId);
        }

        if (!string.IsNullOrWhiteSpace(number))
        {
            var miniNumber = number.Trim();
            query = query.Where(item => item.Num != null && item.Num.Contains(miniNumber));
        }

        if (!string.IsNullOrWhiteSpace(subset))
        {
            query = query.Where(item => item.Subset == subset.Trim());
        }

        if (!string.IsNullOrWhiteSpace(rarity))
        {
            query = query.Where(item => item.RarityID == rarity.Trim());
        }

        if (!string.IsNullOrWhiteSpace(size))
        {
            query = query.Where(item => item.Size == size.Trim());
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(item => item.Type == type.Trim());
        }

        query = ApplyStatusFilter(query, status);

        query = sort?.ToLowerInvariant() switch
        {
            "name" => query.OrderBy(item => item.MiniName),
            "-name" => query.OrderByDescending(item => item.MiniName),
            "number" => query.OrderBy(item => item.Num).ThenBy(item => item.MiniName),
            "-number" => query.OrderByDescending(item => item.Num).ThenBy(item => item.MiniName),
            "rarity" => query.OrderBy(item => item.RarityID).ThenBy(item => item.MiniName),
            "-rarity" => query.OrderByDescending(item => item.RarityID).ThenBy(item => item.MiniName),
            "owned" => query.OrderBy(item => item.Statuses.Where(status => status.StatusID.Trim() == OwnedStatus).Sum(status => status.Qty)).ThenBy(item => item.MiniName),
            "-owned" => query.OrderByDescending(item => item.Statuses.Where(status => status.StatusID.Trim() == OwnedStatus).Sum(status => status.Qty)).ThenBy(item => item.MiniName),
            _ => query
                .OrderBy(item => item.Series!.System!.System)
                .ThenBy(item => item.Series!.Series)
                .ThenBy(item => item.Num)
                .ThenBy(item => item.MiniName)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 5000);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        return new PagedResult<MiniatureItemDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<MiniatureItemDto>> Get(int id, CancellationToken cancellationToken)
    {
        var item = await Includes().AsNoTracking().SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        return item is null ? NotFound() : ToDto(item);
    }

    [AllowAnonymous]
    [HttpGet("companies")]
    public async Task<IEnumerable<MiniLookupDto>> GetCompanies(CancellationToken cancellationToken) =>
        await context.MiniCompanies
            .AsNoTracking()
            .OrderBy(item => item.Company)
            .Select(item => new MiniLookupDto(item.ID, item.Company))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("systems")]
    public async Task<IEnumerable<MiniLookupDto>> GetSystems([FromQuery] int? companyId, CancellationToken cancellationToken)
    {
        var query = context.MiniSystems.AsNoTracking();
        if (companyId is not null)
        {
            query = query.Where(item => item.CompanyID == companyId);
        }

        return await query
            .OrderBy(item => item.System)
            .Select(item => new MiniLookupDto(item.ID, item.System))
            .ToListAsync(cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("series")]
    public async Task<IEnumerable<MiniLookupDto>> GetSeries([FromQuery] int? systemId, CancellationToken cancellationToken)
    {
        var query = context.MiniSeries.AsNoTracking();
        if (systemId is not null)
        {
            query = query.Where(item => item.SystemID == systemId);
        }

        return await query
            .OrderBy(item => item.Series)
            .Select(item => new MiniLookupDto(item.ID, item.Series))
            .ToListAsync(cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("subsets")]
    public async Task<IEnumerable<string>> GetSubsets(CancellationToken cancellationToken) =>
        await LookupValues(context.Miniatures.Select(item => item.Subset), cancellationToken);

    [AllowAnonymous]
    [HttpGet("rarities")]
    public async Task<IEnumerable<string>> GetRarities(CancellationToken cancellationToken) =>
        await LookupValues(context.Miniatures.Select(item => item.RarityID), cancellationToken);

    [AllowAnonymous]
    [HttpGet("sizes")]
    public async Task<IEnumerable<string>> GetSizes(CancellationToken cancellationToken) =>
        await LookupValues(context.Miniatures.Select(item => item.Size), cancellationToken);

    [AllowAnonymous]
    [HttpGet("types")]
    public async Task<IEnumerable<string>> GetTypes(CancellationToken cancellationToken) =>
        await LookupValues(context.Miniatures.Select(item => item.Type), cancellationToken);

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<MiniatureItemDto>> Create(UpsertMiniatureItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var series = await ResolveSeries(dto, cancellationToken);
        var item = new Miniature();
        Apply(item, dto, series);
        context.Miniatures.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        await SaveOwnership(item.ID, dto, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = item.ID }, await LoadDto(item.ID, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<MiniatureItemDto>> Update(int id, UpsertMiniatureItemDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var item = await context.Miniatures.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        var series = await ResolveSeries(dto, cancellationToken);
        Apply(item, dto, series);
        await SaveOwnership(id, dto, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await context.Miniatures.SingleOrDefaultAsync(item => item.ID == id, cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        context.Miniatures.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<Miniature> Includes() =>
        context.Miniatures
            .Include(item => item.Series)!.ThenInclude(series => series.System)!.ThenInclude(system => system.Company)
            .Include(item => item.Statuses)
            .Include(item => item.Values);

    private static IQueryable<Miniature> ApplyStatusFilter(IQueryable<Miniature> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "owned" or "h" => query.Where(item => item.Statuses.Any(status => status.StatusID.Trim() == OwnedStatus && status.Qty > 0)),
            "want" or "wanted" or "w" => query.Where(item =>
                !item.Statuses.Any(status => status.StatusID.Trim() == OwnedStatus && status.Qty > 0) ||
                item.Statuses.Any(status => status.StatusID.Trim() == WantedStatus && status.Qty > 0)),
            _ => query
        };
    }

    private async Task<MiniatureItemDto> LoadDto(int id, CancellationToken cancellationToken) =>
        ToDto(await Includes().AsNoTracking().SingleAsync(item => item.ID == id, cancellationToken));

    private static MiniatureItemDto ToDto(Miniature item)
    {
        var ownedQuantity = item.Statuses
            .Where(status => status.StatusID.Trim() == OwnedStatus)
            .Sum(status => status.Qty);
        var wantedQuantity = item.Statuses
            .Where(status => status.StatusID.Trim() == WantedStatus)
            .Sum(status => status.Qty);

        return new MiniatureItemDto(
            item.ID,
            item.MiniName,
            item.Num,
            item.Series?.System?.CompanyID,
            item.Series?.System?.Company?.Company,
            item.Series?.SystemID,
            item.Series?.System?.System,
            item.SeriesID,
            item.Series?.Series,
            item.Subset,
            item.RarityID,
            item.Size,
            item.Type,
            ownedQuantity,
            ownedQuantity <= 0 || wantedQuantity > 0,
            wantedQuantity,
            item.Values
                .OrderByDescending(value => value.ID)
                .Select(value => (decimal?)value.Price)
                .FirstOrDefault());
    }

    private static string? Validate(UpsertMiniatureItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Miniature name is required.";
        }

        if (dto.Name.Trim().Length > 100)
        {
            return "Miniature name must be 100 characters or fewer.";
        }

        if (dto.SeriesId is null && string.IsNullOrWhiteSpace(dto.SeriesName))
        {
            return "Choose or enter a series.";
        }

        if (dto.OwnedQuantity < 0 || dto.WantedQuantity < 0)
        {
            return "Quantities cannot be negative.";
        }

        return null;
    }

    private async Task<MiniSeries> ResolveSeries(UpsertMiniatureItemDto dto, CancellationToken cancellationToken)
    {
        if (dto.SeriesId is not null)
        {
            return await context.MiniSeries.SingleAsync(item => item.ID == dto.SeriesId, cancellationToken);
        }

        var system = await ResolveSystem(dto, cancellationToken);
        var name = dto.SeriesName!.Trim();
        var existing = await context.MiniSeries.FirstOrDefaultAsync(item => item.SystemID == system.ID && item.Series == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var series = new MiniSeries { Series = name, System = system };
        context.MiniSeries.Add(series);
        return series;
    }

    private async Task<MiniSystem> ResolveSystem(UpsertMiniatureItemDto dto, CancellationToken cancellationToken)
    {
        if (dto.SystemId is not null)
        {
            return await context.MiniSystems.SingleAsync(item => item.ID == dto.SystemId, cancellationToken);
        }

        var company = await ResolveCompany(dto, cancellationToken);
        var name = string.IsNullOrWhiteSpace(dto.SystemName) ? "Unspecified" : dto.SystemName.Trim();
        var existing = await context.MiniSystems.FirstOrDefaultAsync(item => item.CompanyID == company.ID && item.System == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var system = new MiniSystem { System = name, Company = company };
        context.MiniSystems.Add(system);
        return system;
    }

    private async Task<MiniCompany> ResolveCompany(UpsertMiniatureItemDto dto, CancellationToken cancellationToken)
    {
        if (dto.CompanyId is not null)
        {
            return await context.MiniCompanies.SingleAsync(item => item.ID == dto.CompanyId, cancellationToken);
        }

        var name = string.IsNullOrWhiteSpace(dto.CompanyName) ? "Unspecified" : dto.CompanyName.Trim();
        var existing = await context.MiniCompanies.FirstOrDefaultAsync(item => item.Company == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var company = new MiniCompany { Company = name };
        context.MiniCompanies.Add(company);
        return company;
    }

    private static void Apply(Miniature item, UpsertMiniatureItemDto dto, MiniSeries series)
    {
        item.MiniName = dto.Name.Trim();
        item.Num = Trim(dto.Number, 12);
        item.Series = series;
        item.RarityID = Trim(dto.Rarity, 50);
        item.Subset = Trim(dto.Subset, 100);
        item.Size = Trim(dto.Size, 50);
        item.Type = Trim(dto.Type, 50);
    }

    private async Task SaveOwnership(int miniId, UpsertMiniatureItemDto dto, CancellationToken cancellationToken)
    {
        var ownedQuantity = Math.Max(0, dto.OwnedQuantity ?? 0);
        var wantedQuantity = Math.Max(0, dto.WantedQuantity ?? 0);
        if (ownedQuantity == 0 && dto.IsWanted == true && wantedQuantity == 0)
        {
            wantedQuantity = 1;
        }

        await UpsertStatus(miniId, OwnedStatus, ownedQuantity, cancellationToken);
        await UpsertStatus(miniId, WantedStatus, wantedQuantity, cancellationToken);
    }

    private async Task UpsertStatus(int miniId, string statusId, int quantity, CancellationToken cancellationToken)
    {
        var status = await context.MiniStatuses.FirstOrDefaultAsync(item => item.MiniID == miniId && item.StatusID == statusId, cancellationToken);
        if (status is null && quantity > 0)
        {
            context.MiniStatuses.Add(new MiniStatus { MiniID = miniId, StatusID = statusId, Qty = quantity });
            return;
        }

        if (status is null)
        {
            return;
        }

        if (quantity <= 0)
        {
            context.MiniStatuses.Remove(status);
            return;
        }

        status.Qty = quantity;
    }

    private static Task<List<string>> LookupValues(IQueryable<string?> values, CancellationToken cancellationToken) =>
        values
            .Where(value => value != null && value != "")
            .Select(value => value!)
            .Distinct()
            .OrderBy(value => value)
            .ToListAsync(cancellationToken);

    private static string? Trim(string? value, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        return trimmed.Length > maxLength ? trimmed[..maxLength] : trimmed;
    }
}
