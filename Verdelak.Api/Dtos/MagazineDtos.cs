namespace Verdelak.Api.Dtos;

public record MagazineLookupDto(int Id, string Name);

public record MagazineIssueDto(
    int Id,
    short? Number,
    short? Month,
    short? Year,
    string? Season,
    string? Title,
    bool Special,
    bool Alternate,
    string StatusID,
    string? Info,
    int SeriesId,
    string Series,
    string? CoverID,
    string DisplayLabel);

public record UpsertMagazineIssueDto(
    short? Number,
    short? Month,
    short? Year,
    string? Season,
    string? Title,
    bool? Special,
    bool? Alternate,
    string? StatusID,
    string? Info,
    int? SeriesId,
    string? SeriesName,
    string? CoverID);
