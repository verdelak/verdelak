using System.Text.Json;
using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public class SteamLibraryImportService(HttpClient httpClient) : ISteamLibraryImportService
{
    public async Task<IReadOnlyList<SteamOwnedGameDto>> GetOwnedGamesAsync(
        string apiKey,
        string steamId,
        bool includePlayedFreeGames,
        bool includeAppInfo,
        CancellationToken cancellationToken)
    {
        var uri = $"IPlayerService/GetOwnedGames/v1/?key={Uri.EscapeDataString(apiKey)}" +
            $"&steamid={Uri.EscapeDataString(steamId)}" +
            $"&include_appinfo={includeAppInfo.ToString().ToLowerInvariant()}" +
            $"&include_played_free_games={includePlayedFreeGames.ToString().ToLowerInvariant()}" +
            "&format=json";

        using var response = await httpClient.GetAsync(uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        if (!document.RootElement.TryGetProperty("response", out var responseElement) ||
            !responseElement.TryGetProperty("games", out var gamesElement) ||
            gamesElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return gamesElement
            .EnumerateArray()
            .Select(ParseGame)
            .Where(game => game is not null)
            .Select(game => game!)
            .OrderBy(game => game.Name)
            .ToList();
    }

    private static SteamOwnedGameDto? ParseGame(JsonElement game)
    {
        if (!game.TryGetProperty("appid", out var appIdElement) ||
            !appIdElement.TryGetInt32(out var appId))
        {
            return null;
        }

        var name = ReadString(game, "name");
        if (string.IsNullOrWhiteSpace(name))
        {
            name = $"Steam App {appId}";
        }

        game.TryGetProperty("playtime_forever", out var playtimeElement);
        var playtime = playtimeElement.TryGetInt32(out var minutes) ? minutes : 0;
        var iconHash = ReadString(game, "img_icon_url");
        var logoHash = ReadString(game, "img_logo_url");

        return new SteamOwnedGameDto(
            appId,
            name.Trim(),
            playtime,
            SteamImageUrl(appId, iconHash),
            SteamImageUrl(appId, logoHash));
    }

    private static string? ReadString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;

    private static string? SteamImageUrl(int appId, string? hash) =>
        string.IsNullOrWhiteSpace(hash)
            ? null
            : $"https://media.steampowered.com/steamcommunity/public/images/apps/{appId}/{hash}.jpg";
}
