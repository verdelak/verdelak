import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { RecipeBook, RecipeBookRequest, RecipeDetail, RecipeRequest, RecipeShoppingListRequest, RecipeShoppingListResult, RecipeSummary, RecipeTag } from './models/recipe.models';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/recipes`;

  getRecipes(filters: {
    search?: string;
    category?: string;
    cuisine?: string;
    ingredient?: string;
    tag?: string;
    recipeBookId?: number | null;
    sourceStatus?: string;
    readiness?: string;
    maxTotalMinutes?: number | null;
    isCanning?: boolean | null;
    includeInactive?: boolean;
    favoritesOnly?: boolean;
    recentlyUsed?: boolean;
    recentlyUsedDays?: number | null;
  }) {
    const params = new URLSearchParams();
    if (filters.search?.trim()) {
      params.set('search', filters.search.trim());
    }
    if (filters.category && filters.category !== 'All') {
      params.set('category', filters.category);
    }
    if (filters.cuisine && filters.cuisine !== 'All') {
      params.set('cuisine', filters.cuisine);
    }
    if (filters.ingredient?.trim()) {
      params.set('ingredient', filters.ingredient.trim());
    }
    if (filters.tag && filters.tag !== 'All') {
      params.set('tag', filters.tag);
    }
    if (filters.recipeBookId) {
      params.set('recipeBookId', `${filters.recipeBookId}`);
    }
    if (filters.sourceStatus && filters.sourceStatus !== 'All') {
      params.set('sourceStatus', filters.sourceStatus);
    }
    if (filters.readiness && filters.readiness !== 'All') {
      params.set('readiness', filters.readiness);
    }
    if (filters.maxTotalMinutes) {
      params.set('maxTotalMinutes', `${filters.maxTotalMinutes}`);
    }
    if (filters.isCanning !== null && filters.isCanning !== undefined) {
      params.set('isCanning', `${filters.isCanning}`);
    }
    if (filters.includeInactive) {
      params.set('includeInactive', 'true');
    }
    if (filters.favoritesOnly) {
      params.set('favoritesOnly', 'true');
    }
    if (filters.recentlyUsed) {
      params.set('recentlyUsed', 'true');
      if (filters.recentlyUsedDays) {
        params.set('recentlyUsedDays', `${filters.recentlyUsedDays}`);
      }
    }

    const query = params.toString();
    return this.http.get<RecipeSummary[]>(query ? `${this.base}?${query}` : this.base);
  }

  getRecipe(id: number) {
    return this.http.get<RecipeDetail>(`${this.base}/${id}`);
  }

  getTags() {
    return this.http.get<RecipeTag[]>(`${this.base}/tags`);
  }

  getCategories() {
    return this.http.get<string[]>(`${this.base}/categories`);
  }

  getCuisines() {
    return this.http.get<string[]>(`${this.base}/cuisines`);
  }

  getRecipeBooks() {
    return this.http.get<RecipeBook[]>(`${this.base}/books`);
  }

  createRecipeBook(request: RecipeBookRequest) {
    return this.http.post<RecipeBook>(`${this.base}/books`, request);
  }

  updateRecipeBook(id: number, request: RecipeBookRequest) {
    return this.http.put<RecipeBook>(`${this.base}/books/${id}`, request);
  }

  deleteRecipeBook(id: number) {
    return this.http.delete<void>(`${this.base}/books/${id}`);
  }

  createRecipe(request: RecipeRequest) {
    return this.http.post<RecipeDetail>(this.base, request);
  }

  updateRecipe(id: number, request: RecipeRequest) {
    return this.http.put<RecipeDetail>(`${this.base}/${id}`, request);
  }

  deleteRecipe(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  markRecipeUsed(id: number) {
    return this.http.post<RecipeDetail>(`${this.base}/${id}/mark-used`, {});
  }

  addIngredientsToShoppingList(id: number, request: RecipeShoppingListRequest) {
    return this.http.post<RecipeShoppingListResult>(`${this.base}/${id}/shopping-list`, request);
  }
}
