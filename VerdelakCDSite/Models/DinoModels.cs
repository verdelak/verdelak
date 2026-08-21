namespace VerdelakCDSite.Models;

public sealed class DinoIndexViewModel
{
    public string? SearchTerm { get; init; }

    public string? TaxonomyFilter { get; init; }

    public string ApiBaseUrl { get; init; } = string.Empty;

    public string? ErrorMessage { get; init; }

    public IReadOnlyList<PublicDinosaurSummary> Dinosaurs { get; init; } = [];

    public IReadOnlyList<PublicDinoTaxonomyNode> Taxonomy { get; init; } = [];

    public int WithImagesCount => Dinosaurs.Count(item => !string.IsNullOrWhiteSpace(item.PrimaryImageUrl));

    public int WithDescriptionsCount => Dinosaurs.Count(item => !string.IsNullOrWhiteSpace(item.Description));

    public bool HasSearch => !string.IsNullOrWhiteSpace(SearchTerm);

    public bool HasTaxonomyFilter => !string.IsNullOrWhiteSpace(TaxonomyFilter);
}

public sealed class DinoDetailViewModel
{
    public PublicDinosaurDetail? Dinosaur { get; init; }

    public string? ErrorMessage { get; init; }
}

public class PublicDinosaurSummary
{
    public int Id { get; init; }

    public string CommonName { get; init; } = string.Empty;

    public string ScientificName { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public IReadOnlyList<PublicDinoClassification> Classification { get; init; } = [];

    public IReadOnlyList<string> Clades { get; init; } = [];

    public string? DiscoveryDate { get; init; }

    public string? DiscoveredBy { get; init; }

    public string? Description { get; init; }

    public string? PrimaryImageUrl { get; init; }

    public string? PrimaryImageCaption { get; init; }

    public string ClassificationLabel => Classification.Count == 0
        ? "Classification not set"
        : string.Join(" / ", Classification.Select(item => $"{item.Rank}: {item.Name}"));
}

public sealed class PublicDinosaurDetail : PublicDinosaurSummary
{
    public IReadOnlyList<PublicDinoContentSection> Sections { get; init; } = [];

    public IReadOnlyList<PublicDinoIllustration> Illustrations { get; init; } = [];
}

public sealed class PublicDinoClassification
{
    public string Rank { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;
}

public sealed class PublicDinoContentSection
{
    public int Id { get; init; }

    public string Heading { get; init; } = string.Empty;

    public string Body { get; init; } = string.Empty;

    public int SortOrder { get; init; }
}

public sealed class PublicDinoIllustration
{
    public int Id { get; init; }

    public string ImageUrl { get; init; } = string.Empty;

    public string? Caption { get; init; }

    public string? Credit { get; init; }

    public int SortOrder { get; init; }
}

public sealed class PublicDinoTaxonomyNode
{
    public int Id { get; init; }

    public string Rank { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public int? ParentId { get; init; }

    public string? ParentName { get; init; }

    public string? Description { get; init; }

    public int EntryCount { get; init; }
}
