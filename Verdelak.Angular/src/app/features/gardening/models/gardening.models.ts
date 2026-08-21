export interface GardenSeed {
  id: number;
  name: string;
  description: string | null;
  plantDate: string | null;
  indoor: boolean;
  secondPlantDate: string | null;
  notes: string | null;
  inventory: GardenSeedInventory | null;
}

export interface GardenSeedInventory {
  seedId: number;
  qty: number;
  reorder: boolean;
}

export interface GardenSeedUpsert {
  name: string;
  description: string | null;
  plantDate: string | null;
  indoor: boolean;
  secondPlantDate: string | null;
  notes: string | null;
}

export interface GardenSeedInventoryUpsert {
  qty: number;
  reorder: boolean;
}

export interface GardenSeedTray {
  id: number;
  trayName: string;
  dimensions: GardenSeedTrayDimension | null;
}

export interface GardenSeedTrayDimension {
  id: number;
  trayId: number;
  slotsWide: number;
  slotsDeep: number;
}

export interface GardenSeedTrayPlant {
  id: number;
  trayId: number;
  traySlotId: number;
  seedId: number;
  seedName: string | null;
  year: number;
  plantDate: string;
  success: boolean;
  planning: boolean;
}

export interface GardenSeedTrayPlantUpsert {
  trayId: number;
  traySlotId: number;
  seedId: number;
  year: number;
  plantDate: string;
  success: boolean;
  planning: boolean;
}

export interface GardenPlot {
  id: number;
  gardenName: string;
  description: string | null;
  dimensions: GardenPlotDimension | null;
}

export interface GardenPlotUpsert {
  gardenName: string;
  description: string | null;
}

export interface GardenPlotDimension {
  id: number;
  traySlotsWide: number;
  slotsDeep: number;
  notes: string | null;
}

export interface GardenPlotDimensionUpsert {
  traySlotsWide: number;
  slotsDeep: number;
  notes: string | null;
}

export interface GardenPlotPlant {
  id: number;
  gardenPlotId: number;
  traySlotId: number;
  seedId: number;
  seedName: string | null;
  year: number;
  plantDate: string | null;
  success: boolean;
  qty: number | null;
  planning: boolean;
}

export interface GardenPlotPlantUpsert {
  gardenPlotId: number;
  traySlotId: number;
  seedId: number;
  year: number;
  plantDate: string | null;
  success: boolean;
  qty: number | null;
  planning: boolean;
}

export interface GardenNote {
  id: number;
  gardenPlotId: number;
  note: string | null;
  date: string;
  year: number | null;
}

export interface GardenNoteUpsert {
  gardenPlotId: number;
  note: string | null;
  date: string;
  year: number | null;
}
export interface GardenHarvest {
  id: number;
  gardenPlotId: number;
  gardenPlotName: string | null;
  seedId: number;
  seedName: string | null;
  harvestDate: string;
  year: number | null;
  quantity: number | null;
  notes: string | null;
}

export interface GardenHarvestUpsert {
  gardenPlotId: number;
  seedId: number;
  harvestDate: string;
  year: number | null;
  quantity: number | null;
  notes: string | null;
}

export interface GardenHarvestReport {
  year: number | null;
  totalCount: number;
  totalQuantity: number;
  monthlySummaries: GardenHarvestMonthlySummary[];
  cropSummaries: GardenHarvestCropSummary[];
  areaSummaries: GardenHarvestAreaSummary[];
  recentHarvests: GardenHarvest[];
}

export interface GardenHarvestMonthlySummary {
  year: number | null;
  month: number;
  monthName: string;
  count: number;
  totalQuantity: number;
  latestDate: string | null;
}

export interface GardenHarvestCropSummary {
  seedId: number;
  seedName: string;
  count: number;
  totalQuantity: number;
  latestDate: string | null;
}

export interface GardenHarvestAreaSummary {
  gardenPlotId: number;
  gardenPlotName: string;
  count: number;
  totalQuantity: number;
  latestDate: string | null;
}

export interface GardenYearComparison {
  year: number;
  compareYear: number;
  current: GardenYearSeasonSummary;
  previous: GardenYearSeasonSummary;
  delta: GardenYearSeasonDelta;
  cropComparisons: GardenYearCropComparison[];
  areaComparisons: GardenYearAreaComparison[];
}

export interface GardenYearSeasonSummary {
  year: number;
  cropCount: number;
  trayCells: number;
  trayStarted: number;
  trayPlanned: number;
  bedCells: number;
  bedPlanted: number;
  bedPlanned: number;
  successfulPlantings: number;
  plannedQuantity: number;
  harvestEntries: number;
  harvestQuantity: number;
}

export interface GardenYearSeasonDelta {
  cropCount: number;
  trayCells: number;
  bedCells: number;
  successfulPlantings: number;
  plannedQuantity: number;
  harvestEntries: number;
  harvestQuantity: number;
}

export interface GardenYearCropComparison {
  seedId: number;
  seedName: string;
  currentTrayCells: number;
  previousTrayCells: number;
  currentBedCells: number;
  previousBedCells: number;
  currentPlannedQuantity: number;
  previousPlannedQuantity: number;
  currentHarvestQuantity: number;
  previousHarvestQuantity: number;
}

export interface GardenYearAreaComparison {
  gardenPlotId: number;
  gardenPlotName: string;
  currentBedCells: number;
  previousBedCells: number;
  currentPlannedQuantity: number;
  previousPlannedQuantity: number;
  currentHarvestQuantity: number;
  previousHarvestQuantity: number;
}
export interface GardenNoteReport {
  year: number | null;
  totalCount: number;
  monthlySummaries: GardenNoteMonthlySummary[];
  areaSummaries: GardenNoteAreaSummary[];
  recentNotes: GardenNote[];
}

export interface GardenNoteMonthlySummary {
  year: number | null;
  month: number;
  monthName: string;
  count: number;
  latestDate: string | null;
}

export interface GardenNoteAreaSummary {
  gardenPlotId: number;
  gardenPlotName: string;
  count: number;
  latestDate: string | null;
}
export interface GardenSeedImportRequest {
  csv: string;
  updateExisting: boolean;
}

export interface GardenSeedImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  rows: GardenSeedImportRowResult[];
}

export interface GardenSeedImportRowResult {
  rowNumber: number;
  name: string | null;
  action: string;
  message: string;
}

export interface GardenYearCopyRequest {
  fromYear: number;
  toYear: number;
  scopeId: number | null;
  overwriteExisting: boolean;
}

export interface GardenYearCopyResult {
  copied: number;
  skipped: number;
  deletedExisting: number;
}

export interface GardenYearCopyPreview {
  sourceCount: number;
  existingTargetCount: number;
  willCopy: number;
  willSkip: number;
  willDelete: number;
}







