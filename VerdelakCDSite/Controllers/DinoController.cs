using Microsoft.AspNetCore.Mvc;
using VerdelakCDSite.Models;
using VerdelakCDSite.Services;

namespace VerdelakCDSite.Controllers;

public sealed class DinoController(IVerdelakApiClient apiClient, ILogger<DinoController> logger) : Controller
{
    public async Task<IActionResult> Index(string? search, string? taxonomy, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<PublicDinosaurSummary> dinosaurs = [];
        IReadOnlyList<PublicDinoTaxonomyNode> taxonomyNodes = [];
        string? errorMessage = null;

        try
        {
            dinosaurs = await apiClient.GetDinosaursAsync(search, taxonomy, 200, cancellationToken);
            taxonomyNodes = await apiClient.GetDinoTaxonomyAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to reach the public Dino API.");
            errorMessage = "The Dino archive is not available yet. Start Verdelak.Api and refresh this page.";
        }

        return View(new DinoIndexViewModel
        {
            SearchTerm = search,
            TaxonomyFilter = taxonomy,
            ApiBaseUrl = apiClient.BaseAddress?.ToString() ?? "Not configured",
            ErrorMessage = errorMessage,
            Dinosaurs = dinosaurs,
            Taxonomy = taxonomyNodes
        });
    }

    public async Task<IActionResult> Detail(string id, CancellationToken cancellationToken)
    {
        PublicDinosaurDetail? dinosaur = null;
        string? errorMessage = null;

        try
        {
            dinosaur = await apiClient.GetDinosaurAsync(id, cancellationToken);
            if (dinosaur is null)
            {
                errorMessage = "That Dino entry could not be found.";
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to load Dino entry {DinoSlugOrId}.", id);
            errorMessage = "This Dino entry could not be loaded. Start Verdelak.Api and try again.";
        }

        return View(new DinoDetailViewModel
        {
            Dinosaur = dinosaur,
            ErrorMessage = errorMessage
        });
    }
}
