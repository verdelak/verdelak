using System.Text.Json;
using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public sealed class CrossrefLookupService(HttpClient httpClient) : ICrossrefLookupService
{
    private const string ProviderName = "Crossref";

    public async Task<IReadOnlyList<BarcodeLookupCandidate>> LookupIsbnAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken)
    {
        var isbn = item.NormalizedCode.Trim();
        if (string.IsNullOrWhiteSpace(isbn))
        {
            return [];
        }

        var requestUri = $"works?filter=isbn:{Uri.EscapeDataString(isbn)}&rows=5";
        using var response = await httpClient.GetAsync(requestUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(rawJson);

        if (!document.RootElement.TryGetProperty("message", out var message)
            || !message.TryGetProperty("items", out var items)
            || items.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return items.EnumerateArray()
            .Select(work => ToCandidate(item.Id, work, rawJson))
            .Where(candidate => !string.IsNullOrWhiteSpace(candidate.Title))
            .ToList();
    }

    private static BarcodeLookupCandidate ToCandidate(int stagingItemId, JsonElement work, string rawJson)
    {
        return new BarcodeLookupCandidate
        {
            BarcodeStagingItemId = stagingItemId,
            Provider = ProviderName,
            ExternalId = GetString(work, "DOI"),
            Title = FirstString(work, "title"),
            Creator = JoinAuthors(work),
            Publisher = GetString(work, "publisher"),
            PublishDate = GetIssuedYear(work),
            Format = FirstString(work, "type") ?? "Book",
            CoverImageUrl = null,
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

    private static string? FirstString(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object
            || !element.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind switch
        {
            JsonValueKind.String => property.GetString(),
            JsonValueKind.Array => property.EnumerateArray()
                .Where(entry => entry.ValueKind == JsonValueKind.String)
                .Select(entry => entry.GetString())
                .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)),
            _ => null
        };
    }

    private static string? JoinAuthors(JsonElement work)
    {
        if (work.ValueKind != JsonValueKind.Object
            || !work.TryGetProperty("author", out var authors)
            || authors.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var values = authors.EnumerateArray()
            .Select(author =>
            {
                var given = GetString(author, "given");
                var family = GetString(author, "family");
                return string.Join(" ", new[] { given, family }.Where(value => !string.IsNullOrWhiteSpace(value)));
            })
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToList();

        return values.Count == 0 ? null : string.Join(", ", values);
    }

    private static string? GetIssuedYear(JsonElement work)
    {
        if (work.ValueKind != JsonValueKind.Object
            || !work.TryGetProperty("issued", out var issued)
            || issued.ValueKind != JsonValueKind.Object
            || !issued.TryGetProperty("date-parts", out var dateParts)
            || dateParts.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var firstDate = dateParts.EnumerateArray().FirstOrDefault();
        if (firstDate.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var year = firstDate.EnumerateArray().FirstOrDefault();
        return year.ValueKind == JsonValueKind.Number && year.TryGetInt32(out var value)
            ? value.ToString()
            : null;
    }
}
