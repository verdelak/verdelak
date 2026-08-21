namespace Verdelak.Api.Models;

public class ShoppingListItem
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Status { get; set; } = "Needed";
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Store { get; set; }
    public string? Aisle { get; set; }
    public int? SortOrder { get; set; }
    public string? SourceArea { get; set; }
    public string? SourceType { get; set; }
    public int? SourceId { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class ShoppingItemDefault
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "Grocery";
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Store { get; set; }
    public string? Aisle { get; set; }
    public int? SortOrder { get; set; }
    public bool IsFrequent { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class PantryItem
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "Grocery";
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Location { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public bool IsInStock { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
