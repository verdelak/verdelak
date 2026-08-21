export interface ToyLookup {
  id: number;
  name: string;
}

export interface ToyFigure {
  id: number;
  name: string;
  qty: number;
  lineId: number;
  line: string;
  seriesId: number | null;
  series: string | null;
  companyId: number | null;
  company: string | null;
  inBox: boolean;
  statusID: 'H' | 'W';
}

export interface UpsertToyFigure {
  name: string;
  qty: number | null;
  lineId: number | null;
  lineName: string | null;
  companyId: number | null;
  companyName: string | null;
  seriesId: number | null;
  seriesName: string | null;
  inBox: boolean;
  statusID: 'H' | 'W';
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
