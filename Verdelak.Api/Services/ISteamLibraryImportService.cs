using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public interface ISteamLibraryImportService
{
    Task<IReadOnlyList<SteamOwnedGameDto>> GetOwnedGamesAsync(
        string apiKey,
        string steamId,
        bool includePlayedFreeGames,
        bool includeAppInfo,
        CancellationToken cancellationToken);
}
