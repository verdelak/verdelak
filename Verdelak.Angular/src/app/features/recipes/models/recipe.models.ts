export interface RecipeTag {
  id: number;
  name: string;
  slug: string;
}

export interface RecipeBook {
  id: number;
  name: string;
  description: string | null;
}

export interface RecipeBookRequest {
  name: string;
  description: string | null;
}

export interface RecipeIngredient {
  id: number;
  sortOrder: number;
  itemName: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
  shoppingCategory: string;
}

export interface RecipeInstruction {
  id: number;
  stepNumber: number;
  text: string;
}

export interface RecipeSummary {
  id: number;
  title: string;
  description: string | null;
  category: string;
  cuisine: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  recipeBookId: number | null;
  recipeBookName: string | null;
  isCanning: boolean;
  isFavorite: boolean;
  isActive: boolean;
  lastUsedAt: string | null;
  tags: RecipeTag[];
}

export interface RecipeDetail extends RecipeSummary {
  sourceUrl: string | null;
  sourcePage: string | null;
  sourceDetail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
}

export interface RecipeIngredientRequest {
  id: number;
  sortOrder: number;
  itemName: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
  shoppingCategory: string;
}

export interface RecipeInstructionRequest {
  id: number;
  stepNumber: number;
  text: string;
}

export interface RecipeRequest {
  title: string;
  description: string | null;
  category: string;
  cuisine: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  sourceUrl: string | null;
  recipeBookId: number | null;
  sourcePage: string | null;
  sourceDetail: string | null;
  notes: string | null;
  isCanning: boolean;
  isFavorite: boolean;
  isActive: boolean;
  tags: string[];
  ingredients: RecipeIngredientRequest[];
  instructions: RecipeInstructionRequest[];
}

export interface RecipeShoppingListResult {
  createdCount: number;
  updatedCount: number;
  scaleFactor: number;
  skippedPantryCount: number;
  skippedPantryItems: RecipeSkippedPantryItem[];
  items: RecipeShoppingListItemResult[];
}

export interface RecipeSkippedPantryItem {
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  pantryMatch: string | null;
}

export interface RecipeShoppingListItemResult {
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  store: string | null;
  aisle: string | null;
  sortOrder: number | null;
  notes: string | null;
  created: boolean;
}

export interface RecipeShoppingListRequest {
  ingredientIds: number[];
  targetServings: number | null;
  combineDuplicates: boolean;
  store: string | null;
  aisle: string | null;
  sortOrderStart: number | null;
  skipPantryItems: boolean;
  shoppingGroupName: string | null;
}
