using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/dice-games")]
public class DiceGamesController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet("items")]
    public async Task<PagedResult<DiceGameItemDto>> ListDiceGameItems(
        [FromQuery] string? q,
        [FromQuery] string? setName,
        [FromQuery] string? rarity,
        [FromQuery] string? status = "all",
        [FromQuery] string? sort = "set",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        CancellationToken cancellationToken = default)
    {
        var query = context.DiceGameItems.AsNoTracking();
        query = ApplyDiceStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                item.CardName.Contains(term) ||
                (item.Subtitle != null && item.Subtitle.Contains(term)) ||
                (item.CardId != null && item.CardId.Contains(term)) ||
                (item.EnergyType != null && item.EnergyType.Contains(term)) ||
                (item.Notes != null && item.Notes.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(setName))
        {
            query = query.Where(item => item.SetName == setName.Trim());
        }

        if (!string.IsNullOrWhiteSpace(rarity))
        {
            query = query.Where(item => item.Rarity == rarity.Trim());
        }

        query = sort?.ToLowerInvariant() switch
        {
            "name" => query.OrderBy(item => item.CardName).ThenBy(item => item.Subtitle),
            "-name" => query.OrderByDescending(item => item.CardName).ThenBy(item => item.Subtitle),
            "rarity" => query.OrderBy(item => item.Rarity).ThenBy(item => item.CardName),
            "-rarity" => query.OrderByDescending(item => item.Rarity).ThenBy(item => item.CardName),
            "owned" => query.OrderByDescending(item => item.OwnedCardQty + item.OwnedFoilQty).ThenBy(item => item.CardName),
            "want" => query.OrderByDescending(item => item.WantQty).ThenBy(item => item.CardName),
            _ => query.OrderBy(item => item.SetName).ThenBy(item => item.CardNumber).ThenBy(item => item.CardName)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 500);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        return new PagedResult<DiceGameItemDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("items/report")]
    public async Task<DiceInventoryReportDto> DiceGameReport(CancellationToken cancellationToken)
    {
        var items = await context.DiceGameItems.AsNoTracking().ToListAsync(cancellationToken);
        return new DiceInventoryReportDto(
            items.Count,
            items.Count(item => item.StatusID == OwnedStatus || item.OwnedCardQty > 0 || item.OwnedFoilQty > 0 || item.OwnedDieQty > 0),
            items.Count(item => item.StatusID == WantedStatus || item.WantQty > 0),
            items.Count(item => string.IsNullOrWhiteSpace(item.SetName) || string.IsNullOrWhiteSpace(item.CardName)),
            items.Sum(item => item.OwnedCardQty + item.OwnedFoilQty),
            items.Sum(item => item.WantQty),
            BuildBreakdown(items, item => item.SetName, item => item.OwnedCardQty + item.OwnedFoilQty, item => item.WantQty, "No set"),
            BuildBreakdown(items, item => StatusLabel(item.StatusID), item => item.OwnedCardQty + item.OwnedFoilQty, item => item.WantQty, "Unknown"));
    }

    [AllowAnonymous]
    [HttpGet("items/lookups")]
    public async Task<object> DiceGameLookups(CancellationToken cancellationToken) => new
    {
        Sets = await context.DiceGameItems.AsNoTracking().Select(item => item.SetName).Where(value => value != "").Distinct().OrderBy(value => value).ToListAsync(cancellationToken),
        Rarities = await context.DiceGameItems.AsNoTracking().Select(item => item.Rarity).Where(value => value != null && value != "").Distinct().OrderBy(value => value).ToListAsync(cancellationToken)
    };

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("items")]
    public async Task<ActionResult<DiceGameItemDto>> CreateDiceGameItem(UpsertDiceGameItemDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateDiceGameItem(dto);
        if (validation is not null) return BadRequest(validation);
        var item = new DiceGameItem();
        Apply(item, dto);
        context.DiceGameItems.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(ListDiceGameItems), new { id = item.Id }, ToDto(item));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("items/{id:int}")]
    public async Task<ActionResult<DiceGameItemDto>> UpdateDiceGameItem(int id, UpsertDiceGameItemDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateDiceGameItem(dto);
        if (validation is not null) return BadRequest(validation);
        var item = await context.DiceGameItems.FindAsync([id], cancellationToken);
        if (item is null) return NotFound();
        Apply(item, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(item);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteDiceGameItem(int id, CancellationToken cancellationToken)
    {
        var item = await context.DiceGameItems.FindAsync([id], cancellationToken);
        if (item is null) return NotFound();
        context.DiceGameItems.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("dragon-dice")]
    public async Task<PagedResult<DragonDiceItemDto>> ListDragonDiceItems(
        [FromQuery] string? q,
        [FromQuery] string? race,
        [FromQuery] string? role,
        [FromQuery] string? status = "all",
        [FromQuery] string? sort = "race",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        CancellationToken cancellationToken = default)
    {
        var query = context.DragonDiceItems.AsNoTracking();
        query = ApplyDragonStatusFilter(query, status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(item =>
                item.DieName.Contains(term) ||
                (item.RaceOrSpecies != null && item.RaceOrSpecies.Contains(term)) ||
                (item.Role != null && item.Role.Contains(term)) ||
                (item.DieType != null && item.DieType.Contains(term)) ||
                (item.Notes != null && item.Notes.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(race))
        {
            query = query.Where(item => item.RaceOrSpecies == race.Trim());
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(item => item.Role == role.Trim());
        }

        query = sort?.ToLowerInvariant() switch
        {
            "name" => query.OrderBy(item => item.DieName),
            "-name" => query.OrderByDescending(item => item.DieName),
            "role" => query.OrderBy(item => item.Role).ThenBy(item => item.DieName),
            "-role" => query.OrderByDescending(item => item.Role).ThenBy(item => item.DieName),
            "owned" => query.OrderByDescending(item => item.OwnedQty).ThenBy(item => item.DieName),
            "want" => query.OrderByDescending(item => item.WantQty).ThenBy(item => item.DieName),
            _ => query.OrderBy(item => item.RaceOrSpecies).ThenBy(item => item.Role).ThenBy(item => item.DieName)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 500);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);

        return new PagedResult<DragonDiceItemDto>(items, total);
    }

    [AllowAnonymous]
    [HttpGet("dragon-dice/report")]
    public async Task<DiceInventoryReportDto> DragonDiceReport(CancellationToken cancellationToken)
    {
        var items = await context.DragonDiceItems.AsNoTracking().ToListAsync(cancellationToken);
        return new DiceInventoryReportDto(
            items.Count,
            items.Count(item => item.StatusID == OwnedStatus || item.OwnedQty > 0),
            items.Count(item => item.StatusID == WantedStatus || item.WantQty > 0),
            items.Count(item => string.IsNullOrWhiteSpace(item.DieName)),
            items.Sum(item => item.OwnedQty),
            items.Sum(item => item.WantQty),
            BuildBreakdown(items, item => item.RaceOrSpecies, item => item.OwnedQty, item => item.WantQty, "No race/set"),
            BuildBreakdown(items, item => StatusLabel(item.StatusID), item => item.OwnedQty, item => item.WantQty, "Unknown"));
    }

    [AllowAnonymous]
    [HttpGet("dragon-dice/lookups")]
    public async Task<object> DragonDiceLookups(CancellationToken cancellationToken) => new
    {
        Races = await context.DragonDiceItems.AsNoTracking().Select(item => item.RaceOrSpecies).Where(value => value != null && value != "").Distinct().OrderBy(value => value).ToListAsync(cancellationToken),
        Roles = await context.DragonDiceItems.AsNoTracking().Select(item => item.Role).Where(value => value != null && value != "").Distinct().OrderBy(value => value).ToListAsync(cancellationToken)
    };

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("dragon-dice")]
    public async Task<ActionResult<DragonDiceItemDto>> CreateDragonDiceItem(UpsertDragonDiceItemDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateDragonDiceItem(dto);
        if (validation is not null) return BadRequest(validation);
        var item = new DragonDiceItem();
        Apply(item, dto);
        context.DragonDiceItems.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(ListDragonDiceItems), new { id = item.Id }, ToDto(item));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("dragon-dice/{id:int}")]
    public async Task<ActionResult<DragonDiceItemDto>> UpdateDragonDiceItem(int id, UpsertDragonDiceItemDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateDragonDiceItem(dto);
        if (validation is not null) return BadRequest(validation);
        var item = await context.DragonDiceItems.FindAsync([id], cancellationToken);
        if (item is null) return NotFound();
        Apply(item, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(item);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("dragon-dice/{id:int}")]
    public async Task<IActionResult> DeleteDragonDiceItem(int id, CancellationToken cancellationToken)
    {
        var item = await context.DragonDiceItems.FindAsync([id], cancellationToken);
        if (item is null) return NotFound();
        context.DragonDiceItems.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static IQueryable<DiceGameItem> ApplyDiceStatusFilter(IQueryable<DiceGameItem> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "owned" or "h" => query.Where(item => item.StatusID == OwnedStatus || item.OwnedCardQty > 0 || item.OwnedDieQty > 0 || item.OwnedFoilQty > 0),
            "wanted" or "want" or "w" => query.Where(item => item.StatusID == WantedStatus || item.WantQty > 0),
            "all" => query,
            _ => query
        };
    }

    private static IQueryable<DragonDiceItem> ApplyDragonStatusFilter(IQueryable<DragonDiceItem> query, string? status)
    {
        var normalized = status?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "owned" or "h" => query.Where(item => item.StatusID == OwnedStatus || item.OwnedQty > 0),
            "wanted" or "want" or "w" => query.Where(item => item.StatusID == WantedStatus || item.WantQty > 0),
            "all" => query,
            _ => query
        };
    }

    private static string? ValidateDiceGameItem(UpsertDiceGameItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SetName)) return "Set is required.";
        if (string.IsNullOrWhiteSpace(dto.CardName)) return "Card name is required.";
        if (dto.OwnedCardQty is < 0 || dto.OwnedDieQty is < 0 || dto.OwnedFoilQty is < 0 || dto.WantQty is < 0) return "Quantities cannot be negative.";
        return null;
    }

    private static string? ValidateDragonDiceItem(UpsertDragonDiceItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DieName)) return "Die name is required.";
        if (dto.OwnedQty is < 0 || dto.WantQty is < 0) return "Quantities cannot be negative.";
        return null;
    }

    private static void Apply(DiceGameItem item, UpsertDiceGameItemDto dto)
    {
        item.GameName = string.IsNullOrWhiteSpace(dto.GameName) ? "D&D Dice Masters" : dto.GameName.Trim();
        item.SetName = dto.SetName.Trim();
        item.CardId = Trim(dto.CardId);
        item.CardNumber = Trim(dto.CardNumber);
        item.CardName = dto.CardName.Trim();
        item.Subtitle = Trim(dto.Subtitle);
        item.Cost = dto.Cost;
        item.EnergyType = Trim(dto.EnergyType);
        item.Alignment = Trim(dto.Alignment);
        item.Equippable = Trim(dto.Equippable);
        item.Rarity = Trim(dto.Rarity);
        item.DieLimit = dto.DieLimit;
        item.OwnedCardQty = dto.OwnedCardQty.GetValueOrDefault();
        item.OwnedDieQty = dto.OwnedDieQty.GetValueOrDefault();
        item.OwnedFoilQty = dto.OwnedFoilQty.GetValueOrDefault();
        item.WantQty = dto.WantQty.GetValueOrDefault();
        item.StatusID = NormalizeStatus(dto.StatusID, item.OwnedCardQty + item.OwnedDieQty + item.OwnedFoilQty, item.WantQty);
        item.Notes = Trim(dto.Notes);
        item.SourceSheet = Trim(dto.SourceSheet);
        item.SourceRowLabel = Trim(dto.SourceRowLabel);
    }

    private static void Apply(DragonDiceItem item, UpsertDragonDiceItemDto dto)
    {
        item.DieName = dto.DieName.Trim();
        item.RaceOrSpecies = Trim(dto.RaceOrSpecies);
        item.Role = Trim(dto.Role);
        item.DieType = Trim(dto.DieType);
        item.Health = Trim(dto.Health);
        item.Points = Trim(dto.Points);
        item.OwnedQty = dto.OwnedQty.GetValueOrDefault();
        item.WantQty = dto.WantQty.GetValueOrDefault();
        item.StatusID = NormalizeStatus(dto.StatusID, item.OwnedQty, item.WantQty);
        item.NoteCode = Trim(dto.NoteCode);
        item.IsAlternative = dto.IsAlternative ?? string.Equals(item.NoteCode, "A", StringComparison.OrdinalIgnoreCase);
        item.IsReprint = dto.IsReprint ?? string.Equals(item.NoteCode, "R", StringComparison.OrdinalIgnoreCase);
        item.Notes = Trim(dto.Notes);
        item.SourceSheet = Trim(dto.SourceSheet);
        item.SourceRowLabel = Trim(dto.SourceRowLabel);
    }

    private static DiceGameItemDto ToDto(DiceGameItem item) => new(
        item.Id, item.GameName, item.SetName, item.CardId, item.CardNumber, item.CardName, item.Subtitle, item.Cost,
        item.EnergyType, item.Alignment, item.Equippable, item.Rarity, item.DieLimit, item.OwnedCardQty, item.OwnedDieQty,
        item.OwnedFoilQty, item.WantQty, item.StatusID, item.Notes, item.SourceSheet, item.SourceRowLabel);

    private static DragonDiceItemDto ToDto(DragonDiceItem item) => new(
        item.Id, item.DieName, item.RaceOrSpecies, item.Role, item.DieType, item.Health, item.Points, item.OwnedQty,
        item.WantQty, item.StatusID, item.NoteCode, item.IsAlternative, item.IsReprint, item.Notes, item.SourceSheet, item.SourceRowLabel);

    private static IReadOnlyList<DiceInventoryBreakdownDto> BuildBreakdown<T>(
        IEnumerable<T> items,
        Func<T, string?> labelSelector,
        Func<T, int> ownedSelector,
        Func<T, int> wantSelector,
        string emptyLabel) =>
        items
            .GroupBy(item => string.IsNullOrWhiteSpace(labelSelector(item)) ? emptyLabel : labelSelector(item)!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group => new DiceInventoryBreakdownDto(group.Key, group.Count(), group.Sum(ownedSelector), group.Sum(wantSelector)))
            .OrderByDescending(row => row.Count)
            .ThenBy(row => row.Label)
            .ToList();

    private static string NormalizeStatus(string? value, int ownedQty, int wantQty)
    {
        if (value?.Trim().Equals(WantedStatus, StringComparison.OrdinalIgnoreCase) == true || (ownedQty == 0 && wantQty > 0)) return WantedStatus;
        return OwnedStatus;
    }

    private static string StatusLabel(string? value) => value == WantedStatus ? "Wanted" : value == OwnedStatus ? "Owned" : "Unknown";

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

