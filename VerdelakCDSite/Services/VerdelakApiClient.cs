using System.Net.Http.Json;
using VerdelakCDSite.Models;

namespace VerdelakCDSite.Services;

public interface IVerdelakApiClient
{
    Uri? BaseAddress { get; }

    Task<CdCatalogPage> GetCdCatalogAsync(string? band, int page, int pageSize, CancellationToken cancellationToken);

    Task<AlbumDetail?> GetAlbumAsync(int id, CancellationToken cancellationToken);

    Task<IReadOnlyList<PublicDinosaurSummary>> GetDinosaursAsync(string? search, string? taxonomy, int limit, CancellationToken cancellationToken);

    Task<PublicDinosaurDetail?> GetDinosaurAsync(string slugOrId, CancellationToken cancellationToken);

    Task<IReadOnlyList<PublicDinoTaxonomyNode>> GetDinoTaxonomyAsync(CancellationToken cancellationToken);

    Task<PublicResumeDocument> GetResumeAsync(CancellationToken cancellationToken);

    Task<PublicAppearanceSettings> GetMainAppearanceAsync(CancellationToken cancellationToken);

    Task<PublicAppearanceSettings> GetCdSiteAppearanceAsync(CancellationToken cancellationToken);

    Task<PublicAppearanceSettings> GetDinoSiteAppearanceAsync(CancellationToken cancellationToken);

    Task<PublicFilmReviewCatalog> GetFilmReviewCatalogAsync(string? search, string? format, bool includeWishlist, int limit, CancellationToken cancellationToken);

    Task<PublicFilmReviewItem?> GetFilmReviewItemAsync(int id, CancellationToken cancellationToken);

    Task<PublicAppearanceSettings> GetFilmReviewAppearanceAsync(CancellationToken cancellationToken);
}

public sealed class VerdelakApiClient(HttpClient httpClient) : IVerdelakApiClient
{
    public Uri? BaseAddress => httpClient.BaseAddress;

    public async Task<CdCatalogPage> GetCdCatalogAsync(string? band, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = $"api/artists/catalog?format=CD&page={Math.Max(1, page)}&pageSize={Math.Clamp(pageSize, 1, 100)}";
        if (!string.IsNullOrWhiteSpace(band))
        {
            query += $"&band={Uri.EscapeDataString(band)}";
        }

        return await httpClient.GetFromJsonAsync<CdCatalogPage>(query, cancellationToken) ?? new CdCatalogPage();
    }

    public async Task<AlbumDetail?> GetAlbumAsync(int id, CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<AlbumDetail>($"api/MusicAlbums/{id}", cancellationToken);
    }

    public async Task<IReadOnlyList<PublicDinosaurSummary>> GetDinosaursAsync(string? search, string? taxonomy, int limit, CancellationToken cancellationToken)
    {
        var query = $"api/dino?limit={Math.Clamp(limit, 1, 200)}";
        if (!string.IsNullOrWhiteSpace(search))
        {
            query += $"&search={Uri.EscapeDataString(search)}";
        }
        if (!string.IsNullOrWhiteSpace(taxonomy))
        {
            query += $"&taxonomy={Uri.EscapeDataString(taxonomy)}";
        }

        return await httpClient.GetFromJsonAsync<IReadOnlyList<PublicDinosaurSummary>>(query, cancellationToken) ?? [];
    }

    public async Task<PublicDinosaurDetail?> GetDinosaurAsync(string slugOrId, CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<PublicDinosaurDetail>($"api/dino/{Uri.EscapeDataString(slugOrId)}", cancellationToken);
    }

    public async Task<IReadOnlyList<PublicDinoTaxonomyNode>> GetDinoTaxonomyAsync(CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<IReadOnlyList<PublicDinoTaxonomyNode>>("api/dino/taxonomy", cancellationToken) ?? [];
    }

    public async Task<PublicResumeDocument> GetResumeAsync(CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<PublicResumeDocument>("api/resume", cancellationToken)
            ?? PublicResumeDocument.Empty;
    }

    public async Task<PublicAppearanceSettings> GetMainAppearanceAsync(CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<PublicAppearanceSettings>("api/admin/settings/main-appearance", cancellationToken)
            ?? PublicAppearanceSettings.PersonalSiteDefault;
    }

    public async Task<PublicAppearanceSettings> GetCdSiteAppearanceAsync(CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<PublicAppearanceSettings>("api/admin/settings/cd-site-appearance", cancellationToken)
            ?? PublicAppearanceSettings.CdSiteDefault;
    }

    public async Task<PublicAppearanceSettings> GetDinoSiteAppearanceAsync(CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<PublicAppearanceSettings>("api/admin/settings/dino-site-appearance", cancellationToken)
            ?? PublicAppearanceSettings.DinoSiteDefault;
    }

    public async Task<PublicFilmReviewCatalog> GetFilmReviewCatalogAsync(
        string? search,
        string? format,
        bool includeWishlist,
        int limit,
        CancellationToken cancellationToken)
    {
        var query = $"api/film-review?includeWishlist={includeWishlist.ToString().ToLowerInvariant()}&limit={Math.Clamp(limit, 1, 500)}";
        if (!string.IsNullOrWhiteSpace(search))
        {
            query += $"&search={Uri.EscapeDataString(search)}";
        }
        if (!string.IsNullOrWhiteSpace(format))
        {
            query += $"&format={Uri.EscapeDataString(format)}";
        }

        return await httpClient.GetFromJsonAsync<PublicFilmReviewCatalog>(query, cancellationToken)
            ?? new PublicFilmReviewCatalog();
    }

    public async Task<PublicFilmReviewItem?> GetFilmReviewItemAsync(int id, CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<PublicFilmReviewItem>($"api/film-review/{id}", cancellationToken);
    }

    public async Task<PublicAppearanceSettings> GetFilmReviewAppearanceAsync(CancellationToken cancellationToken)
    {
        return await httpClient.GetFromJsonAsync<PublicAppearanceSettings>("api/admin/settings/film-review-appearance", cancellationToken)
            ?? PublicAppearanceSettings.FilmReviewSiteDefault;
    }
}
