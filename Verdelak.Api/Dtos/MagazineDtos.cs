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

public record MagazineBreakdownDto(string Label, int Count);

public record MagazineMissingRangeDto(
    int SeriesId,
    string Series,
    short StartNumber,
    short EndNumber,
    int Count);

public record MagazineDuplicateNumberDto(
    int SeriesId,
    string Series,
    short Number,
    int Count);

public record MagazineReportDto(
    int TotalIssues,
    int OwnedIssues,
    int WantedIssues,
    int MissingNumberIssues,
    int MissingDateIssues,
    int SpecialIssues,
    int AlternateIssues,
    IReadOnlyList<MagazineBreakdownDto> SeriesBreakdown,
    IReadOnlyList<MagazineBreakdownDto> YearBreakdown,
    IReadOnlyList<MagazineMissingRangeDto> MissingRanges,
    IReadOnlyList<MagazineDuplicateNumberDto> DuplicateNumbers);

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
