using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/dino")]
public class DinoController(VerdelakDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PublicDinosaurSummaryDto>>> GetDinosaurs(
        [FromQuery] string? search,
        [FromQuery] string? taxonomy,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        var query = PublishedDinosaurQuery();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(item =>
                item.CommonName.Contains(term) ||
                item.ScientificName.Contains(term) ||
                (item.Description != null && item.Description.Contains(term)) ||
                (item.Clades != null && item.Clades.Contains(term)) ||
                (item.DiscoveredBy != null && item.DiscoveredBy.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(taxonomy))
        {
            var term = taxonomy.Trim();
            query = query.Where(item =>
                (item.Kingdom != null && item.Kingdom.Name == term) ||
                (item.Phylum != null && item.Phylum.Name == term) ||
                (item.Class != null && item.Class.Name == term) ||
                (item.Family != null && item.Family.Name == term) ||
                (item.Subfamily != null && item.Subfamily.Name == term) ||
                (item.Genus != null && item.Genus.Name == term) ||
                (item.Species != null && item.Species.Name == term) ||
                (item.Clades != null && item.Clades.Contains(term)));
        }

        limit = Math.Clamp(limit, 1, 500);
        var dinosaurs = await query
            .OrderBy(item => item.CommonName)
            .ThenBy(item => item.ScientificName)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return Ok(dinosaurs.Select(ToPublicSummaryDto));
    }

    [HttpGet("{slugOrId}")]
    public async Task<ActionResult<PublicDinosaurDetailDto>> GetDinosaur(string slugOrId, CancellationToken cancellationToken)
    {
        var query = PublishedDinosaurQuery();
        var dinosaur = int.TryParse(slugOrId, out var id)
            ? await query.SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
            : await query.SingleOrDefaultAsync(item => item.Slug == slugOrId.Trim(), cancellationToken);

        return dinosaur is null ? NotFound() : Ok(ToPublicDetailDto(dinosaur));
    }

    [HttpGet("taxonomy")]
    public async Task<ActionResult<IEnumerable<PublicDinoTaxonomyNodeDto>>> GetTaxonomy(CancellationToken cancellationToken)
    {
        var published = await context.DinosaurEntries
            .AsNoTracking()
            .Where(item => item.IsPublished)
            .Select(item => new
            {
                item.KingdomId,
                item.PhylumId,
                item.ClassId,
                item.FamilyId,
                item.SubfamilyId,
                item.GenusId,
                item.SpeciesId
            })
            .ToListAsync(cancellationToken);

        var publishedCounts = published
            .SelectMany(item => new[]
            {
                item.KingdomId,
                item.PhylumId,
                item.ClassId,
                item.FamilyId,
                item.SubfamilyId,
                item.GenusId,
                item.SpeciesId
            })
            .Where(id => id.HasValue)
            .GroupBy(id => id!.Value)
            .ToDictionary(group => group.Key, group => group.Count());

        var nodes = await context.DinoTaxonomyNodes
            .AsNoTracking()
            .Include(item => item.Parent)
            .OrderBy(item => item.Rank)
            .ThenBy(item => item.SortOrder)
            .ThenBy(item => item.Name)
            .ToListAsync(cancellationToken);

        return Ok(nodes
            .Where(node => publishedCounts.ContainsKey(node.Id))
            .Select(node => new PublicDinoTaxonomyNodeDto(
                node.Id,
                node.Rank,
                node.Name,
                node.Parent?.Name,
                node.Description,
                publishedCounts[node.Id])));
    }

    private IQueryable<DinosaurEntry> PublishedDinosaurQuery() =>
        context.DinosaurEntries
            .AsNoTracking()
            .Where(item => item.IsPublished)
            .Include(item => item.Kingdom)
            .Include(item => item.Phylum)
            .Include(item => item.Class)
            .Include(item => item.Family)
            .Include(item => item.Subfamily)
            .Include(item => item.Genus)
            .Include(item => item.Species)
            .Include(item => item.Sections)
            .Include(item => item.Illustrations);

    private static PublicDinosaurSummaryDto ToPublicSummaryDto(DinosaurEntry dinosaur)
    {
        var primaryImage = dinosaur.Illustrations
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Caption)
            .FirstOrDefault();

        return new PublicDinosaurSummaryDto(
            dinosaur.Id,
            dinosaur.CommonName,
            dinosaur.ScientificName,
            dinosaur.Slug,
            ClassificationLabel(dinosaur),
            dinosaur.DiscoveryDate,
            dinosaur.DiscoveredBy,
            dinosaur.Description,
            primaryImage?.ImageUrl,
            primaryImage?.Caption);
    }

    private static PublicDinosaurDetailDto ToPublicDetailDto(DinosaurEntry dinosaur) => new(
        dinosaur.Id,
        dinosaur.CommonName,
        dinosaur.ScientificName,
        dinosaur.Slug,
        Classification(dinosaur),
        CladeList(dinosaur.Clades),
        dinosaur.DiscoveryDate,
        dinosaur.DiscoveredBy,
        dinosaur.Description,
        dinosaur.Sections
            .OrderBy(section => section.SortOrder)
            .ThenBy(section => section.Heading)
            .Select(section => new DinoContentSectionDto(section.Id, section.Heading, section.Body, section.SortOrder))
            .ToList(),
        dinosaur.Illustrations
            .OrderBy(illustration => illustration.SortOrder)
            .ThenBy(illustration => illustration.Caption)
            .Select(illustration => new DinoIllustrationDto(illustration.Id, illustration.ImageUrl, illustration.Caption, illustration.Credit, illustration.SortOrder))
            .ToList());

    private static IReadOnlyList<PublicDinoClassificationDto> Classification(DinosaurEntry dinosaur)
    {
        var rows = new List<PublicDinoClassificationDto>();
        AddClassification(rows, "Kingdom", dinosaur.Kingdom?.Name);
        AddClassification(rows, "Phylum", dinosaur.Phylum?.Name);
        AddClassification(rows, "Class", dinosaur.Class?.Name);
        AddClassification(rows, "Family", dinosaur.Family?.Name);
        AddClassification(rows, "Subfamily", dinosaur.Subfamily?.Name);
        AddClassification(rows, "Genus", dinosaur.Genus?.Name);
        AddClassification(rows, "Species", dinosaur.Species?.Name);
        return rows;
    }

    private static string? ClassificationLabel(DinosaurEntry dinosaur)
    {
        var names = Classification(dinosaur).Select(item => item.Name).ToList();
        return names.Count == 0 ? null : string.Join(" / ", names);
    }

    private static IReadOnlyList<string> CladeList(string? clades) =>
        string.IsNullOrWhiteSpace(clades)
            ? []
            : clades.Split([',', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

    private static void AddClassification(List<PublicDinoClassificationDto> rows, string rank, string? name)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            rows.Add(new PublicDinoClassificationDto(rank, name));
        }
    }
}
