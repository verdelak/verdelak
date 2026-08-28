namespace Verdelak.Api.Dtos;

public sealed record MusicFolderImportRequest(
    string RootPath,
    bool ApplyChanges = false);

public sealed record MusicFolderImportRowDto(
    string Artist,
    string Album,
    string RelativePath,
    string Status,
    int? ArtistId,
    int? AlbumId);

public sealed record MusicFolderImportResultDto(
    string RootPath,
    bool Applied,
    int ArtistFoldersScanned,
    int AlbumFoldersScanned,
    int ArtistsCreated,
    int AlbumsCreated,
    int ExistingAlbums,
    int DatabaseOnlyAlbums,
    int SkippedFolders,
    IReadOnlyList<MusicFolderImportRowDto> Rows,
    IReadOnlyList<string> Messages);
