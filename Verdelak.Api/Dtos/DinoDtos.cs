namespace Verdelak.Api.Dtos;

public record DinoTaxonomyNodeDto(
    int Id,
    string Rank,
    string Name,
    int? ParentId,
    string? ParentName,
    string? Description,
    int SortOrder);

public record DinoTaxonomyNodeUpsertDto(
    string Rank,
    string Name,
    int? ParentId,
    string? Description,
    int SortOrder);

public record DinosaurSummaryDto(
    int Id,
    string CommonName,
    string ScientificName,
    string Slug,
    string? KingdomName,
    string? PhylumName,
    string? ClassName,
    string? Clades,
    string? FamilyName,
    string? SubfamilyName,
    string? GenusName,
    string? SpeciesName,
    string? DiscoveryDate,
    string? DiscoveredBy,
    bool HasDescription,
    int SectionCount,
    int IllustrationCount,
    bool IsPublished);

public record DinosaurDetailDto(
    int Id,
    string CommonName,
    string ScientificName,
    string Slug,
    int? KingdomId,
    string? KingdomName,
    int? PhylumId,
    string? PhylumName,
    int? ClassId,
    string? ClassName,
    string? Clades,
    int? FamilyId,
    string? FamilyName,
    int? SubfamilyId,
    string? SubfamilyName,
    int? GenusId,
    string? GenusName,
    int? SpeciesId,
    string? SpeciesName,
    string? DiscoveryDate,
    string? DiscoveredBy,
    string? Description,
    bool IsPublished,
    IReadOnlyList<DinoContentSectionDto> Sections,
    IReadOnlyList<DinoIllustrationDto> Illustrations);

public record DinosaurUpsertDto(
    string CommonName,
    string ScientificName,
    string? Slug,
    int? KingdomId,
    int? PhylumId,
    int? ClassId,
    string? Clades,
    int? FamilyId,
    int? SubfamilyId,
    int? GenusId,
    int? SpeciesId,
    string? DiscoveryDate,
    string? DiscoveredBy,
    string? Description,
    bool IsPublished,
    IReadOnlyList<DinoContentSectionUpsertDto> Sections,
    IReadOnlyList<DinoIllustrationUpsertDto> Illustrations);

public record DinoContentSectionDto(
    int Id,
    string Heading,
    string Body,
    int SortOrder);

public record DinoContentSectionUpsertDto(
    int? Id,
    string Heading,
    string Body,
    int SortOrder);

public record DinoIllustrationDto(
    int Id,
    string ImageUrl,
    string? Caption,
    string? Credit,
    int SortOrder);

public record DinoIllustrationUpsertDto(
    int? Id,
    string ImageUrl,
    string? Caption,
    string? Credit,
    int SortOrder);

public record PublicDinoTaxonomyNodeDto(
    int Id,
    string Rank,
    string Name,
    string? ParentName,
    string? Description,
    int PublishedEntryCount);

public record PublicDinosaurSummaryDto(
    int Id,
    string CommonName,
    string ScientificName,
    string Slug,
    string? Classification,
    string? DiscoveryDate,
    string? DiscoveredBy,
    string? Description,
    string? PrimaryImageUrl,
    string? PrimaryImageCaption);

public record PublicDinosaurDetailDto(
    int Id,
    string CommonName,
    string ScientificName,
    string Slug,
    IReadOnlyList<PublicDinoClassificationDto> Classification,
    IReadOnlyList<string> Clades,
    string? DiscoveryDate,
    string? DiscoveredBy,
    string? Description,
    IReadOnlyList<DinoContentSectionDto> Sections,
    IReadOnlyList<DinoIllustrationDto> Illustrations);

public record PublicDinoClassificationDto(
    string Rank,
    string Name);
