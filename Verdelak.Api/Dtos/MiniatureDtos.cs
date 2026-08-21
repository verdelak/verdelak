namespace Verdelak.Api.Dtos;

public record MiniLookupDto(int Id, string Name);

public record MiniatureItemDto(
    int Id,
    string Name,
    string? Number,
    int? CompanyId,
    string? Company,
    int? SystemId,
    string? System,
    int? SeriesId,
    string? Series,
    string? Subset,
    string? Rarity,
    string? Size,
    string? Type,
    int OwnedQuantity,
    bool IsWanted,
    int WantedQuantity,
    decimal? LatestValue
);

public record UpsertMiniatureItemDto(
    string Name,
    string? Number,
    int? SeriesId,
    string? SeriesName,
    int? SystemId,
    string? SystemName,
    int? CompanyId,
    string? CompanyName,
    string? Subset,
    string? Rarity,
    string? Size,
    string? Type,
    int? OwnedQuantity,
    bool? IsWanted,
    int? WantedQuantity
);
