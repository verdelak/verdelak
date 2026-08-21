namespace Verdelak.Api.Dtos;

public record DiceGameItemDto(
    int Id,
    string GameName,
    string SetName,
    string? CardId,
    string? CardNumber,
    string CardName,
    string? Subtitle,
    int? Cost,
    string? EnergyType,
    string? Alignment,
    string? Equippable,
    string? Rarity,
    short? DieLimit,
    short OwnedCardQty,
    short OwnedDieQty,
    short OwnedFoilQty,
    short WantQty,
    string StatusID,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);

public record UpsertDiceGameItemDto(
    string? GameName,
    string SetName,
    string? CardId,
    string? CardNumber,
    string CardName,
    string? Subtitle,
    int? Cost,
    string? EnergyType,
    string? Alignment,
    string? Equippable,
    string? Rarity,
    short? DieLimit,
    short? OwnedCardQty,
    short? OwnedDieQty,
    short? OwnedFoilQty,
    short? WantQty,
    string? StatusID,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);

public record DragonDiceItemDto(
    int Id,
    string DieName,
    string? RaceOrSpecies,
    string? Role,
    string? DieType,
    string? Health,
    string? Points,
    short OwnedQty,
    short WantQty,
    string StatusID,
    string? NoteCode,
    bool IsAlternative,
    bool IsReprint,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);

public record UpsertDragonDiceItemDto(
    string DieName,
    string? RaceOrSpecies,
    string? Role,
    string? DieType,
    string? Health,
    string? Points,
    short? OwnedQty,
    short? WantQty,
    string? StatusID,
    string? NoteCode,
    bool? IsAlternative,
    bool? IsReprint,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);

public record DiceInventoryBreakdownDto(string Label, int Count, int OwnedQty, int WantQty);

public record DiceInventoryReportDto(
    int TotalCount,
    int OwnedCount,
    int WantedCount,
    int CleanupCount,
    int OwnedQty,
    int WantQty,
    IReadOnlyList<DiceInventoryBreakdownDto> SetBreakdown,
    IReadOnlyList<DiceInventoryBreakdownDto> StatusBreakdown);
