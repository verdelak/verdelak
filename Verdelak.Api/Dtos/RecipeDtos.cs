using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Dtos;

public record RecipeTagDto(
    int Id,
    string Name,
    string Slug
);

public record RecipeBookDto(
    int Id,
    string Name,
    string? Description
);

public class RecipeBookSaveDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public record RecipeIngredientDto(
    int Id,
    int SortOrder,
    string ItemName,
    decimal? Quantity,
    string? Unit,
    string? Preparation,
    string ShoppingCategory
);

public record RecipeInstructionDto(
    int Id,
    int StepNumber,
    string Text
);

public record RecipeSummaryDto(
    int Id,
    string Title,
    string? Description,
    string Category,
    string? Cuisine,
    int? PrepMinutes,
    int? CookMinutes,
    int? Servings,
    int? RecipeBookId,
    string? RecipeBookName,
    bool IsCanning,
    bool IsFavorite,
    bool IsActive,
    DateTime? LastUsedAt,
    IReadOnlyCollection<RecipeTagDto> Tags
);

public record RecipeDetailDto(
    int Id,
    string Title,
    string? Description,
    string Category,
    string? Cuisine,
    int? PrepMinutes,
    int? CookMinutes,
    int? Servings,
    string? SourceUrl,
    int? RecipeBookId,
    string? RecipeBookName,
    string? SourcePage,
    string? SourceDetail,
    string? Notes,
    bool IsCanning,
    bool IsFavorite,
    bool IsActive,
    DateTime? LastUsedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyCollection<RecipeIngredientDto> Ingredients,
    IReadOnlyCollection<RecipeInstructionDto> Instructions,
    IReadOnlyCollection<RecipeTagDto> Tags
);

public class RecipeIngredientSaveDto
{
    public int Id { get; set; }
    public int SortOrder { get; set; }

    [Required]
    public string ItemName { get; set; } = string.Empty;

    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Preparation { get; set; }
    public string ShoppingCategory { get; set; } = "Grocery";
}

public class RecipeInstructionSaveDto
{
    public int Id { get; set; }
    public int StepNumber { get; set; }

    [Required]
    public string Text { get; set; } = string.Empty;
}

public class RecipeSaveDto
{
    [Required]
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
    public List<string> Tags { get; set; } = [];
    public List<RecipeIngredientSaveDto> Ingredients { get; set; } = [];
    public List<RecipeInstructionSaveDto> Instructions { get; set; } = [];
}

public class RecipeShoppingListRequestDto
{
    public List<int> IngredientIds { get; set; } = [];
    public int? TargetServings { get; set; }
    public bool CombineDuplicates { get; set; } = true;
    public string? Store { get; set; }
    public string? Aisle { get; set; }
    public int? SortOrderStart { get; set; }
    public bool SkipPantryItems { get; set; }
    public string? ShoppingGroupName { get; set; }
}

public record RecipeShoppingListItemResultDto(
    string ItemName,
    string Category,
    decimal? Quantity,
    string? Unit,
    string? Store,
    string? Aisle,
    int? SortOrder,
    string? Notes,
    bool Created
);

public record RecipeSkippedPantryItemDto(
    string ItemName,
    string Category,
    decimal? Quantity,
    string? Unit,
    string? PantryMatch
);

public record RecipeShoppingListResultDto(
    int CreatedCount,
    int UpdatedCount,
    decimal ScaleFactor,
    int SkippedPantryCount,
    IReadOnlyCollection<RecipeSkippedPantryItemDto> SkippedPantryItems,
    IReadOnlyCollection<RecipeShoppingListItemResultDto> Items
);
