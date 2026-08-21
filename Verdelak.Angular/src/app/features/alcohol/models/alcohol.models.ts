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
  locationBreakdown: AlcoholBreakdown[];
  statusBreakdown: AlcoholBreakdown[];
  wantedList: AlcoholItem[];
  cleanupItems: AlcoholItem[];
}
