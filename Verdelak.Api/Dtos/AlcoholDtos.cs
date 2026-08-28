namespace Verdelak.Api.Dtos;

public record AlcoholItemDto(
    int Id,
    string Category,
    string Name,
    string? Producer,
    string? Style,
    string? Type,
    string? Variety,
    string? Color,
    string? Country,
    string? Region,
    string? VintageOrYear,
    string? Size,
    decimal? Price,
    decimal? Rating,
    decimal? QuantityOnHand,
    string? Location,
    string StatusID,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);

public record UpsertAlcoholItemDto(
    string Category,
    string Name,
    string? Producer,
    string? Style,
    string? Type,
    string? Variety,
    string? Color,
    string? Country,
    string? Region,
    string? VintageOrYear,
    string? Size,
    decimal? Price,
    decimal? Rating,
    decimal? QuantityOnHand,
    string? Location,
    string? StatusID,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);
public record AlcoholBreakdownDto(
    string Label,
    int Count,
    decimal Quantity,
    decimal? Value);

public record AlcoholReportDto(
    int TotalItems,
    decimal TotalQuantity,
    decimal? TotalValue,
    int OwnedItems,
    int WantedItems,
    int UnknownStatusItems,
    int MissingLocationItems,
    int CleanupNeededItems,
    IReadOnlyList<AlcoholBreakdownDto> CategoryBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> TypeBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> StyleBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> CountryBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> RegionBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> LocationBreakdown,
    IReadOnlyList<AlcoholBreakdownDto> StatusBreakdown,
    IReadOnlyList<AlcoholItemDto> PriceReviewItems,
    IReadOnlyList<AlcoholItemDto> RatingReviewItems,
    IReadOnlyList<AlcoholItemDto> HighValueItems,
    IReadOnlyList<AlcoholItemDto> TopRatedItems,
    IReadOnlyList<AlcoholItemDto> VintageReviewItems,
    IReadOnlyList<AlcoholItemDto> WantedList,
    IReadOnlyList<AlcoholItemDto> CleanupItems);

public record AlcoholLookupCleanupSuggestionDto(
    string Field,
    string CurrentValue,
    string? SuggestedValue,
    int Count,
    string Reason);

public record AlcoholLookupCleanupDto(
    int TotalSuggestions,
    IReadOnlyList<AlcoholLookupCleanupSuggestionDto> Suggestions);

public record AlcoholImportDuplicateKeyDto(
    string Key,
    int Count,
    string Category,
    string Name,
    string? Producer,
    string? VintageOrYear,
    string? Size);

public record ApplyAlcoholLookupCleanupDto(
    string Field,
    string CurrentValue,
    string? SuggestedValue);

public record ApplyAlcoholLookupCleanupResultDto(
    string Field,
    string CurrentValue,
    string? SuggestedValue,
    int UpdatedRows,
    int RemovedRows);

public record MergeAlcoholLookupDto(
    string Field,
    string SourceValue,
    string? TargetValue);

public record MergeAlcoholLookupResultDto(
    string Field,
    string SourceValue,
    string? TargetValue,
    int UpdatedRows,
    int RemovedRows);

public record AlcoholProductDuplicateMemberDto(
    int ProductId,
    int InventoryRows,
    decimal Quantity,
    string? Locations,
    decimal? Price,
    decimal? Rating,
    string? Notes,
    string? SourceSheet,
    string? SourceRowLabel);

public record AlcoholProductDuplicateClusterDto(
    string Product,
    string Category,
    string? Producer,
    string? Style,
    string? Type,
    string? Variety,
    string? Color,
    string? Country,
    string? Region,
    string? VintageOrYear,
    string? Size,
    int ProductRows,
    int InventoryRows,
    decimal Quantity,
    IReadOnlyList<AlcoholProductDuplicateMemberDto> Members);

public record AlcoholProductDuplicateReportDto(
    int TotalClusters,
    int TotalProductRows,
    IReadOnlyList<AlcoholProductDuplicateClusterDto> Clusters);

public record MergeAlcoholProductDuplicatesDto(
    int TargetProductId,
    IReadOnlyList<int> ProductIds);

public record MergeAlcoholProductDuplicatesResultDto(
    int TargetProductId,
    int MergedProductRows,
    int MovedInventoryRows,
    int MovedRatingRows,
    int MovedValueRows);

