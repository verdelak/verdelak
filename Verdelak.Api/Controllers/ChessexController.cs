using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/chessex")]
public class ChessexController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<ChessexSetDto>> List(
        [FromQuery] string? q,
        [FromQuery] int? categoryId,
        [FromQuery] int? setTypeId,
        [FromQuery] string? status = OwnedStatus,
        [FromQuery] string? sort = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.ChessexSets
            .Include(set => set.Category)
            .Include(set => set.SetType)
            .AsNoTracking();

        query = ApplyStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(set =>
                set.Name.Contains(term) ||
                (set.ProductCode != null && set.ProductCode.Contains(term)) ||
                (set.Color != null && set.Color.Contains(term)) ||
                (set.Notes != null && set.Notes.Contains(term)));
        }

        if (categoryId is not null)
        {
            query = query.Where(set => set.CategoryId == categoryId);
        }

        if (setTypeId is not null)
        {
            query = query.Where(set => set.SetTypeId == setTypeId);
        }

        query = sort?.ToLowerInvariant() switch
        {
            "category" => query.OrderBy(set => set.Category!.SortOrder).ThenBy(set => set.Category!.Name).ThenBy(set => set.Name),
            "-category" => query.OrderByDescending(set => set.Category!.SortOrder).ThenByDescending(set => set.Category!.Name).ThenBy(set => set.Name),
            "settype" => query.OrderBy(set => set.SetType!.SortOrder).ThenBy(set => set.SetType!.Name).ThenBy(set => set.Name),
            "-settype" => query.OrderByDescending(set => set.SetType!.SortOrder).ThenByDescending(set => set.SetType!.Name).ThenBy(set => set.Name),
            "qty" => query.OrderBy(set => set.Qty).ThenBy(set => set.Name),
            "-qty" => query.OrderByDescending(set => set.Qty).ThenBy(set => set.Name),
            "-name" => query.OrderByDescending(set => set.Name),
            _ => query.OrderBy(set => set.Name)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(set => ToDto(set))
            .ToListAsync(cancellationToken);

        return new PagedResult<ChessexSetDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ChessexSetDto>> Get(int id, CancellationToken cancellationToken)
    {
        var set = await context.ChessexSets
            .Include(item => item.Category)
            .Include(item => item.SetType)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        return set is null ? NotFound() : ToDto(set);
    }

    [AllowAnonymous]
    [HttpGet("categories")]
    public async Task<IEnumerable<ChessexLookupDto>> GetCategories(CancellationToken cancellationToken) =>
        await context.ChessexCategories
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .Select(category => new ChessexLookupDto(category.Id, category.Name))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("set-types")]
    public async Task<IEnumerable<ChessexLookupDto>> GetSetTypes(CancellationToken cancellationToken) =>
        await context.ChessexSetTypes
            .OrderBy(type => type.SortOrder)
            .ThenBy(type => type.Name)
            .Select(type => new ChessexLookupDto(type.Id, type.Name))
            .ToListAsync(cancellationToken);

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<ChessexSetDto>> Create(UpsertChessexSetDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var category = await ResolveCategory(dto, cancellationToken);
        var setType = await ResolveSetType(dto, cancellationToken);
        var set = new ChessexSet();
        ApplySave(set, dto, category, setType);

        context.ChessexSets.Add(set);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = set.Id }, await LoadDto(set.Id, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ChessexSetDto>> Update(int id, UpsertChessexSetDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var set = await context.ChessexSets.FindAsync([id], cancellationToken);
        if (set is null)
        {
            return NotFound();
        }

        var category = await ResolveCategory(dto, cancellationToken);
        var setType = await ResolveSetType(dto, cancellationToken);
        ApplySave(set, dto, category, setType);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var set = await context.ChessexSets.FindAsync([id], cancellationToken);
        if (set is null)
        {
            return NotFound();
        }

        context.ChessexSets.Remove(set);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static IQueryable<ChessexSet> ApplyStatusFilter(IQueryable<ChessexSet> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "all" => query,
            "want" or "wanted" or "w" => query.Where(set => set.WantStatusID == WantedStatus),
            "unknown" => query.Where(set => set.WantStatusID != OwnedStatus && set.WantStatusID != WantedStatus),
            _ => query.Where(set => set.WantStatusID == OwnedStatus)
        };
    }

    private async Task<ChessexCategory> ResolveCategory(UpsertChessexSetDto dto, CancellationToken cancellationToken)
    {
        if (dto.CategoryId is not null)
        {
            return await context.ChessexCategories.FirstAsync(category => category.Id == dto.CategoryId, cancellationToken);
        }

        var name = string.IsNullOrWhiteSpace(dto.CategoryName) ? "Uncategorized" : dto.CategoryName.Trim();
        var existing = await context.ChessexCategories.FirstOrDefaultAsync(category => category.Name == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var sortOrder = await context.ChessexCategories.AnyAsync(cancellationToken)
            ? await context.ChessexCategories.MaxAsync(category => category.SortOrder, cancellationToken) + 10
            : 10;
        var created = new ChessexCategory { Name = name, SortOrder = sortOrder };
        context.ChessexCategories.Add(created);
        return created;
    }

    private async Task<ChessexSetType> ResolveSetType(UpsertChessexSetDto dto, CancellationToken cancellationToken)
    {
        if (dto.SetTypeId is not null)
        {
            return await context.ChessexSetTypes.FirstAsync(type => type.Id == dto.SetTypeId, cancellationToken);
        }

        var name = string.IsNullOrWhiteSpace(dto.SetTypeName) ? "7-Die Set" : dto.SetTypeName.Trim();
        var existing = await context.ChessexSetTypes.FirstOrDefaultAsync(type => type.Name == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var sortOrder = await context.ChessexSetTypes.AnyAsync(cancellationToken)
            ? await context.ChessexSetTypes.MaxAsync(type => type.SortOrder, cancellationToken) + 10
            : 10;
        var created = new ChessexSetType { Name = name, SortOrder = sortOrder };
        context.ChessexSetTypes.Add(created);
        return created;
    }

    private static void ApplySave(ChessexSet set, UpsertChessexSetDto dto, ChessexCategory category, ChessexSetType setType)
    {
        set.Name = dto.Name.Trim();
        set.ProductCode = NormalizeOptional(dto.ProductCode);
        set.Category = category;
        set.SetType = setType;
        set.DiceCount = dto.DiceCount;
        set.Color = NormalizeOptional(dto.Color);
        set.Notes = NormalizeOptional(dto.Notes);
        set.WantStatusID = NormalizeStatus(dto.WantStatusID);
        set.Qty = dto.Qty.GetValueOrDefault(1);
    }

    private async Task<ChessexSetDto> LoadDto(int id, CancellationToken cancellationToken) =>
        await context.ChessexSets
            .Include(set => set.Category)
            .Include(set => set.SetType)
            .Where(set => set.Id == id)
            .Select(set => ToDto(set))
            .FirstAsync(cancellationToken);

    private static ChessexSetDto ToDto(ChessexSet set) => new(
        set.Id,
        set.Name,
        set.ProductCode,
        set.CategoryId,
        set.Category?.Name ?? "Uncategorized",
        set.SetTypeId,
        set.SetType?.Name ?? "7-Die Set",
        set.DiceCount,
        set.Color,
        set.Notes,
        set.WantStatusID,
        set.Qty);

    private static string? Validate(UpsertChessexSetDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Name is required.";
        }

        return null;
    }

    private static string NormalizeStatus(string? value) =>
        value?.Trim().Equals(WantedStatus, StringComparison.OrdinalIgnoreCase) == true ? WantedStatus : OwnedStatus;

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
