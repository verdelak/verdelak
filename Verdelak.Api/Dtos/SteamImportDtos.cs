namespace Verdelak.Api.Dtos;

public record SteamOwnedGameDto(
    int AppId,
    string Name,
    int PlaytimeForever,
    string? IconUrl,
    string? LogoUrl);

public record SteamImportStageRequest(
    string? BatchName,
    bool IncludePlayedFreeGames);

public record SteamImportStageResultDto(
    int BatchId,
    string BatchName,
    int StagedCount,
    IReadOnlyList<ExternalImportStagingItemDto> Items);
