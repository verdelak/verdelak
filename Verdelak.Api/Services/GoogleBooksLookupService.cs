using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class GoogleBooksLookupService(
    HttpClient httpClient,
    IConfiguration configuration) : IGoogleBooksLookupService
{
    private const string ProviderName = "GoogleBooks";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupIsbnAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var isbn = item.NormalizedCode;
        var requestUri = $"books/v1/volumes?q=isbn:{Uri.EscapeDataString(isbn)}&maxResults=5";
        var apiKey = configuration["GoogleBooks:ApiKey"];

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            requestUri += $"&key={Uri.EscapeDataString(apiKey)}";
        }

        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);

        if (!document.RootElement.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return items.EnumerateArray()
            .Select(volume => ToCandidate(item.Id, volume, rawJson))
            .Where(candidate => !string.IsNullOrWhiteSpace(candidate.Title))
            .ToList();
    }

    private static BarcodeLookupCandidate ToCandidate(int stagingItemId, JsonElement volume, string rawJson)
    {
        var volumeInfo = volume.TryGetProperty("volumeInfo", out var info) ? info : default;

        return new BarcodeLookupCandidate
        {
            BarcodeStagingItemId = stagingItemId,
            Provider = ProviderName,
            ExternalId = GetString(volume, "id"),
            Title = GetString(volumeInfo, "title"),
            Creator = JoinStringArray(volumeInfo, "authors"),
            Publisher = GetString(volumeInfo, "publisher"),
            PublishDate = GetString(volumeInfo, "publishedDate"),
            Format = "Book",
            CoverImageUrl = GetImageLink(volumeInfo),
            Confidence = 90,
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

    private static string? JoinStringArray(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object
            || !element.TryGetProperty(propertyName, out var property)
            || property.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var values = property.EnumerateArray()
            .Where(entry => entry.ValueKind == JsonValueKind.String)
            .Select(entry => entry.GetString())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToList();

        return values.Count == 0 ? null : string.Join(", ", values);
    }

    private static string? GetImageLink(JsonElement volumeInfo)
    {
        if (volumeInfo.ValueKind != JsonValueKind.Object
            || !volumeInfo.TryGetProperty("imageLinks", out var imageLinks)
            || imageLinks.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return GetString(imageLinks, "thumbnail")
            ?? GetString(imageLinks, "smallThumbnail");
    }
}
