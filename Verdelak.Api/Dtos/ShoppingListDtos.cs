namespace Verdelak.Api.Dtos;

public record ShoppingListItemDto(
    int Id,
    string ItemName,
    string Category,
    string Status,
    decimal? Quantity,
    string? Unit,
    string? Store,
    string? Aisle,
    int? SortOrder,
    string? SourceArea,
    string? SourceType,
    int? SourceId,
    string? Reason,
    string? Notes,
    DateTime CreatedAt,
    DateTime? CompletedAt
);

public record ShoppingListItemUpsertDto(
    string ItemName,
    string Category,
    decimal? Quantity,
    string? Unit,
    string? Store,
    string? Aisle,
    int? SortOrder,
    string? SourceArea,
    string? SourceType,
    int? SourceId,
    string? Reason,
    string? Notes
);

public record ShoppingListItemStatusUpdateDto(string Status);

public record ShoppingListClearCompletedResultDto(int DeletedCount);

public record ShoppingListDuplicateGroupDto(
    string Key,
    string ItemName,
    string Category,
    string? Unit,
    string? Store,
    string? Aisle,
    int Count,
    decimal? TotalQuantity,
    IReadOnlyCollection<ShoppingListItemDto> Items
);

public record ShoppingListMergeDuplicatesResultDto(int GroupsMerged, int ItemsUpdated, int ItemsRemoved);

public record ShoppingListHistorySummaryDto(
    IReadOnlyCollection<ShoppingListHistoryMonthDto> Months,
    IReadOnlyCollection<ShoppingListHistoryBucketDto> BySource,
    IReadOnlyCollection<ShoppingListHistoryBucketDto> ByCategory
);

public record ShoppingListHistoryMonthDto(
    string Month,
    int PurchasedCount,
    int SkippedCount
);

public record ShoppingListHistoryBucketDto(
    string Name,
    int PurchasedCount,
    int SkippedCount
);

public record ShoppingItemDefaultDto(
    int Id,
    string ItemName,
    string Category,
    decimal? Quantity,
    string? Unit,
    string? Store,
    string? Aisle,
    int? SortOrder,
    bool IsFrequent,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ShoppingItemDefaultUpsertDto(
    string ItemName,
    string Category,
    decimal? Quantity,
    string? Unit,
    string? Store,
    string? Aisle,
    int? SortOrder,
    bool IsFrequent,
    string? Notes
);

public record PantryItemDto(
    int Id,
    string ItemName,
    string Category,
    decimal? Quantity,
    string? Unit,
    string? Location,
    DateTime? ExpirationDate,
    bool IsInStock,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record PantryItemUpsertDto(
    string ItemName,
    string Category,
    decimal? Quantity,
    string? Unit,
    string? Location,
    DateTime? ExpirationDate,
    bool IsInStock,
    string? Notes
);

public record FishProductShoppingCandidateRequestDto(string? Reason);
