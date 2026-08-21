import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { PantryItem, PantryItemRequest, ShoppingItemDefault, ShoppingItemDefaultRequest, ShoppingListDuplicateGroup, ShoppingListHistorySummary, ShoppingListItem, ShoppingListItemRequest, ShoppingListMergeResult } from './models/shopping-list.models';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/shopping-list`;
  private readonly settingsBase = `${environment.apiUrl}/admin/settings`;

  getItems(category = 'All', sourceArea = 'All', status = 'Needed', store = 'All') {
    const params = new URLSearchParams();
    params.set('category', category);
    params.set('sourceArea', sourceArea);
    params.set('status', status);
    params.set('store', store);
    return this.http.get<ShoppingListItem[]>(`${this.base}?${params.toString()}`);
  }

  updateStatus(id: number, status: 'Needed' | 'Purchased' | 'Skipped') {
    return this.http.patch<ShoppingListItem>(`${this.base}/${id}/status`, { status });
  }

  createItem(request: ShoppingListItemRequest) {
    return this.http.post<ShoppingListItem>(this.base, request);
  }

  updateItem(id: number, request: ShoppingListItemRequest) {
    return this.http.put<ShoppingListItem>(`${this.base}/${id}`, request);
  }

  deleteItem(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  clearCompleted(olderThanDays: number) {
    return this.http.delete<{ deletedCount: number }>(`${this.base}/completed?olderThanDays=${olderThanDays}`);
  }

  getDuplicates(status = 'Needed') {
    return this.http.get<ShoppingListDuplicateGroup[]>(`${this.base}/duplicates?status=${encodeURIComponent(status)}`);
  }

  mergeDuplicates() {
    return this.http.post<ShoppingListMergeResult>(`${this.base}/duplicates/merge`, {});
  }

  getHistorySummary(from?: string, to?: string) {
    return this.http.get<ShoppingListHistorySummary>(`${this.base}/history/summary?${this.historyParams(from, to)}`);
  }

  exportHistory(format: 'csv' | 'xlsx', from?: string, to?: string) {
    return this.http.get(`${this.base}/history/export.${format}?${this.historyParams(from, to)}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  getDefaults(frequentOnly = false) {
    return this.http.get<ShoppingItemDefault[]>(`${this.base}/defaults?frequentOnly=${frequentOnly}`);
  }

  createDefault(request: ShoppingItemDefaultRequest) {
    return this.http.post<ShoppingItemDefault>(`${this.base}/defaults`, request);
  }

  updateDefault(id: number, request: ShoppingItemDefaultRequest) {
    return this.http.put<ShoppingItemDefault>(`${this.base}/defaults/${id}`, request);
  }

  deleteDefault(id: number) {
    return this.http.delete<void>(`${this.base}/defaults/${id}`);
  }

  saveDefaultFromItem(id: number) {
    return this.http.post<ShoppingItemDefault>(`${this.base}/defaults/from-item/${id}`, {});
  }

  quickAddDefault(id: number) {
    return this.http.post<ShoppingListItem>(`${this.base}/defaults/${id}/quick-add`, {});
  }

  getPantryItems(inStockOnly = false) {
    return this.http.get<PantryItem[]>(`${this.base}/pantry?inStockOnly=${inStockOnly}`);
  }

  createPantryItem(request: PantryItemRequest) {
    return this.http.post<PantryItem>(`${this.base}/pantry`, request);
  }

  updatePantryItem(id: number, request: PantryItemRequest) {
    return this.http.put<PantryItem>(`${this.base}/pantry/${id}`, request);
  }

  deletePantryItem(id: number) {
    return this.http.delete<void>(`${this.base}/pantry/${id}`);
  }

  getShoppingCategories() {
    return this.http.get<{ categories: string[] }>(`${this.settingsBase}/shopping-categories`);
  }

  private historyParams(from?: string, to?: string): string {
    const params = new URLSearchParams();
    if (from) {
      params.set('from', from);
    }
    if (to) {
      params.set('to', to);
    }
    return params.toString();
  }
}
