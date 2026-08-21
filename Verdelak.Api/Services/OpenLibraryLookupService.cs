using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class OpenLibraryLookupService(HttpClient httpClient) : IOpenLibraryLookupService
{
    private const string ProviderName = "OpenLibrary";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupIsbnAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var isbn = item.NormalizedCode;
        var bibKey = $"ISBN:{isbn}";
        var requestUri = $"api/books?bibkeys={Uri.EscapeDataString(bibKey)}&jscmd=data&format=json";

        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);

        if (!document.RootElement.TryGetProperty(bibKey, out var book))
        {
            return [];
        }

        var title = GetString(book, "title");

        if (string.IsNullOrWhiteSpace(title))
        {
            return [];
        }

        return
        [
            new BarcodeLookupCandidate
            {
                BarcodeStagingItemId = item.Id,
                Provider = ProviderName,
                ExternalId = bibKey,
                Title = title,
                Creator = JoinNamedArray(book, "authors"),
                Publisher = JoinNamedArray(book, "publishers"),
                PublishDate = GetString(book, "publish_date"),
                Format = "Book",
                CoverImageUrl = GetCoverUrl(book),
                Confidence = 95,
                RawJson = rawJson,
                CreatedAtUtc = DateTime.UtcNow
            }
        ];
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static string? JoinNamedArray(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var names = property.EnumerateArray()
            .Select(entry => GetString(entry, "name"))
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .ToList();

        return names.Count == 0 ? null : string.Join(", ", names);
    }

    private static string? GetCoverUrl(JsonElement book)
    {
        if (!book.TryGetProperty("cover", out var cover) || cover.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return GetString(cover, "medium") ?? GetString(cover, "large") ?? GetString(cover, "small");
    }
}
