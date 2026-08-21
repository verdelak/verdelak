export interface ExternalImportBatch {
  id: number;
  source: string;
  targetArea: string;
  batchName: string;
  status: string;
  notes?: string | null;
  itemCount: number;
  importableCount: number;
  importedCount: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface ExternalImportStagingItem {
  id: number;
  batchId: number;
  source: string;
  targetArea: string;
  externalId?: string | null;
  title: string;
  platformName?: string | null;
  locationName?: string | null;
  publisher?: string | null;
  developer?: string | null;
  versionEdition?: string | null;
  mediaType?: string | null;
  artworkUrl?: string | null;
  status: string;
  matchStatus: string;
  selectedAction: string;
  matchedEntityType?: string | null;
  matchedEntityId?: number | null;
  matchedTitle?: string | null;
  notes?: string | null;
  importedEntityType?: string | null;
  importedEntityId?: number | null;
  importedAtUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface ExternalImportStageBatchRequest {
  source: string;
  targetArea: string;
  batchName?: string | null;
  notes?: string | null;
  items: ExternalImportStageItemRequest[];
}

export interface ExternalImportStageItemRequest {
  externalId?: string | null;
  title: string;
  platformName?: string | null;
  locationName?: string | null;
  publisher?: string | null;
  developer?: string | null;
  versionEdition?: string | null;
  mediaType?: string | null;
  artworkUrl?: string | null;
  notes?: string | null;
  rawJson?: string | null;
}

export interface ExternalImportUpdateItemRequest {
  platformName?: string | null;
  locationName?: string | null;
  publisher?: string | null;
  developer?: string | null;
  versionEdition?: string | null;
  mediaType?: string | null;
  selectedAction?: string | null;
  notes?: string | null;
}

export interface ExternalImportPreviewResult {
  totalCount: number;
  newCount: number;
  possibleDuplicateCount: number;
  alreadyImportedCount: number;
  missingPlatformCount: number;
  items: ExternalImportStagingItem[];
}

export interface ExternalImportCommitRequest {
  ids: number[];
  batchId?: number | null;
  importOnlySelected: boolean;
}

export interface ExternalImportCommitResult {
  importedCount: number;
  skippedCount: number;
  messages: string[];
}

export interface SteamImportStageRequest {
  batchName?: string | null;
  includePlayedFreeGames: boolean;
}

export interface SteamImportStageResult {
  batchId: number;
  batchName: string;
  stagedCount: number;
  items: ExternalImportStagingItem[];
}

export interface BoardGameGeekImportStageRequest {
  batchName?: string | null;
  username?: string | null;
  includeOwned: boolean;
  includeWishlist: boolean;
  includeExpansions: boolean;
}

export interface BoardGameGeekImportStageResult {
  batchId: number;
  batchName: string;
  importedFromProviderCount: number;
  items: ExternalImportStagingItem[];
}
