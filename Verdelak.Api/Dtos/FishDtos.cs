namespace Verdelak.Api.Dtos;

public record FishTankDto(
    int Id,
    string Name,
    decimal? Gallons,
    string Location,
    bool IsSetup,
    bool IsActive,
    string? Notes
);

public record FishTankUpsertDto(
    string Name,
    decimal? Gallons,
    string Location,
    bool IsSetup,
    bool IsActive,
    string? Notes
);

public record FishTankLogDto(
    int Id,
    int FishTankId,
    string TankName,
    DateTime LoggedAt,
    string LogType,
    decimal? Temperature,
    decimal? Ammonia,
    decimal? Nitrite,
    decimal? Nitrate,
    decimal? Ph,
    decimal? Gh,
    decimal? Kh,
    string? Notes
);

public record FishTankLogUpsertDto(
    int FishTankId,
    DateTime LoggedAt,
    string LogType,
    decimal? Temperature,
    decimal? Ammonia,
    decimal? Nitrite,
    decimal? Nitrate,
    decimal? Ph,
    decimal? Gh,
    decimal? Kh,
    string? Notes
);

public record FishStockDto(
    int Id,
    int FishTankId,
    string TankName,
    string CommonName,
    string? ScientificName,
    string? AdultSize,
    string? Temperament,
    string? TemperaturePreference,
    string? PhPreference,
    int Quantity,
    bool IsActive,
    string? Notes
);

public record FishStockUpsertDto(
    int FishTankId,
    string CommonName,
    string? ScientificName,
    string? AdultSize,
    string? Temperament,
    string? TemperaturePreference,
    string? PhPreference,
    int Quantity,
    bool IsActive,
    string? Notes
);

public record FishSpeciesFoodDto(
    int Id,
    int FishSpeciesProfileId,
    string FoodName,
    string? FoodType,
    string? FeedingFrequency,
    bool IsStaple,
    string? Notes
);

public record FishSpeciesFoodUpsertDto(
    string FoodName,
    string? FoodType,
    string? FeedingFrequency,
    bool IsStaple,
    string? Notes
);

public record FishSpeciesProfileDto(
    int Id,
    string CommonName,
    string? ScientificName,
    string? AdultSize,
    string? Temperament,
    string? TemperaturePreference,
    string? PhPreference,
    string? GhPreference,
    string? KhPreference,
    string? CareLevel,
    string? TankLevel,
    bool IsQuarantineRequired,
    string? Notes,
    IReadOnlyList<FishSpeciesFoodDto> Foods
);

public record FishSpeciesProfileUpsertDto(
    string CommonName,
    string? ScientificName,
    string? AdultSize,
    string? Temperament,
    string? TemperaturePreference,
    string? PhPreference,
    string? GhPreference,
    string? KhPreference,
    string? CareLevel,
    string? TankLevel,
    bool IsQuarantineRequired,
    string? Notes
);

public record FishSpeciesProfileGapDto(
    int? FishSpeciesProfileId,
    int? FishStockId,
    int? FishTankId,
    string? TankName,
    string CommonName,
    string? ScientificName,
    string GapType,
    string Detail
);

public record FishTankTaskDto(
    int Id,
    int FishTankId,
    string TankName,
    int TaskId,
    string Title,
    string? Description,
    string TaskCategory,
    bool IsActive,
    string ScheduleType,
    DateTime StartDate,
    DateTime? EndDate,
    string RecurrencePattern,
    string? Notes
);

public record FishTankTaskUpsertDto(
    int FishTankId,
    string Title,
    string? Description,
    string TaskCategory,
    bool IsActive,
    string ScheduleType,
    DateTime StartDate,
    DateTime? EndDate,
    string RecurrencePattern,
    string? Notes
);

public record FishLivestockEventDto(
    int Id,
    int FishTankId,
    string TankName,
    int? DestinationFishTankId,
    string? DestinationTankName,
    DateTime EventDate,
    string EventType,
    string CommonName,
    string? ScientificName,
    int Quantity,
    bool UpdatesStock,
    string? Notes
);

public record FishLivestockEventUpsertDto(
    int FishTankId,
    int? DestinationFishTankId,
    DateTime EventDate,
    string EventType,
    string CommonName,
    string? ScientificName,
    int Quantity,
    bool UpdatesStock,
    string? Notes
);

public record FishAquariumProductDto(
    int Id,
    int? FishTankId,
    string? TankName,
    string Name,
    string Category,
    decimal? Quantity,
    string? Unit,
    decimal? PercentLeft,
    DateTime? ExpirationDate,
    bool IsActive,
    string? Notes
);

public record FishAquariumProductUpsertDto(
    int? FishTankId,
    string Name,
    string Category,
    decimal? Quantity,
    string? Unit,
    decimal? PercentLeft,
    DateTime? ExpirationDate,
    bool IsActive,
    string? Notes
);

public record FishTankHistoryItemDto(
    string Id,
    int FishTankId,
    string TankName,
    DateTime OccurredAt,
    string Kind,
    string Title,
    string? Detail,
    decimal? Temperature,
    decimal? Ammonia,
    decimal? Nitrite,
    decimal? Nitrate,
    decimal? Ph,
    decimal? Gh,
    decimal? Kh,
    string? Status,
    string? Notes
);

public record FishAquariumProductUsageDto(
    int Id,
    int FishAquariumProductId,
    string ProductName,
    string ProductCategory,
    DateTime UsedAt,
    string UsageType,
    decimal? QuantityUsed,
    decimal? QuantityAfter,
    decimal? PercentLeftAfter,
    bool OpenedNewContainer,
    bool UpdateInventory,
    bool AddToShoppingList,
    string ShoppingItemName,
    string ShoppingCategory,
    string? Notes
);

public record FishAquariumProductUsageUpsertDto(
    int FishAquariumProductId,
    DateTime UsedAt,
    string UsageType,
    decimal? QuantityUsed,
    decimal? QuantityAfter,
    decimal? PercentLeftAfter,
    bool OpenedNewContainer,
    bool UpdateInventory,
    bool AddToShoppingList,
    string? ShoppingCategory,
    string? Notes
);
