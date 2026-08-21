namespace Verdelak.Api.Dtos;

public record ComicSeriesDto(
    int Id,
    string Title,
    string? Notes);

public record UpsertComicSeriesDto(
    string? Title,
    string? Notes);

public record ComicValueDto(
    int Id,
    int StoredID,
    decimal Price);

public record ComicIssueDto(
    int Id,
    int SeriesId,
    string Series,
    short? IssueNumber,
    bool IsSpecial,
    string? Name,
    short? IssueMonth,
    string? IssueYear,
    bool IsGraphicNovel,
    bool IsVariant,
    string? Notes,
    string StatusID,
    decimal? Rating,
    IReadOnlyList<ComicValueDto> Values,
    string DisplayLabel);


public record ComicSeriesReportDto(
    int SeriesId,
    string Series,
    string? Notes,
    int IssueCount,
    int OwnedIssueCount,
    int WantedIssueCount,
    int SpecialCount,
    int GraphicNovelCount,
    int VariantCount,
    decimal TotalValue);
public record ComicWantListItemDto(
    int SeriesId,
    string Series,
    string? SeriesNotes,
    int? IssueId,
    short? IssueNumber,
    string? IssueMonth,
    string? IssueYear,
    string? Name,
    bool IsSpecial,
    bool IsGraphicNovel,
    bool IsVariant,
    string? Notes,
    decimal? Rating,
    string DisplayLabel);

public record UpsertComicIssueDto(
    int? SeriesId,
    string? SeriesTitle,
    short? IssueNumber,
    bool? IsSpecial,
    string? Name,
    short? IssueMonth,
    string? IssueYear,
    bool? IsGraphicNovel,
    bool? IsVariant,
    string? Notes,
    string? StatusID,
    decimal? Rating,
    int? StoredID,
    decimal? Price);

