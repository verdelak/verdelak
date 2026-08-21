namespace Verdelak.Api.Dtos;

public sealed record MetalArchivesBandSearchResultDto(
    string MetalArchivesId,
    string Name,
    string Country,
    string Genre,
    string Url);

public sealed record MetalArchivesReleaseDto(
    string MetalArchivesId,
    string Title,
    string ReleaseType,
    int? Year,
    string Url);

public sealed record MusicMetalArchivesComparisonDto(
    MetalArchivesBandSearchResultDto Band,
    IReadOnlyList<MusicMetalArchivesReleaseComparisonDto> Releases);

public sealed record MusicMetalArchivesManualCompareRequest(
    string ArtistName,
    IReadOnlyList<MetalArchivesReleaseDto> Releases);

public sealed record MusicMetalArchivesReleaseComparisonDto(
    string MetalArchivesId,
    string Title,
    string ReleaseType,
    int? Year,
    string Url,
    string Status,
    string? MatchedTitle,
    int? MatchedAlbumId,
    string? MatchNote,
    bool Selected);

public sealed record MusicMetalArchivesAddWantRequest(
    string ArtistName,
    IReadOnlyList<MusicMetalArchivesAddWantReleaseDto> Releases);

public sealed record MusicMetalArchivesAddWantReleaseDto(
    string Title,
    string ReleaseType,
    int? Year,
    string? Url,
    string? MetalArchivesId);

public sealed record MusicMetalArchivesAddWantResultDto(
    int CreatedCount,
    int SkippedCount,
    IReadOnlyList<string> Messages);
