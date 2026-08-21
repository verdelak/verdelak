using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class MusicBrainzLookupService(HttpClient httpClient) : IMusicBrainzLookupService
{
    private const string ProviderName = "MusicBrainz";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var barcode = item.NormalizedCode;
        var requestUri = $"ws/2/release/?query=barcode:{Uri.EscapeDataString(barcode)}&fmt=json&limit=5";

        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);

        if (!document.RootElement.TryGetProperty("releases", out var releases) || releases.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return releases.EnumerateArray()
            .Select(release => ToCandidate(item.Id, release, rawJson))
            .Where(candidate => !string.IsNullOrWhiteSpace(candidate.Title))
            .ToList();
    }

    private static BarcodeLookupCandidate ToCandidate(int stagingItemId, JsonElement release, string rawJson)
    {
        var releaseId = GetString(release, "id");

        return new BarcodeLookupCandidate
        {
            BarcodeStagingItemId = stagingItemId,
            Provider = ProviderName,
            ExternalId = releaseId,
            Title = GetString(release, "title"),
            Creator = JoinArtistCredit(release),
            Publisher = JoinLabelNames(release),
            PublishDate = GetString(release, "date"),
            Format = GetFirstMediumFormat(release) ?? GetReleaseGroupType(release) ?? "Music",
            CoverImageUrl = string.IsNullOrWhiteSpace(releaseId)
                ? null
                : $"https://coverartarchive.org/release/{releaseId}/front-250",
            Confidence = GetScore(release),
            RawJson = rawJson,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        return element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty(propertyName, out var property)
            && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static decimal? GetScore(JsonElement release)
    {
        var score = GetString(release, "score");
        return decimal.TryParse(score, out var value) ? value : null;
    }

    private static string? JoinArtistCredit(JsonElement release)
    {
        if (!release.TryGetProperty("artist-credit", out var artistCredit) || artistCredit.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var names = artistCredit.EnumerateArray()
            .Select(credit => GetString(credit, "name"))
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .ToList();

        return names.Count == 0 ? null : string.Join("", names);
    }

    private static string? JoinLabelNames(JsonElement release)
    {
        if (!release.TryGetProperty("label-info", out var labelInfo) || labelInfo.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var labels = labelInfo.EnumerateArray()
            .Select(labelEntry => labelEntry.TryGetProperty("label", out var label) ? GetString(label, "name") : null)
            .Where(label => !string.IsNullOrWhiteSpace(label))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return labels.Count == 0 ? null : string.Join(", ", labels);
    }

    private static string? GetFirstMediumFormat(JsonElement release)
    {
        if (!release.TryGetProperty("media", out var media) || media.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        return media.EnumerateArray()
            .Select(medium => GetString(medium, "format"))
            .FirstOrDefault(format => !string.IsNullOrWhiteSpace(format));
    }

    private static string? GetReleaseGroupType(JsonElement release)
    {
        return release.TryGetProperty("release-group", out var releaseGroup)
            ? GetString(releaseGroup, "primary-type")
            : null;
    }
}
