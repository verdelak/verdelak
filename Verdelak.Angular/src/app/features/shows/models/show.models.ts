export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface ShowSeriesSummary {
  id: number;
  title: string;
  sortTitle: string | null;
  notes: string | null;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  ownedSeasonCount: number;
  wantedSeasonCount: number;
  watchedSeasonCount: number;
  seasonCount: number;
  legacyShowsToWatchId: number | null;
}

export interface ShowSeason {
  id: number;
  showSeriesId: number;
  seasonNumber: number | null;
  seasonLabel: string;
  statusID: 'H' | 'W';
  format: string | null;
  isOwnedByBoxSet: boolean;
  ownedBoxSetNames: string[];
  isWatched: boolean;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  lastWatchedDate: string | null;
  notes: string | null;
}

export interface ShowOwnershipGap {
  seasonId: number;
  seasonLabel: string;
  isDirectlyOwned: boolean;
  isOwnedByBoxSet: boolean;
  isWanted: boolean;
  format: string | null;
  ownedBoxSetNames: string[];
}

export interface ShowBoxSet {
  id: number;
  showSeriesId: number;
  name: string;
  statusID: 'H' | 'W';
  format: string | null;
  isCompleteSeries: boolean;
  notes: string | null;
  seasonIds: number[];
  seasonLabels: string[];
}

export interface ShowSeriesDetail {
  id: number;
  title: string;
  sortTitle: string | null;
  notes: string | null;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  legacyShowsToWatchId: number | null;
  seasons: ShowSeason[];
  boxSets: ShowBoxSet[];
  ownershipGaps: ShowOwnershipGap[];
}

export interface UpsertShowSeries {
  title: string;
  sortTitle: string | null;
  notes: string | null;
  wantToWatch: boolean;
  wantToRewatch: boolean;
}

export interface UpsertShowSeason {
  seasonNumber: number | null;
  seasonLabel: string | null;
  statusID: 'H' | 'W';
  format: string | null;
  isWatched: boolean;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  lastWatchedDate: string | null;
  notes: string | null;
}

export interface BulkAddShowSeasons {
  startSeason: number;
  endSeason: number;
  statusID: 'H' | 'W';
  format: string | null;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  notes: string | null;
}

export interface UpsertShowBoxSet {
  name: string;
  statusID: 'H' | 'W';
  format: string | null;
  isCompleteSeries: boolean;
  seasonIds: number[];
  startSeason: number | null;
  endSeason: number | null;
  notes: string | null;
}

export interface CreateShowGoalItems {
  year: number;
  seasonIds: number[];
  planningWindowType: string | null;
  targetStartDate: string | null;
  targetEndDate: string | null;
  scheduleSurfaceMode: string | null;
}

export interface CreateShowGoalItemsResult {
  planId: number;
  year: number;
  createdCount: number;
  skippedDuplicateCount: number;
  sectionTitle: string;
}

export interface ShowSeasonReport {
  seriesId: number;
  seriesTitle: string;
  seasonId: number | null;
  seasonNumber: number | null;
  seasonLabel: string;
  statusID: 'H' | 'W' | null;
  format: string | null;
  isDirectlyOwned: boolean;
  isOwnedByBoxSet: boolean;
  isWanted: boolean;
  isMissing: boolean;
  isWatched: boolean;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  ownedBoxSetNames: string[];
  scheduledGoalYears: number[];
}

export interface ShowReportSummary {
  wantedSeasonCount: number;
  missingSeasonCount: number;
  noSeasonDetailCount: number;
  watchCandidateCount: number;
  rewatchCandidateCount: number;
  scheduledGoalSeasonCount: number;
}

