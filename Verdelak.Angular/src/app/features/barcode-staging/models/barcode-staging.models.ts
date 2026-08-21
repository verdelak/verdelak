export type BarcodeItemType = 'Unknown' | 'CD' | 'Book' | 'DVD' | 'Other';
export type BarcodeStageStatus = 'New' | 'Duplicate' | 'LookupPending' | 'Matched' | 'NeedsReview' | 'Approved' | 'Rejected' | 'Imported';

export interface BarcodeStagingItem {
  id: number;
  upc: string;
  normalizedCode: string;
  codeType: string;
  source: string;
  batchName?: string | null;
  itemType: BarcodeItemType | string;
  status: BarcodeStageStatus | string;
  suggestedTitle?: string | null;
  suggestedCreator?: string | null;
  suggestedFormat?: string | null;
  suggestedYear?: string | null;
  lookupProvider?: string | null;
  confidence?: number | null;
  notes?: string | null;
  importedEntityType?: string | null;
  importedEntityId?: number | null;
  importedAtUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface BarcodeStagingCreateRequest {
  batchName?: string | null;
  source?: string | null;
  upcs: string[];
}

export interface BarcodeStagingUpdateRequest {
  itemType: string;
  status: string;
  suggestedTitle?: string | null;
  suggestedCreator?: string | null;
  suggestedFormat?: string | null;
  suggestedYear?: string | null;
  lookupProvider?: string | null;
  confidence?: number | null;
  notes?: string | null;
}

export interface BarcodeStagingBatchUpdateRequest {
  ids: number[];
  itemType?: string | null;
  status?: string | null;
  notes?: string | null;
}

export interface BarcodeStagingBatchLookupRequest {
  ids: number[];
  batchName?: string | null;
  source?: string | null;
  provider: 'Auto' | 'OpenLibrary' | 'GoogleBooks' | 'Crossref' | 'MusicBrainz' | string;
  retryMissingOnly?: boolean;
  fallbackProvidersOnly?: boolean;
}

export interface BarcodeStagingBatchResult {
  requestedCount: number;
  updatedCount: number;
  lookupAttemptedCount: number;
  matchedCount: number;
  needsReviewCount: number;
  messages: string[];
}

export interface BarcodeStagingDuplicateGroup {
  normalizedCode: string;
  codeType: string;
  count: number;
  items: BarcodeStagingItem[];
}

export interface BarcodeStagingCleanupRequest {
  olderThanDays: number;
  statuses: string[];
  batchName?: string | null;
  source?: string | null;
}

export interface BarcodeStagingCleanupResult {
  matchedCount: number;
  deletedCount: number;
  cutoffUtc: string;
  items: BarcodeStagingItem[];
}

export interface BarcodeImportValidationRequest {
  ids: number[];
  batchName?: string | null;
}

export interface BarcodeImportCommitRequest {
  ids: number[];
  batchName?: string | null;
}

export interface BarcodeImportValidationRow {
  item: BarcodeStagingItem;
  canImport: boolean;
  severity: 'Ready' | 'Warning' | 'Blocked' | string;
  messages: string[];
}

export interface BarcodeImportValidationPreview {
  totalCount: number;
  readyCount: number;
  warningCount: number;
  blockedCount: number;
  rows: BarcodeImportValidationRow[];
}

export interface BarcodeImportCommitResult {
  requestedCount: number;
  importedCount: number;
  skippedCount: number;
  messages: string[];
}

export interface BarcodeBatchReport {
  batchName: string;
  source: string;
  totalCount: number;
  newCount: number;
  matchedCount: number;
  needsReviewCount: number;
  approvedCount: number;
  importedCount: number;
  rejectedCount: number;
  readyToImportCount: number;
  duplicateCodeCount: number;
  bookCount: number;
  cdCount: number;
  dvdCount: number;
  otherTypeCount: number;
  importedBookCount: number;
  importedCdCount: number;
  importedDvdCount: number;
  importedOtherTypeCount: number;
  candidateCount: number;
  selectedCandidateCount: number;
  noCandidateCount: number;
  lowConfidenceCount: number;
  providerMatchSummary: string;
  providerFailureSummary: string;
  selectedProviderSummary: string;
  firstStagedAtUtc: string;
  lastUpdatedAtUtc: string;
  lastImportedAtUtc?: string | null;
}

export interface BarcodeImportHistoryRow {
  id: number;
  upc: string;
  normalizedCode: string;
  codeType: string;
  source: string;
  batchName?: string | null;
  itemType: BarcodeItemType | string;
  status: BarcodeStageStatus | string;
  suggestedTitle?: string | null;
  suggestedCreator?: string | null;
  suggestedFormat?: string | null;
  suggestedYear?: string | null;
  lookupProvider?: string | null;
  confidence?: number | null;
  importedEntityType?: string | null;
  importedEntityId?: number | null;
  importedAtUtc: string;
  createdAtUtc: string;
}

export interface BarcodeImportHistoryFilters {
  batchName?: string | null;
  source?: string | null;
  itemType?: string | null;
  importedEntityType?: string | null;
  fromUtc?: string | null;
  toUtc?: string | null;
  take?: number | null;
}
export interface BarcodeLookupCandidate {
  id: number;
  barcodeStagingItemId: number;
  provider: string;
  externalId?: string | null;
  title?: string | null;
  creator?: string | null;
  publisher?: string | null;
  publishDate?: string | null;
  format?: string | null;
  coverImageUrl?: string | null;
  confidence?: number | null;
  selected: boolean;
  createdAtUtc: string;
}





