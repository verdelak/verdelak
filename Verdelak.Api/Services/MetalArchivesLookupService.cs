using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public sealed partial class MetalArchivesLookupService(HttpClient httpClient) : IMetalArchivesLookupService
{
    public async Task<IReadOnlyList<MetalArchivesBandSearchResultDto>> SearchBandsAsync(
        string bandName,
        CancellationToken cancellationToken)
    {
        var query = bandName.Trim();
        if (string.IsNullOrWhiteSpace(query))
        {
            return [];
        }

        var uri = $"search/ajax-band-search/?field=name&query={Uri.EscapeDataString(query)}";
        using var response = await httpClient.GetAsync(uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(json);
        if (!document.RootElement.TryGetProperty("aaData", out var rows) || rows.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return rows.EnumerateArray()
            .Where(row => row.ValueKind == JsonValueKind.Array)
            .Select(ParseBandSearchRow)
            .Where(row => row is not null)
            .Select(row => row!)
            .Take(20)
            .ToList();
    }

    public async Task<IReadOnlyList<MetalArchivesReleaseDto>> GetDiscographyAsync(
        string metalArchivesBandId,
        CancellationToken cancellationToken)
    {
        var id = metalArchivesBandId.Trim();
        if (string.IsNullOrWhiteSpace(id))
        {
            return [];
        }

        var uri = $"band/discography/id/{Uri.EscapeDataString(id)}/tab/all";
        using var response = await httpClient.GetAsync(uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(json);
        if (!document.RootElement.TryGetProperty("aaData", out var rows) || rows.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return rows.EnumerateArray()
            .Where(row => row.ValueKind == JsonValueKind.Array)
            .Select(ParseReleaseRow)
            .Where(row => row is not null)
            .Select(row => row!)
            .Where(row => row.ReleaseType.Equals("Full-length", StringComparison.OrdinalIgnoreCase)
                || row.ReleaseType.Equals("EP", StringComparison.OrdinalIgnoreCase))
            .OrderBy(row => row.Year ?? int.MaxValue)
            .ThenBy(row => row.Title)
            .ToList();
    }

    private static MetalArchivesBandSearchResultDto? ParseBandSearchRow(JsonElement row)
    {
        var columns = row.EnumerateArray().ToList();
        if (columns.Count == 0)
        {
            return null;
        }

        var nameHtml = columns[0].GetString() ?? string.Empty;
        var url = ExtractFirstHref(nameHtml) ?? string.Empty;
        var id = ExtractBandId(url);
        var name = StripHtml(nameHtml);
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        return new MetalArchivesBandSearchResultDto(
            id,
            name,
            columns.Count > 1 ? StripHtml(columns[1].GetString() ?? string.Empty) : string.Empty,
            columns.Count > 2 ? StripHtml(columns[2].GetString() ?? string.Empty) : string.Empty,
            url);
    }

    private static MetalArchivesReleaseDto? ParseReleaseRow(JsonElement row)
    {
        var columns = row.EnumerateArray().ToList();
        if (columns.Count == 0)
        {
            return null;
        }

        var titleHtml = columns[0].GetString() ?? string.Empty;
        var url = ExtractFirstHref(titleHtml) ?? string.Empty;
        var id = ExtractReleaseId(url);
        var title = StripHtml(titleHtml);
        var releaseType = columns.Count > 1 ? StripHtml(columns[1].GetString() ?? string.Empty) : string.Empty;
        var year = columns.Count > 2 && int.TryParse(StripHtml(columns[2].GetString() ?? string.Empty), out var parsedYear)
            ? parsedYear
            : (int?)null;

        return string.IsNullOrWhiteSpace(title)
            ? null
            : new MetalArchivesReleaseDto(id, title, releaseType, year, url);
    }

    private static string? ExtractFirstHref(string html)
    {
        var match = HrefRegex().Match(html);
        return match.Success ? WebUtility.HtmlDecode(match.Groups["url"].Value) : null;
    }

    private static string ExtractBandId(string url)
    {
        var match = BandIdRegex().Match(url);
        return match.Success ? match.Groups["id"].Value : string.Empty;
    }

    private static string ExtractReleaseId(string url)
    {
        var match = ReleaseIdRegex().Match(url);
        return match.Success ? match.Groups["id"].Value : string.Empty;
    }

    private static string StripHtml(string html)
    {
        var withoutTags = TagRegex().Replace(html, " ");
        return WebUtility.HtmlDecode(WhitespaceRegex().Replace(withoutTags, " ")).Trim();
    }

    [GeneratedRegex("href=[\"'](?<url>[^\"']+)[\"']", RegexOptions.IgnoreCase)]
    private static partial Regex HrefRegex();

    [GeneratedRegex("/bands/[^/]+/(?<id>\\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex BandIdRegex();

    [GeneratedRegex("/albums/[^/]+/(?<id>\\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex ReleaseIdRegex();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex TagRegex();

    [GeneratedRegex("\\s+")]
    private static partial Regex WhitespaceRegex();
}
