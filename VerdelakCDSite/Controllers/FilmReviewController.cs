using Microsoft.AspNetCore.Mvc;
using VerdelakCDSite.Models;
using VerdelakCDSite.Services;

namespace VerdelakCDSite.Controllers;

public sealed class FilmReviewController(IVerdelakApiClient apiClient, ILogger<FilmReviewController> logger) : Controller
{
    public async Task<IActionResult> Index(
        string? search,
        string? format,
        bool includeWishlist = true,
        CancellationToken cancellationToken = default)
    {
        var appearance = await LoadAppearanceAsync(cancellationToken);
        var catalog = new PublicFilmReviewCatalog();
        string? errorMessage = null;

        try
        {
            catalog = await apiClient.GetFilmReviewCatalogAsync(search, format, includeWishlist, 200, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to reach the public Film Review API.");
            errorMessage = "The Film Review catalog is not available yet. Start Verdelak.Api and refresh this page.";
        }

        ViewData["Appearance"] = appearance;
        return View(new FilmReviewIndexViewModel
        {
            Appearance = appearance,
            SearchTerm = search,
            Format = format,
            IncludeWishlist = includeWishlist,
            Catalog = catalog,
            ApiBaseUrl = apiClient.BaseAddress?.ToString() ?? "Not configured",
            ErrorMessage = errorMessage
        });
    }

    public async Task<IActionResult> Detail(int id, CancellationToken cancellationToken)
    {
        var appearance = await LoadAppearanceAsync(cancellationToken);
        PublicFilmReviewItem? film = null;
        string? errorMessage = null;

        try
        {
            film = await apiClient.GetFilmReviewItemAsync(id, cancellationToken);
            if (film is null)
            {
                errorMessage = "That Film Review entry could not be found.";
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to load Film Review item {FilmReviewId}.", id);
            errorMessage = "This Film Review entry could not be loaded. Start Verdelak.Api and try again.";
        }

        ViewData["Appearance"] = appearance;
        return View(new FilmReviewDetailViewModel
        {
            Appearance = appearance,
            Film = film,
            ErrorMessage = errorMessage
        });
    }

    private async Task<PublicAppearanceSettings> LoadAppearanceAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await apiClient.GetFilmReviewAppearanceAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Unable to load Film Review appearance settings; using defaults.");
            return PublicAppearanceSettings.FilmReviewSiteDefault;
        }
    }
}
