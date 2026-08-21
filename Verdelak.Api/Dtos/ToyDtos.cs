namespace Verdelak.Api.Dtos;

public record ToyLookupDto(int Id, string Name);

public record ToyFigureDto(
    int Id,
    string Name,
    short Qty,
    int LineId,
    string Line,
    int? SeriesId,
    string? Series,
    int? CompanyId,
    string? Company,
    bool InBox,
    string StatusID);

public record UpsertToyFigureDto(
    string Name,
    short? Qty,
    int? LineId,
    string? LineName,
    int? CompanyId,
    string? CompanyName,
    int? SeriesId,
    string? SeriesName,
    bool? InBox,
    string? StatusID);
