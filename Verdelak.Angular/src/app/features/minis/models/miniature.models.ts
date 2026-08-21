export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface MiniLookup {
  id: number;
  name: string;
}

export interface MiniatureItem {
  id: number;
  name: string;
  number: string | null;
  companyId: number | null;
  company: string | null;
  systemId: number | null;
  system: string | null;
  seriesId: number | null;
  series: string | null;
  subset: string | null;
  rarity: string | null;
  size: string | null;
  type: string | null;
  ownedQuantity: number;
  isWanted: boolean;
  wantedQuantity: number;
  latestValue: number | null;
}

export interface UpsertMiniatureItem {
  name: string;
  number: string | null;
  seriesId: number | null;
  seriesName: string | null;
  systemId: number | null;
  systemName: string | null;
  companyId: number | null;
  companyName: string | null;
  subset: string | null;
  rarity: string | null;
  size: string | null;
  type: string | null;
  ownedQuantity: number;
  isWanted: boolean;
  wantedQuantity: number;
}
