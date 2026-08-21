namespace Verdelak.Api.Dtos;

public record AlcoholItemDto(
    int Id,
    string Category,
    string Name,
    string? Producer,
    string? Style,
    string? Type,
    string? Variety,
    string? Color,
    string? Country,
    string? Region,
    string? VintageOrYear,
    string? Size,
    decimal? Price,
    decimal? Rating,
    decimal? QuantityOnHand,
    string? Location,
    string StatusID,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);

public record UpsertAlcoholItemDto(
    string Category,
    string Name,
    string? Producer,
    string? Style,
    string? Type,
    string? Variety,
    string? Color,
    string? Country,
    string? Region,
    string? VintageOrYear,
    string? Size,
    decimal? Price,
    decimal? Rating,
    decimal? QuantityOnHand,
    string? Location,
    string? StatusID,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);
public record AlcoholBreakdownDto(
    string Label,
    int Count,
    decimal Quantity,
    decimal? Value);

public record AlcoholReportDto(
    int TotalItems,
    decimal TotalQuantity,
    decimal? TotalValue,
    int OwnedItems,
    int WantedItems,
    int UnknownStatusItems,
    int MissingLocationItems,
    int CleanupNeededItems,
    IReadOnlyList<AlcoholBreakdownDto> CategoryBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> LocationBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> StatusBreakdown,
    IReadOnlyList<AlcoholItemDto> WantedList,
    IReadOnlyList<AlcoholItemDto> CleanupItems);

