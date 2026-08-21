export interface ChessexLookup {
  id: number;
  name: string;
}

export interface ChessexSet {
  id: number;
  name: string;
  productCode: string | null;
  categoryId: number;
  category: string;
  setTypeId: number;
  setType: string;
  diceCount: number | null;
  color: string | null;
  notes: string | null;
  wantStatusID: 'H' | 'W';
  qty: number;
}

export interface UpsertChessexSet {
  name: string;
  productCode: string | null;
  categoryId: number | null;
  categoryName: string | null;
  setTypeId: number | null;
  setTypeName: string | null;
  diceCount: number | null;
  color: string | null;
  notes: string | null;
  wantStatusID: 'H' | 'W';
  qty: number | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
