export interface MagazineLookup {
  id: number;
  name: string;
}

export interface MagazineIssue {
  id: number;
  number: number | null;
  month: number | null;
  year: number | null;
  season: string | null;
  title: string | null;
  special: boolean;
  alternate: boolean;
  statusID: 'H' | 'W';
  info: string | null;
  seriesId: number;
  series: string;
  coverID: string | null;
  displayLabel: string;
}

export interface UpsertMagazineIssue {
  number: number | null;
  month: number | null;
  year: number | null;
  season: string | null;
  title: string | null;
  special: boolean;
  alternate: boolean;
  statusID: 'H' | 'W';
  info: string | null;
  seriesId: number | null;
  seriesName: string | null;
  coverID: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
