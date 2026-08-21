namespace Verdelak.Api.Models;

public class Recipe
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "General";
    public string? Cuisine { get; set; }
    public int? PrepMinutes { get; set; }
    public int? CookMinutes { get; set; }
    public int? Servings { get; set; }
    public string? SourceUrl { get; set; }
    public int? RecipeBookId { get; set; }
    public string? SourcePage { get; set; }
    public string? SourceDetail { get; set; }
    public string? Notes { get; set; }
    public bool IsCanning { get; set; }
    public bool IsFavorite { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<RecipeIngredient> Ingredients { get; set; } = new List<RecipeIngredient>();
    public ICollection<RecipeInstruction> Instructions { get; set; } = new List<RecipeInstruction>();
    public ICollection<RecipeTagLink> RecipeTagLinks { get; set; } = new List<RecipeTagLink>();
}

public class RecipeBook
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class RecipeIngredient
{
    public int Id { get; set; }
    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
    public int SortOrder { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Preparation { get; set; }
    public string ShoppingCategory { get; set; } = "Grocery";
}

public class RecipeInstruction
{
    public int Id { get; set; }
    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
    public int StepNumber { get; set; }
    public string Text { get; set; } = string.Empty;
}

public class RecipeTag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public ICollection<RecipeTagLink> RecipeTagLinks { get; set; } = new List<RecipeTagLink>();
}

public class RecipeTagLink
{
    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
    public int RecipeTagId { get; set; }
    public RecipeTag RecipeTag { get; set; } = null!;
}
