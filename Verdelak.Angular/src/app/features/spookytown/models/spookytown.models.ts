export interface SpookytownItem {
  id: number;
  name: string;
  sku?: string | null;
  year?: number | null;
  retired?: boolean | null;
  url?: string | null;
  qty?: number | null;
  typeId?: string | null;
  typeName?: string | null;
  own: boolean;
  want: boolean;
}
export interface UpsertSpookytown {
  name: string;
  sku?: string | null;
  year?: number | null;
  retired?: boolean | null;
  url?: string | null;
  qty?: number | null;
  typeId?: string | null;
  own: boolean;
  want: boolean;
}
export interface SpookytownType { id: string; type: string; }
export interface PagedResult<T> { items: T[]; total: number; }
