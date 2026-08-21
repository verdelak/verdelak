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
}
