export interface ShoppingListItem {
  id: number;
  itemName: string;
  category: string;
  status: string;
  quantity: number | null;
  unit: string | null;
  store: string | null;
  aisle: string | null;
  sortOrder: number | null;
  sourceArea: string | null;
  sourceType: string | null;
  sourceId: number | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ShoppingListItemRequest {
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  store?: string | null;
  aisle?: string | null;
  sortOrder?: number | null;
  sourceArea: string | null;
  sourceType: string | null;
  sourceId: number | null;
  reason: string | null;
  notes: string | null;
}

export interface ShoppingListGroup {
  category: string;
  items: ShoppingListItem[];
}

export interface ShoppingListDuplicateGroup {
  key: string;
  itemName: string;
  category: string;
  unit: string | null;
  store: string | null;
  aisle: string | null;
  count: number;
  totalQuantity: number | null;
  items: ShoppingListItem[];
}

export interface ShoppingListMergeResult {
  groupsMerged: number;
  itemsUpdated: number;
  itemsRemoved: number;
}

export interface ShoppingListHistorySummary {
  months: ShoppingListHistoryMonth[];
  bySource: ShoppingListHistoryBucket[];
  byCategory: ShoppingListHistoryBucket[];
}

export interface ShoppingListHistoryMonth {
  month: string;
  purchasedCount: number;
  skippedCount: number;
}

export interface ShoppingListHistoryBucket {
  name: string;
  purchasedCount: number;
  skippedCount: number;
}

export interface ShoppingItemDefault {
  id: number;
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  store: string | null;
  aisle: string | null;
  sortOrder: number | null;
  isFrequent: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItemDefaultRequest {
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  store: string | null;
  aisle: string | null;
  sortOrder: number | null;
  isFrequent: boolean;
  notes: string | null;
}

export interface PantryItem {
  id: number;
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  expirationDate: string | null;
  isInStock: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PantryItemRequest {
  itemName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  expirationDate: string | null;
  isInStock: boolean;
  notes: string | null;
}
