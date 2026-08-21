export type BookFormat = 'Hardcover' | 'Softcover' | 'Audio Book';
export type BookWantStatus = 'H' | 'W';

export interface BookLookup {
  id: number;
  name: string;
}

export interface BookListItem {
  id: number;
  title: string;
  author: string;
  series?: string | null;
  subSeries?: string | null;
  seriesNumber?: number | null;
  format: BookFormat;
  wantStatusID: BookWantStatus;
}

export interface BookSaveRequest {
  title: string;
  authorID?: number | null;
  authorFirstName?: string | null;
  authorMiddle?: string | null;
  authorLastName?: string | null;
  seriesID?: number | null;
  seriesName?: string | null;
  subSeriesID?: number | null;
  subSeriesName?: string | null;
  seriesNumber?: number | null;
  formatID?: number | null;
  format?: BookFormat | null;
  wantStatusID: BookWantStatus;
}
