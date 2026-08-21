namespace Verdelak.Api.Models;

public class FishTank
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Gallons { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsSetup { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public ICollection<FishTankLog> Logs { get; set; } = [];
    public ICollection<FishStock> Stock { get; set; } = [];
    public ICollection<FishTankTask> Tasks { get; set; } = [];
    public ICollection<FishLivestockEvent> LivestockEvents { get; set; } = [];
    public ICollection<FishAquariumProduct> AquariumProducts { get; set; } = [];
}

public class FishTankLog
{
    public int Id { get; set; }
    public int FishTankId { get; set; }
    public FishTank? FishTank { get; set; }
    public DateTime LoggedAt { get; set; }
    public string LogType { get; set; } = string.Empty;
    public decimal? Temperature { get; set; }
    public decimal? Ammonia { get; set; }
    public decimal? Nitrite { get; set; }
    public decimal? Nitrate { get; set; }
    public decimal? Ph { get; set; }
    public decimal? Gh { get; set; }
    public decimal? Kh { get; set; }
    public string? Notes { get; set; }
}

public class FishStock
{
    public int Id { get; set; }
    public int FishTankId { get; set; }
    public FishTank? FishTank { get; set; }
    public string CommonName { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public string? AdultSize { get; set; }
    public string? Temperament { get; set; }
    public string? TemperaturePreference { get; set; }
    public string? PhPreference { get; set; }
    public int Quantity { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}

public class FishSpeciesProfile
{
    public int Id { get; set; }
    public string CommonName { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public string? AdultSize { get; set; }
    public string? Temperament { get; set; }
    public string? TemperaturePreference { get; set; }
    public string? PhPreference { get; set; }
    public string? GhPreference { get; set; }
    public string? KhPreference { get; set; }
    public string? CareLevel { get; set; }
    public string? TankLevel { get; set; }
    public bool IsQuarantineRequired { get; set; }
    public string? Notes { get; set; }

    public ICollection<FishSpeciesFood> Foods { get; set; } = [];
}

public class FishSpeciesFood
{
    public int Id { get; set; }
    public int FishSpeciesProfileId { get; set; }
    public FishSpeciesProfile? FishSpeciesProfile { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public string? FoodType { get; set; }
    public string? FeedingFrequency { get; set; }
    public bool IsStaple { get; set; }
    public string? Notes { get; set; }
}

public class FishTankTask
{
    public int Id { get; set; }
    public int FishTankId { get; set; }
    public FishTank? FishTank { get; set; }
    public int TaskId { get; set; }
    public ScheduledTask? ScheduledTask { get; set; }
    public string TaskCategory { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class FishLivestockEvent
{
    public int Id { get; set; }
    public int FishTankId { get; set; }
    public FishTank? FishTank { get; set; }
    public int? DestinationFishTankId { get; set; }
    public FishTank? DestinationFishTank { get; set; }
    public DateTime EventDate { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string CommonName { get; set; } = string.Empty;
    public string? ScientificName { get; set; }
    public int Quantity { get; set; }
    public bool UpdatesStock { get; set; }
    public string? Notes { get; set; }
}

public class FishAquariumProduct
{
    public int Id { get; set; }
    public int? FishTankId { get; set; }
    public FishTank? FishTank { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public decimal? PercentLeft { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public ICollection<FishAquariumProductUsage> UsageLogs { get; set; } = [];
}

public class FishAquariumProductUsage
{
    public int Id { get; set; }
    public int FishAquariumProductId { get; set; }
    public FishAquariumProduct? FishAquariumProduct { get; set; }
    public DateTime UsedAt { get; set; }
    public string UsageType { get; set; } = string.Empty;
    public decimal? QuantityUsed { get; set; }
    public decimal? QuantityAfter { get; set; }
    public decimal? PercentLeftAfter { get; set; }
    public bool OpenedNewContainer { get; set; }
    public bool UpdateInventory { get; set; }
    public bool AddToShoppingList { get; set; }
    public string ShoppingCategory { get; set; } = "Pet";
    public string? Notes { get; set; }
}
