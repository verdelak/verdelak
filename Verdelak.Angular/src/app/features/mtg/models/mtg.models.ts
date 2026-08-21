export interface MtgLookup {
  id: string;
  name: string;
}

export interface MtgCollectionItem {
  id: number;
  cardId: number;
  name: string;
  manaCost: string | null;
  colors: string | null;
  colorIdentity: string | null;
  typeLine: string | null;
  oracleText: string | null;
  printingId: number;
  setCode: string;
  setName: string | null;
  collectorNumber: string;
  rarity: string | null;
  artist: string | null;
  imageUrl: string | null;
  scryfallId: string | null;
  finishes: string | null;
  quantity: number;
  foilQuantity: number;
  wantStatusID: 'H' | 'W';
  condition: string | null;
  language: string | null;
  location: string | null;
  notes: string | null;
  estimatedValue: number | null;
}

export interface MtgReportBucket {
  name: string;
  rowCount: number;
  ownedCount: number;
  wantedCount: number;
  copies: number;
  foilCopies: number;
  estimatedValue: number;
  missingImageCount: number;
}

export interface MtgCleanupBucket {
  key: string;
  label: string;
  count: number;
  detail: string;
  tone: 'red' | 'amber' | 'slate';
}

export interface MtgDuplicateCluster {
  key: string;
  label: string;
  name: string;
  setCode: string;
  collectorNumber: string;
  wantStatusID: 'H' | 'W';
  condition: string | null;
  language: string | null;
  location: string | null;
  rowCount: number;
  copies: number;
  locations: string;
}

export interface MtgCollectionReport {
  totalRows: number;
  totalCopies: number;
  totalFoilCopies: number;
  wantedRows: number;
  estimatedValue: number;
  missingImageRows: number;
  missingScryfallRows: number;
  weakPrintingRows: number;
  missingIdentityRows: number;
  zeroCopyOwnedRows: number;
  missingLocationRows: number;
  cleanupIssueRows: number;
  duplicateClusterCount: number;
  setBreakdown: MtgReportBucket[];
  colorBreakdown: MtgReportBucket[];
  rarityBreakdown: MtgReportBucket[];
  locationBreakdown: MtgReportBucket[];
  cleanupBuckets: MtgCleanupBucket[];
  duplicateClusters: MtgDuplicateCluster[];
}

export interface UpsertMtgCollectionItem {
  cardId: number | null;
  name: string;
  manaCost: string | null;
  colors: string | null;
  colorIdentity: string | null;
  typeLine: string | null;
  oracleText: string | null;
  printingId: number | null;
  setCode: string | null;
  setName: string | null;
  collectorNumber: string | null;
  rarity: string | null;
  artist: string | null;
  imageUrl: string | null;
  scryfallId: string | null;
  finishes: string | null;
  quantity: number | null;
  foilQuantity: number | null;
  wantStatusID: 'H' | 'W';
  condition: string | null;
  language: string | null;
  location: string | null;
  notes: string | null;
  estimatedValue: number | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
