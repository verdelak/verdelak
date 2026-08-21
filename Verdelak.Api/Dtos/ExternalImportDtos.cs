namespace Verdelak.Api.Dtos;

public record ExternalImportBatchDto(
    int Id,
    string Source,
    string TargetArea,
    string BatchName,
    string Status,
    string? Notes,
    int ItemCount,
    int ImportableCount,
    int ImportedCount,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc);

public record ExternalImportStagingItemDto(
    int Id,
    int BatchId,
    string Source,
    string TargetArea,
    string? ExternalId,
    string Title,
    string? PlatformName,
    string? LocationName,
    string? Publisher,
    string? Developer,
    string? VersionEdition,
    string? MediaType,
    string? ArtworkUrl,
    string Status,
    string MatchStatus,
    string SelectedAction,
    string? MatchedEntityType,
    int? MatchedEntityId,
    string? MatchedTitle,
    string? Notes,
    string? ImportedEntityType,
    int? ImportedEntityId,
    DateTime? ImportedAtUtc,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc);

public record ExternalImportStageBatchRequest(
    string Source,
    string TargetArea,
    string? BatchName,
    string? Notes,
    IReadOnlyList<ExternalImportStageItemRequest> Items);

public record ExternalImportStageItemRequest(
    string? ExternalId,
    string Title,
    string? PlatformName,
    string? LocationName,
    string? Publisher,
    string? Developer,
    string? VersionEdition,
    string? MediaType,
    string? ArtworkUrl,
    string? Notes,
    string? RawJson);

public record ExternalImportUpdateItemRequest(
    string? PlatformName,
    string? LocationName,
    string? Publisher,
    string? Developer,
    string? VersionEdition,
    string? MediaType,
    string? SelectedAction,
    string? Notes);

public record ExternalImportPreviewResultDto(
    int TotalCount,
    int NewCount,
    int PossibleDuplicateCount,
    int AlreadyImportedCount,
    int MissingPlatformCount,
    IReadOnlyList<ExternalImportStagingItemDto> Items);

public record ExternalImportCommitRequest(
    IReadOnlyList<int> Ids,
    int? BatchId,
    bool ImportOnlySelected);

public record ExternalImportCommitResultDto(
    int ImportedCount,
    int SkippedCount,
    IReadOnlyList<string> Messages);

public record BoardGameGeekCollectionItemDto(
    string ObjectId,
    string Name,
    int? YearPublished,
    bool IsExpansion,
    bool Owns,
    bool Wishlist,
    int? NumPlays,
    decimal? UserRating,
    decimal? AverageRating,
    string? ImageUrl,
    string? ThumbnailUrl);

public record BoardGameGeekImportStageRequest(
    string? BatchName,
    string? Username,
    bool IncludeOwned,
    bool IncludeWishlist,
    bool IncludeExpansions);

public record BoardGameGeekImportStageResultDto(
    int BatchId,
    string BatchName,
    int ImportedFromProviderCount,
    IReadOnlyList<ExternalImportStagingItemDto> Items);
