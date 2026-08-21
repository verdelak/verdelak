using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class DiscogsLookupService(
    HttpClient httpClient,
    IConfiguration configuration) : IDiscogsLookupService
{
    private const string ProviderName = "Discogs";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var token = configuration["Discogs:Token"];
        if (string.IsNullOrWhiteSpace(token))
        {
            return [];
        }

        var requestUri = $"database/search?type=release&barcode={Uri.EscapeDataString(item.NormalizedCode)}&token={Uri.EscapeDataString(token)}&per_page=5";
        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);

        if (!document.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return results.EnumerateArray()
            .Select(result => ToCandidate(item.Id, result, rawJson))
            .Where(candidate => !string.IsNullOrWhiteSpace(candidate.Title))
            .ToList();
    }

    private static BarcodeLookupCandidate ToCandidate(int stagingItemId, JsonElement result, string rawJson)
    {
        var fullTitle = GetString(result, "title");
        var parts = SplitDiscogsTitle(fullTitle);
        var id = GetInt(result, "id")?.ToString();

        return new BarcodeLookupCandidate
        {
            BarcodeStagingItemId = stagingItemId,
            Provider = ProviderName,
            ExternalId = id,
            Title = parts.Title,
            Creator = parts.Creator,
            Publisher = JoinStringArray(result, "label"),
            PublishDate = GetInt(result, "year")?.ToString(),
            Format = JoinStringArray(result, "format") ?? "Music",
            CoverImageUrl = GetString(result, "cover_image"),
            Confidence = 72,
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

    private static int? GetInt(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var number)
            ? number
            : null;
    }

    private static string? JoinStringArray(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object
            || !element.TryGetProperty(propertyName, out var property)
            || property.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var values = property.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return values.Count == 0 ? null : string.Join(", ", values);
    }

    private static (string? Creator, string? Title) SplitDiscogsTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return (null, null);
        }

        var parts = title.Split(" - ", 2, StringSplitOptions.TrimEntries);
        return parts.Length == 2 ? (parts[0], parts[1]) : (null, title.Trim());
    }
}
