export interface AlcoholItem {
  id: number;
  category: string;
  name: string;
  producer: string | null;
  style: string | null;
  type: string | null;
  variety: string | null;
  color: string | null;
  country: string | null;
  region: string | null;
  vintageOrYear: string | null;
  size: string | null;
  price: number | null;
  rating: number | null;
  quantityOnHand: number | null;
  location: string | null;
  statusID: string;
  notes: string | null;
  sourceSheet: string | null;
  sourceRowLabel: string | null;
}

export interface UpsertAlcoholItem {
  category: string;
  name: string;
  producer: string | null;
  style: string | null;
  type: string | null;
  variety: string | null;
  color: string | null;
  country: string | null;
  region: string | null;
  vintageOrYear: string | null;
  size: string | null;
  price: number | null;
  rating: number | null;
  quantityOnHand: number | null;
  location: string | null;
  statusID: string;
  notes: string | null;
  sourceSheet: string | null;
  sourceRowLabel: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
export interface AlcoholBreakdown {
  label: string;
  count: number;
  quantity: number;
  value: number | null;
}

export interface AlcoholReport {
  totalItems: number;
  totalQuantity: number;
  totalValue: number | null;
  ownedItems: number;
  wantedItems: number;
  unknownStatusItems: number;
  missingLocationItems: number;
  cleanupNeededItems: number;
  categoryBreakdown: AlcoholBreakdown[];
  typeBreakdown: AlcoholBreakdown[];
  styleBreakdown: AlcoholBreakdown[];
  countryBreakdown: AlcoholBreakdown[];
  regionBreakdown: AlcoholBreakdown[];
  locationBreakdown: AlcoholBreakdown[];
  statusBreakdown: AlcoholBreakdown[];
  priceReviewItems: AlcoholItem[];
  ratingReviewItems: AlcoholItem[];
  highValueItems: AlcoholItem[];
  topRatedItems: AlcoholItem[];
  vintageReviewItems: AlcoholItem[];
  wantedList: AlcoholItem[];
  cleanupItems: AlcoholItem[];
}

export interface AlcoholLookupCleanupSuggestion {
  field: string;
  currentValue: string;
  suggestedValue: string | null;
  count: number;
  reason: string;
}

export interface AlcoholLookupCleanup {
  totalSuggestions: number;
  suggestions: AlcoholLookupCleanupSuggestion[];
}

export interface AlcoholImportDuplicateKey {
  key: string;
  count: number;
  category: string;
  name: string;
  producer: string | null;
  vintageOrYear: string | null;
  size: string | null;
}

export interface ApplyAlcoholLookupCleanup {
  field: string;
  currentValue: string;
  suggestedValue: string | null;
}

export interface ApplyAlcoholLookupCleanupResult {
  field: string;
  currentValue: string;
  suggestedValue: string | null;
  updatedRows: number;
  removedRows: number;
}

export interface MergeAlcoholLookup {
  field: string;
  sourceValue: string;
  targetValue: string | null;
}

export interface MergeAlcoholLookupResult {
  field: string;
  sourceValue: string;
  targetValue: string | null;
  updatedRows: number;
  removedRows: number;
}

export interface AlcoholProductDuplicateMember {
  productId: number;
  inventoryRows: number;
  quantity: number;
  locations: string | null;
  price: number | null;
  rating: number | null;
  notes: string | null;
  sourceSheet: string | null;
  sourceRowLabel: string | null;
}

export interface AlcoholProductDuplicateCluster {
  product: string;
  category: string;
  producer: string | null;
  style: string | null;
  type: string | null;
  variety: string | null;
  color: string | null;
  country: string | null;
  region: string | null;
  vintageOrYear: string | null;
  size: string | null;
  productRows: number;
  inventoryRows: number;
  quantity: number;
  members: AlcoholProductDuplicateMember[];
}

export interface AlcoholProductDuplicateReport {
  totalClusters: number;
  totalProductRows: number;
  clusters: AlcoholProductDuplicateCluster[];
}

export interface MergeAlcoholProductDuplicates {
  targetProductId: number;
  productIds: number[];
}

export interface MergeAlcoholProductDuplicatesResult {
  targetProductId: number;
  mergedProductRows: number;
  movedInventoryRows: number;
  movedRatingRows: number;
  movedValueRows: number;
}
