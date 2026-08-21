using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/dino")]
public class DinoAdminController(VerdelakDbContext context) : ControllerBase
{
    private static readonly HashSet<string> KnownRanks = new(StringComparer.OrdinalIgnoreCase)
    {
        "Kingdom",
        "Phylum",
        "Class",
        "Clade",
        "Family",
        "Subfamily",
        "Genus",
        "Species"
    };

    [HttpGet("dinosaurs")]
    public async Task<ActionResult<IEnumerable<DinosaurSummaryDto>>> GetDinosaurs(
        [FromQuery] string? search,
        [FromQuery] bool? isPublished,
        CancellationToken cancellationToken)
    {
        var query = context.DinosaurEntries
            .AsNoTracking()
            .Include(item => item.Kingdom)
            .Include(item => item.Phylum)
            .Include(item => item.Class)
            .Include(item => item.Family)
            .Include(item => item.Subfamily)
            .Include(item => item.Genus)
            .Include(item => item.Species)
            .Include(item => item.Sections)
            .Include(item => item.Illustrations)
            .AsQueryable();

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

        if (isPublished.HasValue)
        {
            query = query.Where(item => item.IsPublished == isPublished.Value);
        }

        var dinosaurs = await query
            .OrderBy(item => item.CommonName)
            .ThenBy(item => item.ScientificName)
            .ToListAsync(cancellationToken);

        return dinosaurs.Select(ToSummaryDto).ToList();
    }

    [HttpGet("dinosaurs/{id:int}")]
    public async Task<ActionResult<DinosaurDetailDto>> GetDinosaur(int id, CancellationToken cancellationToken)
    {
        var dinosaur = await DinosaurDetailQuery()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        return dinosaur is null ? NotFound() : ToDetailDto(dinosaur);
    }

    [HttpPost("dinosaurs")]
    public async Task<ActionResult<DinosaurDetailDto>> CreateDinosaur(
        DinosaurUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var dinosaur = new DinosaurEntry();
        Apply(dinosaur, dto);
        ReplaceSections(dinosaur, dto.Sections);
        ReplaceIllustrations(dinosaur, dto.Illustrations);
        context.DinosaurEntries.Add(dinosaur);
        await context.SaveChangesAsync(cancellationToken);

        var saved = await DinosaurDetailQuery().SingleAsync(item => item.Id == dinosaur.Id, cancellationToken);
        return CreatedAtAction(nameof(GetDinosaur), new { id = saved.Id }, ToDetailDto(saved));
    }

    [HttpPut("dinosaurs/{id:int}")]
    public async Task<ActionResult<DinosaurDetailDto>> UpdateDinosaur(
        int id,
        DinosaurUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var dinosaur = await context.DinosaurEntries
            .Include(item => item.Sections)
            .Include(item => item.Illustrations)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (dinosaur is null)
        {
            return NotFound();
        }

        Apply(dinosaur, dto);
        ReplaceSections(dinosaur, dto.Sections);
        ReplaceIllustrations(dinosaur, dto.Illustrations);
        await context.SaveChangesAsync(cancellationToken);

        var saved = await DinosaurDetailQuery().SingleAsync(item => item.Id == dinosaur.Id, cancellationToken);
        return ToDetailDto(saved);
    }

    [HttpDelete("dinosaurs/{id:int}")]
    public async Task<IActionResult> DeleteDinosaur(int id, CancellationToken cancellationToken)
    {
        var dinosaur = await context.DinosaurEntries.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (dinosaur is null)
        {
            return NotFound();
        }

        context.DinosaurEntries.Remove(dinosaur);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("taxonomy")]
    public async Task<ActionResult<IEnumerable<DinoTaxonomyNodeDto>>> GetTaxonomy(
        [FromQuery] string? rank,
        CancellationToken cancellationToken)
    {
        var query = context.DinoTaxonomyNodes
            .AsNoTracking()
            .Include(item => item.Parent)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(rank))
        {
            query = query.Where(item => item.Rank == rank.Trim());
        }

        var nodes = await query
            .OrderBy(item => item.Rank)
            .ThenBy(item => item.SortOrder)
            .ThenBy(item => item.Name)
            .ToListAsync(cancellationToken);

        return nodes.Select(ToDto).ToList();
    }

    [HttpPost("taxonomy")]
    public async Task<ActionResult<DinoTaxonomyNodeDto>> CreateTaxonomyNode(
        DinoTaxonomyNodeUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var node = new DinoTaxonomyNode();
        Apply(node, dto);
        context.DinoTaxonomyNodes.Add(node);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(node).Reference(item => item.Parent).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetTaxonomy), new { rank = node.Rank }, ToDto(node));
    }

    [HttpPut("taxonomy/{id:int}")]
    public async Task<ActionResult<DinoTaxonomyNodeDto>> UpdateTaxonomyNode(
        int id,
        DinoTaxonomyNodeUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var node = await context.DinoTaxonomyNodes.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (node is null)
        {
            return NotFound();
        }

        Apply(node, dto);
        await context.SaveChangesAsync(cancellationToken);
        await context.Entry(node).Reference(item => item.Parent).LoadAsync(cancellationToken);
        return ToDto(node);
    }

    [HttpDelete("taxonomy/{id:int}")]
    public async Task<IActionResult> DeleteTaxonomyNode(int id, CancellationToken cancellationToken)
    {
        var inUse = await context.DinosaurEntries.AnyAsync(item =>
            item.KingdomId == id ||
            item.PhylumId == id ||
            item.ClassId == id ||
            item.FamilyId == id ||
            item.SubfamilyId == id ||
            item.GenusId == id ||
            item.SpeciesId == id,
            cancellationToken);

        if (inUse)
        {
            return BadRequest("This taxonomy item is used by one or more dinosaur entries.");
        }

        var node = await context.DinoTaxonomyNodes.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (node is null)
        {
            return NotFound();
        }

        context.DinoTaxonomyNodes.Remove(node);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<DinosaurEntry> DinosaurDetailQuery() =>
        context.DinosaurEntries
            .AsNoTracking()
            .Include(item => item.Kingdom)
            .Include(item => item.Phylum)
            .Include(item => item.Class)
            .Include(item => item.Family)
            .Include(item => item.Subfamily)
            .Include(item => item.Genus)
            .Include(item => item.Species)
            .Include(item => item.Sections)
            .Include(item => item.Illustrations);

    private static void Apply(DinosaurEntry dinosaur, DinosaurUpsertDto dto)
    {
        dinosaur.CommonName = dto.CommonName.Trim();
        dinosaur.ScientificName = dto.ScientificName.Trim();
        dinosaur.Slug = string.IsNullOrWhiteSpace(dto.Slug) ? Slugify(dto.CommonName) : Slugify(dto.Slug);
        dinosaur.KingdomId = dto.KingdomId;
        dinosaur.PhylumId = dto.PhylumId;
        dinosaur.ClassId = dto.ClassId;
        dinosaur.Clades = Clean(dto.Clades);
        dinosaur.FamilyId = dto.FamilyId;
        dinosaur.SubfamilyId = dto.SubfamilyId;
        dinosaur.GenusId = dto.GenusId;
        dinosaur.SpeciesId = dto.SpeciesId;
        dinosaur.DiscoveryDate = Clean(dto.DiscoveryDate);
        dinosaur.DiscoveredBy = Clean(dto.DiscoveredBy);
        dinosaur.Description = Clean(dto.Description);
        dinosaur.IsPublished = dto.IsPublished;
        dinosaur.UpdatedAtUtc = DateTime.UtcNow;
    }

    private static void ReplaceSections(DinosaurEntry dinosaur, IEnumerable<DinoContentSectionUpsertDto> sections)
    {
        dinosaur.Sections.Clear();
        foreach (var section in sections.Where(section => !string.IsNullOrWhiteSpace(section.Heading) || !string.IsNullOrWhiteSpace(section.Body)))
        {
            dinosaur.Sections.Add(new DinoContentSection
            {
                Heading = string.IsNullOrWhiteSpace(section.Heading) ? "Notes" : section.Heading.Trim(),
                Body = section.Body.Trim(),
                SortOrder = section.SortOrder
            });
        }
    }

    private static void ReplaceIllustrations(DinosaurEntry dinosaur, IEnumerable<DinoIllustrationUpsertDto> illustrations)
    {
        dinosaur.Illustrations.Clear();
        foreach (var illustration in illustrations.Where(illustration => !string.IsNullOrWhiteSpace(illustration.ImageUrl)))
        {
            dinosaur.Illustrations.Add(new DinoIllustration
            {
                ImageUrl = illustration.ImageUrl.Trim(),
                Caption = Clean(illustration.Caption),
                Credit = Clean(illustration.Credit),
                SortOrder = illustration.SortOrder
            });
        }
    }

    private static void Apply(DinoTaxonomyNode node, DinoTaxonomyNodeUpsertDto dto)
    {
        node.Rank = dto.Rank.Trim();
        node.Name = dto.Name.Trim();
        node.ParentId = dto.ParentId;
        node.Description = Clean(dto.Description);
        node.SortOrder = dto.SortOrder;
        node.UpdatedAtUtc = DateTime.UtcNow;
    }

    private static string? Validate(DinosaurUpsertDto dto) =>
        string.IsNullOrWhiteSpace(dto.CommonName) ? "Common name is required." :
        string.IsNullOrWhiteSpace(dto.ScientificName) ? "Scientific name is required." :
        null;

    private static string? Validate(DinoTaxonomyNodeUpsertDto dto) =>
        string.IsNullOrWhiteSpace(dto.Rank) ? "Rank is required." :
        !KnownRanks.Contains(dto.Rank.Trim()) ? "Rank must be Kingdom, Phylum, Class, Clade, Family, Subfamily, Genus, or Species." :
        string.IsNullOrWhiteSpace(dto.Name) ? "Name is required." :
        null;

    private static DinosaurSummaryDto ToSummaryDto(DinosaurEntry dinosaur) => new(
        dinosaur.Id,
        dinosaur.CommonName,
        dinosaur.ScientificName,
        dinosaur.Slug,
        dinosaur.Kingdom?.Name,
        dinosaur.Phylum?.Name,
        dinosaur.Class?.Name,
        dinosaur.Clades,
        dinosaur.Family?.Name,
        dinosaur.Subfamily?.Name,
        dinosaur.Genus?.Name,
        dinosaur.Species?.Name,
        dinosaur.DiscoveryDate,
        dinosaur.DiscoveredBy,
        !string.IsNullOrWhiteSpace(dinosaur.Description),
        dinosaur.Sections.Count,
        dinosaur.Illustrations.Count,
        dinosaur.IsPublished);

    private static DinosaurDetailDto ToDetailDto(DinosaurEntry dinosaur) => new(
        dinosaur.Id,
        dinosaur.CommonName,
        dinosaur.ScientificName,
        dinosaur.Slug,
        dinosaur.KingdomId,
        dinosaur.Kingdom?.Name,
        dinosaur.PhylumId,
        dinosaur.Phylum?.Name,
        dinosaur.ClassId,
        dinosaur.Class?.Name,
        dinosaur.Clades,
        dinosaur.FamilyId,
        dinosaur.Family?.Name,
        dinosaur.SubfamilyId,
        dinosaur.Subfamily?.Name,
        dinosaur.GenusId,
        dinosaur.Genus?.Name,
        dinosaur.SpeciesId,
        dinosaur.Species?.Name,
        dinosaur.DiscoveryDate,
        dinosaur.DiscoveredBy,
        dinosaur.Description,
        dinosaur.IsPublished,
        dinosaur.Sections.OrderBy(section => section.SortOrder).ThenBy(section => section.Heading).Select(ToDto).ToList(),
        dinosaur.Illustrations.OrderBy(illustration => illustration.SortOrder).ThenBy(illustration => illustration.Caption).Select(ToDto).ToList());

    private static DinoTaxonomyNodeDto ToDto(DinoTaxonomyNode node) => new(
        node.Id,
        node.Rank,
        node.Name,
        node.ParentId,
        node.Parent?.Name,
        node.Description,
        node.SortOrder);

    private static DinoContentSectionDto ToDto(DinoContentSection section) =>
        new(section.Id, section.Heading, section.Body, section.SortOrder);

    private static DinoIllustrationDto ToDto(DinoIllustration illustration) =>
        new(illustration.Id, illustration.ImageUrl, illustration.Caption, illustration.Credit, illustration.SortOrder);

    private static string Slugify(string value)
    {
        var chars = value.Trim().ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) ? character : '-')
            .ToArray();

        return string.Join('-', new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
