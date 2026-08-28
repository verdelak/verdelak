using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using VerdelakCDSite.Models;
using VerdelakCDSite.Services;

namespace VerdelakCDSite.Controllers;

public class HomeController(IVerdelakApiClient apiClient, ILogger<HomeController> logger) : Controller
{
    public async Task<IActionResult> Index(string? band, int page = 1, CancellationToken cancellationToken = default)
    {
        const int pageSize = 24;
        string? apiError = null;
        var catalog = new CdCatalogPage();
        var appearance = await LoadAppearanceAsync(cancellationToken);

        try
        {
            catalog = await apiClient.GetCdCatalogAsync(band, page, pageSize, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to reach the Verdelak API.");
            apiError = "The CD collection is not available yet. Start Verdelak.Api and refresh this page.";
        }

        var model = new CdCatalogViewModel
        {
            Appearance = appearance,
            SearchTerm = band,
            ApiBaseUrl = apiClient.BaseAddress?.ToString() ?? "Not configured",
            ErrorMessage = apiError,
            Artists = catalog.Artists,
            ArtistIndex = catalog.ArtistIndex,
            TotalArtistCount = catalog.TotalArtistCount,
            TotalAlbumCount = catalog.TotalAlbumCount,
            PageNumber = catalog.PageNumber,
            PageSize = catalog.PageSize == 0 ? pageSize : catalog.PageSize
        };

        ViewData["Appearance"] = appearance;
        return View(model);
    }

    public async Task<IActionResult> Album(int id, CancellationToken cancellationToken)
    {
        AlbumDetail? album = null;
        string? errorMessage = null;
        var appearance = await LoadAppearanceAsync(cancellationToken);

        try
        {
            album = await apiClient.GetAlbumAsync(id, cancellationToken);
            if (album is null)
            {
                errorMessage = "That CD could not be found.";
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to load album {AlbumId}.", id);
            errorMessage = "This CD could not be loaded. Start Verdelak.Api and try again.";
        }

        ViewData["Appearance"] = appearance;
        return View(new AlbumDetailViewModel
        {
            Appearance = appearance,
            Album = album,
            ErrorMessage = errorMessage
        });
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }

    private async Task<PublicAppearanceSettings> LoadAppearanceAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await apiClient.GetCdSiteAppearanceAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Unable to load CD site appearance settings; using defaults.");
            return PublicAppearanceSettings.CdSiteDefault;
        }
    }
}
