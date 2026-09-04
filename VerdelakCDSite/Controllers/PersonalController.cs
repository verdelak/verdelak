using Microsoft.AspNetCore.Mvc;
using VerdelakCDSite.Models;
using VerdelakCDSite.Services;

namespace VerdelakCDSite.Controllers;

public sealed class PersonalController(IVerdelakApiClient apiClient, ILogger<PersonalController> logger) : Controller
{
    public async Task<IActionResult> Index(CancellationToken cancellationToken = default)
    {
        var appearance = await LoadAppearanceAsync(cancellationToken);
        var resume = PublicResumeDocument.Empty;
        string? errorMessage = null;

        try
        {
            resume = await apiClient.GetResumeAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to reach the public Resume API.");
            errorMessage = "The resume is not available yet. Start Verdelak.Api and refresh this page.";
        }

        ViewData["Appearance"] = appearance;
        return View(new PersonalIndexViewModel
        {
            Appearance = appearance,
            Resume = resume,
            ApiBaseUrl = apiClient.BaseAddress?.ToString() ?? "Not configured",
            ErrorMessage = errorMessage
        });
    }

    private async Task<PublicAppearanceSettings> LoadAppearanceAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await apiClient.GetMainAppearanceAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Unable to load main appearance settings; using personal site defaults.");
            return PublicAppearanceSettings.PersonalSiteDefault;
        }
    }
}
