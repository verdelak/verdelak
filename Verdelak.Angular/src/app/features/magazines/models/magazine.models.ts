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

export interface MagazineBreakdown {
  label: string;
  count: number;
}

export interface MagazineMissingRange {
  seriesId: number;
  series: string;
  startNumber: number;
  endNumber: number;
  count: number;
}

export interface MagazineDuplicateNumber {
  seriesId: number;
  series: string;
  number: number;
  count: number;
}

export interface MagazineReport {
  totalIssues: number;
  ownedIssues: number;
  wantedIssues: number;
  missingNumberIssues: number;
  missingDateIssues: number;
  specialIssues: number;
  alternateIssues: number;
  seriesBreakdown: MagazineBreakdown[];
  yearBreakdown: MagazineBreakdown[];
  missingRanges: MagazineMissingRange[];
  duplicateNumbers: MagazineDuplicateNumber[];
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
