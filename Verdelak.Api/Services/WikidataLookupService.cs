using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class WikidataLookupService(HttpClient httpClient) : IWikidataLookupService
{
    private const string ProviderName = "Wikidata";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var code = item.NormalizedCode.Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            return [];
        }

        var query = BuildQuery(code);
        var requestUri = $"sparql?format=json&query={Uri.EscapeDataString(query)}";
        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);

        if (!document.RootElement.TryGetProperty("results", out var results)
            || !results.TryGetProperty("bindings", out var bindings)
            || bindings.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return bindings.EnumerateArray()
            .Select(binding => ToCandidate(item.Id, binding, rawJson))
            .Where(candidate => !string.IsNullOrWhiteSpace(candidate.Title))
            .ToList();
    }

    private static string BuildQuery(string code) =>
        $$"""
        SELECT ?item ?itemLabel ?creatorLabel ?publisherLabel ?publicationDate ?formatLabel ?image WHERE {
          VALUES ?identifier { "{{code}}" }
          {
            ?item wdt:P212 ?identifier.
          }
          UNION
          {
            ?item wdt:P957 ?identifier.
          }
          UNION
          {
            ?item wdt:P3962 ?identifier.
          }
          UNION
          {
            ?item wdt:P3967 ?identifier.
          }
          OPTIONAL { ?item wdt:P50 ?creator. }
          OPTIONAL { ?item wdt:P57 ?creator. }
          OPTIONAL { ?item wdt:P170 ?creator. }
          OPTIONAL { ?item wdt:P123 ?publisher. }
          OPTIONAL { ?item wdt:P577 ?publicationDate. }
          OPTIONAL { ?item wdt:P31 ?format. }
          OPTIONAL { ?item wdt:P18 ?image. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 5
        """;

    private static BarcodeLookupCandidate ToCandidate(int stagingItemId, JsonElement binding, string rawJson)
    {
        var externalId = GetUriId(GetBindingValue(binding, "item"));
        var title = GetBindingValue(binding, "itemLabel");

        return new BarcodeLookupCandidate
        {
            BarcodeStagingItemId = stagingItemId,
            Provider = ProviderName,
            ExternalId = externalId,
            Title = title,
            Creator = GetBindingValue(binding, "creatorLabel"),
            Publisher = GetBindingValue(binding, "publisherLabel"),
            PublishDate = ToYear(GetBindingValue(binding, "publicationDate")),
            Format = GetBindingValue(binding, "formatLabel"),
            CoverImageUrl = GetBindingValue(binding, "image"),
            Confidence = 58,
            RawJson = rawJson,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    private static string? GetBindingValue(JsonElement binding, string propertyName)
    {
        if (binding.ValueKind != JsonValueKind.Object
            || !binding.TryGetProperty(propertyName, out var property)
            || property.ValueKind != JsonValueKind.Object
            || !property.TryGetProperty("value", out var value)
            || value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return value.GetString();
    }

    private static string? GetUriId(string? uri)
    {
        if (string.IsNullOrWhiteSpace(uri))
        {
            return null;
        }

        var slashIndex = uri.LastIndexOf('/');
        return slashIndex >= 0 && slashIndex < uri.Length - 1 ? uri[(slashIndex + 1)..] : uri;
    }

    private static string? ToYear(string? value)
    {
        return DateTimeOffset.TryParse(value, out var date)
            ? date.Year.ToString()
            : value;
    }
}
