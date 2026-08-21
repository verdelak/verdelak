export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface ComicSeries {
  id: number;
  title: string;
  notes: string | null;
}

export interface ComicValue {
  id: number;
  storedID: number;
  price: number;
}

export interface ComicIssue {
  id: number;
  seriesId: number;
  series: string;
  issueNumber: number | null;
  isSpecial: boolean;
  name: string | null;
  issueMonth: number | null;
  issueYear: string | null;
  isGraphicNovel: boolean;
  isVariant: boolean;
  notes: string | null;
  statusID: 'H' | 'W';
  rating: number | null;
  values: ComicValue[];
  displayLabel: string;
}

export interface ComicWantListItem {
  seriesId: number;
  series: string;
  seriesNotes: string | null;
  issueId: number | null;
  issueNumber: number | null;
  issueMonth: string | null;
  issueYear: string | null;
  name: string | null;
  isSpecial: boolean;
  isGraphicNovel: boolean;
  isVariant: boolean;
  notes: string | null;
  rating: number | null;
  displayLabel: string;
}


export interface ComicSeriesReport {
  seriesId: number;
  series: string;
  notes: string | null;
  issueCount: number;
  ownedIssueCount: number;
  wantedIssueCount: number;
  specialCount: number;
  graphicNovelCount: number;
  variantCount: number;
  totalValue: number;
}
export interface UpsertComicSeries {
  title: string | null;
  notes: string | null;
}

export interface UpsertComicIssue {
  seriesId: number | null;
  seriesTitle: string | null;
  issueNumber: number | null;
  isSpecial: boolean;
  name: string | null;
  issueMonth: number | null;
  issueYear: string | null;
  isGraphicNovel: boolean;
  isVariant: boolean;
  notes: string | null;
  statusID: 'H' | 'W';
  rating: number | null;
  storedID: number | null;
  price: number | null;
}

