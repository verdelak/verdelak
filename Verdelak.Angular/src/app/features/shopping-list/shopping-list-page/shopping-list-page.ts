import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, switchMap } from 'rxjs';
import { PantryItem, PantryItemRequest, ShoppingItemDefault, ShoppingItemDefaultRequest, ShoppingListDuplicateGroup, ShoppingListGroup, ShoppingListHistorySummary, ShoppingListItem, ShoppingListItemRequest } from '../models/shopping-list.models';
import { ShoppingListService } from '../shopping-list.service';

interface ShoppingListForm {
  id: number | null;
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string;
  store: string;
  aisle: string;
  sortOrder: number | null;
  notes: string;
}

interface ShoppingListImportRow extends ShoppingListItemRequest {
  warnings: string[];
}

interface ShoppingDefaultForm {
  id: number | null;
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string;
  store: string;
  aisle: string;
  sortOrder: number | null;
  isFrequent: boolean;
  notes: string;
}

interface PantryForm {
  id: number | null;
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string;
  location: string;
  expirationDate: string;
  isInStock: boolean;
  notes: string;
}

interface PantrySummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface PantryAttentionRow {
  item: PantryItem;
  status: string;
  tone: string;
  detail: string;
}

interface StoreRouteCard {
  label: string;
  value: number;
  detail: string;
}

interface StoreRouteRow {
  store: string;
  itemCount: number;
  aisleCount: number;
  missingAisleCount: number;
  missingSortCount: number;
  routeLabel: string;
}

interface ShoppingHistoryCard {
  label: string;
  value: number | string;
  detail: string;
}

@Component({
  selector: 'app-shopping-list-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './shopping-list-page.html',
  styleUrl: './shopping-list-page.scss'
})
export class ShoppingListPage {
  readonly items = signal<ShoppingListItem[]>([]);
  readonly allItems = signal<ShoppingListItem[]>([]);
  readonly defaults = signal<ShoppingItemDefault[]>([]);
  readonly pantryItems = signal<PantryItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly importing = signal(false);
  readonly clearingCompleted = signal(false);
  readonly loadingDuplicates = signal(false);
  readonly mergingDuplicates = signal(false);
  readonly loadingHistory = signal(false);
  readonly exportingHistory = signal(false);
  readonly updatingId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly categoryFilter = signal('All');
  readonly sourceFilter = signal('All');
  readonly storeFilter = signal('All');
  readonly statusFilter = signal('Needed');
  readonly statuses = ['Needed', 'Purchased', 'Skipped', 'All'];
  readonly categorySuggestions = signal<string[]>(this.defaultShoppingCategories());
  readonly form = signal<ShoppingListForm>(this.emptyForm());
  readonly defaultForm = signal<ShoppingDefaultForm>(this.emptyDefaultForm());
  readonly pantryForm = signal<PantryForm>(this.emptyPantryForm());
  readonly importText = signal('');
  readonly duplicateGroups = signal<ShoppingListDuplicateGroup[]>([]);
  readonly historySummary = signal<ShoppingListHistorySummary | null>(null);
  readonly historyFrom = signal('');
  readonly historyTo = signal('');
  readonly shoppingMode = signal(false);
  readonly collapsePurchasedInShoppingMode = signal(true);
  readonly clearOlderThanDays = signal(30);

  readonly categories = computed(() => this.uniqueValues([
    ...this.categorySuggestions(),
    ...this.allItems().map(item => item.category)
  ]));
  readonly sources = computed(() => this.uniqueValues(this.allItems().map(item => item.sourceArea || 'Manual')));
  readonly stores = computed(() => this.uniqueValues([
    ...this.allItems().map(item => item.store || 'Store not set'),
    ...this.defaults().map(item => item.store || 'Store not set')
  ]));
  readonly frequentDefaults = computed(() => this.defaults().filter(item => item.isFrequent));
  readonly pantrySummaryCards = computed<PantrySummaryCard[]>(() => {
    const inStock = this.pantryItems().filter(item => item.isInStock);
    const outOfStock = this.pantryItems().filter(item => !item.isInStock);
    const expiringSoon = this.pantryItems().filter(item => this.daysUntilExpiration(item) !== null && this.daysUntilExpiration(item)! >= 0 && this.daysUntilExpiration(item)! <= 14);
    const shoppingMatches = this.neededItems().filter(item => this.pantryMatches(item).length > 0);
    return [
      {
        label: 'Pantry tracked',
        value: this.pantryItems().length,
        detail: `${inStock.length.toLocaleString()} in stock`
      },
      {
        label: 'Already on hand',
        value: shoppingMatches.length,
        detail: 'Needed shopping rows with pantry matches'
      },
      {
        label: 'Out of stock',
        value: outOfStock.length,
        detail: 'Pantry rows marked out'
      },
      {
        label: 'Expiring soon',
        value: expiringSoon.length,
        detail: 'In the next 14 days'
      }
    ];
  });
  readonly pantryAttentionRows = computed<PantryAttentionRow[]>(() => this.pantryItems()
    .map(item => this.pantryAttentionRow(item))
    .filter((row): row is PantryAttentionRow => row !== null)
    .sort((left, right) => this.pantryAttentionRank(left.status) - this.pantryAttentionRank(right.status)
      || left.item.itemName.localeCompare(right.item.itemName))
    .slice(0, 8));
  readonly storeRouteRows = computed(() => this.buildStoreRouteRows());
  readonly missingRouteItems = computed(() => this.neededItems()
    .filter(item => !item.store?.trim() || !item.aisle?.trim() || item.sortOrder === null)
    .sort((left, right) => this.compareShoppingItems(left, right))
    .slice(0, 8));
  readonly routeScopeLabel = computed(() => [
    this.categoryFilter() === 'All' ? 'All categories' : this.categoryFilter(),
    this.storeFilter() === 'All' ? 'All stores' : this.storeFilter(),
    this.sourceFilter() === 'All' ? 'All sources' : this.sourceFilter(),
    this.statusFilter() === 'All' ? 'All statuses' : this.statusFilter()
  ].join(' / '));
  readonly storeRouteCards = computed<StoreRouteCard[]>(() => {
    const needed = this.neededItems();
    const routed = needed.filter(item => item.store?.trim() && item.aisle?.trim() && item.sortOrder !== null);
    const defaultMatches = needed.filter(item => this.routingDefaultForItem(item) !== null);
    return [
      {
        label: 'Needed rows',
        value: needed.length,
        detail: 'Current route planning scope'
      },
      {
        label: 'Fully routed',
        value: routed.length,
        detail: 'Store, aisle, and sort set'
      },
      {
        label: 'Needs route',
        value: needed.length - routed.length,
        detail: 'Missing store, aisle, or sort'
      },
      {
        label: 'Default matches',
        value: defaultMatches.length,
        detail: 'Can copy route from saved defaults'
      }
    ];
  });

  readonly groups = computed<ShoppingListGroup[]>(() => {
    const grouped = new Map<string, ShoppingListItem[]>();
    for (const item of this.items()) {
      if (this.shoppingMode() && this.collapsePurchasedInShoppingMode() && item.status === 'Purchased') {
        continue;
      }

      const key = this.shoppingMode()
        ? `${item.store || 'Store not set'} / ${item.aisle || 'Aisle not set'}`
        : item.category;
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
      .map(([category, items]) => ({
        category,
        items: items.sort((left, right) => this.compareShoppingItems(left, right))
      }));
  });

  readonly totalItems = computed(() => this.items().length);
  readonly neededItems = computed(() => this.items().filter(item => item.status === 'Needed'));
  readonly purchasedItems = computed(() => this.items().filter(item => item.status === 'Purchased'));
  readonly skippedItems = computed(() => this.items().filter(item => item.status === 'Skipped'));
  readonly shoppingPrintDate = computed(() => new Date().toLocaleString());
  readonly importPreview = computed(() => this.parseImportRows(this.importText()));
  readonly validImportRows = computed(() => this.importPreview().filter(row => row.warnings.length === 0));
  readonly historyRangeLabel = computed(() => this.buildHistoryRangeLabel());
  readonly historyCards = computed<ShoppingHistoryCard[]>(() => {
    const history = this.historySummary();
    const purchased = history?.months.reduce((sum, row) => sum + row.purchasedCount, 0) ?? 0;
    const skipped = history?.months.reduce((sum, row) => sum + row.skippedCount, 0) ?? 0;
    const topSource = history?.bySource[0];
    const topCategory = history?.byCategory[0];
    return [
      {
        label: 'Range',
        value: this.historyRangeLabel(),
        detail: history ? `${history.months.length.toLocaleString()} month bucket${history.months.length === 1 ? '' : 's'}` : 'Load summary to preview export scope'
      },
      {
        label: 'Purchased',
        value: purchased,
        detail: 'Completed as purchased'
      },
      {
        label: 'Skipped',
        value: skipped,
        detail: 'Completed as skipped'
      },
      {
        label: 'Top source/category',
        value: topSource?.name ?? topCategory?.name ?? '-',
        detail: topSource && topCategory ? `${topSource.purchasedCount} source buys / ${topCategory.purchasedCount} category buys` : 'Load summary to rank history'
      }
    ];
  });

  constructor(private readonly service: ShoppingListService) {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    forkJoin({
      items: this.service.getItems(this.categoryFilter(), this.sourceFilter(), this.statusFilter(), this.storeFilter()),
      allItems: this.service.getItems('All', 'All', 'All', 'All'),
      defaults: this.service.getDefaults(),
      pantryItems: this.service.getPantryItems(),
      shoppingCategories: this.service.getShoppingCategories()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.allItems.set(result.allItems);
        this.defaults.set(result.defaults);
        this.pantryItems.set(result.pantryItems);
        this.categorySuggestions.set(result.shoppingCategories.categories.length
          ? result.shoppingCategories.categories
          : this.defaultShoppingCategories());
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load shopping list.'),
      complete: () => this.loading.set(false)
    });
  }

  setCategoryFilter(value: string): void {
    this.categoryFilter.set(value);
    this.load();
  }

  setSourceFilter(value: string): void {
    this.sourceFilter.set(value);
    this.load();
  }

  setStoreFilter(value: string): void {
    this.storeFilter.set(value);
    this.load();
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
    this.load();
  }

  toggleShoppingMode(): void {
    const next = !this.shoppingMode();
    this.shoppingMode.set(next);
    if (next && this.statusFilter() === 'All') {
      this.statusFilter.set('Needed');
      this.load();
    }
  }

  setForm<K extends keyof ShoppingListForm>(field: K, value: ShoppingListForm[K]): void {
    this.form.update(form => ({ ...form, [field]: value }));
  }

  setDefaultForm<K extends keyof ShoppingDefaultForm>(field: K, value: ShoppingDefaultForm[K]): void {
    this.defaultForm.update(form => ({ ...form, [field]: value }));
  }

  setPantryForm<K extends keyof PantryForm>(field: K, value: PantryForm[K]): void {
    this.pantryForm.update(form => ({ ...form, [field]: value }));
  }

  saveItem(): void {
    const form = this.form();
    if (!form.itemName.trim()) {
      this.error.set('Item name is required.');
      return;
    }

    if (!form.category.trim()) {
      this.error.set('Category is required.');
      return;
    }

    const request: ShoppingListItemRequest = {
      itemName: form.itemName.trim(),
      category: form.category.trim(),
      quantity: this.optionalNumber(form.quantity),
      unit: form.unit.trim() || null,
      store: form.store.trim() || null,
      aisle: form.aisle.trim() || null,
      sortOrder: this.optionalInteger(form.sortOrder),
      sourceArea: null,
      sourceType: null,
      sourceId: null,
      reason: form.id ? this.items().find(item => item.id === form.id)?.reason ?? 'Manual entry' : 'Manual entry',
      notes: form.notes.trim() || null
    };

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    const save = form.id
      ? this.service.updateItem(form.id, request)
      : this.service.createItem(request);
    save.subscribe({
      next: item => {
        this.message.set(`${item.itemName} ${form.id ? 'updated' : 'added to the shopping list'}.`);
        this.form.set(this.emptyForm());
        this.statusFilter.set('Needed');
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to add shopping-list item.'),
      complete: () => this.saving.set(false)
    });
  }

  resetForm(): void {
    this.form.set(this.emptyForm());
    this.error.set(null);
  }

  editDefault(item: ShoppingItemDefault): void {
    this.defaultForm.set({
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit ?? '',
      store: item.store ?? '',
      aisle: item.aisle ?? '',
      sortOrder: item.sortOrder,
      isFrequent: item.isFrequent,
      notes: item.notes ?? ''
    });
  }

  saveDefault(): void {
    const form = this.defaultForm();
    if (!form.itemName.trim()) {
      this.error.set('Default item name is required.');
      return;
    }

    const request: ShoppingItemDefaultRequest = {
      itemName: form.itemName.trim(),
      category: form.category.trim() || 'Grocery',
      quantity: this.optionalNumber(form.quantity),
      unit: form.unit.trim() || null,
      store: form.store.trim() || null,
      aisle: form.aisle.trim() || null,
      sortOrder: this.optionalInteger(form.sortOrder),
      isFrequent: form.isFrequent,
      notes: form.notes.trim() || null
    };
    this.saving.set(true);
    this.error.set(null);
    const save = form.id ? this.service.updateDefault(form.id, request) : this.service.createDefault(request);
    save.subscribe({
      next: item => {
        this.message.set(`${item.itemName} default saved.`);
        this.defaultForm.set(this.emptyDefaultForm());
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save shopping default.'),
      complete: () => this.saving.set(false)
    });
  }

  saveDefaultFromItem(item: ShoppingListItem): void {
    this.updatingId.set(item.id);
    this.error.set(null);
    this.service.saveDefaultFromItem(item.id).subscribe({
      next: saved => {
        this.message.set(`${saved.itemName} saved as a frequent default.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save default from item.'),
      complete: () => this.updatingId.set(null)
    });
  }

  quickAddDefault(item: ShoppingItemDefault): void {
    this.updatingId.set(item.id);
    this.error.set(null);
    this.service.quickAddDefault(item.id).subscribe({
      next: added => {
        this.message.set(`${added.itemName} added from frequent items.`);
        this.statusFilter.set('Needed');
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to quick-add item.'),
      complete: () => this.updatingId.set(null)
    });
  }

  applyDefaultRouting(item: ShoppingListItem): void {
    const defaultItem = this.routingDefaultForItem(item);
    if (!defaultItem) {
      this.error.set(`No saved default route found for ${item.itemName}.`);
      return;
    }

    this.updatingId.set(item.id);
    this.error.set(null);
    this.message.set(null);
    this.service.updateItem(item.id, {
      ...this.requestFromItem(item),
      store: defaultItem.store,
      aisle: defaultItem.aisle,
      sortOrder: defaultItem.sortOrder
    }).subscribe({
      next: updated => {
        this.message.set(`${updated.itemName} routed to ${this.storeLabel(updated)}.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to apply saved route.'),
      complete: () => this.updatingId.set(null)
    });
  }

  deleteDefault(item: ShoppingItemDefault): void {
    if (!confirm(`Delete saved default "${item.itemName}"?`)) {
      return;
    }

    this.updatingId.set(item.id);
    this.error.set(null);
    this.service.deleteDefault(item.id).subscribe({
      next: () => {
        this.message.set(`${item.itemName} default deleted.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete shopping default.'),
      complete: () => this.updatingId.set(null)
    });
  }

  resetDefaultForm(): void {
    this.defaultForm.set(this.emptyDefaultForm());
  }

  editPantryItem(item: PantryItem): void {
    this.pantryForm.set({
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit ?? '',
      location: item.location ?? '',
      expirationDate: item.expirationDate ? item.expirationDate.slice(0, 10) : '',
      isInStock: item.isInStock,
      notes: item.notes ?? ''
    });
  }

  savePantryItem(): void {
    const form = this.pantryForm();
    if (!form.itemName.trim()) {
      this.error.set('Pantry item name is required.');
      return;
    }

    const request: PantryItemRequest = {
      itemName: form.itemName.trim(),
      category: form.category.trim() || 'Grocery',
      quantity: this.optionalNumber(form.quantity),
      unit: form.unit.trim() || null,
      location: form.location.trim() || null,
      expirationDate: form.expirationDate || null,
      isInStock: form.isInStock,
      notes: form.notes.trim() || null
    };
    this.saving.set(true);
    this.error.set(null);
    const save = form.id ? this.service.updatePantryItem(form.id, request) : this.service.createPantryItem(request);
    save.subscribe({
      next: item => {
        this.message.set(`${item.itemName} pantry item saved.`);
        this.pantryForm.set(this.emptyPantryForm());
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save pantry item.'),
      complete: () => this.saving.set(false)
    });
  }

  deletePantryItem(item: PantryItem): void {
    if (!confirm(`Delete pantry item "${item.itemName}"?`)) {
      return;
    }

    this.updatingId.set(item.id);
    this.error.set(null);
    this.service.deletePantryItem(item.id).subscribe({
      next: () => {
        this.message.set(`${item.itemName} pantry item deleted.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete pantry item.'),
      complete: () => this.updatingId.set(null)
    });
  }

  resetPantryForm(): void {
    this.pantryForm.set(this.emptyPantryForm());
  }

  stockPantryFromItem(item: ShoppingListItem): void {
    const existing = this.pantryMatches(item)[0] ?? null;
    const request = this.pantryRequestFromShoppingItem(item, existing);

    this.updatingId.set(item.id);
    this.error.set(null);
    this.message.set(null);
    const save = existing
      ? this.service.updatePantryItem(existing.id, request)
      : this.service.createPantryItem(request);

    save.pipe(
      switchMap(saved => item.status === 'Purchased'
        ? [saved]
        : this.service.updateStatus(item.id, 'Purchased'))
    ).subscribe({
      next: () => {
        this.message.set(`${item.itemName} stocked in pantry${item.status === 'Purchased' ? '' : ' and marked purchased'}.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to stock pantry from shopping item.'),
      complete: () => this.updatingId.set(null)
    });
  }

  importRows(): void {
    const rows = this.validImportRows();
    if (rows.length === 0) {
      this.error.set('No valid shopping-list rows are ready to import.');
      return;
    }

    this.importing.set(true);
    this.error.set(null);
    this.message.set(null);
    forkJoin(rows.map(row => this.service.createItem(row))).subscribe({
      next: created => {
        this.message.set(`${created.length} shopping-list item${created.length === 1 ? '' : 's'} added.`);
        this.importText.set('');
        this.statusFilter.set('Needed');
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to import shopping-list rows.'),
      complete: () => this.importing.set(false)
    });
  }

  clearImport(): void {
    this.importText.set('');
    this.error.set(null);
  }

  clearCompleted(): void {
    const days = Math.max(0, Number(this.clearOlderThanDays()) || 0);
    if (!confirm(`Delete purchased and skipped shopping-list items completed ${days} or more days ago?`)) {
      return;
    }

    this.clearingCompleted.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.clearCompleted(days).subscribe({
      next: result => {
        this.message.set(`${result.deletedCount} completed shopping-list item${result.deletedCount === 1 ? '' : 's'} cleared.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to clear completed shopping-list items.'),
      complete: () => this.clearingCompleted.set(false)
    });
  }

  loadDuplicates(): void {
    this.loadingDuplicates.set(true);
    this.error.set(null);
    this.service.getDuplicates('Needed').subscribe({
      next: groups => this.duplicateGroups.set(groups),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to scan duplicate shopping-list items.'),
      complete: () => this.loadingDuplicates.set(false)
    });
  }

  mergeDuplicates(): void {
    if (this.duplicateGroups().length === 0) {
      this.error.set('Scan for duplicates before merging.');
      return;
    }

    if (!confirm(`Merge ${this.duplicateGroups().length} duplicate shopping-list group${this.duplicateGroups().length === 1 ? '' : 's'}?`)) {
      return;
    }

    this.mergingDuplicates.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.mergeDuplicates().subscribe({
      next: result => {
        this.message.set(`Merged ${result.groupsMerged} group${result.groupsMerged === 1 ? '' : 's'} and removed ${result.itemsRemoved} duplicate item${result.itemsRemoved === 1 ? '' : 's'}.`);
        this.duplicateGroups.set([]);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to merge duplicate shopping-list items.'),
      complete: () => this.mergingDuplicates.set(false)
    });
  }

  loadHistorySummary(): void {
    this.loadingHistory.set(true);
    this.error.set(null);
    this.service.getHistorySummary(this.historyFrom() || undefined, this.historyTo() || undefined).subscribe({
      next: summary => this.historySummary.set(summary),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load shopping history summary.'),
      complete: () => this.loadingHistory.set(false)
    });
  }

  applyHistoryPreset(days: number | 'ytd' | 'all'): void {
    const today = new Date();
    if (days === 'all') {
      this.historyFrom.set('');
      this.historyTo.set('');
    } else if (days === 'ytd') {
      this.historyFrom.set(`${today.getFullYear()}-01-01`);
      this.historyTo.set(this.dateKey(today));
    } else {
      this.historyFrom.set(this.dateKey(this.addDays(today, -days)));
      this.historyTo.set(this.dateKey(today));
    }

    this.loadHistorySummary();
  }

  clearHistoryRange(): void {
    this.historyFrom.set('');
    this.historyTo.set('');
    this.historySummary.set(null);
  }

  exportHistory(format: 'csv' | 'xlsx'): void {
    this.exportingHistory.set(true);
    this.error.set(null);
    this.service.exportHistory(format, this.historyFrom() || undefined, this.historyTo() || undefined).subscribe({
      next: response => {
        const blob = response.body;
        if (!blob) {
          this.error.set('Shopping history export was empty.');
          return;
        }

        this.downloadBlob(blob, `shopping-history-${this.historyFileSuffix()}.${format}`);
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to export shopping history.'),
      complete: () => this.exportingHistory.set(false)
    });
  }

  exportStoreRouteCsv(): void {
    this.downloadCsv(`shopping-store-routes-${this.fileSlug(this.routeScopeLabel())}.csv`, [
      ['Route Scope', this.routeScopeLabel(), '', '', '', '', '', '', '', ''],
      ['Exported At', new Date().toLocaleString(), '', '', '', '', '', '', '', ''],
      [],
      ['Section', 'Store', 'Aisle', 'Sort', 'Item', 'Category', 'Quantity', 'Unit', 'Status', 'Route Note'],
      ...this.neededItems().map(item => [
        'Needed',
        item.store,
        item.aisle,
        item.sortOrder,
        item.itemName,
        item.category,
        item.quantity,
        item.unit,
        item.status,
        this.routeStatusLabel(item)
      ]),
      ...this.defaults().map(item => [
        'Default',
        item.store,
        item.aisle,
        item.sortOrder,
        item.itemName,
        item.category,
        item.quantity,
        item.unit,
        item.isFrequent ? 'Frequent' : 'Saved',
        'Saved default route'
      ])
    ]);
  }

  printShoppingList(): void {
    this.shoppingMode.set(true);
    if (this.statusFilter() === 'All') {
      this.statusFilter.set('Needed');
      this.load();
    }
    setTimeout(() => window.print());
  }

  editItem(item: ShoppingListItem): void {
    this.form.set({
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit ?? '',
      store: item.store ?? '',
      aisle: item.aisle ?? '',
      sortOrder: item.sortOrder,
      notes: item.notes ?? ''
    });
    this.error.set(null);
    this.message.set(null);
    setTimeout(() => document.getElementById('shopping-list-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  markPurchased(item: ShoppingListItem): void {
    this.updateItemStatus(item, 'Purchased');
  }

  skipItem(item: ShoppingListItem): void {
    this.updateItemStatus(item, 'Skipped');
  }

  reopenItem(item: ShoppingListItem): void {
    this.updateItemStatus(item, 'Needed');
  }

  deleteItem(item: ShoppingListItem): void {
    if (!confirm(`Delete "${item.itemName}" from the shopping list?`)) {
      return;
    }

    this.updatingId.set(item.id);
    this.error.set(null);
    this.message.set(null);
    this.service.deleteItem(item.id).subscribe({
      next: () => {
        this.message.set(`${item.itemName} deleted.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete shopping-list item.'),
      complete: () => this.updatingId.set(null)
    });
  }

  sourceLabel(item: ShoppingListItem): string {
    if (!item.sourceArea && !item.sourceType) {
      return 'Manual';
    }

    return [item.sourceArea, item.sourceType].filter(Boolean).join(' / ');
  }

  quantityLabel(item: ShoppingListItem): string {
    if (item.quantity === null) {
      return '-';
    }

    return `${item.quantity}${item.unit ? ' ' + item.unit : ''}`;
  }

  storeLabel(item: ShoppingListItem): string {
    return [item.store, item.aisle].filter(Boolean).join(' / ') || '-';
  }

  routeStatusLabel(item: ShoppingListItem): string {
    if (item.store?.trim() && item.aisle?.trim() && item.sortOrder !== null) {
      return 'Routed';
    }

    const missing = [
      item.store?.trim() ? '' : 'store',
      item.aisle?.trim() ? '' : 'aisle',
      item.sortOrder !== null ? '' : 'sort'
    ].filter(Boolean);
    return `Missing ${missing.join(', ')}`;
  }

  routeStatusTone(item: ShoppingListItem): string {
    return this.routeStatusLabel(item) === 'Routed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : this.routingDefaultForItem(item)
        ? 'app-token-soft-surface app-token-text-primary'
        : 'border-amber-200 bg-amber-50 text-amber-800';
  }

  routingDefaultForItem(item: ShoppingListItem): ShoppingItemDefault | null {
    const itemName = this.inventoryKey(item.itemName);
    const category = this.inventoryKey(item.category);
    const unit = this.inventoryKey(item.unit);
    return this.defaults()
      .filter(defaultItem => this.inventoryKey(defaultItem.itemName) === itemName
        && this.inventoryKey(defaultItem.category) === category
        && (!unit || !this.inventoryKey(defaultItem.unit) || this.inventoryKey(defaultItem.unit) === unit)
        && (!!defaultItem.store?.trim() || !!defaultItem.aisle?.trim() || defaultItem.sortOrder !== null))
      .sort((left, right) => Number(right.isFrequent) - Number(left.isFrequent)
        || this.sortText(left.store).localeCompare(this.sortText(right.store), undefined, { numeric: true })
        || this.sortText(left.aisle).localeCompare(this.sortText(right.aisle), undefined, { numeric: true })
        || this.sortNumber(left.sortOrder) - this.sortNumber(right.sortOrder))
      [0] ?? null;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString();
  }

  monthLabel(value: string): string {
    const [year, month] = value.split('-').map(part => Number(part));
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }

  private buildHistoryRangeLabel(): string {
    if (!this.historyFrom() && !this.historyTo()) {
      return 'All time';
    }

    const from = this.historyFrom() || 'Start';
    const to = this.historyTo() || 'Today';
    return `${from} to ${to}`;
  }

  private historyFileSuffix(): string {
    return this.fileSlug(this.buildHistoryRangeLabel());
  }

  private fileSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'all-time';
  }

  private dateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDays(value: Date, days: number): Date {
    const copy = new Date(value);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  statusTone(item: ShoppingListItem): string {
    switch (item.status) {
      case 'Purchased':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'Skipped':
        return 'border-slate-200 bg-slate-50 text-slate-700';
      default:
        return 'border-amber-200 bg-amber-50 text-amber-800';
    }
  }

  pantryMatches(item: ShoppingListItem): PantryItem[] {
    const itemKey = this.inventoryKey(item.itemName);
    const categoryKey = this.inventoryKey(item.category);
    const unitKey = this.inventoryKey(item.unit);
    return this.pantryItems()
      .filter(pantry => this.inventoryKey(pantry.itemName) === itemKey
        && this.inventoryKey(pantry.category) === categoryKey
        && (!unitKey || !this.inventoryKey(pantry.unit) || this.inventoryKey(pantry.unit) === unitKey))
      .sort((left, right) => Number(right.isInStock) - Number(left.isInStock)
        || this.sortText(left.location).localeCompare(this.sortText(right.location)));
  }

  pantryStatusLabel(item: ShoppingListItem): string {
    const matches = this.pantryMatches(item);
    if (matches.length === 0) {
      return 'Not tracked';
    }

    const stocked = matches.find(match => match.isInStock);
    if (!stocked) {
      return 'Out in pantry';
    }

    const expiring = this.daysUntilExpiration(stocked);
    if (expiring !== null && expiring < 0) {
      return 'Expired on hand';
    }

    if (expiring !== null && expiring <= 14) {
      return 'Expiring on hand';
    }

    return 'On hand';
  }

  pantryStatusDetail(item: ShoppingListItem): string {
    const matches = this.pantryMatches(item);
    if (matches.length === 0) {
      return 'No matching pantry row';
    }

    const primary = matches.find(match => match.isInStock) ?? matches[0];
    const quantity = primary.quantity !== null ? `${primary.quantity}${primary.unit ? ' ' + primary.unit : ''}` : 'Qty not set';
    const location = primary.location ? ` / ${primary.location}` : '';
    const expiration = primary.expirationDate ? ` / expires ${this.formatDate(primary.expirationDate)}` : '';
    return `${quantity}${location}${expiration}`;
  }

  pantryStatusTone(item: ShoppingListItem): string {
    const label = this.pantryStatusLabel(item);
    return label === 'On hand'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : label === 'Expiring on hand'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : label === 'Expired on hand' || label === 'Out in pantry'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-slate-200 bg-slate-50 text-slate-600';
  }

  private updateItemStatus(item: ShoppingListItem, status: 'Needed' | 'Purchased' | 'Skipped'): void {
    this.updatingId.set(item.id);
    this.error.set(null);
    this.message.set(null);
    this.service.updateStatus(item.id, status).subscribe({
      next: updated => {
        this.message.set(`${updated.itemName} marked ${updated.status.toLowerCase()}.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to update shopping-list item.'),
      complete: () => this.updatingId.set(null)
    });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private downloadCsv(fileName: string, rows: (string | number | boolean | null | undefined)[][]): void {
    const csv = rows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\r\n');
    this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), fileName);
  }

  private csvCell(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private requestFromItem(item: ShoppingListItem): ShoppingListItemRequest {
    return {
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      store: item.store,
      aisle: item.aisle,
      sortOrder: item.sortOrder,
      sourceArea: item.sourceArea,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      reason: item.reason,
      notes: item.notes
    };
  }

  private buildStoreRouteRows(): StoreRouteRow[] {
    const rows = new Map<string, ShoppingListItem[]>();
    this.neededItems().forEach(item => {
      const store = item.store?.trim() || 'Store not set';
      rows.set(store, [...(rows.get(store) ?? []), item]);
    });

    return Array.from(rows.entries())
      .map(([store, items]) => {
        const aisleNames = this.uniqueValues(items.map(item => item.aisle || 'Aisle not set'));
        const missingAisleCount = items.filter(item => !item.aisle?.trim()).length;
        const missingSortCount = items.filter(item => item.sortOrder === null).length;
        return {
          store,
          itemCount: items.length,
          aisleCount: aisleNames.length,
          missingAisleCount,
          missingSortCount,
          routeLabel: aisleNames.slice(0, 4).join(' / ') + (aisleNames.length > 4 ? ` / +${aisleNames.length - 4}` : '')
        };
      })
      .sort((left, right) => left.store.localeCompare(right.store, undefined, { numeric: true }));
  }

  private pantryRequestFromShoppingItem(item: ShoppingListItem, existing: PantryItem | null): PantryItemRequest {
    const existingQuantity = existing?.quantity ?? null;
    const incomingQuantity = item.quantity ?? null;
    const quantity = existingQuantity !== null && incomingQuantity !== null
      ? existingQuantity + incomingQuantity
      : incomingQuantity ?? existingQuantity;
    const notes = [
      existing?.notes,
      item.notes,
      item.reason ? `Shopping reason: ${item.reason}` : null,
      `Stocked from shopping list ${new Date().toLocaleDateString()}`
    ].filter((value): value is string => !!value?.trim());

    return {
      itemName: item.itemName,
      category: item.category,
      quantity,
      unit: item.unit,
      location: existing?.location ?? item.store ?? item.aisle ?? null,
      expirationDate: existing?.expirationDate ?? null,
      isInStock: true,
      notes: Array.from(new Set(notes)).join(' | ') || null
    };
  }

  private pantryAttentionRow(item: PantryItem): PantryAttentionRow | null {
    if (!item.isInStock) {
      return {
        item,
        status: 'Out of stock',
        tone: 'border-rose-200 bg-rose-50 text-rose-800',
        detail: `${item.category}${item.location ? ' / ' + item.location : ''}`
      };
    }

    const days = this.daysUntilExpiration(item);
    if (days === null) {
      return null;
    }

    if (days < 0) {
      return {
        item,
        status: 'Expired',
        tone: 'border-rose-200 bg-rose-50 text-rose-800',
        detail: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
      };
    }

    if (days <= 14) {
      return {
        item,
        status: 'Expiring soon',
        tone: 'border-amber-200 bg-amber-50 text-amber-800',
        detail: days === 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`
      };
    }

    return null;
  }

  private pantryAttentionRank(status: string): number {
    return status === 'Expired'
      ? 0
      : status === 'Out of stock'
        ? 1
        : 2;
  }

  private daysUntilExpiration(item: PantryItem): number | null {
    if (!item.expirationDate) {
      return null;
    }

    const expiration = this.localDate(item.expirationDate.slice(0, 10));
    const today = this.localDate(new Date().toISOString().slice(0, 10));
    return Math.ceil((expiration.getTime() - today.getTime()) / 86400000);
  }

  private localDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number(part));
    return new Date(year, month - 1, day);
  }

  private inventoryKey(value: string | null): string {
    return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.filter(value => value.trim()).sort((left, right) => left.localeCompare(right))));
  }

  private emptyForm(): ShoppingListForm {
    return {
      id: null,
      itemName: '',
      category: 'Grocery',
      quantity: null,
      unit: '',
      store: '',
      aisle: '',
      sortOrder: null,
      notes: ''
    };
  }

  private emptyDefaultForm(): ShoppingDefaultForm {
    return {
      id: null,
      itemName: '',
      category: 'Grocery',
      quantity: null,
      unit: '',
      store: '',
      aisle: '',
      sortOrder: null,
      isFrequent: true,
      notes: ''
    };
  }

  private emptyPantryForm(): PantryForm {
    return {
      id: null,
      itemName: '',
      category: 'Grocery',
      quantity: null,
      unit: '',
      location: '',
      expirationDate: '',
      isInStock: true,
      notes: ''
    };
  }

  private defaultShoppingCategories(): string[] {
    return ['Grocery', 'Pet', 'Household', 'Garden', 'Canning', 'Medical', 'Other'];
  }

  private optionalNumber(value: number | null): number | null {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value);
  }

  private optionalInteger(value: number | null): number | null {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? null : Math.trunc(Number(value));
  }

  private parseImportRows(value: string): ShoppingListImportRow[] {
    const rows = this.parseDelimitedRows(value);
    if (rows.length === 0) {
      return [];
    }

    const header = this.headerMap(rows[0], ['item', 'item name', 'name', 'category', 'quantity', 'qty', 'unit', 'store', 'aisle', 'sort', 'sort order', 'sortorder', 'notes']);
    const dataRows = header ? rows.slice(1) : rows;

    return dataRows.map(row => {
      const itemName = header ? this.importValue(row, header, ['item', 'item name', 'name']) : row[0] ?? '';
      const category = header ? this.importValue(row, header, ['category']) : row[1] ?? '';
      const quantity = header ? this.importValue(row, header, ['quantity', 'qty']) : row[2] ?? '';
      const unit = header ? this.importValue(row, header, ['unit']) : row[3] ?? '';
      const store = header ? this.importValue(row, header, ['store']) : row[4] ?? '';
      const aisle = header ? this.importValue(row, header, ['aisle']) : row[5] ?? '';
      const sortOrder = header ? this.importValue(row, header, ['sort', 'sort order', 'sortorder']) : row[6] ?? '';
      const notes = header ? this.importValue(row, header, ['notes']) : row.slice(7).join(' ');
      const warnings: string[] = [];
      const parsedQuantity = quantity.trim() ? Number(quantity.trim()) : null;
      const parsedSortOrder = sortOrder.trim() ? Number(sortOrder.trim()) : null;

      if (!itemName.trim()) {
        warnings.push('Item is required.');
      }

      if (parsedQuantity !== null && (!Number.isFinite(parsedQuantity) || parsedQuantity < 0)) {
        warnings.push('Quantity must be a positive number.');
      }

      if (parsedSortOrder !== null && (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0)) {
        warnings.push('Sort order must be a positive whole number.');
      }

      return {
        itemName: itemName.trim(),
        category: category.trim() || 'Grocery',
        quantity: parsedQuantity !== null && Number.isFinite(parsedQuantity) ? parsedQuantity : null,
        unit: unit.trim() || null,
        store: store.trim() || null,
        aisle: aisle.trim() || null,
        sortOrder: parsedSortOrder !== null && Number.isFinite(parsedSortOrder) ? Math.trunc(parsedSortOrder) : null,
        sourceArea: null,
        sourceType: null,
        sourceId: null,
        reason: 'Bulk import',
        notes: notes.trim() || null,
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

  private compareShoppingItems(left: ShoppingListItem, right: ShoppingListItem): number {
    return this.sortText(left.store).localeCompare(this.sortText(right.store), undefined, { numeric: true })
      || this.sortText(left.aisle).localeCompare(this.sortText(right.aisle), undefined, { numeric: true })
      || this.sortNumber(left.sortOrder) - this.sortNumber(right.sortOrder)
      || left.category.localeCompare(right.category)
      || left.itemName.localeCompare(right.itemName);
  }

  private sortText(value: string | null): string {
    return value?.trim() || 'zzzz';
  }

  private sortNumber(value: number | null): number {
    return value ?? Number.MAX_SAFE_INTEGER;
  }
}
