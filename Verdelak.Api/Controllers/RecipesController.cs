using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/recipes")]
public class RecipesController(VerdelakDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeSummaryDto>>> GetRecipes(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? cuisine,
        [FromQuery] string? ingredient,
        [FromQuery] string? tag,
        [FromQuery] int? recipeBookId,
        [FromQuery] string? sourceStatus,
        [FromQuery] string? readiness,
        [FromQuery] int? maxTotalMinutes,
        [FromQuery] bool? isCanning,
        [FromQuery] bool includeInactive = false,
        [FromQuery] bool favoritesOnly = false,
        [FromQuery] bool recentlyUsed = false,
        [FromQuery] int? recentlyUsedDays = null,
        CancellationToken cancellationToken = default)
    {
        var query = RecipeQuery().AsNoTracking();

        if (!includeInactive)
        {
            query = query.Where(recipe => recipe.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(recipe =>
                recipe.Title.Contains(term)
                || (recipe.Description != null && recipe.Description.Contains(term))
                || recipe.Ingredients.Any(ingredient => ingredient.ItemName.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(recipe => recipe.Category == category.Trim());
        }

        if (!string.IsNullOrWhiteSpace(cuisine) && !cuisine.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(recipe => recipe.Cuisine == cuisine.Trim());
        }

        if (!string.IsNullOrWhiteSpace(ingredient))
        {
            var ingredientTerm = ingredient.Trim();
            query = query.Where(recipe => recipe.Ingredients.Any(item => item.ItemName.Contains(ingredientTerm)));
        }

        if (!string.IsNullOrWhiteSpace(tag) && !tag.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var slug = BlogController.Slugify(tag);
            query = query.Where(recipe => recipe.RecipeTagLinks.Any(link => link.RecipeTag.Slug == slug));
        }

        if (recipeBookId.HasValue)
        {
            query = query.Where(recipe => recipe.RecipeBookId == recipeBookId.Value);
        }

        if (!string.IsNullOrWhiteSpace(sourceStatus) && !sourceStatus.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedSourceStatus = sourceStatus.Trim();
            if (normalizedSourceStatus.Equals("Linked", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(recipe => recipe.RecipeBookId != null);
            }
            else if (normalizedSourceStatus.Equals("Missing", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(recipe => recipe.RecipeBookId == null);
            }
        }

        if (!string.IsNullOrWhiteSpace(readiness) && !readiness.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedReadiness = readiness.Trim();
            if (normalizedReadiness.Equals("Ready", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(recipe => recipe.Servings != null
                    && recipe.Ingredients.Any()
                    && recipe.Instructions.Any());
            }
            else if (normalizedReadiness.Equals("MissingIngredients", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(recipe => !recipe.Ingredients.Any());
            }
            else if (normalizedReadiness.Equals("MissingInstructions", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(recipe => !recipe.Instructions.Any());
            }
            else if (normalizedReadiness.Equals("MissingServings", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(recipe => recipe.Servings == null);
            }
        }

        if (maxTotalMinutes is > 0)
        {
            query = query.Where(recipe => (recipe.PrepMinutes ?? 0) + (recipe.CookMinutes ?? 0) <= maxTotalMinutes.Value);
        }

        if (isCanning.HasValue)
        {
            query = query.Where(recipe => recipe.IsCanning == isCanning.Value);
        }

        if (favoritesOnly)
        {
            query = query.Where(recipe => recipe.IsFavorite);
        }

        if (recentlyUsed)
        {
            var windowDays = recentlyUsedDays.GetValueOrDefault(90);
            if (windowDays > 0)
            {
                var cutoff = DateTime.UtcNow.AddDays(-windowDays);
                query = query.Where(recipe => recipe.LastUsedAt >= cutoff);
            }

            query = query.Where(recipe => recipe.LastUsedAt != null)
                .OrderByDescending(recipe => recipe.LastUsedAt);
        }
        else
        {
            query = query.OrderBy(recipe => recipe.Title);
        }

        var recipeBooks = await RecipeBookLookup(cancellationToken);
        var recipes = await query
            .Select(recipe => ToSummaryDto(recipe))
            .ToListAsync(cancellationToken);

        return Ok(recipes.Select(recipe => recipe with
        {
            RecipeBookName = recipe.RecipeBookId.HasValue && recipeBooks.TryGetValue(recipe.RecipeBookId.Value, out var bookName)
                ? bookName
                : null
        }));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecipeDetailDto>> GetRecipe(int id, CancellationToken cancellationToken)
    {
        var recipe = await RecipeQuery()
            .AsNoTracking()
            .FirstOrDefaultAsync(recipe => recipe.Id == id, cancellationToken);

        if (recipe is null)
        {
            return NotFound();
        }

        var recipeBooks = await RecipeBookLookup(cancellationToken);
        return Ok(ToDetailDto(recipe, recipeBooks.TryGetValue(recipe.RecipeBookId ?? 0, out var bookName) ? bookName : null));
    }

    [HttpGet("tags")]
    public async Task<ActionResult<IEnumerable<RecipeTagDto>>> GetTags(CancellationToken cancellationToken)
    {
        var tags = await context.RecipeTags
            .AsNoTracking()
            .Where(tag => tag.RecipeTagLinks.Any(link => link.Recipe.IsActive))
            .OrderBy(tag => tag.Name)
            .Select(tag => ToTagDto(tag))
            .ToListAsync(cancellationToken);

        return Ok(tags);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.IsActive)
            .Select(recipe => recipe.Category)
            .Distinct()
            .OrderBy(category => category)
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpGet("cuisines")]
    public async Task<ActionResult<IEnumerable<string>>> GetCuisines(CancellationToken cancellationToken)
    {
        var cuisines = await context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.IsActive && recipe.Cuisine != null && recipe.Cuisine != "")
            .Select(recipe => recipe.Cuisine!)
            .Distinct()
            .OrderBy(cuisine => cuisine)
            .ToListAsync(cancellationToken);

        return Ok(cuisines);
    }

    [HttpGet("books")]
    public async Task<ActionResult<IEnumerable<RecipeBookDto>>> GetRecipeBooks(CancellationToken cancellationToken)
    {
        var books = await context.RecipeBooks
            .AsNoTracking()
            .OrderBy(book => book.Name)
            .Select(book => new RecipeBookDto(book.Id, book.Name, book.Description))
            .ToListAsync(cancellationToken);

        return Ok(books);
    }

    [HttpPost("books")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RecipeBookDto>> CreateRecipeBook(RecipeBookSaveDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateRecipeBook(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var name = dto.Name.Trim();
        var existing = await context.RecipeBooks
            .FirstOrDefaultAsync(book => book.Name == name, cancellationToken);
        if (existing is not null)
        {
            return Conflict("A recipe book/source with that name already exists.");
        }

        var book = new RecipeBook
        {
            Name = name,
            Description = TrimOrNull(dto.Description)
        };
        context.RecipeBooks.Add(book);
        await context.SaveChangesAsync(cancellationToken);

        return Ok(ToRecipeBookDto(book));
    }

    [HttpPut("books/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RecipeBookDto>> UpdateRecipeBook(int id, RecipeBookSaveDto dto, CancellationToken cancellationToken)
    {
        var validation = ValidateRecipeBook(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var book = await context.RecipeBooks.FindAsync([id], cancellationToken);
        if (book is null)
        {
            return NotFound();
        }

        var name = dto.Name.Trim();
        var duplicate = await context.RecipeBooks
            .AnyAsync(item => item.Id != id && item.Name == name, cancellationToken);
        if (duplicate)
        {
            return Conflict("A recipe book/source with that name already exists.");
        }

        book.Name = name;
        book.Description = TrimOrNull(dto.Description);
        await context.SaveChangesAsync(cancellationToken);

        return Ok(ToRecipeBookDto(book));
    }

    [HttpDelete("books/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteRecipeBook(int id, CancellationToken cancellationToken)
    {
        var book = await context.RecipeBooks.FindAsync([id], cancellationToken);
        if (book is null)
        {
            return NotFound();
        }

        var recipes = await context.Recipes
            .Where(recipe => recipe.RecipeBookId == id)
            .ToListAsync(cancellationToken);
        foreach (var recipe in recipes)
        {
            recipe.RecipeBookId = null;
            recipe.UpdatedAt = DateTime.UtcNow;
        }

        context.RecipeBooks.Remove(book);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RecipeDetailDto>> CreateRecipe(RecipeSaveDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var recipe = new Recipe
        {
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await Apply(recipe, dto, cancellationToken);
        context.Recipes.Add(recipe);
        await context.SaveChangesAsync(cancellationToken);

        await LoadRecipe(recipe, cancellationToken);
        var recipeBooks = await RecipeBookLookup(cancellationToken);
        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, ToDetailDto(recipe, recipeBooks.TryGetValue(recipe.RecipeBookId ?? 0, out var bookName) ? bookName : null));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RecipeDetailDto>> UpdateRecipe(int id, RecipeSaveDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var recipe = await RecipeQuery()
            .FirstOrDefaultAsync(recipe => recipe.Id == id, cancellationToken);

        if (recipe is null)
        {
            return NotFound();
        }

        recipe.Ingredients.Clear();
        recipe.Instructions.Clear();
        recipe.RecipeTagLinks.Clear();
        await Apply(recipe, dto, cancellationToken);
        recipe.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        await LoadRecipe(recipe, cancellationToken);

        var recipeBooks = await RecipeBookLookup(cancellationToken);
        return Ok(ToDetailDto(recipe, recipeBooks.TryGetValue(recipe.RecipeBookId ?? 0, out var bookName) ? bookName : null));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteRecipe(int id, CancellationToken cancellationToken)
    {
        var recipe = await context.Recipes.FindAsync([id], cancellationToken);
        if (recipe is null)
        {
            return NotFound();
        }

        context.Recipes.Remove(recipe);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/mark-used")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RecipeDetailDto>> MarkRecipeUsed(int id, CancellationToken cancellationToken)
    {
        var recipe = await RecipeQuery()
            .FirstOrDefaultAsync(recipe => recipe.Id == id, cancellationToken);

        if (recipe is null)
        {
            return NotFound();
        }

        recipe.LastUsedAt = DateTime.UtcNow;
        recipe.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        var recipeBooks = await RecipeBookLookup(cancellationToken);
        return Ok(ToDetailDto(recipe, recipeBooks.TryGetValue(recipe.RecipeBookId ?? 0, out var bookName) ? bookName : null));
    }

    [HttpPost("{id:int}/shopping-list")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<RecipeShoppingListResultDto>> AddIngredientsToShoppingList(
        int id,
        RecipeShoppingListRequestDto dto,
        CancellationToken cancellationToken)
    {
        var recipe = await context.Recipes
            .Include(recipe => recipe.Ingredients)
            .FirstOrDefaultAsync(recipe => recipe.Id == id, cancellationToken);

        if (recipe is null)
        {
            return NotFound();
        }

        if (dto.TargetServings is < 0)
        {
            return BadRequest("Target servings cannot be negative.");
        }

        var selectedIngredientIds = dto.IngredientIds
            .Where(ingredientId => ingredientId > 0)
            .Distinct()
            .ToHashSet();
        var selectedIngredients = recipe.Ingredients
            .Where(ingredient => !string.IsNullOrWhiteSpace(ingredient.ItemName))
            .Where(ingredient => selectedIngredientIds.Count == 0 || selectedIngredientIds.Contains(ingredient.Id))
            .ToList();
        var scaleFactor = recipe.Servings.GetValueOrDefault() > 0 && dto.TargetServings.GetValueOrDefault() > 0
            ? dto.TargetServings!.Value / (decimal)recipe.Servings!.Value
            : 1m;
        var skippedPantryCount = 0;
        var skippedPantryItems = new List<RecipeSkippedPantryItemDto>();

        if (dto.SkipPantryItems)
        {
            var pantryItems = await context.PantryItems
                .AsNoTracking()
                .Where(item => item.IsInStock)
                .ToListAsync(cancellationToken);
            var remainingIngredients = new List<RecipeIngredient>();
            foreach (var ingredient in selectedIngredients)
            {
                var pantryMatch = PantryMatch(ingredient, pantryItems);
                if (pantryMatch is null)
                {
                    remainingIngredients.Add(ingredient);
                    continue;
                }

                skippedPantryItems.Add(new RecipeSkippedPantryItemDto(
                    ingredient.ItemName.Trim(),
                    string.IsNullOrWhiteSpace(ingredient.ShoppingCategory) ? "Grocery" : ingredient.ShoppingCategory.Trim(),
                    ScaleQuantity(ingredient.Quantity, scaleFactor),
                    string.IsNullOrWhiteSpace(ingredient.Unit) ? null : ingredient.Unit.Trim(),
                    PantryMatchLabel(pantryMatch)));
            }

            skippedPantryCount = skippedPantryItems.Count;
            selectedIngredients = remainingIngredients;
        }

        if (selectedIngredients.Count == 0)
        {
            if (skippedPantryCount > 0)
            {
                return Ok(new RecipeShoppingListResultDto(0, 0, scaleFactor, skippedPantryCount, skippedPantryItems, []));
            }

            return BadRequest("Select at least one ingredient.");
        }

        var shoppingRows = dto.CombineDuplicates
            ? selectedIngredients
                .GroupBy(ingredient => new
                {
                    Key = $"{ingredient.ItemName.Trim().ToUpperInvariant()}|{(string.IsNullOrWhiteSpace(ingredient.ShoppingCategory) ? "Grocery" : ingredient.ShoppingCategory.Trim()).ToUpperInvariant()}|{(string.IsNullOrWhiteSpace(ingredient.Unit) ? string.Empty : ingredient.Unit.Trim()).ToUpperInvariant()}",
                    Name = ingredient.ItemName.Trim(),
                    Category = string.IsNullOrWhiteSpace(ingredient.ShoppingCategory) ? "Grocery" : ingredient.ShoppingCategory.Trim(),
                    Unit = string.IsNullOrWhiteSpace(ingredient.Unit) ? null : ingredient.Unit.Trim()
                })
                .Select(group => new RecipeShoppingRow(
                    group.Key.Name,
                    group.Key.Category,
                    group.Key.Unit,
                    CombineQuantity(group, scaleFactor),
                    string.Join("; ", group.Select(ingredient => ingredient.Preparation).Where(note => !string.IsNullOrWhiteSpace(note)).Distinct()),
                    null))
                .ToList()
            : selectedIngredients
                .Select(ingredient => new RecipeShoppingRow(
                    ingredient.ItemName.Trim(),
                    string.IsNullOrWhiteSpace(ingredient.ShoppingCategory) ? "Grocery" : ingredient.ShoppingCategory.Trim(),
                    string.IsNullOrWhiteSpace(ingredient.Unit) ? null : ingredient.Unit.Trim(),
                    ScaleQuantity(ingredient.Quantity, scaleFactor),
                    ingredient.Preparation,
                    ingredient.Id))
                .ToList();

        var created = 0;
        var updated = 0;
        var resultItems = new List<RecipeShoppingListItemResultDto>();
        var sortOrder = dto.SortOrderStart;
        var store = TrimOrNull(dto.Store);
        var aisle = TrimOrNull(dto.Aisle);
        var shoppingGroupName = TrimOrNull(dto.ShoppingGroupName);
        var shoppingReason = shoppingGroupName ?? recipe.Title;

        foreach (var row in shoppingRows)
        {
            var sourceType = dto.CombineDuplicates ? "Ingredient Group" : "Ingredient";
            var sourceId = dto.CombineDuplicates ? id : row.SourceIngredientId;
            var existing = await FindOpenRecipeShoppingItem(shoppingReason, row, sourceType, sourceId, cancellationToken);
            var wasCreated = existing is null;

            if (existing is null)
            {
                existing = new ShoppingListItem
                {
                    CreatedAt = DateTime.UtcNow,
                    Status = "Needed",
                    SourceArea = "Recipe",
                    SourceType = sourceType,
                    SourceId = sourceId
                };
                context.ShoppingListItems.Add(existing);
                created++;
            }
            else
            {
                updated++;
            }

            existing.ItemName = row.ItemName;
            existing.Category = row.Category;
            existing.Quantity = row.Quantity;
            existing.Unit = row.Unit;
            existing.Store = store;
            existing.Aisle = aisle;
            existing.SortOrder = sortOrder;
            existing.Reason = shoppingReason;
            existing.Notes = BuildShoppingNotes(row.Notes, recipe.Servings, dto.TargetServings, shoppingGroupName is null ? null : recipe.Title);

            resultItems.Add(new RecipeShoppingListItemResultDto(
                existing.ItemName,
                existing.Category,
                existing.Quantity,
                existing.Unit,
                existing.Store,
                existing.Aisle,
                existing.SortOrder,
                existing.Notes,
                wasCreated));

            if (sortOrder.HasValue)
            {
                sortOrder += 10;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        recipe.LastUsedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(new RecipeShoppingListResultDto(created, updated, scaleFactor, skippedPantryCount, skippedPantryItems, resultItems));
    }

    private async Task<ShoppingListItem?> FindOpenRecipeShoppingItem(
        string recipeTitle,
        RecipeShoppingRow row,
        string sourceType,
        int? sourceId,
        CancellationToken cancellationToken)
    {
        return await context.ShoppingListItems
            .Where(item =>
                item.SourceArea == "Recipe"
                && item.SourceType == sourceType
                && item.SourceId == sourceId
                && item.Status == "Needed"
                && item.Reason == recipeTitle
                && item.ItemName == row.ItemName
                && item.Category == row.Category
                && item.Unit == row.Unit)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static decimal? CombineQuantity(IEnumerable<RecipeIngredient> ingredients, decimal scaleFactor)
    {
        var quantities = ingredients.Select(ingredient => ingredient.Quantity).ToList();
        return quantities.All(quantity => quantity.HasValue)
            ? Math.Round(quantities.Sum(quantity => quantity!.Value) * scaleFactor, 2)
            : null;
    }

    private static decimal? ScaleQuantity(decimal? quantity, decimal scaleFactor)
    {
        return quantity.HasValue ? Math.Round(quantity.Value * scaleFactor, 2) : null;
    }

    private static string? BuildShoppingNotes(string? notes, int? recipeServings, int? targetServings, string? recipeTitle = null)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(recipeTitle))
        {
            parts.Add($"Recipe: {recipeTitle.Trim()}.");
        }

        if (!string.IsNullOrWhiteSpace(notes))
        {
            parts.Add(notes.Trim());
        }

        if (recipeServings.GetValueOrDefault() > 0 && targetServings.GetValueOrDefault() > 0 && recipeServings != targetServings)
        {
            parts.Add($"Scaled from {recipeServings} to {targetServings} servings.");
        }

        return parts.Count == 0 ? null : string.Join(" ", parts);
    }

    private record RecipeShoppingRow(
        string ItemName,
        string Category,
        string? Unit,
        decimal? Quantity,
        string? Notes,
        int? SourceIngredientId);

    private static IEnumerable<string> PantryKeys(string itemName, string? unit)
    {
        yield return PantryKey(itemName, unit);
        yield return PantryKey(itemName, null);
    }

    private static string PantryKey(string itemName, string? unit)
    {
        return $"{itemName.Trim().ToUpperInvariant()}|{(string.IsNullOrWhiteSpace(unit) ? string.Empty : unit.Trim().ToUpperInvariant())}";
    }

    private static PantryItem? PantryMatch(RecipeIngredient ingredient, IEnumerable<PantryItem> pantryItems)
    {
        var ingredientName = ingredient.ItemName.Trim();
        var ingredientKey = PantryKey(ingredientName, ingredient.Unit);
        var ingredientUnitlessKey = PantryKey(ingredientName, null);
        return pantryItems.FirstOrDefault(item =>
            item.ItemName.Trim().Equals(ingredientName, StringComparison.OrdinalIgnoreCase)
            || PantryKeys(item.ItemName, item.Unit).Contains(ingredientKey, StringComparer.OrdinalIgnoreCase)
            || PantryKeys(item.ItemName, item.Unit).Contains(ingredientUnitlessKey, StringComparer.OrdinalIgnoreCase));
    }

    private static string PantryMatchLabel(PantryItem item)
    {
        var quantity = item.Quantity.HasValue
            ? $"{item.Quantity:g}{(string.IsNullOrWhiteSpace(item.Unit) ? string.Empty : " " + item.Unit.Trim())}"
            : "On hand";
        return string.IsNullOrWhiteSpace(item.Location)
            ? $"{item.ItemName.Trim()} ({quantity})"
            : $"{item.ItemName.Trim()} ({quantity}) / {item.Location.Trim()}";
    }

    private IQueryable<Recipe> RecipeQuery()
    {
        return context.Recipes
            .Include(recipe => recipe.Ingredients)
            .Include(recipe => recipe.Instructions)
            .Include(recipe => recipe.RecipeTagLinks)
            .ThenInclude(link => link.RecipeTag);
    }

    private static string? Validate(RecipeSaveDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return "Title is required.";
        }

        if (dto.PrepMinutes is < 0 || dto.CookMinutes is < 0 || dto.Servings is < 0)
        {
            return "Prep time, cook time, and servings cannot be negative.";
        }

        if (dto.Ingredients.Any(ingredient => string.IsNullOrWhiteSpace(ingredient.ItemName)))
        {
            return "Every ingredient needs a name.";
        }

        if (dto.Instructions.Any(instruction => string.IsNullOrWhiteSpace(instruction.Text)))
        {
            return "Every instruction needs text.";
        }

        return null;
    }

    private static string? ValidateRecipeBook(RecipeBookSaveDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return "Recipe book/source name is required.";
        }

        return null;
    }

    private async Task Apply(Recipe recipe, RecipeSaveDto dto, CancellationToken cancellationToken)
    {
        recipe.Title = dto.Title.Trim();
        recipe.Description = TrimOrNull(dto.Description);
        recipe.Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim();
        recipe.Cuisine = TrimOrNull(dto.Cuisine);
        recipe.PrepMinutes = dto.PrepMinutes;
        recipe.CookMinutes = dto.CookMinutes;
        recipe.Servings = dto.Servings;
        recipe.SourceUrl = TrimOrNull(dto.SourceUrl);
        recipe.RecipeBookId = dto.RecipeBookId;
        recipe.SourcePage = TrimOrNull(dto.SourcePage);
        recipe.SourceDetail = TrimOrNull(dto.SourceDetail);
        recipe.Notes = TrimOrNull(dto.Notes);
        recipe.IsCanning = dto.IsCanning;
        recipe.IsFavorite = dto.IsFavorite;
        recipe.IsActive = dto.IsActive;

        foreach (var ingredient in dto.Ingredients
            .Where(ingredient => !string.IsNullOrWhiteSpace(ingredient.ItemName))
            .OrderBy(ingredient => ingredient.SortOrder))
        {
            recipe.Ingredients.Add(new RecipeIngredient
            {
                SortOrder = ingredient.SortOrder,
                ItemName = ingredient.ItemName.Trim(),
                Quantity = ingredient.Quantity,
                Unit = TrimOrNull(ingredient.Unit),
                Preparation = TrimOrNull(ingredient.Preparation),
                ShoppingCategory = string.IsNullOrWhiteSpace(ingredient.ShoppingCategory) ? "Grocery" : ingredient.ShoppingCategory.Trim()
            });
        }

        foreach (var instruction in dto.Instructions
            .Where(instruction => !string.IsNullOrWhiteSpace(instruction.Text))
            .OrderBy(instruction => instruction.StepNumber))
        {
            recipe.Instructions.Add(new RecipeInstruction
            {
                StepNumber = instruction.StepNumber,
                Text = instruction.Text.Trim()
            });
        }

        await ApplyTags(recipe, dto.Tags, cancellationToken);
    }

    private async Task ApplyTags(Recipe recipe, IEnumerable<string> tagNames, CancellationToken cancellationToken)
    {
        var normalizedNames = tagNames
            .Select(tag => tag.Trim())
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        foreach (var tagName in normalizedNames)
        {
            var slug = BlogController.Slugify(tagName);
            var tag = await context.RecipeTags.FirstOrDefaultAsync(existing => existing.Slug == slug, cancellationToken);

            if (tag is null)
            {
                tag = new RecipeTag
                {
                    Name = tagName,
                    Slug = slug
                };
            }

            recipe.RecipeTagLinks.Add(new RecipeTagLink
            {
                Recipe = recipe,
                RecipeTag = tag
            });
        }
    }

    private async Task LoadRecipe(Recipe recipe, CancellationToken cancellationToken)
    {
        await context.Entry(recipe).Collection(x => x.Ingredients).LoadAsync(cancellationToken);
        await context.Entry(recipe).Collection(x => x.Instructions).LoadAsync(cancellationToken);
        await context.Entry(recipe)
            .Collection(x => x.RecipeTagLinks)
            .Query()
            .Include(link => link.RecipeTag)
            .LoadAsync(cancellationToken);
    }

    private static RecipeSummaryDto ToSummaryDto(Recipe recipe)
    {
        return new RecipeSummaryDto(
            recipe.Id,
            recipe.Title,
            recipe.Description,
            recipe.Category,
            recipe.Cuisine,
            recipe.PrepMinutes,
            recipe.CookMinutes,
            recipe.Servings,
            recipe.RecipeBookId,
            null,
            recipe.IsCanning,
            recipe.IsFavorite,
            recipe.IsActive,
            recipe.LastUsedAt,
            recipe.RecipeTagLinks.Select(link => ToTagDto(link.RecipeTag)).OrderBy(tag => tag.Name).ToList());
    }

    private static RecipeDetailDto ToDetailDto(Recipe recipe, string? recipeBookName)
    {
        return new RecipeDetailDto(
            recipe.Id,
            recipe.Title,
            recipe.Description,
            recipe.Category,
            recipe.Cuisine,
            recipe.PrepMinutes,
            recipe.CookMinutes,
            recipe.Servings,
            recipe.SourceUrl,
            recipe.RecipeBookId,
            recipeBookName,
            recipe.SourcePage,
            recipe.SourceDetail,
            recipe.Notes,
            recipe.IsCanning,
            recipe.IsFavorite,
            recipe.IsActive,
            recipe.LastUsedAt,
            recipe.CreatedAt,
            recipe.UpdatedAt,
            recipe.Ingredients.OrderBy(ingredient => ingredient.SortOrder).Select(ToIngredientDto).ToList(),
            recipe.Instructions.OrderBy(instruction => instruction.StepNumber).Select(ToInstructionDto).ToList(),
            recipe.RecipeTagLinks.Select(link => ToTagDto(link.RecipeTag)).OrderBy(tag => tag.Name).ToList());
    }

    private static RecipeIngredientDto ToIngredientDto(RecipeIngredient ingredient)
    {
        return new RecipeIngredientDto(
            ingredient.Id,
            ingredient.SortOrder,
            ingredient.ItemName,
            ingredient.Quantity,
            ingredient.Unit,
            ingredient.Preparation,
            ingredient.ShoppingCategory);
    }

    private static RecipeInstructionDto ToInstructionDto(RecipeInstruction instruction)
    {
        return new RecipeInstructionDto(instruction.Id, instruction.StepNumber, instruction.Text);
    }

    private static RecipeTagDto ToTagDto(RecipeTag tag)
    {
        return new RecipeTagDto(tag.Id, tag.Name, tag.Slug);
    }

    private static RecipeBookDto ToRecipeBookDto(RecipeBook book)
    {
        return new RecipeBookDto(book.Id, book.Name, book.Description);
    }

    private async Task<Dictionary<int, string>> RecipeBookLookup(CancellationToken cancellationToken)
    {
        return await context.RecipeBooks
            .AsNoTracking()
            .ToDictionaryAsync(book => book.Id, book => book.Name, cancellationToken);
    }

    private static string? TrimOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
