using System.Globalization;
using System.Net;
using System.Xml.Linq;
using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public class BoardGameGeekImportService(HttpClient httpClient) : IBoardGameGeekImportService
{
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(5);

    public async Task<IReadOnlyList<BoardGameGeekCollectionItemDto>> GetCollectionAsync(
        string username,
        bool includeOwned,
        bool includeWishlist,
        bool includeExpansions,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return [];
        }

        var collection = new Dictionary<string, BoardGameGeekCollectionItemDto>(StringComparer.OrdinalIgnoreCase);
        var filters = new List<string>();

        if (includeOwned || (!includeOwned && !includeWishlist))
        {
            filters.Add("own=1");
        }

        if (includeWishlist)
        {
            filters.Add("wishlist=1");
        }

        foreach (var filter in filters)
        {
            foreach (var subtypeQuery in BuildSubtypeQueries(includeExpansions))
            {
                var document = await GetCollectionDocumentAsync(username.Trim(), filter, subtypeQuery, cancellationToken);
                foreach (var item in ParseCollection(document, subtypeQuery.IsExpansion))
                {
                    if (collection.TryGetValue(item.ObjectId, out var existing))
                    {
                        collection[item.ObjectId] = existing with
                        {
                            Owns = existing.Owns || item.Owns,
                            Wishlist = existing.Wishlist || item.Wishlist,
                            IsExpansion = existing.IsExpansion || item.IsExpansion
                        };
                    }
                    else
                    {
                        collection[item.ObjectId] = item;
                    }
                }
            }
        }

        return collection.Values
            .OrderBy(item => item.Name)
            .ThenBy(item => item.YearPublished)
            .ToList();
    }

    private static IReadOnlyList<SubtypeQuery> BuildSubtypeQueries(bool includeExpansions)
    {
        var queries = new List<SubtypeQuery>
        {
            new("subtype=boardgame&excludesubtype=boardgameexpansion", false)
        };

        if (includeExpansions)
        {
            queries.Add(new("subtype=boardgameexpansion", true));
        }

        return queries;
    }

    private async Task<XDocument> GetCollectionDocumentAsync(
        string username,
        string filter,
        SubtypeQuery subtypeQuery,
        CancellationToken cancellationToken)
    {
        var path = $"xmlapi2/collection?username={Uri.EscapeDataString(username)}&stats=1&{filter}&{subtypeQuery.Query}";
        Exception? lastError = null;

        for (var attempt = 1; attempt <= 6; attempt++)
        {
            using var response = await httpClient.GetAsync(path, cancellationToken);
            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                throw new HttpRequestException(
                    "BoardGameGeek returned 401 Unauthorized. Check that the username is exact and that the requested collection or wishlist is public; private BGG collections cannot be imported through the public XML API.");
            }

            if (response.StatusCode == HttpStatusCode.Accepted
                || response.StatusCode == HttpStatusCode.ServiceUnavailable
                || response.StatusCode == HttpStatusCode.InternalServerError)
            {
                lastError = new HttpRequestException($"BoardGameGeek returned {(int)response.StatusCode} {response.ReasonPhrase}.");
                await Task.Delay(RetryDelay, cancellationToken);
                continue;
            }

            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            return await XDocument.LoadAsync(stream, LoadOptions.None, cancellationToken);
        }

        throw new HttpRequestException($"BoardGameGeek collection lookup did not complete after retrying. Last error: {lastError?.Message}");
    }

    private static IEnumerable<BoardGameGeekCollectionItemDto> ParseCollection(XDocument document, bool subtypeIsExpansion)
    {
        foreach (var item in document.Root?.Elements("item") ?? [])
        {
            var objectId = item.Attribute("objectid")?.Value?.Trim();
            var name = item.Element("name")?.Value?.Trim();
            if (string.IsNullOrWhiteSpace(objectId) || string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            var status = item.Element("status");
            var stats = item.Element("stats");
            var rating = stats?.Element("rating");

            yield return new BoardGameGeekCollectionItemDto(
                objectId,
                name,
                ReadInt(item.Element("yearpublished")?.Value),
                subtypeIsExpansion || item.Attribute("subtype")?.Value == "boardgameexpansion",
                status?.Attribute("own")?.Value == "1",
                status?.Attribute("wishlist")?.Value == "1",
                ReadInt(item.Element("numplays")?.Value),
                ReadDecimal(rating?.Attribute("value")?.Value),
                ReadDecimal(rating?.Element("average")?.Attribute("value")?.Value),
                item.Element("image")?.Value?.Trim(),
                item.Element("thumbnail")?.Value?.Trim());
        }
    }

    private static int? ReadInt(string? value) =>
        int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) ? parsed : null;

    private static decimal? ReadDecimal(string? value) =>
        decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed) ? parsed : null;

    private sealed record SubtypeQuery(string Query, bool IsExpansion);
}
