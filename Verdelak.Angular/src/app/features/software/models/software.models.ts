export interface SoftwareLookup {
  id: number;
  name: string;
}

export interface SoftwareItem {
  id: number;
  title: string;
  statusID: 'H' | 'W' | 'Unknown';
  platformId: number;
  platform: string;
  locationId: number | null;
  location: string | null;
  publisher: string | null;
  developer: string | null;
  versionEdition: string | null;
  mediaType: string | null;
  serialLicenseKeyNotes: string | null;
  hasBox: boolean;
  hasManual: boolean;
  hasDisc: boolean;
  notes: string | null;
}

export interface UpsertSoftwareItem {
  title: string;
  statusID: 'H' | 'W';
  platformId: number | null;
  locationId: number | null;
  publisher: string | null;
  developer: string | null;
  versionEdition: string | null;
  mediaType: string | null;
  serialLicenseKeyNotes: string | null;
  hasBox: boolean;
  hasManual: boolean;
  hasDisc: boolean;
  notes: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface SoftwareReportSummary {
  ownedCount: number;
  wantedCount: number;
  unknownStatusCount: number;
  byPlatform: SoftwareReportBucket[];
  byLocation: SoftwareReportBucket[];
}

export interface SoftwareReportBucket {
  id: number | null;
  name: string;
  ownedCount: number;
  wantedCount: number;
  unknownStatusCount: number;
}

export interface SoftwareBulkImportRequest {
  text: string;
  defaultPlatformId: number | null;
  defaultLocationId: number | null;
  defaultStatusID: 'H' | 'W';
  hasHeader: boolean;
  rowDecisions: SoftwareBulkImportRowDecision[];
}

export interface SoftwareBulkImportPreview {
  totalRows: number;
  readyCount: number;
  skipCount: number;
  errorCount: number;
  rows: SoftwareBulkImportPreviewRow[];
}

export interface SoftwareBulkImportPreviewRow {
  rowNumber: number;
  rawText: string;
  title: string | null;
  statusID: 'H' | 'W';
  platformId: number | null;
  platform: string | null;
  locationId: number | null;
  location: string | null;
  action: SoftwareBulkImportAction;
  existingId: number | null;
  matches: SoftwareBulkImportMatch[];
  messages: string[];
}

export interface SoftwareBulkImportCommitResult {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  rows: SoftwareBulkImportPreviewRow[];
}

export type SoftwareBulkImportAction = 'Create' | 'Skip' | 'Update' | 'Error';

export interface SoftwareBulkImportMatch {
  id: number;
  title: string;
  statusID: 'H' | 'W' | 'Unknown';
  platformId: number;
  platform: string;
  locationId: number | null;
  location: string | null;
  matchType: string;
}

export interface SoftwareBulkImportRowDecision {
  rowNumber: number;
  action: Exclude<SoftwareBulkImportAction, 'Error'>;
  existingId: number | null;
}

