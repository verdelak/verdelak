using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class UpcItemDbLookupService(HttpClient httpClient) : IUpcItemDbLookupService
{
    private const string ProviderName = "UPCitemdb";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var requestUri = $"prod/trial/lookup?upc={Uri.EscapeDataString(item.NormalizedCode)}";
        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);

        if (!document.RootElement.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return items.EnumerateArray()
            .Select(product => ToCandidate(item.Id, product, rawJson))
            .Where(candidate => !string.IsNullOrWhiteSpace(candidate.Title))
            .ToList();
    }

    private static BarcodeLookupCandidate ToCandidate(int stagingItemId, JsonElement product, string rawJson)
    {
        return new BarcodeLookupCandidate
        {
            BarcodeStagingItemId = stagingItemId,
            Provider = ProviderName,
            ExternalId = GetString(product, "ean") ?? GetString(product, "upc"),
            Title = GetString(product, "title"),
            Creator = GetString(product, "brand"),
            Publisher = GetString(product, "publisher") ?? GetString(product, "brand"),
            PublishDate = null,
            Format = GetString(product, "category") ?? "Product",
            CoverImageUrl = GetFirstImage(product),
            Confidence = 60,
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

    private static string? GetFirstImage(JsonElement product)
    {
        if (product.ValueKind != JsonValueKind.Object
            || !product.TryGetProperty("images", out var images)
            || images.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        return images.EnumerateArray()
            .Where(image => image.ValueKind == JsonValueKind.String)
            .Select(image => image.GetString())
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }
}
