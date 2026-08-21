namespace Verdelak.Api.Models;

public class DinoTaxonomyNode
{
    public int Id { get; set; }
    public string Rank { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public DinoTaxonomyNode? Parent { get; set; }
    public ICollection<DinoTaxonomyNode> Children { get; set; } = new List<DinoTaxonomyNode>();
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class DinosaurEntry
{
    public int Id { get; set; }
    public string CommonName { get; set; } = string.Empty;
    public string ScientificName { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int? KingdomId { get; set; }
    public int? PhylumId { get; set; }
    public int? ClassId { get; set; }
    public string? Clades { get; set; }
    public int? FamilyId { get; set; }
    public int? SubfamilyId { get; set; }
    public int? GenusId { get; set; }
    public int? SpeciesId { get; set; }
    public string? DiscoveryDate { get; set; }
    public string? DiscoveredBy { get; set; }
    public string? Description { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public DinoTaxonomyNode? Kingdom { get; set; }
    public DinoTaxonomyNode? Phylum { get; set; }
    public DinoTaxonomyNode? Class { get; set; }
    public DinoTaxonomyNode? Family { get; set; }
    public DinoTaxonomyNode? Subfamily { get; set; }
    public DinoTaxonomyNode? Genus { get; set; }
    public DinoTaxonomyNode? Species { get; set; }
    public ICollection<DinoContentSection> Sections { get; set; } = new List<DinoContentSection>();
    public ICollection<DinoIllustration> Illustrations { get; set; } = new List<DinoIllustration>();
}

public class DinoContentSection
{
    public int Id { get; set; }
    public int DinosaurEntryId { get; set; }
    public DinosaurEntry? DinosaurEntry { get; set; }
    public string Heading { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class DinoIllustration
{
    public int Id { get; set; }
    public int DinosaurEntryId { get; set; }
    public DinosaurEntry? DinosaurEntry { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public string? Credit { get; set; }
    public int SortOrder { get; set; }
}
