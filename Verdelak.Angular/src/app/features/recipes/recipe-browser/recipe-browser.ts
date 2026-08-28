import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PantryItem } from '../../shopping-list/models/shopping-list.models';
import { ShoppingListService } from '../../shopping-list/shopping-list.service';
import { RecipeBook, RecipeDetail, RecipeIngredientRequest, RecipeInstructionRequest, RecipeRequest, RecipeShoppingListItemResult, RecipeShoppingListResult, RecipeSummary, RecipeTag } from '../models/recipe.models';
import { RecipeService } from '../recipe.service';

interface RecipeForm {
  id: number | null;
  title: string;
  description: string;
  category: string;
  cuisine: string;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  sourceUrl: string;
  recipeBookId: number | null;
  sourcePage: string;
  sourceDetail: string;
  notes: string;
  isCanning: boolean;
  isFavorite: boolean;
  isActive: boolean;
  tagsText: string;
  ingredients: RecipeIngredientRequest[];
  instructions: RecipeInstructionRequest[];
}

interface RecipeImportRow extends RecipeRequest {
  warnings: string[];
}

interface RecipeBookForm {
  id: number | null;
  name: string;
  description: string;
}

interface MealPlanSummaryCard {
  label: string;
  value: string | number;
  detail: string;
}

interface ShoppingPreviewGroup {
  label: string;
  rows: {
    itemName: string;
    category: string;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
    sortOrder: number | null;
    pantryMatchCount?: number;
    pantryMatchDetail?: string | null;
    created?: boolean;
  }[];
}

interface RecipeSourceCard {
  label: string;
  value: number;
  detail: string;
}

interface RecipeSourceCoverageRow {
  label: string;
  count: number;
  favoriteCount: number;
  canningCount: number;
  recentCount: number;
}

@Component({
  selector: 'app-recipe-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-browser.html',
  styleUrl: './recipe-browser.scss'
})
export class RecipeBrowser {
  private readonly auth = inject(AuthService);

  readonly recipes = signal<RecipeSummary[]>([]);
  readonly selected = signal<RecipeDetail | null>(null);
  readonly tags = signal<RecipeTag[]>([]);
  readonly categories = signal<string[]>([]);
  readonly cuisines = signal<string[]>([]);
  readonly recipeBooks = signal<RecipeBook[]>([]);
  readonly pantryItems = signal<PantryItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly importing = signal(false);
  readonly deleting = signal(false);
  readonly shopping = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly search = signal('');
  readonly ingredientFilter = signal('');
  readonly categoryFilter = signal('All');
  readonly cuisineFilter = signal('All');
  readonly tagFilter = signal('All');
  readonly bookFilter = signal<number | null>(null);
  readonly sourceStatusFilter = signal<'All' | 'Linked' | 'Missing'>('All');
  readonly readinessFilter = signal<'All' | 'Ready' | 'MissingIngredients' | 'MissingInstructions' | 'MissingServings'>('All');
  readonly maxTotalMinutesFilter = signal<number | null>(null);
  readonly canningFilter = signal<'All' | 'Canning' | 'NotCanning'>('All');
  readonly includeInactive = signal(false);
  readonly favoritesOnly = signal(false);
  readonly recentlyUsedOnly = signal(false);
  readonly recentlyUsedDays = signal(90);
  readonly editing = signal(false);
  readonly managingSources = signal(false);
  readonly importText = signal('');
  readonly selectedIngredientIds = signal<number[]>([]);
  readonly targetServings = signal<number | null>(null);
  readonly combineShoppingDuplicates = signal(true);
  readonly shoppingStore = signal('');
  readonly shoppingAisle = signal('');
  readonly shoppingSortOrderStart = signal<number | null>(null);
  readonly skipPantryItems = signal(false);
  readonly shoppingGroupName = signal('');
  readonly lastShoppingResult = signal<RecipeShoppingListResult | null>(null);
  readonly form = signal<RecipeForm>(this.emptyForm());
  readonly bookForm = signal<RecipeBookForm>(this.emptyBookForm());

  readonly isAdmin = this.auth.isAdmin;
  readonly categoryOptions = computed(() => this.uniqueValues(['General', ...this.categories(), ...this.recipes().map(recipe => recipe.category)]));
  readonly cuisineOptions = computed(() => this.uniqueValues([...this.cuisines(), ...this.recipes().map(recipe => recipe.cuisine ?? '')]));
  readonly tagOptions = computed(() => this.tags().map(tag => tag.name));
  readonly shownCount = computed(() => this.recipes().length);
  readonly importPreview = computed(() => this.parseImportRows(this.importText()));
  readonly validImportRows = computed(() => this.importPreview().filter(row => row.warnings.length === 0));
  readonly selectedIngredientCount = computed(() => this.selectedIngredientIds().length);
  readonly recipeSourceCards = computed<RecipeSourceCard[]>(() => {
    const recipes = this.recipes();
    const cookbookCount = recipes.filter(recipe => !!recipe.recipeBookName).length;
    const unassignedCount = recipes.length - cookbookCount;
    const activeBooks = new Set(recipes.map(recipe => recipe.recipeBookId).filter((id): id is number => id !== null));
    return [
      {
        label: 'Visible recipes',
        value: recipes.length,
        detail: 'Current filter set'
      },
      {
        label: 'Cookbook linked',
        value: cookbookCount,
        detail: 'Visible rows tied to a saved source'
      },
      {
        label: 'Needs source',
        value: unassignedCount,
        detail: 'Visible rows without a cookbook/source link'
      },
      {
        label: 'Active sources',
        value: activeBooks.size,
        detail: `${this.recipeBooks().length.toLocaleString()} total saved sources`
      }
    ];
  });
  readonly sourceCoverageRows = computed(() => this.buildSourceCoverageRows());
  readonly missingSourceRecipes = computed(() => this.recipes()
    .filter(recipe => !recipe.recipeBookName)
    .slice()
    .sort((left, right) => left.title.localeCompare(right.title))
    .slice(0, 8));
  readonly sourceScopeLabel = computed(() => [
    this.search().trim() ? `Search: ${this.search().trim()}` : 'Any search',
    this.ingredientFilter().trim() ? `Ingredient: ${this.ingredientFilter().trim()}` : 'Any ingredient',
    this.categoryFilter() === 'All' ? 'All categories' : this.categoryFilter(),
    this.cuisineFilter() === 'All' ? 'All cuisines' : this.cuisineFilter(),
    this.tagFilter() === 'All' ? 'All tags' : this.tagFilter(),
    this.bookFilter() ? this.recipeBooks().find(book => book.id === this.bookFilter())?.name ?? 'Selected book' : 'All books',
    this.sourceStatusFilter() === 'All' ? 'Any source' : this.sourceStatusFilter(),
    this.readinessFilter() === 'All' ? 'Any readiness' : this.readinessFilter(),
    this.maxTotalMinutesFilter() ? `Max ${this.maxTotalMinutesFilter()} minutes` : 'Any time',
    this.canningFilter() === 'All' ? 'All recipe types' : this.canningFilter(),
    this.favoritesOnly() ? 'Favorites' : 'All favorite states',
    this.recentlyUsedOnly() ? `Used in ${this.recentlyUsedDays()} days` : 'Any usage date'
  ].join(' / '));
  readonly shoppingScaleFactor = computed(() => {
    const recipeServings = this.selected()?.servings ?? null;
    const targetServings = this.targetServings();
    if (!recipeServings || !targetServings) {
      return 1;
    }

    return Math.round((targetServings / recipeServings) * 100) / 100;
  });
  readonly shoppingReadinessWarnings = computed(() => {
    const recipe = this.selected();
    const warnings: string[] = [];
    if (!recipe) {
      return warnings;
    }

    const selected = this.selectedShoppingIngredients();
    if (recipe.ingredients.length === 0) {
      warnings.push('Add ingredients before sending this recipe to the shopping list.');
    }

    if (selected.length === 0) {
      warnings.push('Select at least one ingredient.');
    }

    if (this.targetServings() && !recipe.servings) {
      warnings.push('Set recipe servings if you want reliable scaling.');
    }

    const missingQuantities = selected.filter(ingredient => ingredient.quantity === null).length;
    if (missingQuantities > 0) {
      warnings.push(`${missingQuantities} selected ingredient${missingQuantities === 1 ? ' has' : 's have'} no quantity.`);
    }

    const missingCategories = selected.filter(ingredient => !ingredient.shoppingCategory?.trim()).length;
    if (missingCategories > 0) {
      warnings.push(`${missingCategories} selected ingredient${missingCategories === 1 ? ' has' : 's have'} no shopping category.`);
    }

    return warnings;
  });
  readonly shoppingPreviewRows = computed(() => {
    const selected = this.selectedShoppingIngredients();
    const scaleFactor = this.shoppingScaleFactor();
    if (!this.combineShoppingDuplicates()) {
      return selected.map((ingredient, index) => ({
        itemName: ingredient.itemName,
        category: ingredient.shoppingCategory || 'Grocery',
        quantity: ingredient.quantity === null ? null : this.roundQuantity(ingredient.quantity * scaleFactor),
        unit: ingredient.unit,
        notes: ingredient.preparation,
        sortOrder: this.previewSortOrder(index),
        pantryMatchCount: this.pantryMatchesIngredient(ingredient).length,
        pantryMatchDetail: this.pantryMatchDetail(this.pantryMatchesIngredient(ingredient))
      }));
    }

    const groups = new Map<string, {
      itemName: string;
      category: string;
      unit: string | null;
      quantities: (number | null)[];
      notes: string[];
      pantryMatches: PantryItem[];
    }>();

    for (const ingredient of selected) {
      const itemName = ingredient.itemName.trim();
      const category = ingredient.shoppingCategory?.trim() || 'Grocery';
      const unit = ingredient.unit?.trim() || null;
      const key = `${itemName.toUpperCase()}|${category.toUpperCase()}|${(unit ?? '').toUpperCase()}`;
      const group = groups.get(key) ?? { itemName, category, unit, quantities: [], notes: [], pantryMatches: [] };
      group.quantities.push(ingredient.quantity);
      if (ingredient.preparation?.trim()) {
        group.notes.push(ingredient.preparation.trim());
      }
      group.pantryMatches.push(...this.pantryMatchesIngredient(ingredient));
      groups.set(key, group);
    }

    return Array.from(groups.values()).map((group, index) => ({
      itemName: group.itemName,
      category: group.category,
      quantity: group.quantities.every(quantity => quantity !== null)
        ? this.roundQuantity(group.quantities.reduce((sum, quantity) => sum + (quantity ?? 0), 0) * scaleFactor)
        : null,
      unit: group.unit,
      notes: Array.from(new Set(group.notes)).join('; ') || null,
      sortOrder: this.previewSortOrder(index),
      pantryMatchCount: this.uniquePantryMatches(group.pantryMatches).length,
      pantryMatchDetail: this.pantryMatchDetail(this.uniquePantryMatches(group.pantryMatches))
    }));
  });
  readonly shoppingPreviewGroups = computed<ShoppingPreviewGroup[]>(() => this.groupShoppingRows(this.shoppingPreviewRows()));
  readonly shoppingPantryMatchCount = computed(() => this.shoppingPreviewRows()
    .filter(row => (row.pantryMatchCount ?? 0) > 0)
    .length);
  readonly mealPlanGroupSuggestions = computed(() => this.buildMealPlanGroupSuggestions());
  readonly mealPlanSummaryCards = computed<MealPlanSummaryCard[]>(() => {
    const groupName = this.currentMealPlanGroupName();
    const rows = this.shoppingPreviewRows();
    const categories = new Set(rows.map(row => row.category));
    return [
      {
        label: 'Meal group',
        value: groupName || 'Recipe title',
        detail: groupName ? 'Used as the shopping reason and duplicate group' : 'No custom group set'
      },
      {
        label: 'Preview rows',
        value: rows.length,
        detail: `${categories.size.toLocaleString()} shopping categor${categories.size === 1 ? 'y' : 'ies'}`
      },
      {
        label: 'Selected ingredients',
        value: this.selectedIngredientCount(),
        detail: this.combineShoppingDuplicates() ? 'Matches combine by item/category/unit' : 'Each selected ingredient stays separate'
      },
      {
        label: 'Pantry matches',
        value: this.shoppingPantryMatchCount(),
        detail: this.skipPantryItems() ? 'Matched rows will be skipped' : 'On-hand matches shown before push'
      }
    ];
  });
  readonly lastShoppingResultGroups = computed<ShoppingPreviewGroup[]>(() => this.groupShoppingRows(this.lastShoppingResult()?.items ?? []));
  readonly selectedTotalMinutes = computed(() => {
    const recipe = this.selected();
    const total = (recipe?.prepMinutes ?? 0) + (recipe?.cookMinutes ?? 0);
    return total || null;
  });

  constructor(
    private readonly service: RecipeService,
    private readonly shoppingListService: ShoppingListService
  ) {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    forkJoin({
      recipes: this.service.getRecipes({
        search: this.search(),
        category: this.categoryFilter(),
        cuisine: this.cuisineFilter(),
        ingredient: this.ingredientFilter(),
        tag: this.tagFilter(),
        recipeBookId: this.bookFilter(),
        sourceStatus: this.sourceStatusFilter(),
        readiness: this.readinessFilter(),
        maxTotalMinutes: this.maxTotalMinutesFilter(),
        isCanning: this.canningFilter() === 'All' ? null : this.canningFilter() === 'Canning',
        includeInactive: this.includeInactive(),
        favoritesOnly: this.favoritesOnly(),
        recentlyUsed: this.recentlyUsedOnly(),
        recentlyUsedDays: this.recentlyUsedDays()
      }),
      tags: this.service.getTags(),
      categories: this.service.getCategories(),
      cuisines: this.service.getCuisines(),
      recipeBooks: this.service.getRecipeBooks(),
      pantryItems: this.shoppingListService.getPantryItems(true)
    }).subscribe({
      next: result => {
        this.recipes.set(result.recipes);
        this.tags.set(result.tags);
        this.categories.set(result.categories);
        this.cuisines.set(result.cuisines);
        this.recipeBooks.set(result.recipeBooks);
        this.pantryItems.set(result.pantryItems);

        const currentId = this.selected()?.id;
        const nextSelection = currentId ? result.recipes.find(recipe => recipe.id === currentId) : result.recipes[0];
        if (nextSelection) {
          this.selectRecipe(nextSelection.id, false);
        } else {
          this.selected.set(null);
        }
      },
      error: err => this.error.set(this.errorText(err, 'Failed to load recipes.')),
      complete: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.search.set('');
    this.ingredientFilter.set('');
    this.categoryFilter.set('All');
    this.cuisineFilter.set('All');
    this.tagFilter.set('All');
    this.bookFilter.set(null);
    this.sourceStatusFilter.set('All');
    this.readinessFilter.set('All');
    this.maxTotalMinutesFilter.set(null);
    this.canningFilter.set('All');
    this.favoritesOnly.set(false);
    this.recentlyUsedOnly.set(false);
    this.recentlyUsedDays.set(90);
    this.load();
  }

  selectRecipe(id: number, clearMessage = true): void {
    if (clearMessage) {
      this.message.set(null);
      this.error.set(null);
    }

    this.service.getRecipe(id).subscribe({
      next: recipe => {
        this.selected.set(recipe);
        this.selectedIngredientIds.set(recipe.ingredients.map(ingredient => ingredient.id));
        this.targetServings.set(recipe.servings);
        this.shoppingGroupName.set(this.defaultMealPlanGroupName(recipe));
        this.lastShoppingResult.set(null);
        if (!this.editing()) {
          this.form.set(this.toForm(recipe));
        }
      },
      error: err => this.error.set(this.errorText(err, 'Failed to load recipe.'))
    });
  }

  newRecipe(): void {
    this.selected.set(null);
    this.form.set(this.emptyForm());
    this.editing.set(true);
    this.error.set(null);
    this.message.set(null);
  }

  editSelected(): void {
    const recipe = this.selected();
    if (!recipe) {
      return;
    }

    this.form.set(this.toForm(recipe));
    this.editing.set(true);
    this.error.set(null);
    this.message.set(null);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.form.set(this.selected() ? this.toForm(this.selected()!) : this.emptyForm());
    this.error.set(null);
  }

  saveRecipe(): void {
    const form = this.form();
    if (!form.title.trim()) {
      this.error.set('Recipe title is required.');
      return;
    }

    const request = this.toRequest(form);
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    const save = form.id ? this.service.updateRecipe(form.id, request) : this.service.createRecipe(request);

    save.subscribe({
      next: recipe => {
        this.selected.set(recipe);
        this.form.set(this.toForm(recipe));
        this.editing.set(false);
        this.message.set(`${recipe.title} saved.`);
        this.load();
      },
      error: err => this.error.set(this.errorText(err, 'Failed to save recipe.')),
      complete: () => this.saving.set(false)
    });
  }

  deleteSelected(): void {
    const recipe = this.selected();
    if (!recipe || !confirm(`Delete "${recipe.title}"?`)) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.deleteRecipe(recipe.id).subscribe({
      next: () => {
        this.selected.set(null);
        this.form.set(this.emptyForm());
        this.editing.set(false);
        this.message.set(`${recipe.title} deleted.`);
        this.load();
      },
      error: err => this.error.set(this.errorText(err, 'Failed to delete recipe.')),
      complete: () => this.deleting.set(false)
    });
  }

  markUsed(): void {
    const recipe = this.selected();
    if (!recipe) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.markRecipeUsed(recipe.id).subscribe({
      next: updated => {
        this.selected.set(updated);
        this.form.set(this.toForm(updated));
        this.message.set(`${updated.title} marked as used.`);
        this.load();
      },
      error: err => this.error.set(this.errorText(err, 'Failed to mark recipe as used.')),
      complete: () => this.saving.set(false)
    });
  }

  toggleSourceManager(): void {
    this.managingSources.update(value => !value);
    this.bookForm.set(this.emptyBookForm());
    this.error.set(null);
    this.message.set(null);
  }

  editBook(book: RecipeBook): void {
    this.bookForm.set({
      id: book.id,
      name: book.name,
      description: book.description ?? ''
    });
  }

  saveBook(): void {
    const form = this.bookForm();
    if (!form.name.trim()) {
      this.error.set('Recipe book/source name is required.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    const request = {
      name: form.name.trim(),
      description: form.description.trim() || null
    };
    const save = form.id
      ? this.service.updateRecipeBook(form.id, request)
      : this.service.createRecipeBook(request);

    save.subscribe({
      next: book => {
        this.bookForm.set(this.emptyBookForm());
        this.message.set(`${book.name} saved.`);
        this.load();
      },
      error: err => this.error.set(this.errorText(err, 'Failed to save recipe book/source.')),
      complete: () => this.saving.set(false)
    });
  }

  deleteBook(book: RecipeBook): void {
    if (!confirm(`Delete "${book.name}"? Recipes using it will keep their source details but lose the cookbook link.`)) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.deleteRecipeBook(book.id).subscribe({
      next: () => {
        if (this.bookFilter() === book.id) {
          this.bookFilter.set(null);
        }
        if (this.form().recipeBookId === book.id) {
          this.setForm('recipeBookId', null);
        }
        this.bookForm.set(this.emptyBookForm());
        this.message.set(`${book.name} deleted.`);
        this.load();
      },
      error: err => this.error.set(this.errorText(err, 'Failed to delete recipe book/source.')),
      complete: () => this.saving.set(false)
    });
  }

  cancelBookEdit(): void {
    this.bookForm.set(this.emptyBookForm());
  }

  filterToBook(bookId: number | null): void {
    this.bookFilter.set(bookId);
    this.applyFilters();
  }

  filterToSourceLabel(label: string): void {
    const bookId = this.recipeBooks().find(book => book.name === label)?.id ?? null;
    this.filterToBook(bookId);
  }

  exportRecipeSourceCsv(): void {
    this.downloadCsv(`recipe-source-coverage-${this.fileSlug(this.sourceScopeLabel())}.csv`, [
      ['Source Scope', this.sourceScopeLabel(), '', '', '', '', '', '', ''],
      ['Exported At', new Date().toLocaleString(), '', '', '', '', '', '', ''],
      [],
      ['Title', 'Category', 'Cuisine', 'Cookbook', 'Favorite', 'Canning', 'Active', 'Last Used', 'Tags'],
      ...this.recipes().map(recipe => [
        recipe.title,
        recipe.category,
        recipe.cuisine,
        recipe.recipeBookName,
        recipe.isFavorite,
        recipe.isCanning,
        recipe.isActive,
        recipe.lastUsedAt,
        recipe.tags.map(tag => tag.name).join('|')
      ])
    ]);
  }

  importRows(): void {
    const rows = this.validImportRows();
    if (rows.length === 0) {
      this.error.set('No valid recipe rows are ready to import.');
      return;
    }

    this.importing.set(true);
    this.error.set(null);
    this.message.set(null);
    forkJoin(rows.map(row => this.service.createRecipe(row))).subscribe({
      next: created => {
        this.importText.set('');
        this.message.set(`${created.length} recipe${created.length === 1 ? '' : 's'} imported.`);
        this.load();
      },
      error: err => this.error.set(this.errorText(err, 'Failed to import recipe rows.')),
      complete: () => this.importing.set(false)
    });
  }

  clearImport(): void {
    this.importText.set('');
    this.error.set(null);
  }

  addToShoppingList(): void {
    const recipe = this.selected();
    if (!recipe) {
      return;
    }

    if (this.selectedIngredientIds().length === 0) {
      this.error.set('Select at least one ingredient to add to the shopping list.');
      return;
    }

    this.shopping.set(true);
    this.error.set(null);
    this.message.set(null);
    this.lastShoppingResult.set(null);
    this.service.addIngredientsToShoppingList(recipe.id, {
      ingredientIds: this.selectedIngredientIds(),
      targetServings: this.targetServings(),
      combineDuplicates: this.combineShoppingDuplicates(),
      store: this.shoppingStore().trim() || null,
      aisle: this.shoppingAisle().trim() || null,
      sortOrderStart: this.shoppingSortOrderStart(),
      skipPantryItems: this.skipPantryItems(),
      shoppingGroupName: this.shoppingGroupName().trim() || null
    }).subscribe({
      next: result => {
        const skipped = result.skippedPantryCount > 0 ? ` ${result.skippedPantryCount} pantry item${result.skippedPantryCount === 1 ? '' : 's'} skipped.` : '';
        const group = this.currentMealPlanGroupName();
        this.lastShoppingResult.set(result);
        this.message.set(`${result.createdCount} shopping item${result.createdCount === 1 ? '' : 's'} added and ${result.updatedCount} updated${group ? ` for ${group}` : ''}. Scale factor ${result.scaleFactor}.${skipped}`);
      },
      error: err => this.error.set(this.errorText(err, 'Failed to add ingredients to the shopping list.')),
      complete: () => this.shopping.set(false)
    });
  }

  toggleIngredient(id: number, checked: boolean): void {
    this.selectedIngredientIds.update(ids => checked
      ? Array.from(new Set([...ids, id]))
      : ids.filter(current => current !== id));
  }

  selectAllIngredients(): void {
    this.selectedIngredientIds.set(this.selected()?.ingredients.map(ingredient => ingredient.id) ?? []);
  }

  clearSelectedIngredients(): void {
    this.selectedIngredientIds.set([]);
  }

  applyMealPlanGroupName(value: string): void {
    this.shoppingGroupName.set(value);
  }

  addIngredient(): void {
    this.form.update(form => ({
      ...form,
      ingredients: [
        ...form.ingredients,
        {
          id: 0,
          sortOrder: form.ingredients.length + 1,
          itemName: '',
          quantity: null,
          unit: null,
          preparation: null,
          shoppingCategory: 'Grocery'
        }
      ]
    }));
  }

  removeIngredient(index: number): void {
    this.form.update(form => ({ ...form, ingredients: this.reorderIngredients(form.ingredients.filter((_, current) => current !== index)) }));
  }

  addInstruction(): void {
    this.form.update(form => ({
      ...form,
      instructions: [
        ...form.instructions,
        {
          id: 0,
          stepNumber: form.instructions.length + 1,
          text: ''
        }
      ]
    }));
  }

  removeInstruction(index: number): void {
    this.form.update(form => ({ ...form, instructions: this.reorderInstructions(form.instructions.filter((_, current) => current !== index)) }));
  }

  setForm<K extends keyof RecipeForm>(field: K, value: RecipeForm[K]): void {
    this.form.update(form => ({ ...form, [field]: value }));
  }

  setIngredient(index: number, field: keyof RecipeIngredientRequest, value: string | number | null): void {
    this.form.update(form => ({
      ...form,
      ingredients: form.ingredients.map((ingredient, current) => current === index ? { ...ingredient, [field]: value } : ingredient)
    }));
  }

  setInstruction(index: number, value: string): void {
    this.form.update(form => ({
      ...form,
      instructions: form.instructions.map((instruction, current) => current === index ? { ...instruction, text: value } : instruction)
    }));
  }

  setBookForm<K extends keyof RecipeBookForm>(field: K, value: RecipeBookForm[K]): void {
    this.bookForm.update(form => ({ ...form, [field]: value }));
  }

  tagLabel(recipe: RecipeSummary | RecipeDetail): string {
    return recipe.tags.map(tag => tag.name).join(', ') || 'No tags';
  }

  sourceLabel(recipe: RecipeSummary | RecipeDetail): string {
    if (recipe.recipeBookName) {
      return recipe.recipeBookName;
    }

    if ('sourceDetail' in recipe && recipe.sourceDetail) {
      return recipe.sourceDetail;
    }

    if ('sourceUrl' in recipe && recipe.sourceUrl) {
      return recipe.sourceUrl;
    }

    return 'Source not set';
  }

  timeLabel(recipe: RecipeSummary | RecipeDetail): string {
    const parts = [
      recipe.prepMinutes ? `${recipe.prepMinutes}m prep` : '',
      recipe.cookMinutes ? `${recipe.cookMinutes}m cook` : ''
    ].filter(Boolean);
    return parts.join(' / ') || 'Time unset';
  }

  quantityLabel(ingredient: RecipeIngredientRequest | RecipeDetail['ingredients'][number]): string {
    if (ingredient.quantity === null) {
      return '';
    }

    return `${ingredient.quantity}${ingredient.unit ? ' ' + ingredient.unit : ''}`;
  }

  scaledQuantityLabel(ingredient: RecipeDetail['ingredients'][number]): string {
    if (ingredient.quantity === null) {
      return '-';
    }

    const recipeServings = this.selected()?.servings ?? null;
    const targetServings = this.targetServings();
    if (!recipeServings || !targetServings || recipeServings === targetServings) {
      return this.quantityLabel(ingredient) || '-';
    }

    const scaled = Math.round((ingredient.quantity * targetServings / recipeServings) * 100) / 100;
    return `${scaled}${ingredient.unit ? ' ' + ingredient.unit : ''}`;
  }

  previewQuantityLabel(row: { quantity: number | null; unit: string | null }): string {
    if (row.quantity === null) {
      return '-';
    }

    return `${row.quantity}${row.unit ? ' ' + row.unit : ''}`;
  }

  shoppingResultVerb(item: RecipeShoppingListItemResult | { created?: boolean }): string {
    return item.created ? 'Created' : 'Updated';
  }

  shoppingResultTone(item: RecipeShoppingListItemResult | { created?: boolean }): string {
    return item.created
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'app-token-soft-surface app-token-text-primary';
  }

  private selectedShoppingIngredients(): RecipeDetail['ingredients'] {
    const recipe = this.selected();
    if (!recipe) {
      return [];
    }

    const selectedIds = new Set(this.selectedIngredientIds());
    return recipe.ingredients.filter(ingredient => selectedIds.has(ingredient.id));
  }

  private previewSortOrder(index: number): number | null {
    const start = this.shoppingSortOrderStart();
    return start === null ? null : start + index * 10;
  }

  private roundQuantity(quantity: number): number {
    return Math.round(quantity * 100) / 100;
  }

  private buildSourceCoverageRows(): RecipeSourceCoverageRow[] {
    const rows = new Map<string, RecipeSourceCoverageRow>();
    for (const recipe of this.recipes()) {
      const label = recipe.recipeBookName ?? 'Source not set';
      const row = rows.get(label) ?? { label, count: 0, favoriteCount: 0, canningCount: 0, recentCount: 0 };
      row.count += 1;
      row.favoriteCount += recipe.isFavorite ? 1 : 0;
      row.canningCount += recipe.isCanning ? 1 : 0;
      row.recentCount += recipe.lastUsedAt ? 1 : 0;
      rows.set(label, row);
    }

    return Array.from(rows.values())
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  }

  private downloadCsv(fileName: string, rows: (string | number | boolean | null | undefined)[][]): void {
    const csv = rows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private fileSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'all-recipes';
  }

  private groupShoppingRows(rows: {
    itemName: string;
    category: string;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
    sortOrder: number | null;
    pantryMatchCount?: number;
    pantryMatchDetail?: string | null;
    created?: boolean;
  }[]): ShoppingPreviewGroup[] {
    const groups = new Map<string, ShoppingPreviewGroup['rows']>();
    for (const row of rows) {
      const label = row.category || 'Grocery';
      groups.set(label, [...(groups.get(label) ?? []), row]);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([label, groupedRows]) => ({
        label,
        rows: groupedRows.sort((left, right) => this.sortNumber(left.sortOrder) - this.sortNumber(right.sortOrder)
          || left.itemName.localeCompare(right.itemName))
      }));
  }

  private buildMealPlanGroupSuggestions(): string[] {
    const recipe = this.selected();
    if (!recipe) {
      return [];
    }

    const values = [
      this.defaultMealPlanGroupName(recipe),
      recipe.category ? `${recipe.category} meal plan` : '',
      recipe.cuisine ? `${recipe.cuisine} meal plan` : '',
      recipe.recipeBookName ? `${recipe.recipeBookName} meal plan` : ''
    ];

    return Array.from(new Set(values.map(value => value.trim()).filter(Boolean))).slice(0, 4);
  }

  private defaultMealPlanGroupName(recipe: RecipeDetail): string {
    const date = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${recipe.title} - ${date}`;
  }

  private currentMealPlanGroupName(): string {
    return this.shoppingGroupName().trim();
  }

  private pantryMatchesIngredient(ingredient: RecipeDetail['ingredients'][number]): PantryItem[] {
    const itemKey = this.inventoryKey(ingredient.itemName);
    const unitKey = this.inventoryKey(ingredient.unit);
    return this.pantryItems()
      .filter(item => item.isInStock)
      .filter(item => this.inventoryKey(item.itemName) === itemKey
        && (!unitKey || !this.inventoryKey(item.unit) || this.inventoryKey(item.unit) === unitKey));
  }

  private uniquePantryMatches(items: PantryItem[]): PantryItem[] {
    return Array.from(new Map(items.map(item => [item.id, item])).values());
  }

  private pantryMatchDetail(items: PantryItem[]): string | null {
    const matches = this.uniquePantryMatches(items);
    if (matches.length === 0) {
      return null;
    }

    return matches
      .slice(0, 2)
      .map(item => `${item.itemName}${item.quantity !== null ? ` ${item.quantity}${item.unit ? ' ' + item.unit : ''}` : ''}${item.location ? ` / ${item.location}` : ''}`)
      .join('; ');
  }

  private inventoryKey(value: string | null | undefined): string {
    return (value ?? '').trim().toUpperCase();
  }

  private sortNumber(value: number | null): number {
    return value ?? Number.MAX_SAFE_INTEGER;
  }

  private toForm(recipe: RecipeDetail): RecipeForm {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description ?? '',
      category: recipe.category,
      cuisine: recipe.cuisine ?? '',
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      servings: recipe.servings,
      sourceUrl: recipe.sourceUrl ?? '',
      recipeBookId: recipe.recipeBookId,
      sourcePage: recipe.sourcePage ?? '',
      sourceDetail: recipe.sourceDetail ?? '',
      notes: recipe.notes ?? '',
      isCanning: recipe.isCanning,
      isFavorite: recipe.isFavorite,
      isActive: recipe.isActive,
      tagsText: recipe.tags.map(tag => tag.name).join(', '),
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        sortOrder: ingredient.sortOrder,
        itemName: ingredient.itemName,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        preparation: ingredient.preparation,
        shoppingCategory: ingredient.shoppingCategory
      })),
      instructions: recipe.instructions.map(instruction => ({
        id: instruction.id,
        stepNumber: instruction.stepNumber,
        text: instruction.text
      }))
    };
  }

  private toRequest(form: RecipeForm): RecipeRequest {
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || 'General',
      cuisine: form.cuisine.trim() || null,
      prepMinutes: this.optionalNumber(form.prepMinutes),
      cookMinutes: this.optionalNumber(form.cookMinutes),
      servings: this.optionalNumber(form.servings),
      sourceUrl: form.sourceUrl.trim() || null,
      recipeBookId: form.recipeBookId,
      sourcePage: form.sourcePage.trim() || null,
      sourceDetail: form.sourceDetail.trim() || null,
      notes: form.notes.trim() || null,
      isCanning: form.isCanning,
      isFavorite: form.isFavorite,
      isActive: form.isActive,
      tags: form.tagsText.split(',').map(tag => tag.trim()).filter(Boolean),
      ingredients: this.reorderIngredients(form.ingredients).filter(ingredient => ingredient.itemName.trim()),
      instructions: this.reorderInstructions(form.instructions).filter(instruction => instruction.text.trim())
    };
  }

  private emptyForm(): RecipeForm {
    return {
      id: null,
      title: '',
      description: '',
      category: 'General',
      cuisine: '',
      prepMinutes: null,
      cookMinutes: null,
      servings: null,
      sourceUrl: '',
      recipeBookId: null,
      sourcePage: '',
      sourceDetail: '',
      notes: '',
      isCanning: false,
      isFavorite: false,
      isActive: true,
      tagsText: '',
      ingredients: [],
      instructions: []
    };
  }

  private emptyBookForm(): RecipeBookForm {
    return {
      id: null,
      name: '',
      description: ''
    };
  }

  private optionalNumber(value: number | null): number | null {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value);
  }

  private reorderIngredients(ingredients: RecipeIngredientRequest[]): RecipeIngredientRequest[] {
    return ingredients.map((ingredient, index) => ({ ...ingredient, sortOrder: index + 1 }));
  }

  private reorderInstructions(instructions: RecipeInstructionRequest[]): RecipeInstructionRequest[] {
    return instructions.map((instruction, index) => ({ ...instruction, stepNumber: index + 1 }));
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.filter(value => value.trim()))).sort((left, right) => left.localeCompare(right));
  }

  private parseImportRows(value: string): RecipeImportRow[] {
    const rows = this.parseDelimitedRows(value);
    if (rows.length === 0) {
      return [];
    }

    const header = this.headerMap(rows[0], [
      'title',
      'name',
      'category',
      'cuisine',
      'tags',
      'description',
      'notes',
      'book',
      'recipe book',
      'source',
      'page',
      'source page',
      'prep',
      'prep minutes',
      'cook',
      'cook minutes',
      'servings',
      'canning',
      'favorite',
      'active'
    ]);
    const dataRows = header ? rows.slice(1) : rows;

    return dataRows.map(row => {
      const title = header ? this.importValue(row, header, ['title', 'name']) : row[0] ?? '';
      const category = header ? this.importValue(row, header, ['category']) : row[1] ?? '';
      const cuisine = header ? this.importValue(row, header, ['cuisine']) : row[2] ?? '';
      const tags = header ? this.importValue(row, header, ['tags']) : row[3] ?? '';
      const description = header ? this.importValue(row, header, ['description']) : row[4] ?? '';
      const notes = header ? this.importValue(row, header, ['notes']) : row[5] ?? '';
      const book = header ? this.importValue(row, header, ['book', 'recipe book', 'source']) : '';
      const sourcePage = header ? this.importValue(row, header, ['page', 'source page']) : '';
      const prepMinutes = header ? this.importValue(row, header, ['prep', 'prep minutes']) : row[6] ?? '';
      const cookMinutes = header ? this.importValue(row, header, ['cook', 'cook minutes']) : row[7] ?? '';
      const servings = header ? this.importValue(row, header, ['servings']) : row[8] ?? '';
      const canning = header ? this.importValue(row, header, ['canning']) : '';
      const favorite = header ? this.importValue(row, header, ['favorite']) : '';
      const active = header ? this.importValue(row, header, ['active']) : '';
      const warnings: string[] = [];
      const parsedPrep = this.parseOptionalInteger(prepMinutes, 'Prep minutes', warnings);
      const parsedCook = this.parseOptionalInteger(cookMinutes, 'Cook minutes', warnings);
      const parsedServings = this.parseOptionalInteger(servings, 'Servings', warnings);

      if (!title.trim()) {
        warnings.push('Title is required.');
      }

      return {
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || 'General',
        cuisine: cuisine.trim() || null,
        prepMinutes: parsedPrep,
        cookMinutes: parsedCook,
        servings: parsedServings,
        sourceUrl: null,
        recipeBookId: this.findRecipeBookId(book),
        sourcePage: sourcePage.trim() || null,
        sourceDetail: book.trim() && !this.findRecipeBookId(book) ? book.trim() : null,
        notes: notes.trim() || null,
        isCanning: this.parseBoolean(canning) || category.trim().toLowerCase() === 'canning',
        isFavorite: this.parseBoolean(favorite),
        isActive: active.trim() ? this.parseBoolean(active) : true,
        tags: tags.split(/[;,]/).map(tag => tag.trim()).filter(Boolean),
        ingredients: [],
        instructions: [],
        warnings
      };
    });
  }

  private parseDelimitedRows(value: string): string[][] {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    if (!trimmed.includes(',') && !trimmed.includes('\t') && !trimmed.includes('"')) {
      return trimmed
        .split(/\r?\n/)
        .map(line => [line.trim()])
        .filter(row => row[0]);
    }

    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < trimmed.length; index += 1) {
      const char = trimmed[index];
      const next = trimmed[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          index += 1;
        }
        row.push(cell.trim());
        if (row.some(part => part)) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(part => part)) {
      rows.push(row);
    }

    return rows;
  }

  private headerMap(row: string[], candidates: string[]): Map<string, number> | null {
    const normalized = row.map(cell => this.normalizeHeader(cell));
    const candidateSet = new Set(candidates.map(candidate => this.normalizeHeader(candidate)));
    if (!normalized.some(cell => candidateSet.has(cell))) {
      return null;
    }

    return new Map(normalized.map((header, index) => [header, index]));
  }

  private importValue(row: string[], header: Map<string, number>, names: string[]): string {
    for (const name of names) {
      const index = header.get(this.normalizeHeader(name));
      if (index !== undefined) {
        return row[index]?.trim() ?? '';
      }
    }

    return '';
  }

  private normalizeHeader(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private parseOptionalInteger(value: string, label: string, warnings: string[]): number | null {
    if (!value.trim()) {
      return null;
    }

    const parsed = Number(value.trim());
    if (!Number.isInteger(parsed) || parsed < 0) {
      warnings.push(`${label} must be a whole number.`);
      return null;
    }

    return parsed;
  }

  private parseBoolean(value: string): boolean {
    return ['1', 'true', 'yes', 'y', 'favorite', 'active'].includes(value.trim().toLowerCase());
  }

  private findRecipeBookId(value: string): number | null {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return this.recipeBooks().find(book => book.name.toLowerCase() === normalized)?.id ?? null;
  }

  private errorText(err: { error?: unknown; message?: string }, fallback: string): string {
    return typeof err.error === 'string' ? err.error : err.message ?? fallback;
  }
}
