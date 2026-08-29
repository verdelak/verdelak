import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { MasterScheduleItem, ScheduledTask, ScheduledTaskRequest, TaskOccurrenceActivity } from '../../tasks/models/scheduled-task.model';
import { GardenHarvest, GardenHarvestReport, GardenHarvestUpsert, GardenYearComparison, GardenNote, GardenNoteReport, GardenNoteUpsert, GardenPlot, GardenPlotDimensionUpsert, GardenPlotPlant, GardenPlotPlantUpsert, GardenPlotUpsert, GardenSeed, GardenSeedImportResult, GardenSeedTray, GardenSeedTrayPlant, GardenSeedTrayPlantUpsert, GardenSeedUpsert, GardenYearCopyPreview, GardenYearCopyResult } from '../models/gardening.models';
import { GardeningService } from '../gardening.service';
import { GardeningSchedulePanel } from '../gardening-schedule-panel/gardening-schedule-panel';
import { GardeningYearComparisonPanel } from '../gardening-year-comparison-panel/gardening-year-comparison-panel';
import { GardeningHarvestReportPanel } from '../gardening-harvest-report-panel/gardening-harvest-report-panel';
import { GardeningSeedInventoryPanel } from '../gardening-seed-inventory-panel/gardening-seed-inventory-panel';
import { GardeningSeedStartReportPanel } from '../gardening-seed-start-report-panel/gardening-seed-start-report-panel';
import { GardeningTrayGridPanel } from '../gardening-tray-grid-panel/gardening-tray-grid-panel';
import { GardeningPlotGridPanel } from '../gardening-plot-grid-panel/gardening-plot-grid-panel';

interface TrayCell {
  row: string;
  column: number;
  slotId: number;
  label: string;
  plant: GardenSeedTrayPlant | null;
  code: string;
}

interface TrayLegendItem {
  code: string;
  seedId: number;
  seedName: string;
  slots: string;
  slotLabels: string[];
  slotIds: number[];
  count: number;
  plantedCount: number;
  successCount: number;
  planningCount: number;
  firstPlantDate: string | null;
}

interface TrayAssignmentForm {
  seedId: number | null;
  plantDate: string;
  planning: boolean;
  success: boolean;
}

type TrayAssignmentMode = 'select' | 'paint';
type PlotAssignmentMode = 'select' | 'paint';
type PlotCellFilter = 'all' | 'planned' | 'planted' | 'success' | 'empty';
type SeedInventoryFilter = 'all' | 'indoor' | 'outdoor' | 'reorder' | 'low' | 'empty';
type SeedInventorySort = 'name' | 'qty' | 'start' | 'reorder';
type NoteSort = 'newest' | 'oldest' | 'area' | 'month';
type HarvestSort = 'newest' | 'oldest' | 'crop' | 'area' | 'qty';

type SeedStartReportScope = 'all' | 'tray' | 'area' | 'warnings';

interface SeedImportPreviewRow {
  rowNumber: number;
  name: string;
  description: string;
  plantDate: string;
  indoor: string;
  secondPlantDate: string;
  notes: string;
  qty: string;
  reorder: string;
  action: string;
  warning: string | null;
}

interface SeedStartMonthReportRow {
  date: string | null;
  action: string;
  seedId: number;
  seedName: string;
  method: string;
  trayLocations: string[];
  gardenAreas: string[];
  qty: number | null;
  inventoryQty: number;
  inventoryStatus: string;
  warnings: string[];
  notes: string | null;
}

interface SeedStartTraySummary {
  trayId: number;
  trayName: string;
  seedCount: number;
  cellCount: number;
  plannedCount: number;
  startedCount: number;
  successCount: number;
  emptyCount: number | null;
  firstDate: string | null;
  seeds: string[];
  rows: SeedStartMonthReportRow[];
}

interface SeedStartAreaSummary {
  plotId: number;
  areaName: string;
  seedCount: number;
  cellCount: number;
  plannedCount: number;
  plantedCount: number;
  successCount: number;
  totalQty: number;
  emptyCount: number | null;
  firstDate: string | null;
  seeds: string[];
  rows: SeedStartMonthReportRow[];
}

interface NoteKeywordSummary {
  label: string;
  count: number;
}

interface NoteEntryGroup {
  key: string;
  label: string;
  detail: string;
  notes: GardenNote[];
}

interface NotePrompt {
  label: string;
  text: string;
}

interface PlotCell {
  row: string;
  column: number;
  slotId: number;
  label: string;
  plant: GardenPlotPlant | null;
}

interface PlotLegendItem {
  seedId: number;
  seedName: string;
  slots: string;
  slotLabels: string[];
  slotIds: number[];
  count: number;
  totalQty: number;
  plantedCount: number;
  successCount: number;
  planningCount: number;
  firstPlantDate: string | null;
}

interface PlotRowSummary {
  row: string;
  assigned: number;
  open: number;
  planned: number;
  planted: number;
  success: number;
  qty: number;
  coveragePercent: number;
  firstSlotId: number | null;
}

interface SeedForm {
  id: number | null;
  name: string;
  description: string;
  plantDate: string;
  indoor: boolean;
  secondPlantDate: string;
  notes: string;
  qty: number;
  reorder: boolean;
}

interface PlotForm {
  id: number | null;
  gardenName: string;
  description: string;
}

interface PlotDimensionForm {
  traySlotsWide: number;
  slotsDeep: number;
  notes: string;
}

interface PlotPlantForm {
  seedId: number | null;
  plantDate: string;
  planning: boolean;
  success: boolean;
  qty: number | null;
}

interface NoteForm {
  id: number | null;
  gardenPlotId: number | null;
  date: string;
  year: number | null;
  note: string;
}

interface HarvestForm {
  id: number | null;
  gardenPlotId: number | null;
  seedId: number | null;
  harvestDate: string;
  year: number | null;
  quantity: number | null;
  notes: string;
}

interface GardeningTaskForm {
  id: number | null;
  title: string;
  description: string;
  isActive: boolean;
  scheduleType: string;
  recurrencePattern: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-gardening-dashboard',
  imports: [CommonModule, FormsModule, GardeningSchedulePanel, GardeningYearComparisonPanel, GardeningHarvestReportPanel, GardeningSeedInventoryPanel, GardeningSeedStartReportPanel, GardeningTrayGridPanel, GardeningPlotGridPanel],
  templateUrl: './gardening-dashboard.html',
  styleUrl: './gardening-dashboard.scss'
})
export class GardeningDashboard implements OnInit {
  readonly viewModel = this;
  readonly seeds = signal<GardenSeed[]>([]);
  readonly trays = signal<GardenSeedTray[]>([]);
  readonly trayPlants = signal<GardenSeedTrayPlant[]>([]);
  readonly plots = signal<GardenPlot[]>([]);
  readonly plotPlants = signal<GardenPlotPlant[]>([]);
  readonly notes = signal<GardenNote[]>([]);
  readonly harvests = signal<GardenHarvest[]>([]);
  readonly harvestReport = signal<GardenHarvestReport | null>(null);
  readonly yearComparison = signal<GardenYearComparison | null>(null);
  readonly noteReport = signal<GardenNoteReport | null>(null);
  readonly gardeningTasks = signal<ScheduledTask[]>([]);
  readonly gardeningActivity = signal<TaskOccurrenceActivity[]>([]);
  readonly gardeningSchedule = signal<MasterScheduleItem[]>([]);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly comparisonYear = signal(new Date().getFullYear() - 1);
  readonly selectedReportMonth = signal(new Date().getMonth() + 1);
  readonly selectedTrayId = signal<number | null>(null);
  readonly selectedSlotId = signal<number | null>(null);
  readonly selectedPlotId = signal<number | null>(null);
  readonly selectedPlotSlotId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly savingAssignment = signal(false);
  readonly savingSeed = signal(false);
  readonly importingSeeds = signal(false);
  readonly copyingTrayYear = signal(false);
  readonly previewingTrayCopy = signal(false);
  readonly copyingPlotYear = signal(false);
  readonly previewingPlotCopy = signal(false);
  readonly savingPlot = signal(false);
  readonly savingPlotDimension = signal(false);
  readonly savingPlotPlant = signal(false);
  readonly savingNote = signal(false);
  readonly savingHarvest = signal(false);
  readonly loadingHarvestReport = signal(false);
  readonly loadingYearComparison = signal(false);
  readonly loadingNoteReport = signal(false);
  readonly savingTask = signal(false);
  readonly generatingTasks = signal(false);
  readonly scheduleLoading = signal(false);
  readonly scheduleActionId = signal<string | null>(null);
  readonly scheduleMoveId = signal<string | null>(null);
  readonly scheduleMoveDate = signal('');
  readonly scheduleActionNote = signal('');
  readonly error = signal<string | null>(null);
  readonly assignmentMessage = signal<string | null>(null);
  readonly seedMessage = signal<string | null>(null);
  readonly seedImportMessage = signal<string | null>(null);
  readonly plotMessage = signal<string | null>(null);
  readonly noteMessage = signal<string | null>(null);
  readonly harvestMessage = signal<string | null>(null);
  readonly taskMessage = signal<string | null>(null);
  readonly seedFilter = signal('');
  readonly seedImportCsv = signal('');
  readonly seedImportUpdateExisting = signal(true);
  readonly seedImportResult = signal<GardenSeedImportResult | null>(null);
  readonly trayCopyFromYear = signal(new Date().getFullYear() - 1);
  readonly trayCopyToYear = signal(new Date().getFullYear());
  readonly trayCopyScope = signal<'selected' | 'all'>('selected');
  readonly trayCopyOverwrite = signal(false);
  readonly trayCopyPreview = signal<GardenYearCopyPreview | null>(null);
  readonly trayCopyResult = signal<GardenYearCopyResult | null>(null);
  readonly plotCopyFromYear = signal(new Date().getFullYear() - 1);
  readonly plotCopyToYear = signal(new Date().getFullYear());
  readonly plotCopyScope = signal<'selected' | 'all'>('selected');
  readonly plotCopyOverwrite = signal(false);
  readonly plotCopyPreview = signal<GardenYearCopyPreview | null>(null);
  readonly plotCopyResult = signal<GardenYearCopyResult | null>(null);
  readonly seedInventoryFilter = signal<SeedInventoryFilter>('all');
  readonly seedInventorySort = signal<SeedInventorySort>('name');
  readonly noteFilter = signal('');
  readonly notePlotFilter = signal<number | null>(null);
  readonly noteFromDate = signal('');
  readonly noteToDate = signal('');
  readonly noteSort = signal<NoteSort>('newest');
  readonly harvestPlotFilter = signal<number | null>(null);
  readonly harvestSeedFilter = signal<number | null>(null);
  readonly harvestFromDate = signal('');
  readonly harvestToDate = signal('');
  readonly harvestSort = signal<HarvestSort>('newest');
  readonly seedStartReportScope = signal<SeedStartReportScope>('all');
  readonly generateDays = signal(30);
  readonly trayAssignmentMode = signal<TrayAssignmentMode>('select');
  readonly plotAssignmentMode = signal<PlotAssignmentMode>('select');
  readonly plotCellFilter = signal<PlotCellFilter>('all');
  readonly selectedLegendSeedId = signal<number | null>(null);
  readonly selectedPlotLegendSeedId = signal<number | null>(null);
  readonly assignmentForm = signal<TrayAssignmentForm>({
    seedId: null,
    plantDate: this.toInputDate(new Date().toISOString()),
    planning: false,
    success: false
  });
  readonly seedForm = signal<SeedForm>(this.emptySeedForm());
  readonly plotForm = signal<PlotForm>({ id: null, gardenName: '', description: '' });
  readonly plotDimensionForm = signal<PlotDimensionForm>({
    traySlotsWide: 4,
    slotsDeep: 4,
    notes: ''
  });
  readonly plotPlantForm = signal<PlotPlantForm>({
    seedId: null,
    plantDate: this.toInputDate(new Date().toISOString()),
    planning: true,
    success: false,
    qty: 1
  });
  readonly noteForm = signal<NoteForm>(this.emptyNoteForm());
  readonly harvestForm = signal<HarvestForm>(this.emptyHarvestForm());
  readonly taskForm = signal<GardeningTaskForm>(this.emptyTaskForm());

  readonly selectedTray = computed(() => {
    const selectedId = this.selectedTrayId();
    return this.trays().find(tray => tray.id === selectedId) ?? this.trays()[0] ?? null;
  });
  readonly selectedTrayName = computed(() => this.selectedTray()?.trayName ?? 'Seed Tray');
  readonly selectedTrayColumnCount = computed(() => (this.selectedTray()?.dimensions?.slotsWide ?? 0) + 1);
  readonly selectedPlot = computed(() => {
    const selectedId = this.selectedPlotId();
    return this.plots().find(plot => plot.id === selectedId) ?? this.plots()[0] ?? null;
  });
  readonly selectedPlotName = computed(() => this.selectedPlot()?.gardenName ?? 'Garden Bed');
  readonly selectedPlotColumnCount = computed(() => (this.selectedPlot()?.dimensions?.traySlotsWide ?? 0) + 1);
  readonly selectedPlotGridLabel = computed(() => {
    const dimensions = this.selectedPlot()?.dimensions;
    return dimensions ? `${dimensions.slotsDeep} x ${dimensions.traySlotsWide}` : '0 x 0';
  });

  readonly trayRows = computed(() => this.buildTrayRows());
  readonly plotRows = computed(() => this.buildPlotRows());
  readonly trayLegend = computed(() => this.buildLegend());
  readonly plotLegend = computed(() => this.buildPlotLegend());
  readonly filteredPlotLegend = computed(() => this.plotLegend().filter(item => !this.selectedPlotLegendSeedId() || item.seedId === this.selectedPlotLegendSeedId()));
  readonly plotRowSummaries = computed(() => this.buildPlotRowSummaries());
  readonly selectedTrayPlantCount = computed(() => this.currentTrayPlants().length);
  readonly selectedTrayCellCount = computed(() => {
    const dimensions = this.selectedTray()?.dimensions;
    return dimensions ? dimensions.slotsWide * dimensions.slotsDeep : 0;
  });
  readonly selectedTrayEmptyCount = computed(() => Math.max(0, this.selectedTrayCellCount() - this.selectedTrayPlantCount()));
  readonly selectedTrayPlannedCount = computed(() => this.currentTrayPlants().filter(plant => plant.planning).length);
  readonly selectedTrayStartedCount = computed(() => this.currentTrayPlants().filter(plant => !plant.planning).length);
  readonly selectedTraySuccessCount = computed(() => this.currentTrayPlants().filter(plant => plant.success).length);
  readonly selectedTrayCoveragePercent = computed(() => {
    const cells = this.selectedTrayCellCount();
    return cells ? Math.round((this.selectedTrayPlantCount() / cells) * 100) : 0;
  });
  readonly selectedTrayPlanningLabel = computed(() => {
    const dimensions = this.selectedTray()?.dimensions;
    if (!dimensions) {
      return 'No tray grid yet';
    }

    return `${this.selectedTrayCoveragePercent()}% assigned / ${this.selectedTrayEmptyCount()} open cells`;
  });
  readonly selectedPlotPlantCount = computed(() => this.currentPlotPlants().length);
  readonly selectedPlotCellCount = computed(() => {
    const dimensions = this.selectedPlot()?.dimensions;
    return dimensions ? dimensions.traySlotsWide * dimensions.slotsDeep : 0;
  });
  readonly selectedPlotEmptyCount = computed(() => Math.max(0, this.selectedPlotCellCount() - this.selectedPlotPlantCount()));
  readonly selectedPlotPlantedCount = computed(() => this.currentPlotPlants().filter(plant => !plant.planning).length);
  readonly selectedPlotStartedCount = computed(() => this.currentPlotPlants().filter(plant => !plant.planning && !plant.success).length);
  readonly selectedPlotSuccessCount = computed(() => this.currentPlotPlants().filter(plant => plant.success).length);
  readonly selectedPlotPlannedCount = computed(() => this.currentPlotPlants().filter(plant => plant.planning).length);
  readonly selectedPlotTotalQty = computed(() => this.currentPlotPlants().reduce((sum, plant) => sum + (plant.qty ?? 1), 0));
  readonly selectedPlotPlannedQty = computed(() => this.currentPlotPlants().filter(plant => plant.planning).reduce((sum, plant) => sum + (plant.qty ?? 1), 0));
  readonly selectedPlotCoveragePercent = computed(() => {
    const cells = this.selectedPlotCellCount();
    return cells ? Math.round((this.selectedPlotPlantCount() / cells) * 100) : 0;
  });
  readonly selectedPlotPlanningLabel = computed(() => {
    const dimensions = this.selectedPlot()?.dimensions;
    if (!dimensions) {
      return 'No bed grid yet';
    }

    return `${this.selectedPlotCoveragePercent()}% assigned / ${this.selectedPlotEmptyCount()} open cells`;
  });
  readonly selectedPlotFilterCount = computed(() => this.plotRows().flat().filter(cell => this.plotCellMatchesFilter(cell)).length);
  readonly selectedPlotWarnings = computed(() => this.buildPlotWarnings());
  readonly sortedSeeds = computed(() => [...this.seeds()].sort((left, right) => left.name.localeCompare(right.name)));
  readonly seedInventoryTotalQty = computed(() =>
    this.seeds().reduce((sum, seed) => sum + (seed.inventory?.qty ?? 0), 0));
  readonly emptySeedCount = computed(() =>
    this.seeds().filter(seed => (seed.inventory?.qty ?? 0) === 0).length);
  readonly lowSeedCount = computed(() =>
    this.seeds().filter(seed => {
      const qty = seed.inventory?.qty ?? 0;
      return qty > 0 && qty <= 2;
    }).length);
  readonly filteredSeeds = computed(() => {
    const term = this.seedFilter().trim().toLowerCase();
    const mode = this.seedInventoryFilter();
    const seeds = this.seeds().filter(seed => {
      const qty = seed.inventory?.qty ?? 0;
      if (mode === 'indoor') {
        return seed.indoor;
      }

      if (mode === 'outdoor') {
        return !seed.indoor;
      }

      if (mode === 'reorder') {
        return !!seed.inventory?.reorder;
      }

      if (mode === 'low') {
        return qty > 0 && qty <= 2;
      }

      if (mode === 'empty') {
        return qty === 0;
      }

      return true;
    });
    const filtered = term
      ? seeds.filter(seed => `${seed.name} ${seed.description ?? ''} ${seed.notes ?? ''}`.toLowerCase().includes(term))
      : seeds;
    return this.sortSeeds(filtered);
  });
  readonly selectedCell = computed(() => {
    const slotId = this.selectedSlotId();
    return this.trayRows().flat().find(cell => cell.slotId === slotId) ?? null;
  });
  readonly selectedAssignment = computed(() => this.selectedCell()?.plant ?? null);
  readonly selectedAssignmentSeedName = computed(() => {
    const seedId = this.assignmentForm().seedId;
    return seedId ? this.seeds().find(seed => seed.id === seedId)?.name ?? 'Selected seed' : 'No seed selected';
  });
  readonly selectedPlotCell = computed(() => {
    const slotId = this.selectedPlotSlotId();
    return this.plotRows().flat().find(cell => cell.slotId === slotId) ?? null;
  });
  readonly selectedPlotAssignment = computed(() => this.selectedPlotCell()?.plant ?? null);
  readonly selectedPlotPlantSeedName = computed(() => {
    const seedId = this.plotPlantForm().seedId;
    return seedId ? this.seeds().find(seed => seed.id === seedId)?.name ?? 'Selected seed' : 'No seed selected';
  });
  readonly indoorSeeds = computed(() => this.seeds().filter(seed => seed.indoor));
  readonly reorderSeeds = computed(() => this.seeds().filter(seed => seed.inventory?.reorder));
  readonly noteAreaSummaries = computed(() => {
    const summaries = new Map<number, { plotId: number; name: string; count: number; latestDate: string | null }>();
    for (const note of this.notes()) {
      if (!note.gardenPlotId) {
        continue;
      }

      const existing = summaries.get(note.gardenPlotId) ?? {
        plotId: note.gardenPlotId,
        name: this.plotName(note.gardenPlotId),
        count: 0,
        latestDate: null
      };
      existing.count += 1;
      if (!existing.latestDate || new Date(note.date).getTime() > new Date(existing.latestDate).getTime()) {
        existing.latestDate = note.date;
      }
      summaries.set(note.gardenPlotId, existing);
    }

    return [...summaries.values()].sort((left, right) => left.name.localeCompare(right.name));
  });
  readonly seedImportPreviewRows = computed(() => this.buildSeedImportPreviewRows());
  readonly seedImportPreviewWarnings = computed(() => this.seedImportPreviewRows().filter(row => row.warning).length);
  readonly seedImportPreviewCreates = computed(() => this.seedImportPreviewRows().filter(row => row.action === 'Create').length);
  readonly seedImportPreviewUpdates = computed(() => this.seedImportPreviewRows().filter(row => row.action === 'Update').length);
  readonly seedImportPreviewSkips = computed(() => this.seedImportPreviewRows().filter(row => row.action === 'Skip').length);
  readonly seedImportPreviewLabel = computed(() => {
    const rows = this.seedImportPreviewRows();
    return rows.length ? `${rows.length} rows detected / ${this.seedImportPreviewWarnings()} warnings` : 'No import rows loaded';
  });

  readonly filteredNotes = computed(() => {
    const term = this.noteFilter().trim().toLowerCase();
    const from = this.noteFromDate();
    const to = this.noteToDate();
    const sort = this.noteSort();
    return [...this.notes()]
      .filter(note => !this.notePlotFilter() || note.gardenPlotId === this.notePlotFilter())
      .filter(note => !from || this.toInputDate(note.date) >= from)
      .filter(note => !to || this.toInputDate(note.date) <= to)
      .filter(note => {
        if (!term) {
          return true;
        }

        return `${note.note ?? ''} ${this.plotName(note.gardenPlotId)} ${note.year ?? ''}`.toLowerCase().includes(term);
      })
      .sort((left, right) => {
        if (sort === 'area') {
          const areaCompare = this.plotName(left.gardenPlotId).localeCompare(this.plotName(right.gardenPlotId));
          return areaCompare || new Date(right.date).getTime() - new Date(left.date).getTime();
        }

        const dateCompare = new Date(right.date).getTime() - new Date(left.date).getTime();
        return sort === 'oldest' ? -dateCompare : dateCompare;
      });
  });
  readonly recentNotes = computed(() => this.filteredNotes().slice(0, 24));
  readonly noteEntryGroups = computed(() => this.buildNoteEntryGroups(this.recentNotes()));
  readonly filteredHarvests = computed(() => this.buildFilteredHarvests());
  readonly recentHarvests = computed(() => this.filteredHarvests().slice(0, 24));
  readonly topCropComparisons = computed(() => this.yearComparison()?.cropComparisons.slice(0, 8) ?? []);
  readonly topAreaComparisons = computed(() => this.yearComparison()?.areaComparisons.slice(0, 6) ?? []);
  readonly harvestTotalQuantity = computed(() => this.harvests().reduce((sum, harvest) => sum + (harvest.quantity ?? 0), 0));
  readonly harvestCropCount = computed(() => new Set(this.harvests().map(harvest => harvest.seedId)).size);
  readonly filteredHarvestTotalQuantity = computed(() => this.filteredHarvests().reduce((sum, harvest) => sum + (harvest.quantity ?? 0), 0));
  readonly filteredHarvestCropCount = computed(() => new Set(this.filteredHarvests().map(harvest => harvest.seedId)).size);
  readonly harvestFilterLabel = computed(() => {
    const parts = [
      this.harvestPlotFilter() ? this.plotName(this.harvestPlotFilter()) : null,
      this.harvestSeedFilter() ? this.seedName(this.harvestSeedFilter()!) : null,
      this.harvestFromDate() ? `from ${this.formatDate(this.harvestFromDate())}` : null,
      this.harvestToDate() ? `to ${this.formatDate(this.harvestToDate())}` : null
    ].filter(Boolean);

    return parts.length ? parts.join(' / ') : 'All harvests';
  });
  readonly isEditingHarvest = computed(() => this.harvestForm().id !== null);
  readonly noteMonthlySummaries = computed(() => {
    const summaries = new Map<string, { label: string; count: number; latestDate: string | null }>();
    for (const note of this.filteredNotes()) {
      const date = new Date(note.date);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const key = `${note.year ?? date.getFullYear()}-${date.getMonth() + 1}`;
      const label = `${this.monthName(date.getMonth() + 1)} ${note.year ?? date.getFullYear()}`;
      const existing = summaries.get(key) ?? { label, count: 0, latestDate: null };
      existing.count += 1;
      if (!existing.latestDate || new Date(note.date).getTime() > new Date(existing.latestDate).getTime()) {
        existing.latestDate = note.date;
      }
      summaries.set(key, existing);
    }

    return [...summaries.values()].sort((left, right) => (right.latestDate ?? '').localeCompare(left.latestDate ?? ''));
  });
  readonly filteredNoteAreaSummaries = computed(() => {
    const summaries = new Map<number, { plotId: number; name: string; count: number; latestDate: string | null }>();
    for (const note of this.filteredNotes()) {
      const existing = summaries.get(note.gardenPlotId) ?? {
        plotId: note.gardenPlotId,
        name: this.plotName(note.gardenPlotId),
        count: 0,
        latestDate: null
      };
      existing.count += 1;
      if (!existing.latestDate || new Date(note.date).getTime() > new Date(existing.latestDate).getTime()) {
        existing.latestDate = note.date;
      }
      summaries.set(note.gardenPlotId, existing);
    }

    return [...summaries.values()].sort((left, right) => left.name.localeCompare(right.name));
  });
  readonly activeGardeningTasks = computed(() => this.gardeningTasks().filter(task => task.isActive).length);
  readonly recentGardeningActivityCount = computed(() => this.gardeningActivity().length);
  readonly openGardeningActivityCount = computed(() => this.gardeningActivity().filter(item => item.status !== 'Completed' && item.status !== 'Skipped').length);
  readonly openGardeningScheduleCount = computed(() => this.gardeningSchedule().filter(item => item.status !== 'Completed' && item.status !== 'Skipped').length);
  readonly completedGardeningScheduleCount = computed(() => this.gardeningSchedule().filter(item => item.status === 'Completed').length);
  readonly skippedGardeningScheduleCount = computed(() => this.gardeningSchedule().filter(item => item.status === 'Skipped').length);
  readonly monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: this.monthName(index + 1) }));
  readonly notePrompts: NotePrompt[] = [
    { label: 'Weather', text: 'Weather:\n\nImpact on garden:\n\nFollow-up:' },
    { label: 'Pest / Disease', text: 'Pest or disease observed:\n\nPlants affected:\n\nAction taken:\n\nFollow-up:' },
    { label: 'Harvest', text: 'Harvested:\n\nQuantity:\n\nQuality notes:\n\nNext harvest estimate:' },
    { label: 'Follow-up', text: 'Follow-up from prior note:\n\nResult:\n\nNext step:' }
  ];
  readonly monthlySeedStartRows = computed(() => this.buildMonthlySeedStartRows());
  readonly scopedMonthlySeedStartRows = computed(() => this.filterMonthlySeedStartRows(this.monthlySeedStartRows()));
  readonly monthlyIndoorStartCount = computed(() => this.monthlySeedStartRows().filter(row => row.method === 'Indoor').length);
  readonly monthlyOutdoorStartCount = computed(() => this.monthlySeedStartRows().filter(row => row.method === 'Outdoor').length);
  readonly monthlyTrayAssignmentCount = computed(() => this.monthlySeedStartRows().filter(row => row.trayLocations.length > 0).length);
  readonly monthlyPlanningWarningCount = computed(() => this.monthlySeedStartRows().filter(row => row.warnings.length > 0).length);
  readonly monthlyTraySummaries = computed(() => this.buildMonthlyTraySummaries());
  readonly monthlyAreaSummaries = computed(() => this.buildMonthlyAreaSummaries());
  readonly monthlyAreaQtyTotal = computed(() => this.monthlyAreaSummaries().reduce((sum, area) => sum + area.totalQty, 0));
  readonly monthlySeedInventoryWarningCount = computed(() => this.monthlySeedStartRows().filter(row => row.inventoryQty <= 2).length);
  readonly monthlyUnassignedSeedStartCount = computed(() => this.monthlySeedStartRows().filter(row => row.trayLocations.length === 0 || row.gardenAreas.length === 0).length);
  readonly isEditingNote = computed(() => this.noteForm().id !== null);
  readonly noteFormWordCount = computed(() => this.noteForm().note.trim().split(/\s+/).filter(Boolean).length);
  readonly noteFormCharacterCount = computed(() => this.noteForm().note.trim().length);
  readonly noteFormAreaName = computed(() => this.noteForm().gardenPlotId ? this.plotName(this.noteForm().gardenPlotId) : 'No area selected');
  readonly filteredNoteWordTotal = computed(() => this.filteredNotes().reduce((sum, note) => sum + this.noteWordCount(note.note), 0));
  readonly latestFilteredNoteDate = computed(() => this.filteredNotes()[0]?.date ?? null);
  readonly noteKeywordSummaries = computed(() => this.buildNoteKeywordSummaries());
  readonly noteFilterLabel = computed(() => {
    const parts = [
      this.noteFilter().trim() ? `search "${this.noteFilter().trim()}"` : null,
      this.notePlotFilter() ? this.plotName(this.notePlotFilter()) : null,
      this.noteFromDate() ? `from ${this.formatDate(this.noteFromDate())}` : null,
      this.noteToDate() ? `to ${this.formatDate(this.noteToDate())}` : null
    ].filter(Boolean);

    return parts.length ? parts.join(' / ') : 'All diary entries';
  });

  constructor(
    private readonly service: GardeningService,
    private readonly csvDownload: CsvDownloadService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      seeds: this.service.getSeeds(),
      trays: this.service.getTrays(),
      trayPlants: this.service.getTrayPlants(this.selectedYear()),
      plotPlants: this.service.getPlotPlants(this.selectedYear()),
      plots: this.service.getPlots(),
      notes: this.service.getNotes(this.selectedYear()),
      harvests: this.service.getHarvests(this.selectedYear(), null, null, 50),
      harvestReport: this.service.getHarvestReport(this.selectedYear()),
      yearComparison: this.service.getYearComparison(this.selectedYear(), this.comparisonYear()),
      noteReport: this.service.getNoteReport(this.selectedYear()),
      gardeningTasks: this.service.getGardeningTasks(),
      gardeningActivity: this.service.getGardeningActivity(),
      gardeningSchedule: this.service.getGardeningMasterSchedule(this.todayDate(), this.scheduleRangeEnd())
    }).subscribe({
      next: result => {
        this.seeds.set(result.seeds);
        this.trays.set(result.trays);
        this.trayPlants.set(result.trayPlants);
        this.plotPlants.set(result.plotPlants);
        this.plots.set(result.plots);
        this.notes.set(result.notes);
        this.harvests.set(result.harvests);
        this.harvestReport.set(result.harvestReport);
        this.yearComparison.set(result.yearComparison);
        this.noteReport.set(result.noteReport);
        this.gardeningTasks.set(result.gardeningTasks);
        this.gardeningActivity.set(result.gardeningActivity);
        this.gardeningSchedule.set(result.gardeningSchedule.filter(item => item.source === 'Gardening'));
        if (!this.selectedTrayId() && result.trays.length) {
          this.selectedTrayId.set(result.trays[0].id);
        }
        if (!this.selectedPlotId() && result.plots.length) {
          this.selectedPlotId.set(result.plots[0].id);
        }
        this.syncPlotDimensionForm();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load gardening data.'),
      complete: () => this.loading.set(false)
    });
  }

  setYear(value: string | number): void {
    const year = Number(value);
    this.selectedYear.set(Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear());
    this.comparisonYear.set(this.selectedYear() - 1);
    this.selectedSlotId.set(null);
    this.selectedPlotSlotId.set(null);
    this.load();
  }

  setComparisonYear(value: string | number): void {
    const year = Number(value);
    this.comparisonYear.set(Number.isFinite(year) ? Math.trunc(year) : this.selectedYear() - 1);
    this.refreshYearComparison();
  }

  refreshYearComparison(): void {
    this.loadingYearComparison.set(true);
    this.service.getYearComparison(this.selectedYear(), this.comparisonYear()).subscribe({
      next: result => this.yearComparison.set(result),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load garden year comparison.'),
      complete: () => this.loadingYearComparison.set(false)
    });
  }

  setReportMonth(value: string | number): void {
    const month = Number(value);
    this.selectedReportMonth.set(Number.isFinite(month) && month >= 1 && month <= 12 ? Math.trunc(month) : new Date().getMonth() + 1);
  }

  setTrayCopyFromYear(value: string | number): void {
    const year = Number(value);
    this.trayCopyFromYear.set(Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear() - 1);
    this.trayCopyPreview.set(null);
    this.trayCopyResult.set(null);
  }

  setTrayCopyToYear(value: string | number): void {
    const year = Number(value);
    this.trayCopyToYear.set(Number.isFinite(year) ? Math.trunc(year) : this.selectedYear());
    this.trayCopyPreview.set(null);
    this.trayCopyResult.set(null);
  }

  setTrayCopyScope(value: 'selected' | 'all'): void {
    this.trayCopyScope.set(value);
    this.trayCopyPreview.set(null);
    this.trayCopyResult.set(null);
  }

  setTrayCopyOverwrite(value: boolean): void {
    this.trayCopyOverwrite.set(value);
    this.trayCopyPreview.set(null);
    this.trayCopyResult.set(null);
  }

  previewTrayYear(): void {
    const scopeId = this.trayCopyScope() === 'selected' ? this.selectedTray()?.id ?? null : null;
    if (this.trayCopyScope() === 'selected' && !scopeId) {
      this.assignmentMessage.set('Choose a tray before previewing selected tray assignments.');
      return;
    }

    this.previewingTrayCopy.set(true);
    this.assignmentMessage.set(null);
    this.service.previewCopyTrayPlants({
      fromYear: this.trayCopyFromYear(),
      toYear: this.trayCopyToYear(),
      scopeId,
      overwriteExisting: this.trayCopyOverwrite()
    }).subscribe({
      next: preview => { this.trayCopyPreview.set(preview); this.trayCopyResult.set(null); },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not preview tray copy-forward.'),
      complete: () => this.previewingTrayCopy.set(false)
    });
  }

  useNextYearForTrayCopy(): void {
    this.trayCopyFromYear.set(this.selectedYear());
    this.trayCopyToYear.set(this.selectedYear() + 1);
    this.trayCopyPreview.set(null);
    this.trayCopyResult.set(null);
  }

  copyTrayYear(): void {
    const scopeId = this.trayCopyScope() === 'selected' ? this.selectedTray()?.id ?? null : null;
    if (this.trayCopyScope() === 'selected' && !scopeId) {
      this.assignmentMessage.set('Choose a tray before copying selected tray assignments.');
      return;
    }

    this.copyingTrayYear.set(true);
    this.assignmentMessage.set(null);
    this.service.copyTrayPlants({
      fromYear: this.trayCopyFromYear(),
      toYear: this.trayCopyToYear(),
      scopeId,
      overwriteExisting: this.trayCopyOverwrite()
    }).subscribe({
      next: result => { this.trayCopyResult.set(result); this.trayCopyPreview.set(null); this.handleTrayCopyResult(result); },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not copy tray assignments.'),
      complete: () => this.copyingTrayYear.set(false)
    });
  }

  setTray(value: number | string | null): void {
    const trayId = value === null || value === '' ? null : Number(value);
    this.selectedTrayId.set(Number.isFinite(trayId) ? trayId : null);
    this.selectedSlotId.set(null);
    this.assignmentMessage.set(null);
  }

  setPlotCopyFromYear(value: string | number): void {
    const year = Number(value);
    this.plotCopyFromYear.set(Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear() - 1);
    this.plotCopyPreview.set(null);
    this.plotCopyResult.set(null);
  }

  setPlotCopyToYear(value: string | number): void {
    const year = Number(value);
    this.plotCopyToYear.set(Number.isFinite(year) ? Math.trunc(year) : this.selectedYear());
    this.plotCopyPreview.set(null);
    this.plotCopyResult.set(null);
  }

  setPlotCopyScope(value: 'selected' | 'all'): void {
    this.plotCopyScope.set(value);
    this.plotCopyPreview.set(null);
    this.plotCopyResult.set(null);
  }

  setPlotCopyOverwrite(value: boolean): void {
    this.plotCopyOverwrite.set(value);
    this.plotCopyPreview.set(null);
    this.plotCopyResult.set(null);
  }

  previewPlotYear(): void {
    const scopeId = this.plotCopyScope() === 'selected' ? this.selectedPlot()?.id ?? null : null;
    if (this.plotCopyScope() === 'selected' && !scopeId) {
      this.plotMessage.set('Choose a garden area before previewing selected bed assignments.');
      return;
    }

    this.previewingPlotCopy.set(true);
    this.plotMessage.set(null);
    this.service.previewCopyPlotPlants({
      fromYear: this.plotCopyFromYear(),
      toYear: this.plotCopyToYear(),
      scopeId,
      overwriteExisting: this.plotCopyOverwrite()
    }).subscribe({
      next: preview => { this.plotCopyPreview.set(preview); this.plotCopyResult.set(null); },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not preview bed copy-forward.'),
      complete: () => this.previewingPlotCopy.set(false)
    });
  }

  useNextYearForPlotCopy(): void {
    this.plotCopyFromYear.set(this.selectedYear());
    this.plotCopyToYear.set(this.selectedYear() + 1);
    this.plotCopyPreview.set(null);
    this.plotCopyResult.set(null);
  }

  copyPlotYear(): void {
    const scopeId = this.plotCopyScope() === 'selected' ? this.selectedPlot()?.id ?? null : null;
    if (this.plotCopyScope() === 'selected' && !scopeId) {
      this.plotMessage.set('Choose a garden area before copying selected bed assignments.');
      return;
    }

    this.copyingPlotYear.set(true);
    this.plotMessage.set(null);
    this.service.copyPlotPlants({
      fromYear: this.plotCopyFromYear(),
      toYear: this.plotCopyToYear(),
      scopeId,
      overwriteExisting: this.plotCopyOverwrite()
    }).subscribe({
      next: result => { this.plotCopyResult.set(result); this.plotCopyPreview.set(null); this.handlePlotCopyResult(result); },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not copy bed assignments.'),
      complete: () => this.copyingPlotYear.set(false)
    });
  }

  downloadTrayCopyReportCsv(): void {
    this.downloadCopyForwardCsv('garden-tray-copy-forward', this.trayCopyFromYear(), this.trayCopyToYear(), this.trayCopyScope(), this.trayCopyOverwrite(), this.trayCopyPreview(), this.trayCopyResult());
  }

  downloadPlotCopyReportCsv(): void {
    this.downloadCopyForwardCsv('garden-bed-copy-forward', this.plotCopyFromYear(), this.plotCopyToYear(), this.plotCopyScope(), this.plotCopyOverwrite(), this.plotCopyPreview(), this.plotCopyResult());
  }
  setPlot(value: number | string | null): void {
    const plotId = value === null || value === '' ? null : Number(value);
    this.selectedPlotId.set(Number.isFinite(plotId) ? plotId : null);
    this.selectedPlotSlotId.set(null);
    this.selectedPlotLegendSeedId.set(null);
    this.plotMessage.set(null);
    this.syncPlotDimensionForm();
  }

  setSeedFilter(value: string): void {
    this.seedFilter.set(value);
  }

  setSeedImportCsv(value: string): void {
    this.seedImportCsv.set(value);
  }

  setSeedImportUpdateExisting(value: boolean): void {
    this.seedImportUpdateExisting.set(value);
  }

  loadSeedImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.seedImportCsv.set(String(reader.result ?? ''));
      this.seedImportMessage.set(`Loaded ${file.name}.`);
    };
    reader.onerror = () => this.seedImportMessage.set('Could not read the selected seed file.');
    reader.readAsText(file);
    input.value = '';
  }

  downloadSeedImportTemplateCsv(): void {
    this.downloadCsv('garden-seeds-template.csv', [
      ['Name', 'Description', 'PlantDate', 'Indoor', 'SecondPlantDate', 'Notes', 'Qty', 'Reorder'],
      ['Tomato', 'Example seed', `${this.selectedYear()}-03-15`, 'true', '', 'Started indoors', 12, 'false'],
      ['Basil', 'Direct sow herb', `${this.selectedYear()}-05-01`, 'false', '', 'Succession plant optional', 4, 'true']
    ]);
  }

  downloadSeedImportPreviewCsv(): void {
    this.downloadCsv(`garden-seed-import-preview-${this.selectedYear()}.csv`, [
      ['Row', 'Action', 'Name', 'Description', 'PlantDate', 'Indoor', 'SecondPlantDate', 'Qty', 'Reorder', 'Warning', 'Notes'],
      ...this.seedImportPreviewRows().map(row => [row.rowNumber, row.action, row.name, row.description, row.plantDate, row.indoor, row.secondPlantDate, row.qty, row.reorder, row.warning ?? '', row.notes])
    ]);
  }

  downloadSeedImportResultCsv(): void {
    const result = this.seedImportResult();
    if (!result) {
      this.seedImportMessage.set('Import seeds before downloading a result report.');
      return;
    }

    this.downloadCsv(`garden-seed-import-result-${this.selectedYear()}.csv`, [
      ['Row', 'Action', 'Name', 'Message'],
      ...(result.rows ?? []).map(row => [row.rowNumber, row.action, row.name ?? '', row.message]),
      ...result.errors.map(error => ['', 'Error', '', error])
    ]);
  }

  clearSeedImportCsv(): void {
    this.seedImportCsv.set('');
    this.seedImportResult.set(null);
    this.seedImportMessage.set('Seed import text cleared.');
  }

  downloadSeedsCsv(): void {
    this.service.exportSeedsCsv().subscribe({
      next: blob => this.downloadBlob(`garden-seeds-${this.selectedYear()}.csv`, blob),
      error: err => this.seedImportMessage.set(err.error ?? err.message ?? 'Could not export seed CSV.')
    });
  }

  importSeedsCsv(): void {
    const csv = this.seedImportCsv().trim();
    if (!csv) {
      this.seedImportMessage.set('Paste or upload seed CSV before importing.');
      return;
    }

    if (this.seedImportPreviewWarnings() > 0) {
      this.seedImportMessage.set('Resolve seed import preview warnings before importing.');
      return;
    }

    this.importingSeeds.set(true);
    this.seedImportMessage.set(null);
    this.seedImportResult.set(null);
    this.service.importSeeds({ csv, updateExisting: this.seedImportUpdateExisting() }).subscribe({
      next: result => {
        this.seedImportResult.set(result);
        this.seedImportMessage.set(`Imported seeds: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped.`);
        this.load();
      },
      error: err => this.seedImportMessage.set(err.error ?? err.message ?? 'Could not import seed CSV.'),
      complete: () => this.importingSeeds.set(false)
    });
  }
  setSeedInventoryFilter(value: SeedInventoryFilter): void {
    this.seedInventoryFilter.set(value);
  }

  setSeedInventorySort(value: SeedInventorySort): void {
    this.seedInventorySort.set(value);
  }

  setSeedStartReportScope(value: SeedStartReportScope): void {
    this.seedStartReportScope.set(value);
  }

  setNoteFilter(value: string): void {
    this.noteFilter.set(value);
  }

  setNotePlotFilter(value: number | string | null): void {
    const plotId = value === null || value === '' ? null : Number(value);
    this.notePlotFilter.set(Number.isFinite(plotId) ? plotId : null);
  }

  setNoteFromDate(value: string): void {
    this.noteFromDate.set(value);
  }

  setNoteToDate(value: string): void {
    this.noteToDate.set(value);
  }

  setNoteSort(value: NoteSort): void {
    this.noteSort.set(value);
  }

  applyNotePrompt(prompt: NotePrompt): void {
    const current = this.noteForm().note.trim();
    const next = current ? `${current}\n\n${prompt.text}` : prompt.text;
    this.patchNoteForm({ note: next });
  }

  clearNoteFilters(): void {
    this.noteFilter.set('');
    this.notePlotFilter.set(null);
    this.noteFromDate.set('');
    this.noteToDate.set('');
    this.noteSort.set('newest');
  }
  filterNotesToday(): void {
    const today = this.toInputDate(new Date().toISOString());
    this.noteFromDate.set(today);
    this.noteToDate.set(today);
    this.noteSort.set('newest');
  }

  filterNotesThisWeek(): void {
    const today = this.localDate(this.toInputDate(new Date().toISOString()));
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const weekEnd = new Date(today.getFullYear(), today.getMonth(), weekStart.getDate() + 6);
    this.noteFromDate.set(this.toInputDate(weekStart.toISOString()));
    this.noteToDate.set(this.toInputDate(weekEnd.toISOString()));
    this.noteSort.set('newest');
  }

  filterNotesThisMonth(): void {
    const today = this.localDate(this.toInputDate(new Date().toISOString()));
    this.noteFromDate.set(this.toInputDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString()));
    this.noteToDate.set(this.toInputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()));
    this.noteSort.set('newest');
  }

  filterNotesSelectedArea(): void {
    const plotId = this.selectedPlotId();
    if (!plotId) {
      this.noteMessage.set('Choose a garden area first.');
      return;
    }

    this.notePlotFilter.set(plotId);
  }

  refreshNoteReport(): void {
    this.loadingNoteReport.set(true);
    this.noteMessage.set(null);
    this.service.getNoteReport(this.selectedYear(), this.notePlotFilter()).subscribe({
      next: report => this.noteReport.set(report),
      error: err => this.noteMessage.set(err.error ?? err.message ?? 'Could not load garden diary report.'),
      complete: () => this.loadingNoteReport.set(false)
    });
  }

  downloadFilteredNotesCsv(): void {
    this.downloadCsv(`garden-diary-filtered-${this.selectedYear()}.csv`, [
      ['Year', 'Date', 'Garden Area', 'Words', 'Note'],
      ...this.filteredNotes().map(note => [
        note.year ?? '',
        this.toInputDate(note.date),
        this.plotName(note.gardenPlotId),
        this.noteWordCount(note.note),
        note.note ?? ''
      ])
    ]);
  }

  downloadDiarySummaryCsv(): void {
    const areaRows = this.filteredNoteAreaSummaries().map(summary => [
      'Area',
      summary.name,
      summary.count,
      this.toInputDateOrEmpty(summary.latestDate),
      ''
    ]);
    const monthRows = this.noteMonthlySummaries().map(summary => [
      'Month',
      summary.label,
      summary.count,
      this.toInputDateOrEmpty(summary.latestDate),
      ''
    ]);
    const keywordRows = this.noteKeywordSummaries().map(summary => [
      'Keyword',
      summary.label,
      summary.count,
      '',
      ''
    ]);

    this.downloadCsv(`garden-diary-summary-${this.selectedYear()}.csv`, [
      ['Type', 'Label', 'Count', 'Latest Date', 'Notes'],
      ...areaRows,
      ...monthRows,
      ...keywordRows
    ]);
  }

  downloadSeedStartReportCsv(): void {
    this.downloadCsv(`garden-seed-starts-${this.selectedYear()}-${this.selectedReportMonth()}.csv`, [
      ['Date', 'Action', 'Method', 'Seed', 'Tray Locations', 'Garden Areas', 'Qty', 'Inventory Qty', 'Inventory Status', 'Warnings', 'Notes'],
      ...this.scopedMonthlySeedStartRows().map(row => [
        row.date ?? '',
        row.action,
        row.method,
        row.seedName,
        row.trayLocations.join('; '),
        row.gardenAreas.join('; '),
        row.qty ?? '',
        row.inventoryQty,
        row.inventoryStatus,
        row.warnings.join('; '),
        row.notes ?? ''
      ])
    ]);
  }

  downloadSeedStartSummaryCsv(): void {
    const trayRows = this.monthlyTraySummaries().map(tray => [
      'Tray',
      tray.trayName,
      tray.seedCount,
      tray.cellCount,
      '',
      tray.plannedCount,
      tray.startedCount,
      tray.successCount,
      tray.emptyCount ?? '',
      this.toInputDateOrEmpty(tray.firstDate),
      tray.seeds.join('; ')
    ]);
    const areaRows = this.monthlyAreaSummaries().map(area => [
      'Garden Area',
      area.areaName,
      area.seedCount,
      area.cellCount,
      area.totalQty,
      area.plannedCount,
      area.plantedCount,
      area.successCount,
      area.emptyCount ?? '',
      this.toInputDateOrEmpty(area.firstDate),
      area.seeds.join('; ')
    ]);

    this.downloadCsv(`garden-seed-start-summary-${this.selectedYear()}-${this.selectedReportMonth()}.csv`, [
      ['Type', 'Name', 'Seeds', 'Cells', 'Qty', 'Planned', 'Started/Planted', 'Success', 'Open Cells', 'First Date', 'Seed List'],
      ...trayRows,
      ...areaRows
    ]);
  }

  downloadDiaryReportCsv(): void {
    this.loadingNoteReport.set(true);
    this.noteMessage.set(null);
    this.service.exportNotesCsv(this.selectedYear(), this.notePlotFilter()).subscribe({
      next: blob => this.downloadBlob(`garden-diary-${this.selectedYear()}.csv`, blob),
      error: err => this.noteMessage.set(err.error ?? err.message ?? 'Could not export garden diary report.'),
      complete: () => this.loadingNoteReport.set(false)
    });
  }

  refreshHarvestReport(): void {
    this.loadingHarvestReport.set(true);
    this.harvestMessage.set(null);
    this.service.getHarvestReport(this.selectedYear()).subscribe({
      next: report => this.harvestReport.set(report),
      error: err => this.harvestMessage.set(err.error ?? err.message ?? 'Could not load harvest report.'),
      complete: () => this.loadingHarvestReport.set(false)
    });
  }

  filterNotesForKeyword(keyword: string): void {
    this.noteFilter.set(keyword);
  }

  filterNotesForMonth(summary: { label: string }): void {
    const [monthName, yearText] = summary.label.split(' ');
    const month = this.monthOptions.find(option => option.label === monthName)?.value ?? new Date().getMonth() + 1;
    const year = Number(yearText) || this.selectedYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    this.noteFromDate.set(this.toInputDate(start.toISOString()));
    this.noteToDate.set(this.toInputDate(end.toISOString()));
    this.noteSort.set('newest');
  }

  setHarvestPlotFilter(value: number | string | null): void {
    const plotId = value === null || value === '' ? null : Number(value);
    this.harvestPlotFilter.set(Number.isFinite(plotId) ? plotId : null);
  }

  setHarvestSeedFilter(value: number | string | null): void {
    const seedId = value === null || value === '' ? null : Number(value);
    this.harvestSeedFilter.set(Number.isFinite(seedId) ? seedId : null);
  }

  setHarvestFromDate(value: string): void {
    this.harvestFromDate.set(value);
  }

  setHarvestToDate(value: string): void {
    this.harvestToDate.set(value);
  }

  setHarvestSort(value: HarvestSort): void {
    this.harvestSort.set(value);
  }

  clearHarvestFilters(): void {
    this.harvestPlotFilter.set(null);
    this.harvestSeedFilter.set(null);
    this.harvestFromDate.set('');
    this.harvestToDate.set('');
    this.harvestSort.set('newest');
  }

  filterHarvestSelectedArea(): void {
    const plotId = this.selectedPlotId();
    if (!plotId) {
      this.harvestMessage.set('Choose a garden area first.');
      return;
    }

    this.harvestPlotFilter.set(plotId);
  }

  downloadFilteredHarvestsCsv(): void {
    this.downloadCsv(`garden-harvests-filtered-${this.selectedYear()}.csv`, [
      ['Year', 'Date', 'Garden Area', 'Crop', 'Quantity', 'Notes'],
      ...this.filteredHarvests().map(harvest => [
        harvest.year ?? '',
        this.toInputDate(harvest.harvestDate),
        harvest.gardenPlotName || this.plotName(harvest.gardenPlotId),
        harvest.seedName || this.seedName(harvest.seedId),
        harvest.quantity ?? '',
        harvest.notes ?? ''
      ])
    ]);
  }

  downloadHarvestReportCsv(): void {
    this.loadingHarvestReport.set(true);
    this.harvestMessage.set(null);
    this.service.exportHarvestsCsv(this.selectedYear()).subscribe({
      next: blob => this.downloadBlob(`garden-harvests-${this.selectedYear()}.csv`, blob),
      error: err => this.harvestMessage.set(err.error ?? err.message ?? 'Could not export harvest report.'),
      complete: () => this.loadingHarvestReport.set(false)
    });
  }
  useTodayForNote(): void {
    this.patchNoteForm({ date: this.toInputDate(new Date().toISOString()), year: this.selectedYear() });
  }
  useSelectedAreaForNote(): void {
    const plotId = this.selectedPlotId();
    if (!plotId) {
      this.noteMessage.set('Choose a garden area first.');
      return;
    }

    this.patchNoteForm({ gardenPlotId: plotId });
    this.noteMessage.set(null);
  }

  applyNoteTemplate(template: 'observation' | 'planting' | 'harvest' | 'maintenance'): void {
    const labels = {
      observation: 'Observation: ',
      planting: 'Planting: ',
      harvest: 'Harvest: ',
      maintenance: 'Maintenance: '
    };
    const current = this.noteForm().note.trim();
    this.patchNoteForm({ note: current ? `${current}\n${labels[template]}` : labels[template] });
  }

  formatDelta(value: number): string {
    if (value > 0) {
      return `+${value}`;
    }

    return String(value);
  }

  deltaTone(value: number): string {
    if (value > 0) {
      return 'text-emerald-700';
    }

    if (value < 0) {
      return 'text-rose-700';
    }

    return 'text-slate-500';
  }

  formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleDateString() : '-';
  }

  plotName(plotId: number | null): string {
    return this.plots().find(plot => plot.id === plotId)?.gardenName ?? 'Garden area';
  }

  monthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: 'long' });
  }

  planningInventoryTone(row: SeedStartMonthReportRow): string {
    return row.inventoryQty === 0
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : row.inventoryQty <= 2
        ? 'bg-orange-50 text-orange-800 border-orange-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }

  cellTone(cell: TrayCell): string {
    if (this.selectedSlotId() === cell.slotId) {
      return 'border-emerald-500 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-300';
    }

    if (cell.plant && this.selectedLegendSeedId() === cell.plant.seedId) {
      return 'app-token-border-accent app-token-selected-row app-token-ring';
    }

    if (!cell.plant) {
      return 'border-slate-200 bg-white text-slate-400';
    }

    if (cell.plant.success) {
      return 'border-emerald-300 bg-emerald-50 text-emerald-900';
    }

    if (cell.plant.planning) {
      return 'border-amber-300 bg-amber-50 text-amber-900';
    }

    return 'app-token-soft-surface app-token-text-strong';
  }

  selectCell(cell: TrayCell): void {
    const brush = this.assignmentForm();
    this.selectedSlotId.set(cell.slotId);
    this.assignmentMessage.set(null);

    if (this.trayAssignmentMode() === 'paint' && brush.seedId) {
      this.assignmentForm.set(brush);
      this.saveAssignment();
      return;
    }

    this.assignmentForm.set({
      seedId: cell.plant?.seedId ?? null,
      plantDate: this.toInputDate(cell.plant?.plantDate ?? new Date().toISOString()),
      planning: cell.plant?.planning ?? false,
      success: cell.plant?.success ?? false
    });
  }

  setAssignmentSeed(value: number | string | null): void {
    const seedId = value === null || value === '' ? null : Number(value);
    this.assignmentForm.update(form => ({ ...form, seedId: Number.isFinite(seedId) ? seedId : null }));
  }

  setAssignmentDate(value: string): void {
    this.assignmentForm.update(form => ({ ...form, plantDate: value }));
  }

  setAssignmentPlanning(value: boolean): void {
    this.assignmentForm.update(form => ({ ...form, planning: value }));
  }

  setAssignmentSuccess(value: boolean): void {
    this.assignmentForm.update(form => ({ ...form, success: value }));
  }

  setAssignmentStatus(value: 'planned' | 'started' | 'success'): void {
    this.assignmentForm.update(form => ({
      ...form,
      planning: value === 'planned',
      success: value === 'success'
    }));
  }

  useSelectedSeedDefaultDate(): void {
    const seedId = this.assignmentForm().seedId;
    if (!seedId) {
      this.assignmentMessage.set('Choose a seed before using its start date.');
      return;
    }

    const seed = this.seeds().find(item => item.id === seedId);
    const date = this.toInputDateOrEmpty(seed?.plantDate ?? null);
    if (!date) {
      this.assignmentMessage.set(`${seed?.name ?? 'Selected seed'} does not have a start date.`);
      return;
    }

    this.assignmentForm.update(form => ({ ...form, plantDate: date, planning: true, success: false }));
    this.assignmentMessage.set(`Brush date set from ${seed?.name ?? 'selected seed'}.`);
  }

  clearAssignmentBrush(): void {
    this.assignmentForm.set({
      seedId: null,
      plantDate: this.toInputDate(new Date().toISOString()),
      planning: false,
      success: false
    });
    this.selectedLegendSeedId.set(null);
    this.assignmentMessage.set('Assignment brush cleared.');
  }

  setTrayAssignmentMode(value: TrayAssignmentMode): void {
    this.trayAssignmentMode.set(value);
  }

  useSeedForTray(seed: GardenSeed): void {
    this.assignmentForm.update(form => ({
      ...form,
      seedId: seed.id,
      plantDate: this.toInputDateOrEmpty(seed.plantDate) || form.plantDate || this.toInputDate(new Date().toISOString()),
      planning: true
    }));
    this.selectedLegendSeedId.set(seed.id);
    this.trayAssignmentMode.set('paint');
    this.assignmentMessage.set(`${seed.name} selected for tray painting.`);
  }

  useSeedForBed(seed: GardenSeed): void {
    this.plotPlantForm.update(form => ({
      ...form,
      seedId: seed.id,
      plantDate: this.toInputDateOrEmpty(seed.plantDate) || form.plantDate || this.toInputDate(new Date().toISOString()),
      planning: true,
      qty: form.qty ?? 1
    }));
    this.selectedPlotLegendSeedId.set(seed.id);
    this.plotAssignmentMode.set('paint');
    this.plotMessage.set(`${seed.name} selected for bed painting.`);
  }

  saveAssignment(): void {
    const tray = this.selectedTray();
    const slotId = this.selectedSlotId();
    const form = this.assignmentForm();
    if (!tray || !slotId) {
      this.assignmentMessage.set('Choose a tray cell first.');
      return;
    }

    if (!form.seedId) {
      this.assignmentMessage.set('Choose a seed before saving.');
      return;
    }

    const payload = this.trayAssignmentPayload(tray.id, slotId, form);

    const existing = this.selectedAssignment();
    const request = existing
      ? this.service.updateTrayPlant(existing.id, payload)
      : this.service.createTrayPlant(payload);

    this.savingAssignment.set(true);
    this.assignmentMessage.set(null);
    request.subscribe({
      next: saved => {
        this.upsertTrayPlants([saved]);
        this.assignmentMessage.set(`${this.slotLabel(slotId)} saved.`);
      },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not save tray assignment.'),
      complete: () => this.savingAssignment.set(false)
    });
  }

  clearAssignment(): void {
    const existing = this.selectedAssignment();
    if (!existing) {
      this.assignmentForm.set({
        seedId: null,
        plantDate: this.toInputDate(new Date().toISOString()),
        planning: false,
        success: false
      });
      return;
    }

    this.savingAssignment.set(true);
    this.assignmentMessage.set(null);
    this.service.deleteTrayPlant(existing.id).subscribe({
      next: () => {
        this.trayPlants.update(items => items.filter(item => item.id !== existing.id));
        this.assignmentForm.set({
          seedId: null,
          plantDate: this.toInputDate(new Date().toISOString()),
          planning: false,
          success: false
        });
        this.assignmentMessage.set(`${this.slotLabel(existing.traySlotId)} cleared.`);
      },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not clear tray assignment.'),
      complete: () => this.savingAssignment.set(false)
    });
  }

  useSeedFromLegend(item: TrayLegendItem): void {
    this.assignmentForm.update(form => ({ ...form, seedId: item.seedId }));
    this.selectedLegendSeedId.set(item.seedId);
    this.trayAssignmentMode.set('paint');
    this.assignmentMessage.set(`${item.seedName} selected for tray painting.`);
  }

  focusLegendSeed(item: TrayLegendItem): void {
    this.selectedLegendSeedId.set(this.selectedLegendSeedId() === item.seedId ? null : item.seedId);
    this.assignmentForm.update(form => ({ ...form, seedId: item.seedId }));
  }

  clearLegendFocus(): void {
    this.selectedLegendSeedId.set(null);
  }

  selectTraySlot(slotId: number): void {
    const cell = this.trayRows().flat().find(item => item.slotId === slotId);
    if (!cell) {
      this.assignmentMessage.set('Could not find that tray cell.');
      return;
    }

    this.trayAssignmentMode.set('select');
    this.selectCell(cell);
  }

  copySelectedAssignment(): void {
    const assignment = this.selectedAssignment();
    if (!assignment) {
      this.assignmentMessage.set('Choose a filled cell to copy.');
      return;
    }

    this.assignmentForm.set({
      seedId: assignment.seedId,
      plantDate: this.toInputDate(assignment.plantDate),
      planning: assignment.planning,
      success: assignment.success
    });
    this.trayAssignmentMode.set('paint');
    this.assignmentMessage.set(`${assignment.seedName ?? 'Seed'} copied to the assignment brush.`);
  }

  fillSelectedRow(): void {
    const cell = this.selectedCell();
    const tray = this.selectedTray();
    const form = this.assignmentForm();
    if (!cell || !tray) {
      this.assignmentMessage.set('Choose a tray cell first.');
      return;
    }

    if (!form.seedId) {
      this.assignmentMessage.set('Choose a seed before filling a row.');
      return;
    }

    const row = this.trayRows().find(items => items.some(item => item.slotId === cell.slotId)) ?? [];
    if (!row.length) {
      this.assignmentMessage.set('Could not find the selected row.');
      return;
    }

    const requests = row.map(item => {
      const payload = this.trayAssignmentPayload(tray.id, item.slotId, form);
      return item.plant
        ? this.service.updateTrayPlant(item.plant.id, payload)
        : this.service.createTrayPlant(payload);
    });

    this.savingAssignment.set(true);
    this.assignmentMessage.set(null);
    forkJoin(requests).subscribe({
      next: savedItems => {
        this.upsertTrayPlants(savedItems);
        this.assignmentMessage.set(`${cell.row} row filled with ${this.selectedAssignmentSeedName()}.`);
      },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not fill tray row.'),
      complete: () => this.savingAssignment.set(false)
    });
  }

  clearSelectedRow(): void {
    const cell = this.selectedCell();
    if (!cell) {
      this.assignmentMessage.set('Choose a tray cell first.');
      return;
    }

    const rowAssignments = (this.trayRows().find(items => items.some(item => item.slotId === cell.slotId)) ?? [])
      .map(item => item.plant)
      .filter((item): item is GardenSeedTrayPlant => !!item);

    if (!rowAssignments.length) {
      this.assignmentMessage.set(`${cell.row} row is already empty.`);
      return;
    }

    this.savingAssignment.set(true);
    this.assignmentMessage.set(null);
    forkJoin(rowAssignments.map(item => this.service.deleteTrayPlant(item.id))).subscribe({
      next: () => {
        const deletedIds = new Set(rowAssignments.map(item => item.id));
        this.trayPlants.update(items => items.filter(item => !deletedIds.has(item.id)));
        this.assignmentMessage.set(`${cell.row} row cleared.`);
      },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not clear tray row.'),
      complete: () => this.savingAssignment.set(false)
    });
  }

  fillSelectedColumn(): void {
    const cell = this.selectedCell();
    if (!cell) {
      this.assignmentMessage.set('Choose a tray cell first.');
      return;
    }

    const columnCells = this.trayRows()
      .map(row => row.find(item => item.column === cell.column))
      .filter((item): item is TrayCell => !!item);
    this.saveTrayCells(columnCells, `Column ${cell.column}`);
  }

  fillSelectedRowEmpty(): void {
    const cell = this.selectedCell();
    if (!cell) {
      this.assignmentMessage.set('Choose a tray cell first.');
      return;
    }

    const row = (this.trayRows().find(items => items.some(item => item.slotId === cell.slotId)) ?? [])
      .filter(item => !item.plant);
    this.saveTrayCells(row, `${cell.row} empty cells`);
  }

  fillSelectedColumnEmpty(): void {
    const cell = this.selectedCell();
    if (!cell) {
      this.assignmentMessage.set('Choose a tray cell first.');
      return;
    }

    const columnCells = this.trayRows()
      .map(row => row.find(item => item.column === cell.column))
      .filter((item): item is TrayCell => !!item)
      .filter(item => !item.plant);
    this.saveTrayCells(columnCells, `Column ${cell.column} empty cells`);
  }

  clearSelectedColumn(): void {
    const cell = this.selectedCell();
    if (!cell) {
      this.assignmentMessage.set('Choose a tray cell first.');
      return;
    }

    const columnAssignments = this.trayRows()
      .map(row => row.find(item => item.column === cell.column)?.plant ?? null)
      .filter((item): item is GardenSeedTrayPlant => !!item);
    this.clearTrayAssignments(columnAssignments, `Column ${cell.column}`);
  }

  clearSelectedSeedFromTray(): void {
    const seedId = this.assignmentForm().seedId ?? this.selectedLegendSeedId();
    if (!seedId) {
      this.assignmentMessage.set('Choose a seed from the brush or legend first.');
      return;
    }

    const seedName = this.seeds().find(seed => seed.id === seedId)?.name ?? 'Selected seed';
    const assignments = this.currentTrayPlants().filter(plant => plant.seedId === seedId);
    this.clearTrayAssignments(assignments, seedName);
  }

  editSeed(seed: GardenSeed): void {
    this.seedForm.set({
      id: seed.id,
      name: seed.name,
      description: seed.description ?? '',
      plantDate: this.toInputDateOrEmpty(seed.plantDate),
      indoor: seed.indoor,
      secondPlantDate: this.toInputDateOrEmpty(seed.secondPlantDate),
      notes: seed.notes ?? '',
      qty: seed.inventory?.qty ?? 0,
      reorder: seed.inventory?.reorder ?? false
    });
    this.seedMessage.set(null);
  }

  newSeed(): void {
    this.seedForm.set(this.emptySeedForm());
    this.seedMessage.set(null);
  }

  patchSeedForm(patch: Partial<SeedForm>): void {
    this.seedForm.update(form => ({ ...form, ...patch }));
  }

  seedUsageCount(seed: GardenSeed): number {
    return this.seedTrayUsageCount(seed) + this.seedBedUsageCount(seed);
  }

  seedTrayUsageCount(seed: GardenSeed): number {
    return this.trayPlants().filter(plant => plant.seedId === seed.id && plant.year === this.selectedYear()).length;
  }

  seedBedUsageCount(seed: GardenSeed): number {
    return this.plotPlants()
      .filter(plant => plant.seedId === seed.id && plant.year === this.selectedYear())
      .reduce((sum, plant) => sum + (plant.qty ?? 1), 0);
  }

  seedUsageLabel(seed: GardenSeed): string {
    return `${this.seedTrayUsageCount(seed)} tray / ${this.seedBedUsageCount(seed)} bed`;
  }

  seedStockTone(seed: GardenSeed): string {
    const qty = seed.inventory?.qty ?? 0;
    if (seed.inventory?.reorder) {
      return 'bg-amber-100 text-amber-800';
    }

    if (qty === 0) {
      return 'bg-rose-100 text-rose-700';
    }

    if (qty <= 2) {
      return 'bg-orange-100 text-orange-800';
    }

    return 'bg-emerald-100 text-emerald-800';
  }

  seedStockLabel(seed: GardenSeed): string {
    const qty = seed.inventory?.qty ?? 0;
    if (seed.inventory?.reorder) {
      return 'Reorder';
    }

    if (qty === 0) {
      return 'Empty';
    }

    return qty <= 2 ? 'Low' : 'OK';
  }

  adjustSeedQuantity(seed: GardenSeed, delta: number): void {
    const current = seed.inventory?.qty ?? 0;
    this.saveSeedInventory(seed, Math.max(0, current + delta), seed.inventory?.reorder ?? false);
  }

  setSeedQuantity(seed: GardenSeed, value: string | number): void {
    const qty = Math.max(0, Number(value) || 0);
    this.saveSeedInventory(seed, qty, seed.inventory?.reorder ?? false);
  }

  setSeedReorder(seed: GardenSeed, value: boolean): void {
    this.saveSeedInventory(seed, seed.inventory?.qty ?? 0, value);
  }

  markSeedEmpty(seed: GardenSeed): void {
    this.saveSeedInventory(seed, 0, seed.inventory?.reorder ?? true);
  }

  markSeedStocked(seed: GardenSeed): void {
    const qty = seed.inventory?.qty ?? 0;
    this.saveSeedInventory(seed, qty > 0 ? qty : 1, false);
  }

  saveSeed(): void {
    const form = this.seedForm();
    if (!form.name.trim()) {
      this.seedMessage.set('Seed name is required.');
      return;
    }

    const payload: GardenSeedUpsert = {
      name: form.name.trim(),
      description: this.nullIfBlank(form.description),
      plantDate: this.nullIfBlank(form.plantDate),
      indoor: form.indoor,
      secondPlantDate: this.nullIfBlank(form.secondPlantDate),
      notes: this.nullIfBlank(form.notes)
    };
    const request = form.id ? this.service.updateSeed(form.id, payload) : this.service.createSeed(payload);

    this.savingSeed.set(true);
    this.seedMessage.set(null);
    request.subscribe({
      next: seed => {
        const inventory = { qty: Math.max(0, Number(form.qty) || 0), reorder: form.reorder };
        this.service.updateSeedInventory(seed.id, inventory).subscribe({
          next: savedInventory => {
            const saved = { ...seed, inventory: savedInventory };
            this.seeds.update(items => form.id
              ? items.map(item => item.id === saved.id ? saved : item)
              : [...items, saved]);
            this.seedForm.set({
              ...this.seedForm(),
              id: saved.id,
              qty: saved.inventory?.qty ?? 0,
              reorder: saved.inventory?.reorder ?? false
            });
            this.seedMessage.set(`${saved.name} saved.`);
          },
          error: err => this.seedMessage.set(err.error ?? err.message ?? 'Seed saved, but inventory could not be updated.'),
          complete: () => this.savingSeed.set(false)
        });
      },
      error: err => {
        this.seedMessage.set(err.error ?? err.message ?? 'Could not save seed.');
        this.savingSeed.set(false);
      }
    });
  }

  deleteSeed(seed: GardenSeed): void {
    if (!confirm(`Delete ${seed.name}?`)) {
      return;
    }

    this.savingSeed.set(true);
    this.seedMessage.set(null);
    this.service.deleteSeed(seed.id).subscribe({
      next: () => {
        this.seeds.update(items => items.filter(item => item.id !== seed.id));
        if (this.seedForm().id === seed.id) {
          this.newSeed();
        }
        this.seedMessage.set(`${seed.name} deleted.`);
      },
      error: err => this.seedMessage.set(err.error ?? err.message ?? 'Could not delete seed.'),
      complete: () => this.savingSeed.set(false)
    });
  }

  private saveSeedInventory(seed: GardenSeed, qty: number, reorder: boolean): void {
    this.savingSeed.set(true);
    this.seedMessage.set(null);
    this.service.updateSeedInventory(seed.id, { qty, reorder }).subscribe({
      next: inventory => {
        this.seeds.update(items => items.map(item => item.id === seed.id ? { ...item, inventory } : item));
        if (this.seedForm().id === seed.id) {
          this.seedForm.update(form => ({ ...form, qty: inventory.qty, reorder: inventory.reorder }));
        }
        this.seedMessage.set(`${seed.name} inventory updated.`);
      },
      error: err => this.seedMessage.set(err.error ?? err.message ?? 'Could not update seed inventory.'),
      complete: () => this.savingSeed.set(false)
    });
  }

  editPlot(plot: GardenPlot): void {
    this.plotForm.set({ id: plot.id, gardenName: plot.gardenName, description: plot.description ?? '' });
    this.selectedPlotId.set(plot.id);
    this.syncPlotDimensionForm(plot);
    this.plotMessage.set(null);
  }

  newPlot(): void {
    this.plotForm.set({ id: null, gardenName: '', description: '' });
    this.plotMessage.set(null);
  }

  patchPlotForm(patch: Partial<PlotForm>): void {
    this.plotForm.update(form => ({ ...form, ...patch }));
  }

  patchPlotDimensionForm(patch: Partial<PlotDimensionForm>): void {
    this.plotDimensionForm.update(form => ({
      ...form,
      ...patch
    }));
  }

  savePlot(): void {
    const form = this.plotForm();
    if (!form.gardenName.trim()) {
      this.plotMessage.set('Garden area name is required.');
      return;
    }

    const payload: GardenPlotUpsert = {
      gardenName: form.gardenName.trim(),
      description: this.nullIfBlank(form.description)
    };
    const request = form.id ? this.service.updatePlot(form.id, payload) : this.service.createPlot(payload);

    this.savingPlot.set(true);
    this.plotMessage.set(null);
    request.subscribe({
      next: saved => {
        const existing = this.plots().find(plot => plot.id === saved.id);
        const dimensions = saved.dimensions ?? existing?.dimensions ?? this.selectedPlot()?.dimensions ?? null;
        const merged = { ...saved, dimensions };
        this.plots.update(items => form.id
          ? items.map(item => item.id === merged.id ? merged : item)
          : [...items, merged]);
        this.selectedPlotId.set(merged.id);
        this.plotForm.set({ id: merged.id, gardenName: merged.gardenName, description: merged.description ?? '' });
        this.plotMessage.set(`${merged.gardenName} saved.`);
      },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not save garden area.'),
      complete: () => this.savingPlot.set(false)
    });
  }

  savePlotDimensions(): void {
    const form = this.plotDimensionForm();
    const payload: GardenPlotDimensionUpsert = {
      traySlotsWide: Math.max(1, Math.trunc(Number(form.traySlotsWide) || 1)),
      slotsDeep: Math.max(1, Math.trunc(Number(form.slotsDeep) || 1)),
      notes: this.nullIfBlank(form.notes)
    };

    this.savingPlotDimension.set(true);
    this.plotMessage.set(null);
    this.service.createPlotDimension(payload).subscribe({
      next: saved => {
        this.plots.update(items => items.map(plot => ({ ...plot, dimensions: saved })));
        this.plotDimensionForm.set({
          traySlotsWide: saved.traySlotsWide,
          slotsDeep: saved.slotsDeep,
          notes: saved.notes ?? ''
        });
        this.selectedPlotSlotId.set(null);
        this.plotMessage.set(`Bed grid set to ${saved.slotsDeep} rows x ${saved.traySlotsWide} columns.`);
      },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not save bed grid.'),
      complete: () => this.savingPlotDimension.set(false)
    });
  }

  selectPlotCell(cell: PlotCell): void {
    const brush = this.plotPlantForm();
    this.selectedPlotSlotId.set(cell.slotId);
    this.plotMessage.set(null);

    if (this.plotAssignmentMode() === 'paint' && brush.seedId) {
      this.plotPlantForm.set(brush);
      this.savePlotPlant();
      return;
    }

    this.plotPlantForm.set({
      seedId: cell.plant?.seedId ?? null,
      plantDate: this.toInputDateOrEmpty(cell.plant?.plantDate),
      planning: cell.plant?.planning ?? true,
      success: cell.plant?.success ?? false,
      qty: cell.plant?.qty ?? 1
    });
  }

  useSeedFromPlotLegend(item: PlotLegendItem): void {
    this.selectedPlotLegendSeedId.set(item.seedId);
    this.plotPlantForm.update(form => ({ ...form, seedId: item.seedId, qty: form.qty ?? 1 }));
    this.plotAssignmentMode.set('paint');
    this.plotMessage.set(`${item.seedName} selected for bed painting.`);
  }

  setPlotAssignmentMode(value: PlotAssignmentMode): void {
    this.plotAssignmentMode.set(value);
  }

  setPlotCellFilter(value: PlotCellFilter): void {
    this.plotCellFilter.set(value);
  }

  filterPlotByLegendSeed(item: PlotLegendItem): void {
    this.focusPlotLegendSeed(item);
    this.plotCellFilter.set('all');
  }

  setPlotPlantStatus(value: 'planned' | 'planted' | 'success'): void {
    this.plotPlantForm.update(form => ({
      ...form,
      planning: value === 'planned',
      success: value === 'success'
    }));
  }

  useSelectedPlotSeedDefaultDate(): void {
    const seedId = this.plotPlantForm().seedId;
    if (!seedId) {
      this.plotMessage.set('Choose a seed before using its start date.');
      return;
    }

    const seed = this.seeds().find(item => item.id === seedId);
    const date = this.toInputDateOrEmpty(seed?.plantDate ?? null) || this.toInputDateOrEmpty(seed?.secondPlantDate ?? null);
    if (!date) {
      this.plotMessage.set(`${seed?.name ?? 'Selected seed'} does not have a start date.`);
      return;
    }

    this.plotPlantForm.update(form => ({ ...form, plantDate: date, planning: true, success: false, qty: form.qty ?? 1 }));
    this.plotMessage.set(`Bed brush date set from ${seed?.name ?? 'selected seed'}.`);
  }

  clearPlotBrush(): void {
    this.plotPlantForm.set({
      seedId: null,
      plantDate: this.toInputDate(new Date().toISOString()),
      planning: true,
      success: false,
      qty: 1
    });
    this.selectedPlotLegendSeedId.set(null);
    this.plotMessage.set('Bed brush cleared.');
  }

  focusPlotLegendSeed(item: PlotLegendItem): void {
    this.selectedPlotLegendSeedId.set(this.selectedPlotLegendSeedId() === item.seedId ? null : item.seedId);
    this.plotPlantForm.update(form => ({ ...form, seedId: item.seedId }));
  }

  clearPlotLegendFocus(): void {
    this.selectedPlotLegendSeedId.set(null);
  }

  selectPlotSlot(slotId: number): void {
    const cell = this.plotRows().flat().find(item => item.slotId === slotId);
    if (!cell) {
      this.plotMessage.set('Could not find that bed cell.');
      return;
    }

    this.plotAssignmentMode.set('select');
    this.selectPlotCell(cell);
  }

  setPlotPlantSeed(value: number | string | null): void {
    const seedId = value === null || value === '' ? null : Number(value);
    this.plotPlantForm.update(form => ({ ...form, seedId: Number.isFinite(seedId) ? seedId : null }));
  }

  patchPlotPlantForm(patch: Partial<PlotPlantForm>): void {
    this.plotPlantForm.update(form => ({ ...form, ...patch }));
  }

  savePlotPlant(): void {
    const plot = this.selectedPlot();
    const slotId = this.selectedPlotSlotId();
    const form = this.plotPlantForm();
    if (!plot || !slotId) {
      this.plotMessage.set('Choose a bed cell first.');
      return;
    }

    if (!form.seedId) {
      this.plotMessage.set('Choose a seed before saving.');
      return;
    }

    const payload = this.plotPlantPayload(plot.id, slotId, form);
    const existing = this.selectedPlotAssignment();
    const request = existing
      ? this.service.updatePlotPlant(existing.id, payload)
      : this.service.createPlotPlant(payload);

    this.savingPlotPlant.set(true);
    this.plotMessage.set(null);
    request.subscribe({
      next: saved => {
        this.plotPlants.update(items => existing
          ? items.map(item => item.id === saved.id ? saved : item)
          : [...items, saved]);
        this.plotMessage.set(`${this.plotSlotLabel(slotId)} saved.`);
      },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not save bed assignment.'),
      complete: () => this.savingPlotPlant.set(false)
    });
  }

  clearPlotPlant(): void {
    const existing = this.selectedPlotAssignment();
    if (!existing) {
      this.plotPlantForm.set({ seedId: null, plantDate: '', planning: true, success: false, qty: 1 });
      return;
    }

    this.savingPlotPlant.set(true);
    this.plotMessage.set(null);
    this.service.deletePlotPlant(existing.id).subscribe({
      next: () => {
        this.plotPlants.update(items => items.filter(item => item.id !== existing.id));
        this.plotPlantForm.set({ seedId: null, plantDate: '', planning: true, success: false, qty: 1 });
        this.plotMessage.set(`${this.plotSlotLabel(existing.traySlotId)} cleared.`);
      },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not clear bed assignment.'),
      complete: () => this.savingPlotPlant.set(false)
    });
  }

  fillSelectedPlotRow(): void {
    const cell = this.selectedPlotCell();
    const plot = this.selectedPlot();
    const form = this.plotPlantForm();
    if (!cell || !plot) {
      this.plotMessage.set('Choose a bed cell first.');
      return;
    }

    if (!form.seedId) {
      this.plotMessage.set('Choose a seed before filling a bed row.');
      return;
    }

    const row = this.plotRows().find(items => items.some(item => item.slotId === cell.slotId)) ?? [];
    this.savePlotCells(row, `${cell.row} row`);
  }

  fillSelectedPlotColumn(): void {
    const cell = this.selectedPlotCell();
    if (!cell) {
      this.plotMessage.set('Choose a bed cell first.');
      return;
    }

    if (!this.plotPlantForm().seedId) {
      this.plotMessage.set('Choose a seed before filling a bed column.');
      return;
    }

    const column = this.plotRows()
      .map(row => row.find(item => item.column === cell.column))
      .filter((item): item is PlotCell => !!item);
    this.savePlotCells(column, `Column ${cell.column}`);
  }

  fillSelectedPlotRowEmpty(): void {
    const cell = this.selectedPlotCell();
    if (!cell) {
      this.plotMessage.set('Choose a bed cell first.');
      return;
    }

    const row = (this.plotRows().find(items => items.some(item => item.slotId === cell.slotId)) ?? [])
      .filter(item => !item.plant);
    this.savePlotCells(row, `${cell.row} empty cells`);
  }

  fillSelectedPlotColumnEmpty(): void {
    const cell = this.selectedPlotCell();
    if (!cell) {
      this.plotMessage.set('Choose a bed cell first.');
      return;
    }

    const column = this.plotRows()
      .map(row => row.find(item => item.column === cell.column))
      .filter((item): item is PlotCell => !!item)
      .filter(item => !item.plant);
    this.savePlotCells(column, `Column ${cell.column} empty cells`);
  }

  clearSelectedPlotRow(): void {
    const cell = this.selectedPlotCell();
    if (!cell) {
      this.plotMessage.set('Choose a bed cell first.');
      return;
    }

    const rowAssignments = (this.plotRows().find(items => items.some(item => item.slotId === cell.slotId)) ?? [])
      .map(item => item.plant)
      .filter((item): item is GardenPlotPlant => !!item);
    this.clearPlotAssignments(rowAssignments, `${cell.row} row`);
  }

  clearSelectedPlotColumn(): void {
    const cell = this.selectedPlotCell();
    if (!cell) {
      this.plotMessage.set('Choose a bed cell first.');
      return;
    }

    const columnAssignments = this.plotRows()
      .map(row => row.find(item => item.column === cell.column)?.plant ?? null)
      .filter((item): item is GardenPlotPlant => !!item);
    this.clearPlotAssignments(columnAssignments, `Column ${cell.column}`);
  }

  clearSelectedSeedFromPlot(): void {
    const seedId = this.plotPlantForm().seedId ?? this.selectedPlotLegendSeedId();
    if (!seedId) {
      this.plotMessage.set('Choose a seed from the bed form or legend first.');
      return;
    }

    const seedName = this.seeds().find(seed => seed.id === seedId)?.name ?? 'Selected seed';
    const assignments = this.currentPlotPlants().filter(plant => plant.seedId === seedId);
    this.clearPlotAssignments(assignments, seedName);
  }

  editNote(note: GardenNote): void {
    this.noteForm.set({
      id: note.id,
      gardenPlotId: note.gardenPlotId,
      date: this.toInputDate(note.date),
      year: note.year ?? this.selectedYear(),
      note: note.note ?? ''
    });
    this.noteMessage.set(null);
  }
  duplicateNote(note: GardenNote): void {
    this.noteForm.set({
      id: null,
      gardenPlotId: note.gardenPlotId,
      date: this.toInputDate(new Date().toISOString()),
      year: this.selectedYear(),
      note: note.note ?? ''
    });
    this.noteMessage.set('Copied note into a new diary entry.');
  }

  newNote(): void {
    this.noteForm.set(this.emptyNoteForm());
    this.noteMessage.set(null);
  }

  patchNoteForm(patch: Partial<NoteForm>): void {
    this.noteForm.update(form => ({ ...form, ...patch }));
  }

  setNotePlot(value: number | string | null): void {
    const plotId = value === null || value === '' ? null : Number(value);
    this.patchNoteForm({ gardenPlotId: Number.isFinite(plotId) ? plotId : null });
  }

  saveNote(): void {
    const form = this.noteForm();
    if (!form.gardenPlotId) {
      this.noteMessage.set('Choose a garden area for this note.');
      return;
    }
    if (!form.note.trim()) {
      this.noteMessage.set('Enter a diary note before saving.');
      return;
    }

    const payload: GardenNoteUpsert = {
      gardenPlotId: form.gardenPlotId,
      note: this.nullIfBlank(form.note),
      date: form.date || this.toInputDate(new Date().toISOString()),
      year: form.year ?? this.selectedYear()
    };
    const request = form.id ? this.service.updateNote(form.id, payload) : this.service.createNote(payload);

    this.savingNote.set(true);
    this.noteMessage.set(null);
    request.subscribe({
      next: saved => {
        this.notes.update(items => form.id
          ? items.map(item => item.id === saved.id ? saved : item)
          : [saved, ...items]);
        this.noteForm.set({
          id: saved.id,
          gardenPlotId: saved.gardenPlotId,
          date: this.toInputDate(saved.date),
          year: saved.year ?? this.selectedYear(),
          note: saved.note ?? ''
        });
        this.noteMessage.set('Garden note saved.');
        this.refreshNoteReport();
      },
      error: err => this.noteMessage.set(err.error ?? err.message ?? 'Could not save garden note.'),
      complete: () => this.savingNote.set(false)
    });
  }

  deleteNote(note: GardenNote): void {
    if (!confirm('Delete this garden note?')) {
      return;
    }

    this.savingNote.set(true);
    this.noteMessage.set(null);
    this.service.deleteNote(note.id).subscribe({
      next: () => {
        this.notes.update(items => items.filter(item => item.id !== note.id));
        if (this.noteForm().id === note.id) {
          this.newNote();
        }
        this.noteMessage.set('Garden note deleted.');
        this.refreshNoteReport();
      },
      error: err => this.noteMessage.set(err.error ?? err.message ?? 'Could not delete garden note.'),
      complete: () => this.savingNote.set(false)
    });
  }

  newHarvest(): void {
    this.harvestForm.set(this.emptyHarvestForm());
    this.harvestMessage.set(null);
  }

  editHarvest(harvest: GardenHarvest): void {
    this.harvestForm.set({
      id: harvest.id,
      gardenPlotId: harvest.gardenPlotId,
      seedId: harvest.seedId,
      harvestDate: this.toInputDate(harvest.harvestDate),
      year: harvest.year ?? this.selectedYear(),
      quantity: harvest.quantity,
      notes: harvest.notes ?? ''
    });
    this.harvestMessage.set(null);
  }

  patchHarvestForm(patch: Partial<HarvestForm>): void {
    this.harvestForm.update(form => ({ ...form, ...patch }));
  }

  setHarvestPlot(value: number | string | null): void {
    const plotId = value === null || value === '' ? null : Number(value);
    this.patchHarvestForm({ gardenPlotId: Number.isFinite(plotId) ? plotId : null });
  }

  setHarvestSeed(value: number | string | null): void {
    const seedId = value === null || value === '' ? null : Number(value);
    this.patchHarvestForm({ seedId: Number.isFinite(seedId) ? seedId : null });
  }

  useSelectedAreaForHarvest(): void {
    const plotId = this.selectedPlotId();
    if (!plotId) {
      this.harvestMessage.set('Choose a garden area first.');
      return;
    }

    this.patchHarvestForm({ gardenPlotId: plotId });
  }

  saveHarvest(): void {
    const form = this.harvestForm();
    if (!form.gardenPlotId) {
      this.harvestMessage.set('Choose a garden area for this harvest.');
      return;
    }

    if (!form.seedId) {
      this.harvestMessage.set('Choose a seed or crop for this harvest.');
      return;
    }

    const payload: GardenHarvestUpsert = {
      gardenPlotId: form.gardenPlotId,
      seedId: form.seedId,
      harvestDate: form.harvestDate || this.toInputDate(new Date().toISOString()),
      year: form.year ?? this.selectedYear(),
      quantity: form.quantity === null || form.quantity === undefined ? null : Number(form.quantity),
      notes: this.nullIfBlank(form.notes)
    };
    const request = form.id ? this.service.updateHarvest(form.id, payload) : this.service.createHarvest(payload);

    this.savingHarvest.set(true);
    this.harvestMessage.set(null);
    request.subscribe({
      next: saved => {
        this.harvests.update(items => form.id
          ? items.map(item => item.id === saved.id ? saved : item)
          : [saved, ...items]);
        this.harvestForm.set({
          id: saved.id,
          gardenPlotId: saved.gardenPlotId,
          seedId: saved.seedId,
          harvestDate: this.toInputDate(saved.harvestDate),
          year: saved.year ?? this.selectedYear(),
          quantity: saved.quantity,
          notes: saved.notes ?? ''
        });
        this.harvestMessage.set('Harvest saved.');
        this.refreshHarvestReport();
      },
      error: err => this.harvestMessage.set(err.error ?? err.message ?? 'Could not save harvest.'),
      complete: () => this.savingHarvest.set(false)
    });
  }

  deleteHarvest(harvest: GardenHarvest): void {
    if (!confirm('Delete this harvest entry?')) {
      return;
    }

    this.savingHarvest.set(true);
    this.harvestMessage.set(null);
    this.service.deleteHarvest(harvest.id).subscribe({
      next: () => {
        this.harvests.update(items => items.filter(item => item.id !== harvest.id));
        if (this.harvestForm().id === harvest.id) {
          this.newHarvest();
        }
        this.harvestMessage.set('Harvest deleted.');
        this.refreshHarvestReport();
      },
      error: err => this.harvestMessage.set(err.error ?? err.message ?? 'Could not delete harvest.'),
      complete: () => this.savingHarvest.set(false)
    });
  }
  editTask(task: ScheduledTask): void {
    this.taskForm.set({
      id: task.taskID,
      title: task.title,
      description: task.description ?? '',
      isActive: task.isActive,
      scheduleType: task.scheduleType,
      recurrencePattern: task.recurrencePattern,
      startDate: this.toInputDate(task.startDate),
      endDate: this.toInputDateOrEmpty(task.endDate)
    });
    this.taskMessage.set(null);
  }

  newTask(): void {
    this.taskForm.set(this.emptyTaskForm());
    this.taskMessage.set(null);
  }

  patchTaskForm(patch: Partial<GardeningTaskForm>): void {
    this.taskForm.update(form => ({ ...form, ...patch }));
  }

  applyTaskTemplate(template: 'daily' | 'weekly' | 'monthly' | 'seasonal'): void {
    const today = this.toInputDate(new Date().toISOString());
    const current = this.taskForm();
    const next = { ...current, startDate: current.startDate || today };
    if (template === 'daily') {
      this.taskForm.set({ ...next, scheduleType: 'Daily', recurrencePattern: `interval=1;anchor=${next.startDate}` });
    } else if (template === 'weekly') {
      this.taskForm.set({ ...next, scheduleType: 'Weekly', recurrencePattern: `days=${this.dayName(new Date(next.startDate).getDay())}` });
    } else if (template === 'monthly') {
      this.taskForm.set({ ...next, scheduleType: 'Monthly', recurrencePattern: `day=${new Date(next.startDate).getDate()};interval=1` });
    } else {
      this.taskForm.set({ ...next, scheduleType: 'Interval', recurrencePattern: `unit=weeks;interval=2;anchor=${next.startDate}` });
    }
  }

  saveTask(): void {
    const form = this.taskForm();
    if (!form.title.trim()) {
      this.taskMessage.set('Task title is required.');
      return;
    }

    const payload: ScheduledTaskRequest = {
      title: form.title.trim(),
      description: this.nullIfBlank(form.description),
      taskType: 'Gardening',
      isActive: form.isActive,
      scheduleType: form.scheduleType,
      recurrencePattern: form.recurrencePattern.trim(),
      startDate: form.startDate || this.toInputDate(new Date().toISOString()),
      endDate: this.nullIfBlank(form.endDate)
    };
    const request = form.id ? this.service.updateGardeningTask(form.id, payload) : this.service.createGardeningTask(payload);

    this.savingTask.set(true);
    this.taskMessage.set(null);
    request.subscribe({
      next: saved => {
        this.gardeningTasks.update(items => form.id
          ? items.map(item => item.taskID === saved.taskID ? saved : item)
          : [...items, saved]);
        this.taskForm.set({
          id: saved.taskID,
          title: saved.title,
          description: saved.description ?? '',
          isActive: saved.isActive,
          scheduleType: saved.scheduleType,
          recurrencePattern: saved.recurrencePattern,
          startDate: this.toInputDate(saved.startDate),
          endDate: this.toInputDateOrEmpty(saved.endDate)
        });
        this.taskMessage.set(`${saved.title} saved.`);
      },
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not save gardening task.'),
      complete: () => this.savingTask.set(false)
    });
  }

  deleteTask(task: ScheduledTask): void {
    if (!confirm(`Delete ${task.title}?`)) {
      return;
    }

    this.savingTask.set(true);
    this.taskMessage.set(null);
    this.service.deleteGardeningTask(task.taskID).subscribe({
      next: () => {
        this.gardeningTasks.update(items => items.filter(item => item.taskID !== task.taskID));
        if (this.taskForm().id === task.taskID) {
          this.newTask();
        }
        this.taskMessage.set(`${task.title} deleted.`);
      },
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not delete gardening task.'),
      complete: () => this.savingTask.set(false)
    });
  }

  setGenerateDays(value: number | string): void {
    const days = Number(value);
    this.generateDays.set(Number.isFinite(days) ? days : 30);
    this.loadGardeningSchedule();
  }

  generateGardeningSchedule(): void {
    const from = this.toInputDate(new Date().toISOString());
    const to = this.addDays(from, this.generateDays());
    this.generatingTasks.set(true);
    this.taskMessage.set(null);
    this.service.generateGardeningOccurrences(from, to).subscribe({
      next: result => {
        this.taskMessage.set(`Created ${result.created} Gardening schedule occurrences.`);
        this.loadGardeningActivity();
      },
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not generate gardening schedule.'),
      complete: () => this.generatingTasks.set(false)
    });
  }

  loadGardeningActivity(): void {
    this.service.getGardeningActivity().subscribe({
      next: activity => this.gardeningActivity.set(activity),
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not load Gardening schedule activity.')
    });
  }

  loadGardeningSchedule(): void {
    this.scheduleLoading.set(true);
    this.service.getGardeningMasterSchedule(this.todayDate(), this.scheduleRangeEnd()).subscribe({
      next: items => this.gardeningSchedule.set(items.filter(item => item.source === 'Gardening')),
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not load Gardening master schedule rows.'),
      complete: () => this.scheduleLoading.set(false)
    });
  }

  refreshGardeningSchedule(): void {
    this.loadGardeningActivity();
    this.loadGardeningSchedule();
  }

  completeGardeningOccurrence(item: MasterScheduleItem, note?: string | null): void {
    if (!item.occurrenceId) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.taskMessage.set(null);
    this.service.completeOccurrence(item.occurrenceId, this.todayDate(), note).subscribe({
      next: () => {
        this.taskMessage.set(`${item.title} completed.`);
        this.scheduleActionNote.set('');
        this.refreshGardeningSchedule();
      },
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not complete Gardening occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  skipGardeningOccurrence(item: MasterScheduleItem, note?: string | null): void {
    if (!item.occurrenceId) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.taskMessage.set(null);
    this.service.skipOccurrence(item.occurrenceId, note ?? 'Skipped from the shared schedule.').subscribe({
      next: () => {
        this.taskMessage.set(`${item.title} skipped.`);
        this.scheduleActionNote.set('');
        this.refreshGardeningSchedule();
      },
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not skip Gardening occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  reopenGardeningOccurrence(item: MasterScheduleItem, note?: string | null): void {
    if (!item.occurrenceId) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.taskMessage.set(null);
    this.service.reopenOccurrence(item.occurrenceId, note ?? 'Reopened from the shared schedule.').subscribe({
      next: () => {
        this.taskMessage.set(`${item.title} reopened.`);
        this.scheduleActionNote.set('');
        this.refreshGardeningSchedule();
      },
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not reopen Gardening occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  startMoveGardeningOccurrence(item: MasterScheduleItem): void {
    this.scheduleMoveId.set(item.id);
    this.scheduleMoveDate.set(this.toInputDate(item.scheduledDate));
  }

  cancelMoveGardeningOccurrence(): void {
    this.scheduleMoveId.set(null);
    this.scheduleMoveDate.set('');
  }

  moveGardeningOccurrence(item: MasterScheduleItem, note?: string | null): void {
    if (!item.occurrenceId || !this.scheduleMoveDate()) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.taskMessage.set(null);
    const originalDate = this.toInputDate(item.scheduledDate);
    this.service.moveOccurrence(item.occurrenceId, this.scheduleMoveDate(), note ?? `Rescheduled from ${originalDate}.`).subscribe({
      next: () => {
        this.taskMessage.set(`${item.title} rescheduled to ${this.formatDate(this.scheduleMoveDate())}.`);
        this.scheduleActionNote.set('');
        this.cancelMoveGardeningOccurrence();
        this.refreshGardeningSchedule();
      },
      error: err => this.taskMessage.set(err.error ?? err.message ?? 'Could not move Gardening occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  scheduleCapabilities(item: MasterScheduleItem) {
    return {
      canComplete: item.canComplete,
      canMove: item.canMove,
      canSkip: item.canSkip,
      canReopen: item.canReopen
    };
  }

  isGardeningScheduleAction(item: MasterScheduleItem): boolean {
    return this.scheduleActionId() === item.id;
  }

  isMovingGardeningOccurrence(item: MasterScheduleItem): boolean {
    return this.scheduleMoveId() === item.id;
  }

  activityStatusTone(status: string): string {
    return status === 'Completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'Skipped'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : status === 'Missed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-slate-200 bg-slate-50 text-slate-700';
  }

  activityWhen(item: TaskOccurrenceActivity): string {
    return item.completedDate || item.scheduledDate;
  }

  private todayDate(): string {
    return this.toInputDate(new Date().toISOString());
  }

  private scheduleRangeEnd(): string {
    return this.addDays(this.todayDate(), this.generateDays());
  }

  private trayAssignmentPayload(trayId: number, slotId: number, form: TrayAssignmentForm): GardenSeedTrayPlantUpsert {
    return {
      trayId,
      traySlotId: slotId,
      seedId: form.seedId!,
      year: this.selectedYear(),
      plantDate: form.plantDate,
      success: form.success,
      planning: form.planning
    };
  }

  private upsertTrayPlants(savedItems: GardenSeedTrayPlant[]): void {
    const savedById = new Map(savedItems.map(item => [item.id, item]));
    const existingIds = new Set(this.trayPlants().map(item => item.id));
    this.trayPlants.update(items => [
      ...items.map(item => savedById.get(item.id) ?? item),
      ...savedItems.filter(item => !existingIds.has(item.id))
    ]);
  }

  private saveTrayCells(cells: TrayCell[], label: string): void {
    const tray = this.selectedTray();
    const form = this.assignmentForm();
    if (!tray || !cells.length) {
      this.assignmentMessage.set(`${label} has no cells to fill.`);
      return;
    }

    if (!form.seedId) {
      this.assignmentMessage.set('Choose a seed before filling tray cells.');
      return;
    }

    const requests = cells.map(item => {
      const payload = this.trayAssignmentPayload(tray.id, item.slotId, form);
      return item.plant
        ? this.service.updateTrayPlant(item.plant.id, payload)
        : this.service.createTrayPlant(payload);
    });

    this.savingAssignment.set(true);
    this.assignmentMessage.set(null);
    forkJoin(requests).subscribe({
      next: savedItems => {
        this.upsertTrayPlants(savedItems);
        this.assignmentMessage.set(`${label} filled with ${this.selectedAssignmentSeedName()}.`);
      },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not fill tray cells.'),
      complete: () => this.savingAssignment.set(false)
    });
  }

  private clearTrayAssignments(assignments: GardenSeedTrayPlant[], label: string): void {
    if (!assignments.length) {
      this.assignmentMessage.set(`${label} is already empty.`);
      return;
    }

    this.savingAssignment.set(true);
    this.assignmentMessage.set(null);
    forkJoin(assignments.map(item => this.service.deleteTrayPlant(item.id))).subscribe({
      next: () => {
        const deletedIds = new Set(assignments.map(item => item.id));
        this.trayPlants.update(items => items.filter(item => !deletedIds.has(item.id)));
        this.assignmentMessage.set(`${label} cleared.`);
      },
      error: err => this.assignmentMessage.set(err.error ?? err.message ?? 'Could not clear tray assignments.'),
      complete: () => this.savingAssignment.set(false)
    });
  }

  private plotPlantPayload(plotId: number, slotId: number, form: PlotPlantForm): GardenPlotPlantUpsert {
    return {
      gardenPlotId: plotId,
      traySlotId: slotId,
      seedId: form.seedId!,
      year: this.selectedYear(),
      plantDate: this.nullIfBlank(form.plantDate),
      success: form.success,
      qty: form.qty === null ? null : Math.max(0, Number(form.qty) || 0),
      planning: form.planning
    };
  }

  private savePlotCells(cells: PlotCell[], label: string): void {
    const plot = this.selectedPlot();
    const form = this.plotPlantForm();
    if (!plot || !cells.length) {
      this.plotMessage.set(`${label} has no cells to fill.`);
      return;
    }

    if (!form.seedId) {
      this.plotMessage.set('Choose a seed before filling bed cells.');
      return;
    }

    const requests = cells.map(cell => {
      const payload = this.plotPlantPayload(plot.id, cell.slotId, form);
      return cell.plant
        ? this.service.updatePlotPlant(cell.plant.id, payload)
        : this.service.createPlotPlant(payload);
    });

    this.savingPlotPlant.set(true);
    this.plotMessage.set(null);
    forkJoin(requests).subscribe({
      next: savedItems => {
        this.upsertPlotPlants(savedItems);
        this.plotMessage.set(`${label} planned with ${this.plotPlantSeedName()}.`);
      },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not save bed cells.'),
      complete: () => this.savingPlotPlant.set(false)
    });
  }

  private upsertPlotPlants(savedItems: GardenPlotPlant[]): void {
    const savedById = new Map(savedItems.map(item => [item.id, item]));
    const existingIds = new Set(this.plotPlants().map(item => item.id));
    this.plotPlants.update(items => [
      ...items.map(item => savedById.get(item.id) ?? item),
      ...savedItems.filter(item => !existingIds.has(item.id))
    ]);
  }

  private clearPlotAssignments(assignments: GardenPlotPlant[], label: string): void {
    if (!assignments.length) {
      this.plotMessage.set(`${label} is already empty.`);
      return;
    }

    this.savingPlotPlant.set(true);
    this.plotMessage.set(null);
    forkJoin(assignments.map(item => this.service.deletePlotPlant(item.id))).subscribe({
      next: () => {
        const deletedIds = new Set(assignments.map(item => item.id));
        this.plotPlants.update(items => items.filter(item => !deletedIds.has(item.id)));
        this.plotMessage.set(`${label} cleared.`);
      },
      error: err => this.plotMessage.set(err.error ?? err.message ?? 'Could not clear bed assignments.'),
      complete: () => this.savingPlotPlant.set(false)
    });
  }

  private plotPlantSeedName(): string {
    const seedId = this.plotPlantForm().seedId;
    return seedId ? this.seeds().find(seed => seed.id === seedId)?.name ?? 'selected seed' : 'selected seed';
  }

  private downloadCopyForwardCsv(filePrefix: string, fromYear: number, toYear: number, scope: string, overwriteExisting: boolean, preview: GardenYearCopyPreview | null, result: GardenYearCopyResult | null): void {
    this.downloadCsv(`${filePrefix}-${fromYear}-to-${toYear}.csv`, [
      ['Type', 'From Year', 'To Year', 'Scope', 'Overwrite Existing', 'Source', 'Existing Target', 'Will Copy', 'Will Skip', 'Will Delete', 'Copied', 'Skipped', 'Deleted Existing'],
      [
        filePrefix.includes('tray') ? 'Tray' : 'Bed',
        fromYear,
        toYear,
        scope,
        overwriteExisting ? 'true' : 'false',
        preview?.sourceCount ?? '',
        preview?.existingTargetCount ?? '',
        preview?.willCopy ?? '',
        preview?.willSkip ?? '',
        preview?.willDelete ?? '',
        result?.copied ?? '',
        result?.skipped ?? '',
        result?.deletedExisting ?? ''
      ]
    ]);
  }
  private handleTrayCopyResult(result: GardenYearCopyResult): void {
    this.assignmentMessage.set(`Copied ${result.copied} tray cells, skipped ${result.skipped}, replaced ${result.deletedExisting}.`);
    this.selectedYear.set(this.trayCopyToYear());
    this.load();
  }

  private handlePlotCopyResult(result: GardenYearCopyResult): void {
    this.plotMessage.set(`Copied ${result.copied} bed cells, skipped ${result.skipped}, replaced ${result.deletedExisting}.`);
    this.selectedYear.set(this.plotCopyToYear());
    this.load();
  }
  private buildSeedImportPreviewRows(): SeedImportPreviewRow[] {
    const lines = this.seedImportCsv().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!lines.length) {
      return [];
    }

    const firstLine = this.parseCsvLine(lines[0]);
    const hasHeader = firstLine.map(header => this.normalizeImportHeader(header)).includes('name');
    const headers = hasHeader
      ? new Map(firstLine.map((header, index) => [this.normalizeImportHeader(header), index]))
      : new Map<string, number>([
        ['name', 0],
        ['description', 1],
        ['plantdate', 2],
        ['indoor', 3],
        ['secondplantdate', 4],
        ['notes', 5],
        ['qty', 6],
        ['reorder', 7]
      ]);
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const seenNames = new Set<string>();

    return dataLines.slice(0, 100).map((line, index) => {
      const columns = this.parseCsvLine(line);
      const rowNumber = index + (hasHeader ? 2 : 1);
      const name = this.importColumn(columns, headers, 'name');
      const description = this.importColumn(columns, headers, 'description');
      const plantDate = this.importColumn(columns, headers, 'plantdate');
      const indoor = this.importColumn(columns, headers, 'indoor');
      const secondPlantDate = this.importColumn(columns, headers, 'secondplantdate');
      const notes = this.importColumn(columns, headers, 'notes');
      const qty = this.importColumn(columns, headers, 'qty');
      const reorder = this.importColumn(columns, headers, 'reorder');
      const normalizedName = name.trim().toLowerCase();
      const existing = !!normalizedName && this.seeds().some(seed => seed.name.trim().toLowerCase() === normalizedName);
      const duplicate = !!normalizedName && seenNames.has(normalizedName);
      if (normalizedName) {
        seenNames.add(normalizedName);
      }

      const warnings = [
        !name.trim() ? 'Missing name' : null,
        name.trim().length > 50 ? 'Name over 50 chars' : null,
        plantDate && !this.isValidImportDate(plantDate) ? 'Check start date' : null,
        secondPlantDate && !this.isValidImportDate(secondPlantDate) ? 'Check second date' : null,
        qty && !/^\d+$/.test(qty.trim()) ? 'Qty must be a whole number' : null,
        indoor && !this.isBooleanLike(indoor) ? 'Indoor should be true/false' : null,
        reorder && !this.isBooleanLike(reorder) ? 'Reorder should be true/false' : null,
        duplicate ? 'Duplicate name in import' : null
      ].filter((value): value is string => !!value);

      return {
        rowNumber,
        name,
        description,
        plantDate,
        indoor,
        secondPlantDate,
        notes,
        qty,
        reorder,
        action: warnings.length ? 'Review' : existing ? (this.seedImportUpdateExisting() ? 'Update' : 'Skip') : 'Create',
        warning: warnings.join('; ') || null
      };
    });
  }

  private normalizeImportHeader(value: string): string {
    return value.trim().replace(/[\s_]/g, '').toLowerCase();
  }

  private importColumn(columns: string[], headers: Map<string, number>, name: string): string {
    const index = headers.get(name);
    return index === undefined ? '' : columns[index]?.trim() ?? '';
  }

  private isValidImportDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) && !Number.isNaN(new Date(value).getTime());
  }

  private isBooleanLike(value: string): boolean {
    return ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 'x', ''].includes(value.trim().toLowerCase());
  }

  private buildFilteredHarvests(): GardenHarvest[] {
    const from = this.harvestFromDate();
    const to = this.harvestToDate();
    const sort = this.harvestSort();
    return [...this.harvests()]
      .filter(harvest => !this.harvestPlotFilter() || harvest.gardenPlotId === this.harvestPlotFilter())
      .filter(harvest => !this.harvestSeedFilter() || harvest.seedId === this.harvestSeedFilter())
      .filter(harvest => !from || this.toInputDate(harvest.harvestDate) >= from)
      .filter(harvest => !to || this.toInputDate(harvest.harvestDate) <= to)
      .sort((left, right) => {
        if (sort === 'crop') {
          return (left.seedName ?? this.seedName(left.seedId)).localeCompare(right.seedName ?? this.seedName(right.seedId)) ||
            new Date(right.harvestDate).getTime() - new Date(left.harvestDate).getTime();
        }

        if (sort === 'area') {
          return (left.gardenPlotName ?? this.plotName(left.gardenPlotId)).localeCompare(right.gardenPlotName ?? this.plotName(right.gardenPlotId)) ||
            new Date(right.harvestDate).getTime() - new Date(left.harvestDate).getTime();
        }

        if (sort === 'qty') {
          return (right.quantity ?? 0) - (left.quantity ?? 0) ||
            new Date(right.harvestDate).getTime() - new Date(left.harvestDate).getTime();
        }

        const dateCompare = new Date(right.harvestDate).getTime() - new Date(left.harvestDate).getTime();
        return sort === 'oldest' ? -dateCompare : dateCompare;
      });
  }

  private filterMonthlySeedStartRows(rows: SeedStartMonthReportRow[]): SeedStartMonthReportRow[] {
    const scope = this.seedStartReportScope();
    if (scope === 'tray') {
      return rows.filter(row => row.trayLocations.length > 0);
    }

    if (scope === 'area') {
      return rows.filter(row => row.gardenAreas.length > 0);
    }

    if (scope === 'warnings') {
      return rows.filter(row => row.warnings.length > 0);
    }

    return rows;
  }

  private buildMonthlyTraySummaries(): SeedStartTraySummary[] {
    const grouped = new Map<number, GardenSeedTrayPlant[]>();
    for (const plant of this.trayPlants().filter(plant => plant.year === this.selectedYear() && this.isSelectedReportMonth(plant.plantDate))) {
      grouped.set(plant.trayId, [...(grouped.get(plant.trayId) ?? []), plant]);
    }

    return Array.from(grouped.entries())
      .map(([trayId, plants]) => {
        const tray = this.trays().find(item => item.id === trayId);
        const cellCount = tray?.dimensions ? tray.dimensions.slotsWide * tray.dimensions.slotsDeep : null;
        const seeds = [...new Set(plants.map(plant => plant.seedName ?? this.seedName(plant.seedId)))]
          .sort((left, right) => left.localeCompare(right));

        return {
          trayId,
          trayName: tray?.trayName ?? 'Tray ' + trayId,
          seedCount: seeds.length,
          cellCount: plants.length,
          plannedCount: plants.filter(plant => plant.planning).length,
          startedCount: plants.filter(plant => !plant.planning).length,
          successCount: plants.filter(plant => plant.success).length,
          emptyCount: cellCount === null ? null : Math.max(0, cellCount - plants.length),
          firstDate: this.firstPlantDate(plants),
          seeds,
          rows: this.monthlySeedStartRows().filter(row => row.trayLocations.some(location => location.startsWith((tray?.trayName ?? 'Tray ' + trayId) + ' ')))
        };
      })
      .sort((left, right) => left.trayName.localeCompare(right.trayName));
  }

  private buildMonthlyAreaSummaries(): SeedStartAreaSummary[] {
    const grouped = new Map<number, GardenPlotPlant[]>();
    for (const plant of this.plotPlants().filter(plant => plant.year === this.selectedYear() && this.isSelectedReportMonth(plant.plantDate))) {
      grouped.set(plant.gardenPlotId, [...(grouped.get(plant.gardenPlotId) ?? []), plant]);
    }

    return Array.from(grouped.entries())
      .map(([plotId, plants]) => {
        const plot = this.plots().find(item => item.id === plotId);
        const cellCount = plot?.dimensions ? plot.dimensions.traySlotsWide * plot.dimensions.slotsDeep : null;
        const seeds = [...new Set(plants.map(plant => plant.seedName ?? this.seedName(plant.seedId)))]
          .sort((left, right) => left.localeCompare(right));

        return {
          plotId,
          areaName: plot?.gardenName ?? 'Garden area ' + plotId,
          seedCount: seeds.length,
          cellCount: plants.length,
          plannedCount: plants.filter(plant => plant.planning).length,
          plantedCount: plants.filter(plant => !plant.planning).length,
          successCount: plants.filter(plant => plant.success).length,
          totalQty: plants.reduce((sum, plant) => sum + (plant.qty ?? 1), 0),
          emptyCount: cellCount === null ? null : Math.max(0, cellCount - plants.length),
          firstDate: this.firstPlantDate(plants),
          seeds,
          rows: this.monthlySeedStartRows().filter(row => row.gardenAreas.some(location => location.startsWith((plot?.gardenName ?? 'Garden area ' + plotId) + ' ')))
        };
      })
      .sort((left, right) => left.areaName.localeCompare(right.areaName));
  }
  private buildMonthlySeedStartRows(): SeedStartMonthReportRow[] {
    const rows: SeedStartMonthReportRow[] = [];
    const seen = new Set<string>();
    const seedsById = new Map(this.seeds().map(seed => [seed.id, seed]));

    for (const seed of this.seeds()) {
      this.addMonthlySeedDateRow(rows, seen, seed, seed.plantDate, seed.indoor ? 'Seed Start' : 'Direct Sow');
      this.addMonthlySeedDateRow(rows, seen, seed, seed.secondPlantDate, 'Second Planting');
    }

    for (const plant of this.trayPlants().filter(plant => plant.year === this.selectedYear() && this.isSelectedReportMonth(plant.plantDate))) {
      const seed = seedsById.get(plant.seedId);
      if (!seed) {
        continue;
      }

      this.addMonthlySeedDateRow(rows, seen, seed, plant.plantDate, plant.planning ? 'Tray Planning' : 'Tray Started');
    }

    for (const plant of this.plotPlants().filter(plant => plant.year === this.selectedYear() && this.isSelectedReportMonth(plant.plantDate))) {
      const seed = seedsById.get(plant.seedId);
      if (!seed) {
        continue;
      }

      this.addMonthlySeedDateRow(rows, seen, seed, plant.plantDate, plant.planning ? 'Bed Planning' : 'Bed Planted');
    }

    return rows.sort((left, right) => {
      const leftTime = left.date ? new Date(left.date).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.date ? new Date(right.date).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime || left.seedName.localeCompare(right.seedName) || left.action.localeCompare(right.action);
    });
  }

  private addMonthlySeedDateRow(rows: SeedStartMonthReportRow[], seen: Set<string>, seed: GardenSeed, date: string | null, action: string): void {
    if (!this.isSelectedReportMonth(date)) {
      return;
    }

    const key = seed.id + '|' + this.toInputDate(date ?? '') + '|' + action;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    const trayLocations = this.trayLocationsForSeed(seed.id);
    const gardenAreas = this.gardenAreasForSeed(seed.id);
    const inventoryQty = seed.inventory?.qty ?? 0;
    const warnings: string[] = [];

    if (inventoryQty === 0) {
      warnings.push('No seed inventory');
    } else if (inventoryQty <= 2) {
      warnings.push('Low seed inventory');
    }

    if (seed.indoor && trayLocations.length === 0) {
      warnings.push('Indoor seed has no tray assignment');
    }

    if (gardenAreas.length === 0) {
      warnings.push('No garden area assigned');
    }

    rows.push({
      date: date ? this.toInputDate(date) : null,
      action,
      seedId: seed.id,
      seedName: seed.name,
      method: seed.indoor ? 'Indoor' : 'Outdoor',
      trayLocations,
      gardenAreas,
      qty: this.plannedQtyForSeed(seed.id),
      inventoryQty,
      inventoryStatus: inventoryQty === 0 ? 'Empty' : inventoryQty <= 2 ? 'Low' : 'Ready',
      warnings,
      notes: seed.notes || seed.description
    });
  }

  private isSelectedReportMonth(value: string | null | undefined): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === this.selectedYear() && date.getMonth() + 1 === this.selectedReportMonth();
  }

  private trayLocationsForSeed(seedId: number): string[] {
    return this.trayPlants()
      .filter(plant => plant.seedId === seedId && plant.year === this.selectedYear())
      .map(plant => this.trayLocationLabel(plant));
  }

  private gardenAreasForSeed(seedId: number): string[] {
    const areas = this.plotPlants()
      .filter(plant => plant.seedId === seedId && plant.year === this.selectedYear())
      .map(plant => this.plotLocationLabel(plant));
    return [...new Set(areas)];
  }

  private plannedQtyForSeed(seedId: number): number | null {
    const plotQty = this.plotPlants()
      .filter(plant => plant.seedId === seedId && plant.year === this.selectedYear())
      .reduce((sum, plant) => sum + (plant.qty ?? 1), 0);
    if (plotQty > 0) {
      return plotQty;
    }

    const trayQty = this.trayPlants().filter(plant => plant.seedId === seedId && plant.year === this.selectedYear()).length;
    return trayQty || null;
  }

  private seedName(seedId: number): string {
    return this.seeds().find(seed => seed.id === seedId)?.name ?? 'Unknown seed';
  }

  private buildNoteEntryGroups(notes: GardenNote[]): NoteEntryGroup[] {
    const groups = new Map<string, NoteEntryGroup>();
    const groupByArea = this.noteSort() === 'area';

    for (const note of notes) {
      const date = this.localDate(this.toInputDate(note.date));
      const key = groupByArea
        ? `area-${note.gardenPlotId}`
        : `${date.getFullYear()}-${date.getMonth() + 1}`;
      const label = groupByArea
        ? this.plotName(note.gardenPlotId)
        : `${this.monthName(date.getMonth() + 1)} ${note.year ?? date.getFullYear()}`;
      const existing = groups.get(key) ?? { key, label, detail: '', notes: [] };
      existing.notes.push(note);
      groups.set(key, existing);
    }

    return [...groups.values()].map(group => {
      const latest = group.notes
        .map(note => note.date)
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
      return {
        ...group,
        detail: `${group.notes.length} ${group.notes.length === 1 ? 'entry' : 'entries'} / latest ${this.formatDate(latest)}`
      };
    });
  }
  private buildNoteKeywordSummaries(): NoteKeywordSummary[] {
    const keywords = [
      'planting',
      'harvest',
      'maintenance',
      'watering',
      'fertilizer',
      'pest',
      'disease',
      'weather',
      'transplant',
      'seed'
    ];
    return keywords
      .map(label => ({
        label,
        count: this.filteredNotes().filter(note => (note.note ?? '').toLowerCase().includes(label)).length
      }))
      .filter(summary => summary.count > 0)
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  }

  private noteWordCount(value: string | null): number {
    return (value ?? '').trim().split(/\s+/).filter(Boolean).length;
  }

  private firstPlantDate(plants: Array<{ plantDate: string | null }>): string | null {
    return plants
      .map(plant => plant.plantDate)
      .filter((value): value is string => !!value)
      .sort()[0] ?? null;
  }
  private trayLocationLabel(plant: GardenSeedTrayPlant): string {
    const tray = this.trays().find(item => item.id === plant.trayId);
    return (tray?.trayName ?? 'Tray') + ' ' + this.gridSlotLabel(tray?.dimensions?.slotsWide ?? 0, plant.traySlotId);
  }

  private plotLocationLabel(plant: GardenPlotPlant): string {
    const plot = this.plots().find(item => item.id === plant.gardenPlotId);
    return (plot?.gardenName ?? 'Garden area') + ' ' + this.gridSlotLabel(plot?.dimensions?.traySlotsWide ?? 0, plant.traySlotId);
  }

  private gridSlotLabel(columns: number, slotId: number): string {
    if (!columns) {
      return 'slot ' + slotId;
    }

    const zeroBased = Math.max(0, slotId - 1);
    const row = Math.floor(zeroBased / columns);
    const column = zeroBased % columns + 1;
    return this.rowLabel(row) + column;
  }
  private sortSeeds(seeds: GardenSeed[]): GardenSeed[] {
    return [...seeds].sort((left, right) => {
      if (this.seedInventorySort() === 'qty') {
        return (left.inventory?.qty ?? 0) - (right.inventory?.qty ?? 0) || left.name.localeCompare(right.name);
      }

      if (this.seedInventorySort() === 'start') {
        return (left.plantDate ?? '9999-12-31').localeCompare(right.plantDate ?? '9999-12-31') || left.name.localeCompare(right.name);
      }

      if (this.seedInventorySort() === 'reorder') {
        return Number(!!right.inventory?.reorder) - Number(!!left.inventory?.reorder) ||
          (left.inventory?.qty ?? 0) - (right.inventory?.qty ?? 0) ||
          left.name.localeCompare(right.name);
      }

      return left.name.localeCompare(right.name);
    });
  }

  private syncPlotDimensionForm(plot = this.selectedPlot()): void {
    const dimensions = plot?.dimensions;
    this.plotDimensionForm.set({
      traySlotsWide: dimensions?.traySlotsWide ?? this.plotDimensionForm().traySlotsWide,
      slotsDeep: dimensions?.slotsDeep ?? this.plotDimensionForm().slotsDeep,
      notes: dimensions?.notes ?? ''
    });
  }

  private buildTrayRows(): TrayCell[][] {
    const tray = this.selectedTray();
    const dimensions = tray?.dimensions;
    if (!tray || !dimensions) {
      return [];
    }

    const plants = new Map(this.currentTrayPlants().map(plant => [plant.traySlotId, plant]));
    const codes = this.seedCodes();
    const rows: TrayCell[][] = [];

    for (let rowIndex = 0; rowIndex < dimensions.slotsDeep; rowIndex += 1) {
      const rowLabel = this.rowLabel(rowIndex);
      const row: TrayCell[] = [];
      for (let columnIndex = 0; columnIndex < dimensions.slotsWide; columnIndex += 1) {
        const slotId = rowIndex * dimensions.slotsWide + columnIndex + 1;
        const plant = plants.get(slotId) ?? null;
        row.push({
          row: rowLabel,
          column: columnIndex + 1,
          slotId,
          label: `${rowLabel}${columnIndex + 1}`,
          plant,
          code: plant ? codes.get(plant.seedId) ?? 'SEED' : ''
        });
      }
      rows.push(row);
    }

    return rows;
  }

  private buildLegend(): TrayLegendItem[] {
    const codes = this.seedCodes();
    const grouped = new Map<number, GardenSeedTrayPlant[]>();

    for (const plant of this.currentTrayPlants()) {
      grouped.set(plant.seedId, [...(grouped.get(plant.seedId) ?? []), plant]);
    }

    return Array.from(grouped.entries())
      .map(([seedId, plants]) => ({
        code: codes.get(seedId) ?? 'SEED',
        seedId,
        seedName: plants[0].seedName ?? this.seeds().find(seed => seed.id === seedId)?.name ?? 'Unknown seed',
        slots: plants
          .map(plant => this.slotLabel(plant.traySlotId))
          .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
          .join(', '),
        slotLabels: plants
          .map(plant => this.slotLabel(plant.traySlotId))
          .sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
        slotIds: plants
          .map(plant => plant.traySlotId)
          .sort((left, right) => left - right),
        count: plants.length,
        plantedCount: plants.filter(plant => !plant.planning).length,
        successCount: plants.filter(plant => plant.success).length,
        planningCount: plants.filter(plant => plant.planning).length,
        firstPlantDate: plants.map(plant => plant.plantDate).sort()[0] ?? null
      }))
      .sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true }));
  }

  private buildPlotRows(): PlotCell[][] {
    const plot = this.selectedPlot();
    const dimensions = plot?.dimensions;
    if (!plot || !dimensions) {
      return [];
    }

    const plants = new Map(this.currentPlotPlants().map(plant => [plant.traySlotId, plant]));
    const rows: PlotCell[][] = [];

    for (let rowIndex = 0; rowIndex < dimensions.slotsDeep; rowIndex += 1) {
      const rowLabel = this.rowLabel(rowIndex);
      const row: PlotCell[] = [];
      for (let columnIndex = 0; columnIndex < dimensions.traySlotsWide; columnIndex += 1) {
        const slotId = rowIndex * dimensions.traySlotsWide + columnIndex + 1;
        row.push({
          row: rowLabel,
          column: columnIndex + 1,
          slotId,
          label: `${rowLabel}${columnIndex + 1}`,
          plant: plants.get(slotId) ?? null
        });
      }
      rows.push(row);
    }

    return rows;
  }

  private buildPlotLegend(): PlotLegendItem[] {
    const grouped = new Map<number, GardenPlotPlant[]>();
    for (const plant of this.currentPlotPlants()) {
      grouped.set(plant.seedId, [...(grouped.get(plant.seedId) ?? []), plant]);
    }

    return Array.from(grouped.entries())
      .map(([seedId, plants]) => ({
        seedId,
        seedName: plants[0].seedName ?? this.seeds().find(seed => seed.id === seedId)?.name ?? 'Unknown seed',
        slots: plants
          .map(plant => this.plotSlotLabel(plant.traySlotId))
          .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
          .join(', '),
        slotLabels: plants
          .map(plant => this.plotSlotLabel(plant.traySlotId))
          .sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
        slotIds: plants
          .map(plant => plant.traySlotId)
          .sort((left, right) => left - right),
        count: plants.length,
        totalQty: plants.reduce((sum, plant) => sum + (plant.qty ?? 0), 0),
        plantedCount: plants.filter(plant => !plant.planning).length,
        successCount: plants.filter(plant => plant.success).length,
        planningCount: plants.filter(plant => plant.planning).length,
        firstPlantDate: plants
          .map(plant => plant.plantDate)
          .filter((value): value is string => !!value)
          .sort()[0] ?? null
      }))
      .sort((left, right) => left.seedName.localeCompare(right.seedName));
  }

  private buildPlotRowSummaries(): PlotRowSummary[] {
    return this.plotRows().map(row => {
      const assigned = row.filter(cell => !!cell.plant).length;
      const planned = row.filter(cell => cell.plant?.planning).length;
      const success = row.filter(cell => cell.plant?.success).length;
      const planted = row.filter(cell => cell.plant && !cell.plant.planning && !cell.plant.success).length;
      const qty = row.reduce((sum, cell) => sum + (cell.plant?.qty ?? 0), 0);
      const open = row.length - assigned;
      return {
        row: row[0]?.row ?? '-',
        assigned,
        open,
        planned,
        planted,
        success,
        qty,
        coveragePercent: row.length ? Math.round((assigned / row.length) * 100) : 0,
        firstSlotId: row[0]?.slotId ?? null
      };
    });
  }

  private buildPlotWarnings(): string[] {
    const warnings: string[] = [];
    const plot = this.selectedPlot();
    const dimensions = plot?.dimensions;
    if (!plot) {
      return ['No garden area selected.'];
    }

    if (!dimensions) {
      return ['This garden area needs bed grid dimensions before it can be planned.'];
    }

    if (this.selectedPlotPlantCount() > this.selectedPlotCellCount()) {
      warnings.push('More assignments exist than bed cells. Check grid dimensions before continuing.');
    }

    if (this.selectedPlotEmptyCount() === 0 && this.selectedPlotPlannedCount() > 0) {
      warnings.push('Every cell is assigned and some are still planned.');
    }

    if (this.selectedPlotPlannedQty() > this.selectedPlotTotalQty() && this.selectedPlotTotalQty() > 0) {
      warnings.push('Planned quantity is higher than the total counted quantity.');
    }

    const undated = this.currentPlotPlants().filter(plant => !plant.plantDate).length;
    if (undated > 0) {
      warnings.push(`${undated} bed ${undated === 1 ? 'cell is' : 'cells are'} missing a plant date.`);
    }

    return warnings;
  }

  private plotCellMatchesFilter(cell: PlotCell): boolean {
    const filter = this.plotCellFilter();
    if (filter === 'all') {
      return true;
    }

    if (filter === 'empty') {
      return !cell.plant;
    }

    if (!cell.plant) {
      return false;
    }

    if (filter === 'planned') {
      return cell.plant.planning;
    }

    if (filter === 'success') {
      return cell.plant.success;
    }

    return !cell.plant.planning && !cell.plant.success;
  }
  plotCellTone(cell: PlotCell): string {
    if (!this.plotCellMatchesFilter(cell)) {
      return 'border-slate-100 bg-slate-50 text-slate-300 opacity-45';
    }

    if (this.selectedPlotSlotId() === cell.slotId) {
      return 'border-lime-600 bg-lime-100 text-lime-950 ring-2 ring-lime-300';
    }

    if (cell.plant && this.selectedPlotLegendSeedId() === cell.plant.seedId) {
      return 'app-token-border-accent app-token-selected-row app-token-ring';
    }

    if (!cell.plant) {
      return 'border-slate-200 bg-white text-slate-400';
    }

    if (cell.plant.success) {
      return 'border-emerald-300 bg-emerald-50 text-emerald-900';
    }

    if (cell.plant.planning) {
      return 'border-yellow-300 bg-yellow-50 text-yellow-900';
    }

    return 'border-lime-300 bg-lime-50 text-lime-900';
  }

  private seedCodes(): Map<number, string> {
    const used = new Map<number, string>();
    const taken = new Set<string>();

    const seedIds = Array.from(new Set(this.currentTrayPlants().map(plant => plant.seedId)));
    for (const seedId of seedIds) {
      const seedName = this.currentTrayPlants().find(plant => plant.seedId === seedId)?.seedName
        ?? this.seeds().find(seed => seed.id === seedId)?.name
        ?? 'Seed';
      let code = this.baseCode(seedName);
      let suffix = 2;
      while (taken.has(code)) {
        code = `${this.baseCode(seedName)}${suffix}`;
        suffix += 1;
      }

      used.set(seedId, code);
      taken.add(code);
    }

    return used;
  }

  private baseCode(value: string): string {
    const words = value
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return (words[0] ?? 'SEED').slice(0, 3).toUpperCase();
  }

  private rowLabel(index: number): string {
    let value = '';
    let current = index;
    do {
      value = String.fromCharCode(65 + (current % 26)) + value;
      current = Math.floor(current / 26) - 1;
    } while (current >= 0);

    return value;
  }

  private currentTrayPlants(): GardenSeedTrayPlant[] {
    const trayId = this.selectedTray()?.id;
    if (!trayId) {
      return [];
    }

    return this.trayPlants().filter(plant => plant.trayId === trayId);
  }

  private currentPlotPlants(): GardenPlotPlant[] {
    const plotId = this.selectedPlot()?.id;
    if (!plotId) {
      return [];
    }

    return this.plotPlants().filter(plant => plant.gardenPlotId === plotId);
  }

  private slotLabel(slotId: number): string {
    const tray = this.selectedTray();
    const columns = tray?.dimensions?.slotsWide ?? 0;
    if (!columns) {
      return `Slot ${slotId}`;
    }

    const rowIndex = Math.floor((slotId - 1) / columns);
    const column = ((slotId - 1) % columns) + 1;
    return `${this.rowLabel(rowIndex)}${column}`;
  }

  private plotSlotLabel(slotId: number): string {
    const plot = this.selectedPlot();
    const columns = plot?.dimensions?.traySlotsWide ?? 0;
    if (!columns) {
      return `Bed slot ${slotId}`;
    }

    const rowIndex = Math.floor((slotId - 1) / columns);
    const column = ((slotId - 1) % columns) + 1;
    return `${this.rowLabel(rowIndex)}${column}`;
  }

  private localDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number(part));
    return new Date(year, month - 1, day);
  }

  private toInputDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
  }

  private toInputDateOrEmpty(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  private nullIfBlank(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private downloadCsv(fileName: string, rows: Array<Array<string | number | null>>): void {
    this.csvDownload.download(fileName, rows);
  }

  private downloadBlob(fileName: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      if (char === ',' && !quoted) {
        values.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current);
    return values;
  }

  private emptySeedForm(): SeedForm {
    return {
      id: null,
      name: '',
      description: '',
      plantDate: '',
      indoor: false,
      secondPlantDate: '',
      notes: '',
      qty: 0,
      reorder: false
    };
  }

  private emptyNoteForm(): NoteForm {
    return {
      id: null,
      gardenPlotId: this.selectedPlotId(),
      date: this.toInputDate(new Date().toISOString()),
      year: this.selectedYear(),
      note: ''
    };
  }

  private emptyHarvestForm(): HarvestForm {
    return {
      id: null,
      gardenPlotId: this.selectedPlotId(),
      seedId: this.plotPlantForm().seedId ?? null,
      harvestDate: this.toInputDate(new Date().toISOString()),
      year: this.selectedYear(),
      quantity: null,
      notes: ''
    };
  }
  private emptyTaskForm(): GardeningTaskForm {
    const today = this.toInputDate(new Date().toISOString());
    return {
      id: null,
      title: '',
      description: '',
      isActive: true,
      scheduleType: 'Weekly',
      recurrencePattern: `days=${this.dayName(new Date().getDay())}`,
      startDate: today,
      endDate: ''
    };
  }

  private addDays(value: string, days: number): string {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return this.toInputDate(date.toISOString());
  }

  private dayName(day: number): string {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] ?? 'Sunday';
  }
}






















































