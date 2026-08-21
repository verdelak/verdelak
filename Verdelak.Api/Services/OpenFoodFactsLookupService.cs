using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class OpenFoodFactsLookupService(HttpClient httpClient) : IOpenFoodFactsLookupService
{
    private const string ProviderName = "OpenFoodFacts";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var requestUri = $"api/v2/product/{Uri.EscapeDataString(item.NormalizedCode)}.json?fields=code,product_name,product_name_en,generic_name,generic_name_en,brands,categories,categories_tags,quantity,packaging,stores,image_front_url,image_url";
        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);
        var root = document.RootElement;

        if (!root.TryGetProperty("status", out var status) || status.GetInt32() != 1)
        {
            return [];
        }

        if (!root.TryGetProperty("product", out var product) || product.ValueKind != JsonValueKind.Object)
        {
            return [];
        }

        var candidate = ToCandidate(item.Id, product, rawJson);
        return string.IsNullOrWhiteSpace(candidate.Title) ? [] : [candidate];
    }

    private static BarcodeLookupCandidate ToCandidate(int stagingItemId, JsonElement product, string rawJson)
    {
        var categories = GetString(product, "categories") ?? FirstCategoryTag(product);
        var quantity = GetString(product, "quantity");
        var packaging = GetString(product, "packaging");
        var formatParts = new[] { categories, quantity, packaging }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new BarcodeLookupCandidate
        {
            BarcodeStagingItemId = stagingItemId,
            Provider = ProviderName,
            ExternalId = GetString(product, "code"),
            Title = GetString(product, "product_name_en")
                ?? GetString(product, "product_name")
                ?? GetString(product, "generic_name_en")
                ?? GetString(product, "generic_name"),
            Creator = GetString(product, "brands"),
            Publisher = GetString(product, "brands"),
            PublishDate = null,
            Format = formatParts.Count > 0 ? string.Join(" / ", formatParts) : "Product",
            CoverImageUrl = GetString(product, "image_front_url") ?? GetString(product, "image_url"),
            Confidence = 55,
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

    private static string? FirstCategoryTag(JsonElement product)
    {
        if (product.ValueKind != JsonValueKind.Object
            || !product.TryGetProperty("categories_tags", out var tags)
            || tags.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        return tags.EnumerateArray()
            .Where(tag => tag.ValueKind == JsonValueKind.String)
            .Select(tag => tag.GetString())
            .Select(tag => tag?.StartsWith("en:", StringComparison.OrdinalIgnoreCase) == true ? tag[3..] : tag)
            .Select(tag => tag?.Replace('-', ' '))
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }
}
