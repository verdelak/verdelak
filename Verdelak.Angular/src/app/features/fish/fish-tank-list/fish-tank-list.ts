import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { TaskOccurrence, TaskOccurrenceUpdateRequest } from '../../tasks/models/scheduled-task.model';
import { FishService } from '../fish-service';
import { FishLivestockPanel } from '../fish-livestock-panel/fish-livestock-panel';
import { FishOccurrencesPanel } from '../fish-occurrences-panel/fish-occurrences-panel';
import { FishProductUsagePanel } from '../fish-product-usage-panel/fish-product-usage-panel';
import { FishProductsPanel } from '../fish-products-panel/fish-products-panel';
import { FishReportPanel } from '../fish-report-panel/fish-report-panel';
import { FishSpeciesPanel } from '../fish-species-panel/fish-species-panel';
import { FishTasksPanel } from '../fish-tasks-panel/fish-tasks-panel';
import { FishTimelinePanel } from '../fish-timeline-panel/fish-timeline-panel';
import { FishWaterTrendPanel } from '../fish-water-trend-panel/fish-water-trend-panel';
import { FishAquariumProduct, FishAquariumProductRequest, FishAquariumProductUsage, FishAquariumProductUsageRequest, FishLivestockEvent, FishLivestockEventRequest, FishSpeciesFood, FishSpeciesFoodRequest, FishSpeciesProfile, FishSpeciesProfileGap, FishSpeciesProfileRequest, FishStock, FishStockRequest, FishTank, FishTankHistoryItem, FishTankLog, FishTankLogRequest, FishTankRequest, FishTankTask, FishTankTaskRequest } from '../models/fish-tank.model';

interface FishTankForm {
  id: number | null;
  name: string;
  gallons: number | null;
  location: string;
  isSetup: boolean;
  isActive: boolean;
  notes: string;
}

interface FishTankLogForm {
  id: number | null;
  fishTankId: number | null;
  loggedAt: string;
  logType: string;
  temperature: number | null;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
  ph: number | null;
  gh: number | null;
  kh: number | null;
  notes: string;
}

interface FishStockForm {
  id: number | null;
  fishTankId: number | null;
  commonName: string;
  scientificName: string;
  adultSize: string;
  temperament: string;
  temperaturePreference: string;
  phPreference: string;
  quantity: number;
  isActive: boolean;
  notes: string;
}

interface FishStockImportRow extends FishStockRequest {
  tankName: string;
  warnings: string[];
}

interface FishSpeciesProfileImportRow extends FishSpeciesProfileRequest {
  matchedProfileId: number | null;
  warnings: string[];
}

interface FishSpeciesFoodImportRow extends FishSpeciesFoodRequest {
  commonName: string;
  scientificName: string | null;
  fishSpeciesProfileId: number | null;
  warnings: string[];
}

interface FishSpeciesProfileForm {
  id: number | null;
  commonName: string;
  scientificName: string;
  adultSize: string;
  temperament: string;
  temperaturePreference: string;
  phPreference: string;
  ghPreference: string;
  khPreference: string;
  careLevel: string;
  tankLevel: string;
  isQuarantineRequired: boolean;
  notes: string;
}

interface FishSpeciesFoodForm {
  id: number | null;
  fishSpeciesProfileId: number | null;
  foodName: string;
  foodType: string;
  feedingFrequency: string;
  isStaple: boolean;
  notes: string;
}

interface FishTaskForm {
  id: number | null;
  fishTankId: number | null;
  title: string;
  description: string;
  taskCategory: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  interval: number;
  intervalUnit: 'days' | 'weeks' | 'months';
  notes: string;
}

interface FishTaskTemplate {
  label: string;
  title: string;
  description: string;
  taskCategory: string;
  interval: number;
  intervalUnit: 'days' | 'weeks' | 'months';
  notes: string;
}

interface LivestockEventForm {
  id: number | null;
  fishTankId: number | null;
  destinationFishTankId: number | null;
  eventDate: string;
  eventType: string;
  commonName: string;
  scientificName: string;
  quantity: number;
  updatesStock: boolean;
  notes: string;
}

interface AquariumProductForm {
  id: number | null;
  fishTankId: number | null;
  name: string;
  category: string;
  quantity: number | null;
  unit: string;
  percentLeft: number | null;
  expirationDate: string;
  isActive: boolean;
  notes: string;
}

interface AquariumProductImportRow extends FishAquariumProductRequest {
  tankName: string;
  warnings: string[];
}

interface AquariumProductUsageForm {
  id: number | null;
  fishAquariumProductId: number | null;
  usedAt: string;
  usageType: string;
  quantityUsed: number | null;
  quantityAfter: number | null;
  percentLeftAfter: number | null;
  openedNewContainer: boolean;
  updateInventory: boolean;
  addToShoppingList: boolean;
  shoppingCategory: string;
  notes: string;
}

interface FishTankHistoryGroup {
  dateKey: string;
  dateLabel: string;
  items: FishTankHistoryItem[];
}

interface FishTankDashboardCard {
  tank: FishTank;
  latestLog: FishTankLog | null;
  nextOccurrence: TaskOccurrence | null;
  nextTask: FishTankTask | null;
  stockCount: number;
  supplyAlerts: number;
}

interface FishOverdueTaskReportItem {
  occurrence: TaskOccurrence;
  task: FishTankTask;
  daysOverdue: number;
}

interface FishTankTestReportItem {
  tank: FishTank;
  latestTest: FishTankLog | null;
  daysSinceTest: number | null;
}

interface FishSpeciesFoodProductGap {
  profile: FishSpeciesProfile;
  food: FishSpeciesFood;
}

interface FishQuarantineReportItem {
  event: FishLivestockEvent | null;
  stock: FishStock | null;
  profile: FishSpeciesProfile | null;
  issue: string;
  days: number | null;
  detail: string;
}

@Component({
  selector: 'app-fish-tank-list',
  imports: [CommonModule, FormsModule, FishLivestockPanel, FishOccurrencesPanel, FishProductUsagePanel, FishProductsPanel, FishReportPanel, FishSpeciesPanel, FishTasksPanel, FishTimelinePanel, FishWaterTrendPanel],
  templateUrl: './fish-tank-list.html',
  styleUrl: './fish-tank-list.scss'
})
export class FishTankList {
  readonly vm = this;
  readonly logTypes = ['Water Test', 'Observation', 'Maintenance', 'Equipment Change', 'Plant Added', 'Other'];
  readonly taskCategories = ['Clean', 'Water Change', 'Dose', 'Test', 'Feed', 'Filter', 'Other'];
  readonly livestockEventTypes = ['Addition', 'Death', 'Move', 'Quarantine'];
  readonly productCategories = ['Food', 'Medication', 'Treatment', 'Filter Media', 'Equipment', 'Test Kit', 'Other'];
  readonly productUsageTypes = ['Used', 'Opened', 'Replaced', 'Refilled', 'Discarded', 'Other'];
  readonly scheduleWindows = [30, 60, 90];
  readonly tanks = signal<FishTank[]>([]);
  readonly tankLogs = signal<FishTankLog[]>([]);
  readonly stock = signal<FishStock[]>([]);
  readonly speciesProfiles = signal<FishSpeciesProfile[]>([]);
  readonly speciesProfileGaps = signal<FishSpeciesProfileGap[]>([]);
  readonly tankTasks = signal<FishTankTask[]>([]);
  readonly livestockEvents = signal<FishLivestockEvent[]>([]);
  readonly products = signal<FishAquariumProduct[]>([]);
  readonly productUsage = signal<FishAquariumProductUsage[]>([]);
  readonly history = signal<FishTankHistoryItem[]>([]);
  readonly occurrences = signal<TaskOccurrence[]>([]);
  readonly loading = signal(false);
  readonly logsLoading = signal(false);
  readonly stockLoading = signal(false);
  readonly speciesProfilesLoading = signal(false);
  readonly speciesGapsLoading = signal(false);
  readonly tasksLoading = signal(false);
  readonly livestockLoading = signal(false);
  readonly productsLoading = signal(false);
  readonly productUsageLoading = signal(false);
  readonly historyLoading = signal(false);
  readonly occurrencesLoading = signal(false);
  readonly thresholdsLoading = signal(false);
  readonly saving = signal(false);
  readonly logSaving = signal(false);
  readonly stockSaving = signal(false);
  readonly speciesProfileSaving = signal(false);
  readonly speciesFoodSaving = signal(false);
  readonly taskSaving = signal(false);
  readonly livestockSaving = signal(false);
  readonly productSaving = signal(false);
  readonly productUsageSaving = signal(false);
  readonly addingShoppingProductId = signal<number | null>(null);
  readonly stockImporting = signal(false);
  readonly speciesProfileImporting = signal(false);
  readonly speciesFoodImporting = signal(false);
  readonly productImporting = signal(false);
  readonly generatingFishSchedule = signal(false);
  readonly completingOccurrenceId = signal<number | null>(null);
  readonly occurrenceActionId = signal<number | null>(null);
  readonly occurrenceMoveId = signal<number | null>(null);
  readonly occurrenceMoveDate = signal('');
  readonly occurrenceActionNote = signal('');
  readonly schedulePreviewDays = signal(30);
  readonly showInactive = signal(true);
  readonly showInactiveStock = signal(false);
  readonly locationFilter = signal('All');
  readonly logTankFilter = signal<number | null>(null);
  readonly historyTankFilter = signal<number | null>(null);
  readonly stockTankFilter = signal<number | null>(null);
  readonly speciesProfileQuery = signal('');
  readonly speciesGapFilter = signal('All');
  readonly taskTankFilter = signal<number | null>(null);
  readonly livestockTankFilter = signal<number | null>(null);
  readonly productTankFilter = signal<number | null>(null);
  readonly productCategoryFilter = signal('All');
  readonly productStatusFilter = signal('All');
  readonly reportTankFilter = signal<number | null>(null);
  readonly reportTaskCategoryFilter = signal('All');
  readonly reportProductCategoryFilter = signal('All');
  readonly reportCriticalOnly = signal(false);
  readonly reportWaterTestDueDays = signal(7);
  readonly reportOverdueCriticalDays = signal(7);
  readonly reportWaterTestCriticalDays = signal(14);
  readonly reportLowProductPercent = signal(25);
  readonly reportExpiringSoonDays = signal(30);
  readonly productUsageFilter = signal<number | null>(null);
  readonly shoppingOnlyUsage = signal(false);
  readonly waterChartTankFilter = signal<number | null>(null);
  readonly waterChartMetric = signal<'temperature' | 'ammonia' | 'nitrite' | 'nitrate' | 'ph' | 'gh' | 'kh'>('ph');
  readonly showInactiveProducts = signal(true);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly form = signal<FishTankForm>(this.emptyForm());
  readonly logForm = signal<FishTankLogForm>(this.emptyLogForm());
  readonly stockForm = signal<FishStockForm>(this.emptyStockForm());
  readonly speciesProfileForm = signal<FishSpeciesProfileForm>(this.emptySpeciesProfileForm());
  readonly speciesFoodForm = signal<FishSpeciesFoodForm>(this.emptySpeciesFoodForm());
  readonly taskForm = signal<FishTaskForm>(this.emptyTaskForm());
  readonly livestockForm = signal<LivestockEventForm>(this.emptyLivestockForm());
  readonly productForm = signal<AquariumProductForm>(this.emptyProductForm());
  readonly productUsageForm = signal<AquariumProductUsageForm>(this.emptyProductUsageForm());
  readonly stockImportText = signal('');
  readonly stockImportFileName = signal<string | null>(null);
  readonly speciesProfileImportText = signal('');
  readonly speciesProfileImportFileName = signal<string | null>(null);
  readonly speciesFoodImportText = signal('');
  readonly speciesFoodImportFileName = signal<string | null>(null);
  readonly productImportText = signal('');
  readonly productImportFileName = signal<string | null>(null);
  readonly fishTaskTemplates: FishTaskTemplate[] = [
    {
      label: 'Water Change',
      title: 'Water change',
      description: 'Perform scheduled water change.',
      taskCategory: 'Water Change',
      interval: 1,
      intervalUnit: 'weeks',
      notes: ''
    },
    {
      label: 'Dosing',
      title: 'Dose tank',
      description: 'Dose tank as scheduled.',
      taskCategory: 'Dose',
      interval: 1,
      intervalUnit: 'weeks',
      notes: ''
    },
    {
      label: 'Testing',
      title: 'Test water',
      description: 'Test water parameters.',
      taskCategory: 'Test',
      interval: 1,
      intervalUnit: 'weeks',
      notes: ''
    },
    {
      label: 'Feeding',
      title: 'Feed fish',
      description: 'Feed fish.',
      taskCategory: 'Feed',
      interval: 1,
      intervalUnit: 'days',
      notes: ''
    },
    {
      label: 'Filter Work',
      title: 'Filter maintenance',
      description: 'Perform scheduled filter maintenance.',
      taskCategory: 'Filter',
      interval: 1,
      intervalUnit: 'months',
      notes: ''
    }
  ];

  readonly locations = computed(() => [
    'All',
    ...Array.from(new Set(this.tanks().map(tank => tank.location).filter(Boolean))).sort()
  ]);

  readonly setupCount = computed(() => this.tanks().filter(tank => tank.isSetup).length);
  readonly futureCount = computed(() => this.tanks().filter(tank => !tank.isSetup || !tank.isActive).length);

  readonly visibleTanks = computed(() => this.tanks()
    .filter(tank => this.showInactive() || (tank.isSetup && tank.isActive))
    .filter(tank => this.locationFilter() === 'All' || tank.location === this.locationFilter()));

  readonly activeTanks = computed(() => this.tanks().filter(tank => tank.isSetup && tank.isActive));

  readonly visibleLogs = computed(() => this.tankLogs()
    .filter(log => !this.logTankFilter() || log.fishTankId === this.logTankFilter()));
  readonly visibleHistory = computed(() => this.history()
    .filter(item => !this.historyTankFilter() || item.fishTankId === this.historyTankFilter()));
  readonly historyGroups = computed(() => this.groupHistoryByDate(this.visibleHistory()));

  readonly visibleStock = computed(() => this.stock()
    .filter(stock => this.showInactiveStock() || stock.isActive)
    .filter(stock => !this.stockTankFilter() || stock.fishTankId === this.stockTankFilter()));
  readonly stockImportPreview = computed(() => this.parseStockImportRows(this.stockImportText()));
  readonly validStockImportRows = computed(() => this.stockImportPreview().filter(row => row.warnings.length === 0));
  readonly speciesProfileImportPreview = computed(() => this.parseSpeciesProfileImportRows(this.speciesProfileImportText()));
  readonly validSpeciesProfileImportRows = computed(() => this.speciesProfileImportPreview().filter(row => row.warnings.length === 0));
  readonly speciesFoodImportPreview = computed(() => this.parseSpeciesFoodImportRows(this.speciesFoodImportText()));
  readonly validSpeciesFoodImportRows = computed(() => this.speciesFoodImportPreview().filter(row => row.warnings.length === 0));
  readonly visibleSpeciesProfiles = computed(() => {
    const term = this.speciesProfileQuery().trim().toLowerCase();
    return this.speciesProfiles()
      .filter(profile => !term
        || profile.commonName.toLowerCase().includes(term)
        || (profile.scientificName ?? '').toLowerCase().includes(term)
        || profile.foods.some(food => food.foodName.toLowerCase().includes(term)))
      .sort((left, right) => left.commonName.localeCompare(right.commonName));
  });
  readonly selectedSpeciesProfile = computed(() => this.speciesProfiles().find(profile => profile.id === this.speciesProfileForm().id) ?? null);
  readonly speciesGapTypes = computed(() => [
    'All',
    ...Array.from(new Set(this.speciesProfileGaps().map(gap => gap.gapType))).sort()
  ]);
  readonly filteredSpeciesProfileGaps = computed(() => this.speciesProfileGaps()
    .filter(gap => this.speciesGapFilter() === 'All' || gap.gapType === this.speciesGapFilter()));
  readonly stockWithoutProfiles = computed(() => this.speciesProfileGaps().filter(gap => gap.gapType === 'Missing Profile').length);
  readonly profilesWithoutFoods = computed(() => this.speciesProfileGaps().filter(gap => gap.gapType === 'Missing Foods').length);
  readonly quarantineEvents = computed(() => this.livestockEvents()
    .filter(event => event.eventType === 'Quarantine')
    .sort((left, right) => new Date(right.eventDate).getTime() - new Date(left.eventDate).getTime()));
  readonly speciesFoodProductGaps = computed<FishSpeciesFoodProductGap[]>(() => this.speciesProfiles()
    .flatMap(profile => profile.foods.map(food => ({ profile, food })))
    .filter(item => this.matchingFoodProducts(item.food).length === 0)
    .sort((left, right) => left.profile.commonName.localeCompare(right.profile.commonName) || left.food.foodName.localeCompare(right.food.foodName)));
  readonly quarantineAttention = computed<FishQuarantineReportItem[]>(() => {
    const longQuarantineItems = this.quarantineEvents()
      .filter(event => this.daysElapsed(event.eventDate) >= 14)
      .map(event => ({
        event,
        stock: null,
        profile: this.findSpeciesProfileByName(event.commonName, event.scientificName),
        issue: 'Long Quarantine',
        days: this.daysElapsed(event.eventDate),
        detail: 'Quarantine has been tracked for 14 or more days.'
      }));

    const missingQuarantineItems = this.stock()
      .filter(stock => stock.isActive)
      .map(stock => ({ stock, profile: this.findSpeciesProfile(stock) }))
      .filter(item => item.profile?.isQuarantineRequired)
      .filter(item => !this.hasQuarantineEventForSpecies(item.stock.commonName, item.stock.scientificName))
      .map(item => ({
        event: null,
        stock: item.stock,
        profile: item.profile,
        issue: 'No Quarantine Logged',
        days: null,
        detail: 'Species profile recommends quarantine, but no quarantine event is logged.'
      }));

    return [...longQuarantineItems, ...missingQuarantineItems]
      .sort((left, right) => left.issue.localeCompare(right.issue) || (right.days ?? 0) - (left.days ?? 0));
  });

  readonly stockCount = computed(() => this.stock()
    .filter(stock => stock.isActive)
    .reduce((total, stock) => total + stock.quantity, 0));

  readonly visibleTankTasks = computed(() => this.tankTasks()
    .filter(task => !this.taskTankFilter() || task.fishTankId === this.taskTankFilter()));
  readonly fishSchedulePreviewCount = computed(() => this.tankTasks()
    .filter(task => task.isActive)
    .reduce((total, task) => total + this.previewTaskDates(task, this.schedulePreviewDays()).length, 0));
  readonly visibleLivestockEvents = computed(() => this.livestockEvents()
    .filter(event => !this.livestockTankFilter()
      || event.fishTankId === this.livestockTankFilter()
      || event.destinationFishTankId === this.livestockTankFilter()));
  readonly visibleProducts = computed(() => this.products()
    .filter(product => this.showInactiveProducts() || product.isActive)
    .filter(product => !this.productTankFilter() || product.fishTankId === this.productTankFilter())
    .filter(product => this.productCategoryFilter() === 'All' || product.category === this.productCategoryFilter())
    .filter(product => this.productStatusFilter() === 'All' || this.productStatus(product) === this.productStatusFilter()));
  readonly productImportPreview = computed(() => this.parseProductImportRows(this.productImportText()));
  readonly validProductImportRows = computed(() => this.productImportPreview().filter(row => row.warnings.length === 0));
  readonly activeProducts = computed(() => this.products().filter(product => product.isActive));
  readonly emptyProductCount = computed(() => this.activeProducts().filter(product => this.productStatus(product) === 'Empty').length);
  readonly lowProductCount = computed(() => this.activeProducts().filter(product => this.productStatus(product) === 'Low').length);
  readonly expiredProductCount = computed(() => this.activeProducts().filter(product => this.productStatus(product) === 'Expired').length);
  readonly expiringProductCount = computed(() => this.activeProducts().filter(product => this.productStatus(product) === 'Expiring Soon').length);
  readonly visibleProductUsage = computed(() => this.productUsage()
    .filter(usage => !this.productUsageFilter() || usage.fishAquariumProductId === this.productUsageFilter())
    .filter(usage => !this.shoppingOnlyUsage() || usage.addToShoppingList));
  readonly shoppingCandidateCount = computed(() => this.productUsage().filter(usage => usage.addToShoppingList).length);
  readonly fishTaskIds = computed(() => new Set(this.tankTasks().map(task => task.taskId)));
  readonly fishOccurrences = computed(() => this.occurrences().filter(occurrence => this.fishTaskIds().has(occurrence.taskID)));
  readonly overdueFishTasks = computed(() => this.fishOccurrences()
    .filter(occurrence => occurrence.status === 'Scheduled')
    .filter(occurrence => this.localDate(occurrence.scheduledDate.slice(0, 10)) < this.today())
    .map(occurrence => {
      const task = this.tankTasks().find(item => item.taskId === occurrence.taskID);
      return task ? {
        occurrence,
        task,
        daysOverdue: this.daysElapsed(occurrence.scheduledDate)
      } : null;
    })
    .filter((item): item is FishOverdueTaskReportItem => item !== null)
    .sort((left, right) => new Date(left.occurrence.scheduledDate).getTime() - new Date(right.occurrence.scheduledDate).getTime()));
  readonly filteredOverdueFishTasks = computed(() => this.overdueFishTasks()
    .filter(item => !this.reportTankFilter() || item.task.fishTankId === this.reportTankFilter())
    .filter(item => this.reportTaskCategoryFilter() === 'All' || item.task.taskCategory === this.reportTaskCategoryFilter())
    .filter(item => !this.reportCriticalOnly() || item.daysOverdue >= this.reportOverdueCriticalDays()));
  readonly tanksNeedingTests = computed(() => this.activeTanks()
    .map(tank => {
      const latestTest = this.latestWaterTest(tank.id);
      return {
        tank,
        latestTest,
        daysSinceTest: latestTest ? this.daysElapsed(latestTest.loggedAt) : null
      };
    })
    .filter(item => item.daysSinceTest === null || item.daysSinceTest >= this.reportWaterTestDueDays())
    .sort((left, right) => (right.daysSinceTest ?? Number.MAX_SAFE_INTEGER) - (left.daysSinceTest ?? Number.MAX_SAFE_INTEGER)));
  readonly filteredTanksNeedingTests = computed(() => this.tanksNeedingTests()
    .filter(item => !this.reportTankFilter() || item.tank.id === this.reportTankFilter())
    .filter(item => !this.reportCriticalOnly() || item.daysSinceTest === null || item.daysSinceTest >= this.reportWaterTestCriticalDays()));
  readonly productsNeedingReplacement = computed(() => this.activeProducts()
    .filter(product => ['Expired', 'Expiring Soon', 'Empty', 'Low'].includes(this.productStatus(product)))
    .sort((left, right) => this.productReplacementRank(left) - this.productReplacementRank(right)));
  readonly filteredProductsNeedingReplacement = computed(() => this.productsNeedingReplacement()
    .filter(product => !this.reportTankFilter() || product.fishTankId === this.reportTankFilter())
    .filter(product => this.reportProductCategoryFilter() === 'All' || product.category === this.reportProductCategoryFilter())
    .filter(product => !this.reportCriticalOnly() || ['Expired', 'Empty'].includes(this.productStatus(product))));
  readonly dashboardCards = computed(() => this.activeTanks().map(tank => this.dashboardCard(tank)));
  readonly selectedChartTank = computed(() => this.tanks().find(tank => tank.id === this.waterChartTankFilter()) ?? this.activeTanks()[0] ?? null);
  readonly chartLogs = computed(() => {
    const tank = this.selectedChartTank();
    if (!tank) {
      return [];
    }

    return this.tankLogs()
      .filter(log => log.fishTankId === tank.id)
      .filter(log => this.readingValue(log, this.waterChartMetric()) !== null)
      .sort((left, right) => new Date(left.loggedAt).getTime() - new Date(right.loggedAt).getTime())
      .slice(-20);
  });

  constructor(
    private readonly service: FishService,
    private readonly csvDownload: CsvDownloadService
  ) {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadReportThresholds();
    this.service.getTanks().subscribe({
      next: tanks => this.tanks.set(tanks),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load fish tanks.'),
      complete: () => {
        this.loading.set(false);
        this.ensureDefaultLogTank();
        this.ensureDefaultStockTank();
        this.ensureDefaultTaskTank();
        this.ensureDefaultLivestockTank();
        this.loadStock();
        this.loadSpeciesProfiles();
        this.loadSpeciesProfileGaps();
        this.loadTankTasks();
        this.loadLivestockEvents();
        this.loadProducts();
        this.loadProductUsage();
        this.loadLogs();
        this.loadHistory();
        this.loadOccurrences();
      }
    });
  }

  loadReportThresholds(): void {
    this.thresholdsLoading.set(true);
    this.service.getReportThresholds().subscribe({
      next: thresholds => {
        this.reportWaterTestDueDays.set(thresholds.waterTestDueDays);
        this.reportOverdueCriticalDays.set(thresholds.overdueCriticalDays);
        this.reportWaterTestCriticalDays.set(thresholds.waterTestCriticalDays);
        this.reportLowProductPercent.set(thresholds.lowProductPercent);
        this.reportExpiringSoonDays.set(thresholds.expiringSoonDays);
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load Fish report thresholds.'),
      complete: () => this.thresholdsLoading.set(false)
    });
  }

  loadLogs(): void {
    this.logsLoading.set(true);
    this.service.getTankLogs(null, 75).subscribe({
      next: logs => this.tankLogs.set(logs),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load tank logs.'),
      complete: () => this.logsLoading.set(false)
    });
  }

  loadStock(): void {
    this.stockLoading.set(true);
    this.service.getStock(null, true).subscribe({
      next: stock => this.stock.set(stock),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load fish stock.'),
      complete: () => this.stockLoading.set(false)
    });
  }

  loadSpeciesProfiles(): void {
    this.speciesProfilesLoading.set(true);
    this.service.getSpeciesProfiles().subscribe({
      next: profiles => this.speciesProfiles.set(profiles),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load species profiles.'),
      complete: () => this.speciesProfilesLoading.set(false)
    });
  }

  loadSpeciesProfileGaps(): void {
    this.speciesGapsLoading.set(true);
    this.service.getSpeciesProfileGaps().subscribe({
      next: gaps => this.speciesProfileGaps.set(gaps),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load species profile reports.'),
      complete: () => this.speciesGapsLoading.set(false)
    });
  }

  loadTankTasks(): void {
    this.tasksLoading.set(true);
    this.service.getTankTasks(null, true).subscribe({
      next: tasks => this.tankTasks.set(tasks),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load fish tasks.'),
      complete: () => this.tasksLoading.set(false)
    });
  }

  loadOccurrences(): void {
    this.occurrencesLoading.set(true);
    const from = this.toDateInput(this.addDays(new Date(), -30));
    const to = this.toDateInput(this.addDays(new Date(), 60));
    this.service.getOccurrences(from, to).subscribe({
      next: occurrences => this.occurrences.set(occurrences),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load Fish schedule occurrences.'),
      complete: () => this.occurrencesLoading.set(false)
    });
  }

  loadLivestockEvents(): void {
    this.livestockLoading.set(true);
    this.service.getLivestockEvents(null, 100).subscribe({
      next: events => this.livestockEvents.set(events),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load livestock events.'),
      complete: () => this.livestockLoading.set(false)
    });
  }

  loadProducts(): void {
    this.productsLoading.set(true);
    this.service.getProducts(null, null, true).subscribe({
      next: products => this.products.set(products),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load aquarium products.'),
      complete: () => this.productsLoading.set(false)
    });
  }

  loadProductUsage(): void {
    this.productUsageLoading.set(true);
    this.service.getProductUsage(null, false, 100).subscribe({
      next: usage => this.productUsage.set(usage),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load product usage.'),
      complete: () => this.productUsageLoading.set(false)
    });
  }

  loadHistory(): void {
    this.historyLoading.set(true);
    this.service.getTankHistory(null, 250).subscribe({
      next: history => this.history.set(history),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load tank history.'),
      complete: () => this.historyLoading.set(false)
    });
  }

  save(): void {
    const form = this.form();
    if (!form.name.trim()) {
      this.error.set('Tank name is required.');
      return;
    }

    if (!form.location.trim()) {
      this.error.set('Tank location is required.');
      return;
    }

    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toRequest(form);
    const call = form.id
      ? this.service.updateTank(form.id, request)
      : this.service.createTank(request);

    call.subscribe({
      next: tank => {
        this.message.set(`${tank.name} saved.`);
        this.resetForm();
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save the tank.'),
      complete: () => this.saving.set(false)
    });
  }

  edit(tank: FishTank): void {
    this.form.set({
      id: tank.id,
      name: tank.name,
      gallons: tank.gallons,
      location: tank.location,
      isSetup: tank.isSetup,
      isActive: tank.isActive,
      notes: tank.notes ?? ''
    });
    this.message.set(null);
    this.error.set(null);
  }

  delete(tank: FishTank): void {
    if (!confirm(`Delete "${tank.name}" from the tank list?`)) {
      return;
    }

    this.service.deleteTank(tank.id).subscribe({
      next: () => {
        this.message.set(`${tank.name} deleted.`);
        this.load();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete the tank.')
    });
  }

  saveLog(): void {
    const form = this.logForm();
    if (!form.fishTankId) {
      this.error.set('Choose a tank for the log entry.');
      return;
    }

    if (!form.logType.trim()) {
      this.error.set('Choose a log type.');
      return;
    }

    this.logSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toLogRequest(form);
    const call = form.id
      ? this.service.updateTankLog(form.id, request)
      : this.service.createTankLog(request);

    call.subscribe({
      next: log => {
        this.message.set(`${log.tankName} log saved.`);
        this.resetLogForm();
        this.loadLogs();
        this.loadHistory();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save the tank log.'),
      complete: () => this.logSaving.set(false)
    });
  }

  editLog(log: FishTankLog): void {
    this.logForm.set({
      id: log.id,
      fishTankId: log.fishTankId,
      loggedAt: this.toLocalInput(log.loggedAt),
      logType: log.logType,
      temperature: log.temperature,
      ammonia: log.ammonia,
      nitrite: log.nitrite,
      nitrate: log.nitrate,
      ph: log.ph,
      gh: log.gh,
      kh: log.kh,
      notes: log.notes ?? ''
    });
    this.message.set(null);
    this.error.set(null);
  }

  deleteLog(log: FishTankLog): void {
    if (!confirm(`Delete the ${log.logType} log for ${log.tankName}?`)) {
      return;
    }

    this.service.deleteTankLog(log.id).subscribe({
      next: () => {
        this.message.set(`${log.tankName} log deleted.`);
        this.loadLogs();
        this.loadHistory();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete the tank log.')
    });
  }

  saveStock(): void {
    const form = this.stockForm();
    if (!form.fishTankId) {
      this.error.set('Choose a tank for the stock entry.');
      return;
    }

    if (!form.commonName.trim()) {
      this.error.set('Common name is required.');
      return;
    }

    if (Number(form.quantity) < 0) {
      this.error.set('Quantity cannot be negative.');
      return;
    }

    this.stockSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toStockRequest(form);
    const call = form.id
      ? this.service.updateStock(form.id, request)
      : this.service.createStock(request);

    call.subscribe({
      next: stock => {
        this.message.set(`${stock.commonName} stock saved.`);
        this.resetStockForm();
        this.loadStock();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save fish stock.'),
      complete: () => this.stockSaving.set(false)
    });
  }

  editStock(stock: FishStock): void {
    this.stockForm.set({
      id: stock.id,
      fishTankId: stock.fishTankId,
      commonName: stock.commonName,
      scientificName: stock.scientificName ?? '',
      adultSize: stock.adultSize ?? '',
      temperament: stock.temperament ?? '',
      temperaturePreference: stock.temperaturePreference ?? '',
      phPreference: stock.phPreference ?? '',
      quantity: stock.quantity,
      isActive: stock.isActive,
      notes: stock.notes ?? ''
    });
    this.message.set(null);
    this.error.set(null);
  }

  deleteStock(stock: FishStock): void {
    if (!confirm(`Delete "${stock.commonName}" from ${stock.tankName} stock?`)) {
      return;
    }

    this.service.deleteStock(stock.id).subscribe({
      next: () => {
        this.message.set(`${stock.commonName} stock deleted.`);
        this.loadStock();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete fish stock.')
    });
  }

  importStockRows(): void {
    const rows = this.validStockImportRows();
    const skipped = this.stockImportPreview().length - rows.length;
    if (rows.length === 0) {
      this.error.set('Paste or upload at least one valid stock row before importing.');
      return;
    }

    const skippedText = skipped > 0 ? ` ${skipped.toLocaleString()} invalid row${skipped === 1 ? '' : 's'} will be skipped.` : '';
    if (!confirm(`Import ${rows.length.toLocaleString()} fish stock row${rows.length === 1 ? '' : 's'}?${skippedText}`)) {
      return;
    }

    this.stockImporting.set(true);
    this.message.set(null);
    this.error.set(null);
    forkJoin(rows.map(row => this.service.createStock({
      fishTankId: row.fishTankId,
      commonName: row.commonName,
      scientificName: row.scientificName,
      adultSize: row.adultSize,
      temperament: row.temperament,
      temperaturePreference: row.temperaturePreference,
      phPreference: row.phPreference,
      quantity: row.quantity,
      isActive: row.isActive,
      notes: row.notes
    }))).subscribe({
      next: () => {
        this.message.set(`${rows.length.toLocaleString()} fish stock row${rows.length === 1 ? '' : 's'} imported.`);
        this.stockImportText.set('');
        this.stockImportFileName.set(null);
        this.loadStock();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Fish stock import failed.'),
      complete: () => this.stockImporting.set(false)
    });
  }

  clearStockImport(): void {
    this.stockImportText.set('');
    this.stockImportFileName.set(null);
  }

  uploadStockImport(event: Event): void {
    this.readImportFile(event, content => this.stockImportText.set(content), name => this.stockImportFileName.set(name));
  }

  importSpeciesProfileRows(): void {
    const rows = this.validSpeciesProfileImportRows();
    const skipped = this.speciesProfileImportPreview().length - rows.length;
    if (rows.length === 0) {
      this.error.set('Paste or upload at least one valid species profile row before importing.');
      return;
    }

    const skippedText = skipped > 0 ? ` ${skipped.toLocaleString()} invalid row${skipped === 1 ? '' : 's'} will be skipped.` : '';
    if (!confirm(`Import ${rows.length.toLocaleString()} species profile row${rows.length === 1 ? '' : 's'}?${skippedText}`)) {
      return;
    }

    this.speciesProfileImporting.set(true);
    this.message.set(null);
    this.error.set(null);
    forkJoin(rows.map(row => {
      const request: FishSpeciesProfileRequest = {
        commonName: row.commonName,
        scientificName: row.scientificName,
        adultSize: row.adultSize,
        temperament: row.temperament,
        temperaturePreference: row.temperaturePreference,
        phPreference: row.phPreference,
        ghPreference: row.ghPreference,
        khPreference: row.khPreference,
        careLevel: row.careLevel,
        tankLevel: row.tankLevel,
        isQuarantineRequired: row.isQuarantineRequired,
        notes: row.notes
      };
      return row.matchedProfileId
        ? this.service.updateSpeciesProfile(row.matchedProfileId, request)
        : this.service.createSpeciesProfile(request);
    })).subscribe({
      next: () => {
        this.message.set(`${rows.length.toLocaleString()} species profile row${rows.length === 1 ? '' : 's'} imported.`);
        this.speciesProfileImportText.set('');
        this.speciesProfileImportFileName.set(null);
        this.loadSpeciesProfiles();
        this.loadSpeciesProfileGaps();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Species profile import failed.'),
      complete: () => this.speciesProfileImporting.set(false)
    });
  }

  clearSpeciesProfileImport(): void {
    this.speciesProfileImportText.set('');
    this.speciesProfileImportFileName.set(null);
  }

  uploadSpeciesProfileImport(event: Event): void {
    this.readImportFile(event, content => this.speciesProfileImportText.set(content), name => this.speciesProfileImportFileName.set(name));
  }

  importSpeciesFoodRows(): void {
    const rows = this.validSpeciesFoodImportRows();
    const skipped = this.speciesFoodImportPreview().length - rows.length;
    if (rows.length === 0) {
      this.error.set('Paste or upload at least one valid species food row before importing.');
      return;
    }

    const skippedText = skipped > 0 ? ` ${skipped.toLocaleString()} invalid row${skipped === 1 ? '' : 's'} will be skipped.` : '';
    if (!confirm(`Import ${rows.length.toLocaleString()} species food row${rows.length === 1 ? '' : 's'}?${skippedText}`)) {
      return;
    }

    this.speciesFoodImporting.set(true);
    this.message.set(null);
    this.error.set(null);
    forkJoin(rows.map(row => this.service.createSpeciesFood(row.fishSpeciesProfileId!, {
      foodName: row.foodName,
      foodType: row.foodType,
      feedingFrequency: row.feedingFrequency,
      isStaple: row.isStaple,
      notes: row.notes
    }))).subscribe({
      next: () => {
        this.message.set(`${rows.length.toLocaleString()} species food row${rows.length === 1 ? '' : 's'} imported.`);
        this.speciesFoodImportText.set('');
        this.speciesFoodImportFileName.set(null);
        this.loadSpeciesProfiles();
        this.loadSpeciesProfileGaps();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Species food import failed.'),
      complete: () => this.speciesFoodImporting.set(false)
    });
  }

  clearSpeciesFoodImport(): void {
    this.speciesFoodImportText.set('');
    this.speciesFoodImportFileName.set(null);
  }

  uploadSpeciesFoodImport(event: Event): void {
    this.readImportFile(event, content => this.speciesFoodImportText.set(content), name => this.speciesFoodImportFileName.set(name));
  }

  saveSpeciesProfile(): void {
    const form = this.speciesProfileForm();
    if (!form.commonName.trim()) {
      this.error.set('Common name is required for the species profile.');
      return;
    }

    this.speciesProfileSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toSpeciesProfileRequest(form);
    const call = form.id
      ? this.service.updateSpeciesProfile(form.id, request)
      : this.service.createSpeciesProfile(request);

    call.subscribe({
      next: profile => {
        this.message.set(`${profile.commonName} profile saved.`);
        this.speciesProfileForm.set(this.fromSpeciesProfile(profile));
        this.speciesFoodForm.set(this.emptySpeciesFoodForm(profile.id));
        this.loadSpeciesProfiles();
        this.loadSpeciesProfileGaps();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save species profile.'),
      complete: () => this.speciesProfileSaving.set(false)
    });
  }

  editSpeciesProfile(profile: FishSpeciesProfile): void {
    this.speciesProfileForm.set(this.fromSpeciesProfile(profile));
    this.speciesFoodForm.set(this.emptySpeciesFoodForm(profile.id));
    this.message.set(null);
    this.error.set(null);
  }

  createProfileFromStock(stock: FishStock): void {
    this.speciesProfileForm.set({
      id: null,
      commonName: stock.commonName,
      scientificName: stock.scientificName ?? '',
      adultSize: stock.adultSize ?? '',
      temperament: stock.temperament ?? '',
      temperaturePreference: stock.temperaturePreference ?? '',
      phPreference: stock.phPreference ?? '',
      ghPreference: '',
      khPreference: '',
      careLevel: '',
      tankLevel: '',
      isQuarantineRequired: true,
      notes: stock.notes ?? ''
    });
    this.speciesFoodForm.set(this.emptySpeciesFoodForm());
  }

  createProfileFromGap(gap: FishSpeciesProfileGap): void {
    const stock = this.stock().find(item => item.id === gap.fishStockId);
    if (stock) {
      this.createProfileFromStock(stock);
      return;
    }

    this.speciesProfileForm.set({
      ...this.emptySpeciesProfileForm(),
      commonName: gap.commonName,
      scientificName: gap.scientificName ?? ''
    });
  }

  deleteSpeciesProfile(profile: FishSpeciesProfile): void {
    if (!confirm(`Delete the ${profile.commonName} species profile and its food rows?`)) {
      return;
    }

    this.service.deleteSpeciesProfile(profile.id).subscribe({
      next: () => {
        this.message.set(`${profile.commonName} profile deleted.`);
        this.resetSpeciesProfileForm();
        this.loadSpeciesProfiles();
        this.loadSpeciesProfileGaps();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete species profile.')
    });
  }

  saveSpeciesFood(): void {
    const form = this.speciesFoodForm();
    const profileId = form.fishSpeciesProfileId ?? this.speciesProfileForm().id;
    if (!profileId) {
      this.error.set('Save or select a species profile before adding foods.');
      return;
    }

    if (!form.foodName.trim()) {
      this.error.set('Food name is required.');
      return;
    }

    this.speciesFoodSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toSpeciesFoodRequest({ ...form, fishSpeciesProfileId: profileId });
    const call = form.id
      ? this.service.updateSpeciesFood(form.id, request)
      : this.service.createSpeciesFood(profileId, request);

    call.subscribe({
      next: food => {
        this.message.set(`${food.foodName} saved.`);
        this.speciesFoodForm.set(this.emptySpeciesFoodForm(profileId));
        this.loadSpeciesProfiles();
        this.loadSpeciesProfileGaps();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save species food.'),
      complete: () => this.speciesFoodSaving.set(false)
    });
  }

  editSpeciesFood(food: FishSpeciesFood): void {
    this.speciesFoodForm.set({
      id: food.id,
      fishSpeciesProfileId: food.fishSpeciesProfileId,
      foodName: food.foodName,
      foodType: food.foodType ?? '',
      feedingFrequency: food.feedingFrequency ?? '',
      isStaple: food.isStaple,
      notes: food.notes ?? ''
    });
  }

  deleteSpeciesFood(food: FishSpeciesFood): void {
    if (!confirm(`Delete ${food.foodName} from this species profile?`)) {
      return;
    }

    this.service.deleteSpeciesFood(food.id).subscribe({
      next: () => {
        this.message.set(`${food.foodName} deleted.`);
        this.speciesFoodForm.set(this.emptySpeciesFoodForm(food.fishSpeciesProfileId));
        this.loadSpeciesProfiles();
        this.loadSpeciesProfileGaps();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete species food.')
    });
  }

  resetSpeciesProfileForm(): void {
    this.speciesProfileForm.set(this.emptySpeciesProfileForm());
    this.speciesFoodForm.set(this.emptySpeciesFoodForm());
  }

  saveTankTask(): void {
    const form = this.taskForm();
    if (!form.fishTankId || !form.title.trim()) {
      this.error.set('Choose a tank and enter a task title.');
      return;
    }

    this.taskSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toTaskRequest(form);
    const call = form.id
      ? this.service.updateTankTask(form.id, request)
      : this.service.createTankTask(request);

    call.subscribe({
      next: task => {
        this.message.set(`${task.title} saved.`);
        this.resetTaskForm();
        this.loadTankTasks();
        this.loadOccurrences();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save fish task.'),
      complete: () => this.taskSaving.set(false)
    });
  }

  editTankTask(task: FishTankTask): void {
    const parsed = this.parseInterval(task);
    this.taskForm.set({
      id: task.id,
      fishTankId: task.fishTankId,
      title: task.title,
      description: task.description ?? '',
      taskCategory: task.taskCategory,
      isActive: task.isActive,
      startDate: task.startDate.slice(0, 10),
      endDate: task.endDate?.slice(0, 10) ?? '',
      interval: parsed.interval,
      intervalUnit: parsed.unit,
      notes: task.notes ?? ''
    });
    this.message.set(null);
    this.error.set(null);
  }

  deleteTankTask(task: FishTankTask): void {
    if (!confirm(`Delete "${task.title}" and generated occurrences?`)) {
      return;
    }

    this.service.deleteTankTask(task.id).subscribe({
      next: () => {
        this.message.set(`${task.title} deleted.`);
        this.loadTankTasks();
        this.loadOccurrences();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete fish task.')
    });
  }

  generateFishSchedule(): void {
    const days = this.schedulePreviewDays();
    const previewCount = this.fishSchedulePreviewCount();
    if (previewCount === 0) {
      this.error.set('There are no active Fish task occurrences in the selected window.');
      return;
    }

    if (!confirm(`Generate ${previewCount.toLocaleString()} previewed Fish schedule occurrence${previewCount === 1 ? '' : 's'} for the next ${days} days? Existing occurrences are skipped.`)) {
      return;
    }

    this.generatingFishSchedule.set(true);
    this.message.set(null);
    this.error.set(null);
    const from = this.toDateInput(new Date());
    const to = this.toDateInput(this.addDays(new Date(), days));
    this.service.generateFishOccurrences(from, to).subscribe({
      next: result => {
        this.message.set(`Created ${result.created.toLocaleString()} Fish schedule occurrence${result.created === 1 ? '' : 's'}.`);
        this.loadOccurrences();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to generate Fish schedule.'),
      complete: () => this.generatingFishSchedule.set(false)
    });
  }

  applyTaskTemplate(template: FishTaskTemplate): void {
    this.taskForm.update(form => ({
      ...form,
      title: template.title,
      description: template.description,
      taskCategory: template.taskCategory,
      interval: template.interval,
      intervalUnit: template.intervalUnit,
      notes: template.notes
    }));
    this.message.set(null);
    this.error.set(null);
  }

  completeDashboardTask(card: FishTankDashboardCard): void {
    if (!card.nextTask || !card.nextOccurrence) {
      this.error.set(`No scheduled Fish task found for ${card.tank.name}. Generate the Fish schedule first.`);
      return;
    }

    this.completeTaskOccurrence(card.nextTask, card.nextOccurrence);
  }

  completeNextTaskOccurrence(task: FishTankTask): void {
    this.completeTaskOccurrence(task, this.nextOccurrenceForTask(task));
  }

  completeOverdueTask(item: FishOverdueTaskReportItem): void {
    this.completeTaskOccurrence(item.task, item.occurrence);
  }

  prepareWaterTest(item: FishTankTestReportItem): void {
    this.logForm.set({
      id: null,
      fishTankId: item.tank.id,
      loggedAt: this.toLocalInput(new Date().toISOString()),
      logType: 'Water Test',
      temperature: null,
      ammonia: null,
      nitrite: null,
      nitrate: null,
      ph: null,
      gh: null,
      kh: null,
      notes: item.latestTest
        ? `Follow-up water test. Previous test was ${this.latestTestLabel(item)}.`
        : 'Initial water test.'
    });
    this.logTankFilter.set(item.tank.id);
    this.message.set(`Water test form ready for ${item.tank.name}.`);
    this.error.set(null);
    this.scrollToElement('fish-log-form');
  }

  prepareProductReplacement(product: FishAquariumProduct): void {
    this.productUsageForm.set({
      id: null,
      fishAquariumProductId: product.id,
      usedAt: this.toLocalInput(new Date().toISOString()),
      usageType: 'Replaced',
      quantityUsed: null,
      quantityAfter: product.quantity,
      percentLeftAfter: 100,
      openedNewContainer: true,
      updateInventory: true,
      addToShoppingList: false,
      shoppingCategory: 'Pet',
      notes: `Replacement from Fish report. ${this.replacementReason(product)}.`
    });
    this.productUsageFilter.set(product.id);
    this.message.set(`Replacement usage form ready for ${product.name}.`);
    this.error.set(null);
    this.scrollToElement('fish-product-usage-form');
  }

  addProductReplacementToShoppingList(product: FishAquariumProduct): void {
    this.addingShoppingProductId.set(product.id);
    this.message.set(null);
    this.error.set(null);
    this.service.addProductShoppingCandidate(product.id, this.replacementReason(product)).subscribe({
      next: item => this.message.set(`${item.itemName} is on the ${item.category} shopping list.`),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to add product to the shopping list.'),
      complete: () => this.addingShoppingProductId.set(null)
    });
  }

  resetReportFilters(): void {
    this.reportTankFilter.set(null);
    this.reportTaskCategoryFilter.set('All');
    this.reportProductCategoryFilter.set('All');
    this.speciesGapFilter.set('All');
    this.reportCriticalOnly.set(false);
  }

  exportOverdueFishTasks(): void {
    this.downloadCsv('fish-overdue-tasks.csv', [
      ['Tank', 'Task', 'Category', 'Due Date', 'Days Overdue', 'Status'],
      ...this.filteredOverdueFishTasks().map(item => [
        item.task.tankName,
        item.task.title,
        item.task.taskCategory,
        new Date(item.occurrence.scheduledDate).toLocaleDateString(),
        item.daysOverdue,
        item.occurrence.status
      ])
    ]);
  }

  exportTanksNeedingTests(): void {
    this.downloadCsv('fish-tanks-needing-tests.csv', [
      ['Tank', 'Location', 'Gallons', 'Last Test', 'Days Since Test'],
      ...this.filteredTanksNeedingTests().map(item => [
        item.tank.name,
        item.tank.location,
        item.tank.gallons ?? '',
        item.latestTest ? new Date(item.latestTest.loggedAt).toLocaleDateString() : '',
        item.daysSinceTest ?? ''
      ])
    ]);
  }

  exportProductsNeedingReplacement(): void {
    this.downloadCsv('fish-products-needing-replacement.csv', [
      ['Product', 'Category', 'Tank', 'Quantity', 'Unit', 'Percent Left', 'Expiration Date', 'Status', 'Reason'],
      ...this.filteredProductsNeedingReplacement().map(product => [
        product.name,
        product.category,
        product.tankName ?? 'General',
        product.quantity ?? '',
        product.unit ?? '',
        product.percentLeft ?? '',
        product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : '',
        this.productStatus(product),
        this.replacementReason(product)
      ])
    ]);
  }

  exportSpeciesProfileGaps(): void {
    this.downloadCsv('fish-species-profile-gaps.csv', [
      ['Gap Type', 'Common Name', 'Scientific Name', 'Tank', 'Detail'],
      ...this.filteredSpeciesProfileGaps().map(gap => [
        gap.gapType,
        gap.commonName,
        gap.scientificName ?? '',
        gap.tankName ?? '',
        gap.detail
      ])
    ]);
  }

  exportSpeciesFoodProductGaps(): void {
    this.downloadCsv('fish-food-product-gaps.csv', [
      ['Species', 'Scientific Name', 'Food', 'Food Type', 'Frequency', 'Staple', 'Notes'],
      ...this.speciesFoodProductGaps().map(item => [
        item.profile.commonName,
        item.profile.scientificName ?? '',
        item.food.foodName,
        item.food.foodType ?? '',
        item.food.feedingFrequency ?? '',
        item.food.isStaple,
        item.food.notes ?? ''
      ])
    ]);
  }

  exportQuarantineAttention(): void {
    this.downloadCsv('fish-quarantine-attention.csv', [
      ['Issue', 'Species', 'Scientific Name', 'Tank/Route', 'Days', 'Detail', 'Notes'],
      ...this.quarantineAttention().map(item => [
        item.issue,
        item.event?.commonName ?? item.stock?.commonName ?? item.profile?.commonName ?? '',
        item.event?.scientificName ?? item.stock?.scientificName ?? item.profile?.scientificName ?? '',
        item.event ? this.livestockRoute(item.event) : item.stock?.tankName ?? '',
        item.days ?? '',
        item.detail,
        item.event?.notes ?? item.stock?.notes ?? ''
      ])
    ]);
  }

  exportQuarantineEvents(): void {
    this.downloadCsv('fish-quarantine-events.csv', [
      ['Started', 'Duration', 'Route', 'Common Name', 'Scientific Name', 'Quantity', 'Notes'],
      ...this.quarantineEvents().map(event => [
        new Date(event.eventDate).toLocaleDateString(),
        this.quarantineDuration(event),
        this.livestockRoute(event),
        event.commonName,
        event.scientificName ?? '',
        event.quantity,
        event.notes ?? ''
      ])
    ]);
  }

  saveLivestockEvent(): void {
    const form = this.livestockForm();
    if (!form.fishTankId || !form.commonName.trim()) {
      this.error.set('Choose a tank and enter a common name.');
      return;
    }

    if (form.eventType === 'Move' && !form.destinationFishTankId) {
      this.error.set('Move events need a destination tank.');
      return;
    }

    this.livestockSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toLivestockRequest(form);
    const call = form.id
      ? this.service.updateLivestockEvent(form.id, request)
      : this.service.createLivestockEvent(request);

    call.subscribe({
      next: event => {
        this.message.set(`${event.eventType} logged for ${event.quantity} ${event.commonName}.`);
        this.resetLivestockForm();
        this.loadLivestockEvents();
        this.loadStock();
        this.loadHistory();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save livestock event.'),
      complete: () => this.livestockSaving.set(false)
    });
  }

  editLivestockEvent(event: FishLivestockEvent): void {
    this.livestockForm.set({
      id: event.id,
      fishTankId: event.fishTankId,
      destinationFishTankId: event.destinationFishTankId,
      eventDate: this.toLocalInput(event.eventDate),
      eventType: event.eventType,
      commonName: event.commonName,
      scientificName: event.scientificName ?? '',
      quantity: event.quantity,
      updatesStock: event.updatesStock,
      notes: event.notes ?? ''
    });
    this.message.set(null);
    this.error.set(null);
  }

  deleteLivestockEvent(event: FishLivestockEvent): void {
    if (!confirm(`Delete the ${event.eventType} event for ${event.commonName}? Stock changes from this event will be reversed.`)) {
      return;
    }

    this.service.deleteLivestockEvent(event.id).subscribe({
      next: () => {
        this.message.set(`${event.eventType} event deleted.`);
        this.loadLivestockEvents();
        this.loadStock();
        this.loadHistory();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete livestock event.')
    });
  }

  saveProduct(): void {
    const form = this.productForm();
    if (!form.name.trim()) {
      this.error.set('Product name is required.');
      return;
    }

    if (!form.category.trim()) {
      this.error.set('Product category is required.');
      return;
    }

    if (form.percentLeft !== null && (Number(form.percentLeft) < 0 || Number(form.percentLeft) > 100)) {
      this.error.set('Percent left must be between 0 and 100.');
      return;
    }

    this.productSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toProductRequest(form);
    const call = form.id
      ? this.service.updateProduct(form.id, request)
      : this.service.createProduct(request);

    call.subscribe({
      next: product => {
        this.message.set(`${product.name} saved.`);
        this.resetProductForm();
        this.loadProducts();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save aquarium product.'),
      complete: () => this.productSaving.set(false)
    });
  }

  editProduct(product: FishAquariumProduct): void {
    this.productForm.set({
      id: product.id,
      fishTankId: product.fishTankId,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      unit: product.unit ?? '',
      percentLeft: product.percentLeft,
      expirationDate: product.expirationDate?.slice(0, 10) ?? '',
      isActive: product.isActive,
      notes: product.notes ?? ''
    });
    this.message.set(null);
    this.error.set(null);
  }

  deleteProduct(product: FishAquariumProduct): void {
    if (!confirm(`Delete "${product.name}" from aquarium products?`)) {
      return;
    }

    this.service.deleteProduct(product.id).subscribe({
      next: () => {
        this.message.set(`${product.name} deleted.`);
        this.loadProducts();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete aquarium product.')
    });
  }

  importProductRows(): void {
    const rows = this.validProductImportRows();
    const skipped = this.productImportPreview().length - rows.length;
    if (rows.length === 0) {
      this.error.set('Paste or upload at least one valid product row before importing.');
      return;
    }

    const skippedText = skipped > 0 ? ` ${skipped.toLocaleString()} invalid row${skipped === 1 ? '' : 's'} will be skipped.` : '';
    if (!confirm(`Import ${rows.length.toLocaleString()} aquarium product${rows.length === 1 ? '' : 's'}?${skippedText}`)) {
      return;
    }

    this.productImporting.set(true);
    this.message.set(null);
    this.error.set(null);
    forkJoin(rows.map(row => this.service.createProduct({
      fishTankId: row.fishTankId,
      name: row.name,
      category: row.category,
      quantity: row.quantity,
      unit: row.unit,
      percentLeft: row.percentLeft,
      expirationDate: row.expirationDate,
      isActive: row.isActive,
      notes: row.notes
    }))).subscribe({
      next: () => {
        this.message.set(`${rows.length.toLocaleString()} aquarium product${rows.length === 1 ? '' : 's'} imported.`);
        this.productImportText.set('');
        this.productImportFileName.set(null);
        this.loadProducts();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Aquarium product import failed.'),
      complete: () => this.productImporting.set(false)
    });
  }

  clearProductImport(): void {
    this.productImportText.set('');
    this.productImportFileName.set(null);
  }

  uploadProductImport(event: Event): void {
    this.readImportFile(event, content => this.productImportText.set(content), name => this.productImportFileName.set(name));
  }

  saveProductUsage(): void {
    const form = this.productUsageForm();
    if (!form.fishAquariumProductId) {
      this.error.set('Choose a product for the usage log.');
      return;
    }

    if (!form.usageType.trim()) {
      this.error.set('Choose a usage type.');
      return;
    }

    if (form.percentLeftAfter !== null && (Number(form.percentLeftAfter) < 0 || Number(form.percentLeftAfter) > 100)) {
      this.error.set('Percent left must be between 0 and 100.');
      return;
    }

    this.productUsageSaving.set(true);
    this.message.set(null);
    this.error.set(null);
    const request = this.toProductUsageRequest(form);
    const call = form.id
      ? this.service.updateProductUsage(form.id, request)
      : this.service.createProductUsage(request);

    call.subscribe({
      next: usage => {
        this.message.set(`${usage.productName} usage logged.`);
        this.resetProductUsageForm();
        this.loadProductUsage();
        this.loadProducts();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save product usage.'),
      complete: () => this.productUsageSaving.set(false)
    });
  }

  editProductUsage(usage: FishAquariumProductUsage): void {
    this.productUsageForm.set({
      id: usage.id,
      fishAquariumProductId: usage.fishAquariumProductId,
      usedAt: this.toLocalInput(usage.usedAt),
      usageType: usage.usageType,
      quantityUsed: usage.quantityUsed,
      quantityAfter: usage.quantityAfter,
      percentLeftAfter: usage.percentLeftAfter,
      openedNewContainer: usage.openedNewContainer,
      updateInventory: usage.updateInventory,
      addToShoppingList: usage.addToShoppingList,
      shoppingCategory: usage.shoppingCategory || 'Pet',
      notes: usage.notes ?? ''
    });
    this.message.set(null);
    this.error.set(null);
  }

  deleteProductUsage(usage: FishAquariumProductUsage): void {
    if (!confirm(`Delete the ${usage.usageType} log for "${usage.productName}"? Current inventory will not be recalculated.`)) {
      return;
    }

    this.service.deleteProductUsage(usage.id).subscribe({
      next: () => {
        this.message.set(`${usage.productName} usage log deleted.`);
        this.loadProductUsage();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete product usage.')
    });
  }

  resetForm(): void {
    this.form.set(this.emptyForm());
  }

  resetLogForm(): void {
    this.logForm.set(this.emptyLogForm(this.logForm().fishTankId ?? this.activeTanks()[0]?.id ?? null));
  }

  resetStockForm(): void {
    this.stockForm.set(this.emptyStockForm(this.stockForm().fishTankId ?? this.activeTanks()[0]?.id ?? null));
  }

  resetTaskForm(): void {
    this.taskForm.set(this.emptyTaskForm(this.taskForm().fishTankId ?? this.activeTanks()[0]?.id ?? null));
  }

  resetLivestockForm(): void {
    this.livestockForm.set(this.emptyLivestockForm(this.livestockForm().fishTankId ?? this.activeTanks()[0]?.id ?? null));
  }

  resetProductForm(): void {
    this.productForm.set(this.emptyProductForm());
  }

  resetProductUsageForm(): void {
    this.productUsageForm.set(this.emptyProductUsageForm(this.productUsageForm().fishAquariumProductId));
  }

  setForm<K extends keyof FishTankForm>(key: K, value: FishTankForm[K]): void {
    this.form.update(form => ({ ...form, [key]: value }));
  }

  setLogForm<K extends keyof FishTankLogForm>(key: K, value: FishTankLogForm[K]): void {
    this.logForm.update(form => ({ ...form, [key]: value }));
  }

  setStockForm<K extends keyof FishStockForm>(key: K, value: FishStockForm[K]): void {
    this.stockForm.update(form => ({ ...form, [key]: value }));
  }

  setSpeciesProfileForm<K extends keyof FishSpeciesProfileForm>(key: K, value: FishSpeciesProfileForm[K]): void {
    this.speciesProfileForm.update(form => ({ ...form, [key]: value }));
  }

  setSpeciesFoodForm<K extends keyof FishSpeciesFoodForm>(key: K, value: FishSpeciesFoodForm[K]): void {
    this.speciesFoodForm.update(form => ({ ...form, [key]: value }));
  }

  setTaskForm<K extends keyof FishTaskForm>(key: K, value: FishTaskForm[K]): void {
    this.taskForm.update(form => ({ ...form, [key]: value }));
  }

  setLivestockForm<K extends keyof LivestockEventForm>(key: K, value: LivestockEventForm[K]): void {
    this.livestockForm.update(form => ({ ...form, [key]: value }));
  }

  setProductForm<K extends keyof AquariumProductForm>(key: K, value: AquariumProductForm[K]): void {
    this.productForm.update(form => ({ ...form, [key]: value }));
  }

  setProductUsageForm<K extends keyof AquariumProductUsageForm>(key: K, value: AquariumProductUsageForm[K]): void {
    this.productUsageForm.update(form => ({ ...form, [key]: value }));
  }

  livestockRoute(event: FishLivestockEvent): string {
    return event.destinationTankName
      ? `${event.tankName} -> ${event.destinationTankName}`
      : event.tankName;
  }

  quarantineDuration(event: FishLivestockEvent): string {
    const start = new Date(event.eventDate);
    const today = new Date();
    const days = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
    return `${days.toLocaleString()} day${days === 1 ? '' : 's'}`;
  }

  speciesProfileSummary(stock: FishStock): string {
    const profile = this.findSpeciesProfile(stock);
    const parts = profile
      ? [
          profile.adultSize ? `Adult ${profile.adultSize}` : null,
          profile.temperament || null,
          profile.temperaturePreference ? `Temp ${profile.temperaturePreference}` : null,
          profile.phPreference ? `pH ${profile.phPreference}` : null
        ].filter(Boolean)
      : [
          stock.adultSize ? `Adult ${stock.adultSize}` : null,
          stock.temperament || null,
          stock.temperaturePreference ? `Temp ${stock.temperaturePreference}` : null,
          stock.phPreference ? `pH ${stock.phPreference}` : null
        ].filter(Boolean);

    return parts.length ? parts.join(' / ') : '-';
  }

  speciesFoodsSummary(profile: FishSpeciesProfile): string {
    return profile.foods.length
      ? profile.foods.map(food => `${food.foodName}${food.isStaple ? ' (staple)' : ''}`).join(', ')
      : 'No foods listed';
  }

  foodProductSummary(food: FishSpeciesFood): string {
    const matches = this.matchingFoodProducts(food);
    return matches.length
      ? matches.map(product => `${product.name}${product.percentLeft !== null ? ` (${product.percentLeft}% left)` : ''}`).join(', ')
      : 'No matching Food product';
  }

  matchingFoodProducts(food: FishSpeciesFood): FishAquariumProduct[] {
    const normalizedFood = this.normalizedMatchText(food.foodName);
    if (!normalizedFood) {
      return [];
    }

    return this.products()
      .filter(product => product.isActive)
      .filter(product => product.category === 'Food')
      .filter(product => {
        const normalizedProduct = this.normalizedMatchText(product.name);
        return normalizedProduct === normalizedFood ||
          normalizedProduct.includes(normalizedFood) ||
          normalizedFood.includes(normalizedProduct);
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private findSpeciesProfile(stock: FishStock): FishSpeciesProfile | null {
    return this.findSpeciesProfileByName(stock.commonName, stock.scientificName);
  }

  private hasQuarantineEventForSpecies(commonName: string, scientificName?: string | null): boolean {
    const normalizedCommon = commonName.trim().toLowerCase();
    const normalizedScientific = scientificName?.trim().toLowerCase();
    return this.quarantineEvents().some(event => {
      if (normalizedScientific && event.scientificName?.trim().toLowerCase() === normalizedScientific) {
        return true;
      }

      return !!normalizedCommon && event.commonName.trim().toLowerCase() === normalizedCommon;
    });
  }

  private normalizedMatchText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private findSpeciesProfileByName(commonName: string, scientificName?: string | null): FishSpeciesProfile | null {
    const normalizedCommon = commonName.trim().toLowerCase();
    const normalizedScientific = scientificName?.trim().toLowerCase();
    return this.speciesProfiles().find(profile => {
      if (normalizedScientific && profile.scientificName?.trim().toLowerCase() === normalizedScientific) {
        return true;
      }

      return !!normalizedCommon && profile.commonName.trim().toLowerCase() === normalizedCommon;
    }) ?? null;
  }

  overdueTaskSummary(item: FishOverdueTaskReportItem): string {
    return `${item.task.tankName} / ${item.task.title}`;
  }

  overdueDaysLabel(days: number): string {
    return `${days.toLocaleString()} day${days === 1 ? '' : 's'} overdue`;
  }

  latestTestLabel(item: FishTankTestReportItem): string {
    if (!item.latestTest || item.daysSinceTest === null) {
      return 'No water test logged';
    }

    return `${new Date(item.latestTest.loggedAt).toLocaleDateString()} (${item.daysSinceTest.toLocaleString()} day${item.daysSinceTest === 1 ? '' : 's'} ago)`;
  }

  replacementReason(product: FishAquariumProduct): string {
    const status = this.productStatus(product);
    if (status === 'Expired' && product.expirationDate) {
      return `Expired ${new Date(product.expirationDate).toLocaleDateString()}`;
    }

    if (status === 'Expiring Soon' && product.expirationDate) {
      return `Expires ${new Date(product.expirationDate).toLocaleDateString()}`;
    }

    if (status === 'Empty') {
      return 'Empty';
    }

    if (status === 'Low') {
      return product.percentLeft !== null ? `${product.percentLeft}% left` : 'Low quantity';
    }

    return status;
  }

  readingSummary(log: Pick<FishTankLog, 'temperature' | 'ammonia' | 'nitrite' | 'nitrate' | 'ph' | 'gh' | 'kh'>): string {
    const readings = [
      this.readingPart('Temp', log.temperature),
      this.readingPart('NH3', log.ammonia),
      this.readingPart('NO2', log.nitrite),
      this.readingPart('NO3', log.nitrate),
      this.readingPart('pH', log.ph),
      this.readingPart('GH', log.gh),
      this.readingPart('KH', log.kh)
    ].filter(Boolean);

    return readings.length ? readings.join(' / ') : '-';
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  statusLabel(tank: FishTank): string {
    if (!tank.isSetup) {
      return 'Not setup';
    }

    return tank.isActive ? 'Active' : 'Inactive';
  }

  statusTone(tank: FishTank): string {
    if (!tank.isSetup) {
      return 'border-slate-200 bg-slate-50 text-slate-700';
    }

    return tank.isActive
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';
  }

  historyTone(item: FishTankHistoryItem): string {
    if (item.kind === 'Task') {
      return 'app-token-soft-surface app-token-text-primary';
    }

    if (item.kind === 'Livestock') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }

    if (item.kind === 'Product') {
      return 'app-token-soft-surface app-token-text-primary';
    }

    return 'app-token-soft-surface app-token-text-strong';
  }

  historySummary(item: FishTankHistoryItem): string {
    if (item.kind === 'Reading') {
      return this.readingSummary(item);
    }

    return item.detail || item.status || '-';
  }

  productStatus(product: FishAquariumProduct): string {
    if (!product.isActive) {
      return 'Inactive';
    }

    if (this.isExpired(product)) {
      return 'Expired';
    }

    if (this.isEmptyProduct(product)) {
      return 'Empty';
    }

    if (this.isLowProduct(product)) {
      return 'Low';
    }

    if (this.isExpiringSoon(product)) {
      return 'Expiring Soon';
    }

    return 'Good';
  }

  productStatusTone(product: FishAquariumProduct): string {
    switch (this.productStatus(product)) {
      case 'Expired':
      case 'Empty':
        return 'border-rose-200 bg-rose-50 text-rose-800';
      case 'Low':
      case 'Expiring Soon':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'Inactive':
        return 'border-slate-200 bg-slate-50 text-slate-700';
      default:
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }
  }

  latestReadingText(log: FishTankLog | null): string {
    return log ? this.readingSummary(log) : '-';
  }

  nextDueText(card: FishTankDashboardCard): string {
    if (!card.nextOccurrence || !card.nextTask) {
      return 'None scheduled';
    }

    return `${card.nextTask.title} (${new Date(card.nextOccurrence.scheduledDate).toLocaleDateString()})`;
  }

  taskNextDueLabel(task: FishTankTask): string {
    const occurrence = this.nextOccurrenceForTask(task);
    return occurrence ? new Date(occurrence.scheduledDate).toLocaleDateString() : 'No generated occurrence';
  }

  hasCompletableOccurrence(task: FishTankTask): boolean {
    return this.nextOccurrenceForTask(task) !== null;
  }

  isCompletingTask(task: FishTankTask): boolean {
    return this.nextOccurrenceForTask(task)?.occurrenceID === this.completingOccurrenceId();
  }

  isCompletingCard(card: FishTankDashboardCard): boolean {
    return card.nextOccurrence?.occurrenceID === this.completingOccurrenceId();
  }


  completeFishOccurrence(occurrence: TaskOccurrence, note?: string | null): void {
    this.updateFishOccurrence(occurrence, { status: 'Completed', completedDate: new Date().toISOString(), notes: note }, 'completed');
  }

  skipFishOccurrence(occurrence: TaskOccurrence, note?: string | null): void {
    this.updateFishOccurrence(occurrence, { status: 'Skipped', notes: note ?? 'Skipped from the shared schedule.' }, 'skipped');
  }

  reopenFishOccurrence(occurrence: TaskOccurrence, note?: string | null): void {
    this.updateFishOccurrence(occurrence, { status: 'Scheduled', notes: note ?? 'Reopened from the shared schedule.' }, 'reopened');
  }

  startMoveFishOccurrence(occurrence: TaskOccurrence): void {
    this.occurrenceMoveId.set(occurrence.occurrenceID);
    this.occurrenceMoveDate.set(occurrence.scheduledDate.slice(0, 10));
  }

  cancelMoveFishOccurrence(): void {
    this.occurrenceMoveId.set(null);
    this.occurrenceMoveDate.set('');
  }

  moveFishOccurrence(occurrence: TaskOccurrence, note?: string | null): void {
    if (!this.occurrenceMoveDate()) {
      return;
    }

    const originalDate = occurrence.scheduledDate.slice(0, 10);
    this.updateFishOccurrence(occurrence, {
      status: 'Scheduled',
      scheduledDate: this.occurrenceMoveDate(),
      notes: note ?? `Rescheduled from ${originalDate}.`
    }, 'rescheduled', () => this.cancelMoveFishOccurrence());
  }

  canCompleteFishOccurrence(occurrence: TaskOccurrence): boolean {
    return occurrence.status === 'Scheduled' || occurrence.status === 'Missed';
  }

  canSkipFishOccurrence(occurrence: TaskOccurrence): boolean {
    return occurrence.status === 'Scheduled' || occurrence.status === 'Missed';
  }

  canMoveFishOccurrence(occurrence: TaskOccurrence): boolean {
    return occurrence.status !== 'Completed';
  }

  canReopenFishOccurrence(occurrence: TaskOccurrence): boolean {
    return occurrence.status === 'Completed' || occurrence.status === 'Skipped' || occurrence.status === 'Missed';
  }

  fishOccurrenceCapabilities(occurrence: TaskOccurrence) {
    return {
      canComplete: this.canCompleteFishOccurrence(occurrence),
      canMove: this.canMoveFishOccurrence(occurrence),
      canSkip: this.canSkipFishOccurrence(occurrence),
      canReopen: this.canReopenFishOccurrence(occurrence)
    };
  }

  isFishOccurrenceAction(occurrence: TaskOccurrence): boolean {
    return this.occurrenceActionId() === occurrence.occurrenceID || this.completingOccurrenceId() === occurrence.occurrenceID;
  }

  isMovingFishOccurrence(occurrence: TaskOccurrence): boolean {
    return this.occurrenceMoveId() === occurrence.occurrenceID;
  }

  occurrenceTaskTitle(occurrence: TaskOccurrence): string {
    return this.tankTasks().find(task => task.taskId === occurrence.taskID)?.title ?? 'Fish task';
  }

  occurrenceTaskTank(occurrence: TaskOccurrence): string {
    return this.tankTasks().find(task => task.taskId === occurrence.taskID)?.tankName ?? 'Tank';
  }

  occurrenceStatusTone(status: string): string {
    return status === 'Completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'Skipped'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : status === 'Missed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-slate-200 bg-slate-50 text-slate-700';
  }

  private updateFishOccurrence(occurrence: TaskOccurrence, request: TaskOccurrenceUpdateRequest, actionLabel: string, afterSuccess?: () => void): void {
    this.occurrenceActionId.set(occurrence.occurrenceID);
    this.message.set(null);
    this.error.set(null);
    this.service.updateOccurrence(occurrence.occurrenceID, request).subscribe({
      next: () => {
        afterSuccess?.();
        this.occurrenceActionNote.set('');
        this.message.set(`${this.occurrenceTaskTitle(occurrence)} ${actionLabel}.`);
        this.loadOccurrences();
        this.loadHistory();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to update Fish occurrence.'),
      complete: () => this.occurrenceActionId.set(null)
    });
  }
  private completeTaskOccurrence(task: FishTankTask, occurrence: TaskOccurrence | null): void {
    if (!occurrence) {
      this.error.set(`No scheduled occurrence found for ${task.title}. Generate the Fish schedule first.`);
      return;
    }

    if (!confirm(`Mark "${task.title}" due ${new Date(occurrence.scheduledDate).toLocaleDateString()} complete?`)) {
      return;
    }

    this.completingOccurrenceId.set(occurrence.occurrenceID);
    this.message.set(null);
    this.error.set(null);
    this.service.updateOccurrence(occurrence.occurrenceID, {
      status: 'Completed',
      completedDate: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.message.set(`${task.title} completed.`);
        this.loadOccurrences();
        this.loadHistory();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to complete Fish task.'),
      complete: () => this.completingOccurrenceId.set(null)
    });
  }

  private nextOccurrenceForTask(task: FishTankTask): TaskOccurrence | null {
    return this.fishOccurrences()
      .filter(occurrence => occurrence.taskID === task.taskId && occurrence.status === 'Scheduled')
      .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime())[0] ?? null;
  }

  chartPoints(): string {
    const logs = this.chartLogs();
    if (logs.length === 0) {
      return '';
    }

    if (logs.length === 1) {
      const value = this.readingValue(logs[0], this.waterChartMetric()) ?? 0;
      return `50,${this.chartY(value, [value])}`;
    }

    const values = logs.map(log => this.readingValue(log, this.waterChartMetric()) ?? 0);
    return logs
      .map((log, index) => {
        const value = this.readingValue(log, this.waterChartMetric()) ?? 0;
        const x = 8 + (index / (logs.length - 1)) * 84;
        const y = this.chartY(value, values);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  chartRangeLabel(): string {
    const logs = this.chartLogs();
    if (logs.length === 0) {
      return 'No readings';
    }

    const values = logs.map(log => this.readingValue(log, this.waterChartMetric()) ?? 0);
    return `${Math.min(...values)} - ${Math.max(...values)}`;
  }

  chartDateLabel(): string {
    const logs = this.chartLogs();
    if (logs.length === 0) {
      return '-';
    }

    const first = new Date(logs[0].loggedAt).toLocaleDateString();
    const last = new Date(logs[logs.length - 1].loggedAt).toLocaleDateString();
    return first === last ? first : `${first} - ${last}`;
  }

  chartDotX(index: number): number {
    const logs = this.chartLogs();
    return logs.length === 1 ? 50 : 8 + (index / (logs.length - 1)) * 84;
  }

  chartDotY(log: FishTankLog): number {
    const values = this.chartLogs().map(item => this.readingValue(item, this.waterChartMetric()) ?? 0);
    return this.chartY(this.readingValue(log, this.waterChartMetric()) ?? 0, values);
  }

  readingValue(log: Pick<FishTankLog, 'temperature' | 'ammonia' | 'nitrite' | 'nitrate' | 'ph' | 'gh' | 'kh'>, metric: 'temperature' | 'ammonia' | 'nitrite' | 'nitrate' | 'ph' | 'gh' | 'kh'): number | null {
    return log[metric];
  }

  chartY(value: number, values: number[]): number {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      return 50;
    }

    return 88 - ((value - min) / (max - min)) * 76;
  }

  private emptyForm(): FishTankForm {
    return {
      id: null,
      name: '',
      gallons: null,
      location: 'Basement',
      isSetup: true,
      isActive: true,
      notes: ''
    };
  }

  private emptyLogForm(fishTankId: number | null = null): FishTankLogForm {
    return {
      id: null,
      fishTankId,
      loggedAt: this.toLocalInput(new Date().toISOString()),
      logType: 'Water Test',
      temperature: null,
      ammonia: null,
      nitrite: null,
      nitrate: null,
      ph: null,
      gh: null,
      kh: null,
      notes: ''
    };
  }

  private emptyStockForm(fishTankId: number | null = null): FishStockForm {
    return {
      id: null,
      fishTankId,
      commonName: '',
      scientificName: '',
      adultSize: '',
      temperament: '',
      temperaturePreference: '',
      phPreference: '',
      quantity: 1,
      isActive: true,
      notes: ''
    };
  }

  private emptySpeciesProfileForm(): FishSpeciesProfileForm {
    return {
      id: null,
      commonName: '',
      scientificName: '',
      adultSize: '',
      temperament: '',
      temperaturePreference: '',
      phPreference: '',
      ghPreference: '',
      khPreference: '',
      careLevel: '',
      tankLevel: '',
      isQuarantineRequired: true,
      notes: ''
    };
  }

  private emptySpeciesFoodForm(fishSpeciesProfileId: number | null = null): FishSpeciesFoodForm {
    return {
      id: null,
      fishSpeciesProfileId,
      foodName: '',
      foodType: '',
      feedingFrequency: '',
      isStaple: false,
      notes: ''
    };
  }

  private emptyTaskForm(fishTankId: number | null = null): FishTaskForm {
    return {
      id: null,
      fishTankId,
      title: '',
      description: '',
      taskCategory: 'Water Change',
      isActive: true,
      startDate: this.toDateInput(new Date()),
      endDate: '',
      interval: 1,
      intervalUnit: 'weeks',
      notes: ''
    };
  }

  private emptyLivestockForm(fishTankId: number | null = null): LivestockEventForm {
    return {
      id: null,
      fishTankId,
      destinationFishTankId: null,
      eventDate: this.toLocalInput(new Date().toISOString()),
      eventType: 'Addition',
      commonName: '',
      scientificName: '',
      quantity: 1,
      updatesStock: true,
      notes: ''
    };
  }

  private emptyProductForm(): AquariumProductForm {
    return {
      id: null,
      fishTankId: null,
      name: '',
      category: 'Food',
      quantity: null,
      unit: '',
      percentLeft: null,
      expirationDate: '',
      isActive: true,
      notes: ''
    };
  }

  private emptyProductUsageForm(fishAquariumProductId: number | null = null): AquariumProductUsageForm {
    return {
      id: null,
      fishAquariumProductId,
      usedAt: this.toLocalInput(new Date().toISOString()),
      usageType: 'Used',
      quantityUsed: null,
      quantityAfter: null,
      percentLeftAfter: null,
      openedNewContainer: false,
      updateInventory: true,
      addToShoppingList: false,
      shoppingCategory: 'Pet',
      notes: ''
    };
  }

  private toRequest(form: FishTankForm): FishTankRequest {
    return {
      name: form.name.trim(),
      gallons: form.gallons === null || Number.isNaN(Number(form.gallons)) ? null : Number(form.gallons),
      location: form.location.trim(),
      isSetup: form.isSetup,
      isActive: form.isActive,
      notes: form.notes.trim() || null
    };
  }

  private toLogRequest(form: FishTankLogForm): FishTankLogRequest {
    return {
      fishTankId: Number(form.fishTankId),
      loggedAt: new Date(form.loggedAt).toISOString(),
      logType: form.logType.trim(),
      temperature: this.optionalNumber(form.temperature),
      ammonia: this.optionalNumber(form.ammonia),
      nitrite: this.optionalNumber(form.nitrite),
      nitrate: this.optionalNumber(form.nitrate),
      ph: this.optionalNumber(form.ph),
      gh: this.optionalNumber(form.gh),
      kh: this.optionalNumber(form.kh),
      notes: form.notes.trim() || null
    };
  }

  private toStockRequest(form: FishStockForm): FishStockRequest {
    return {
      fishTankId: Number(form.fishTankId),
      commonName: form.commonName.trim(),
      scientificName: form.scientificName.trim() || null,
      adultSize: form.adultSize.trim() || null,
      temperament: form.temperament.trim() || null,
      temperaturePreference: form.temperaturePreference.trim() || null,
      phPreference: form.phPreference.trim() || null,
      quantity: Number(form.quantity) || 0,
      isActive: form.isActive,
      notes: form.notes.trim() || null
    };
  }

  private toSpeciesProfileRequest(form: FishSpeciesProfileForm): FishSpeciesProfileRequest {
    return {
      commonName: form.commonName.trim(),
      scientificName: form.scientificName.trim() || null,
      adultSize: form.adultSize.trim() || null,
      temperament: form.temperament.trim() || null,
      temperaturePreference: form.temperaturePreference.trim() || null,
      phPreference: form.phPreference.trim() || null,
      ghPreference: form.ghPreference.trim() || null,
      khPreference: form.khPreference.trim() || null,
      careLevel: form.careLevel.trim() || null,
      tankLevel: form.tankLevel.trim() || null,
      isQuarantineRequired: form.isQuarantineRequired,
      notes: form.notes.trim() || null
    };
  }

  private toSpeciesFoodRequest(form: FishSpeciesFoodForm): FishSpeciesFoodRequest {
    return {
      foodName: form.foodName.trim(),
      foodType: form.foodType.trim() || null,
      feedingFrequency: form.feedingFrequency.trim() || null,
      isStaple: form.isStaple,
      notes: form.notes.trim() || null
    };
  }

  private fromSpeciesProfile(profile: FishSpeciesProfile): FishSpeciesProfileForm {
    return {
      id: profile.id,
      commonName: profile.commonName,
      scientificName: profile.scientificName ?? '',
      adultSize: profile.adultSize ?? '',
      temperament: profile.temperament ?? '',
      temperaturePreference: profile.temperaturePreference ?? '',
      phPreference: profile.phPreference ?? '',
      ghPreference: profile.ghPreference ?? '',
      khPreference: profile.khPreference ?? '',
      careLevel: profile.careLevel ?? '',
      tankLevel: profile.tankLevel ?? '',
      isQuarantineRequired: profile.isQuarantineRequired,
      notes: profile.notes ?? ''
    };
  }

  private toTaskRequest(form: FishTaskForm): FishTankTaskRequest {
    const anchor = form.startDate;
    return {
      fishTankId: Number(form.fishTankId),
      title: form.title.trim(),
      description: form.description.trim() || null,
      taskCategory: form.taskCategory,
      isActive: form.isActive,
      scheduleType: 'Interval',
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      recurrencePattern: `Interval:unit=${form.intervalUnit};interval=${Math.max(1, Number(form.interval) || 1)};anchor=${anchor}`,
      notes: form.notes.trim() || null
    };
  }

  private toLivestockRequest(form: LivestockEventForm): FishLivestockEventRequest {
    return {
      fishTankId: Number(form.fishTankId),
      destinationFishTankId: form.destinationFishTankId ? Number(form.destinationFishTankId) : null,
      eventDate: new Date(form.eventDate).toISOString(),
      eventType: form.eventType,
      commonName: form.commonName.trim(),
      scientificName: form.scientificName.trim() || null,
      quantity: Math.max(1, Number(form.quantity) || 1),
      updatesStock: form.updatesStock,
      notes: form.notes.trim() || null
    };
  }

  private toProductRequest(form: AquariumProductForm): FishAquariumProductRequest {
    return {
      fishTankId: form.fishTankId ? Number(form.fishTankId) : null,
      name: form.name.trim(),
      category: form.category,
      quantity: this.optionalNumber(form.quantity),
      unit: form.unit.trim() || null,
      percentLeft: this.optionalNumber(form.percentLeft),
      expirationDate: form.expirationDate ? new Date(form.expirationDate).toISOString() : null,
      isActive: form.isActive,
      notes: form.notes.trim() || null
    };
  }

  private toProductUsageRequest(form: AquariumProductUsageForm): FishAquariumProductUsageRequest {
    return {
      fishAquariumProductId: Number(form.fishAquariumProductId),
      usedAt: new Date(form.usedAt).toISOString(),
      usageType: form.usageType,
      quantityUsed: this.optionalNumber(form.quantityUsed),
      quantityAfter: this.optionalNumber(form.quantityAfter),
      percentLeftAfter: this.optionalNumber(form.percentLeftAfter),
      openedNewContainer: form.openedNewContainer,
      updateInventory: form.updateInventory,
      addToShoppingList: form.addToShoppingList,
      shoppingCategory: form.shoppingCategory.trim() || 'Pet',
      notes: form.notes.trim() || null
    };
  }

  private parseStockImportRows(text: string): FishStockImportRow[] {
    const rows = this.importRows(text);
    if (rows.length === 0) {
      return [];
    }

    const header = this.headerMap(rows[0], ['tank', 'commonname', 'common name', 'scientificname', 'scientific name', 'adultsize', 'adult size', 'temperament', 'temperaturepreference', 'temperature preference', 'phpreference', 'ph preference', 'quantity', 'qty', 'active', 'notes']);
    const dataRows = header ? rows.slice(1) : rows;
    return dataRows
      .map(row => {
        const tankValue = header ? this.importValue(row, header, ['tank', 'tankname', 'tank name']) : '';
        const commonName = header ? this.importValue(row, header, ['commonname', 'common name', 'name', 'species']) : row[0] ?? '';
        const scientificName = header ? this.importValue(row, header, ['scientificname', 'scientific name', 'latin', 'latinname', 'latin name']) : row[1] ?? '';
        const adultSize = header ? this.importValue(row, header, ['adultsize', 'adult size', 'size']) : '';
        const temperament = header ? this.importValue(row, header, ['temperament', 'behavior', 'behaviour']) : '';
        const temperaturePreference = header ? this.importValue(row, header, ['temperaturepreference', 'temperature preference', 'temp', 'temprange', 'temp range']) : '';
        const phPreference = header ? this.importValue(row, header, ['phpreference', 'ph preference', 'ph', 'phrange', 'ph range']) : '';
        const quantityValue = header ? this.importValue(row, header, ['quantity', 'qty', 'count']) : row[2] ?? '';
        const activeValue = header ? this.importValue(row, header, ['active', 'isactive', 'is active', 'status']) : row[3] ?? '';
        const notes = header ? this.importValue(row, header, ['notes', 'note']) : row.slice(4).join(' ').trim();
        const tank = this.resolveTank(tankValue, this.stockForm().fishTankId);
        const quantity = this.optionalImportNumber(quantityValue, 1);
        const warnings: string[] = [];

        if (!tank) {
          warnings.push('Tank is required');
        }
        if (!commonName.trim()) {
          warnings.push('Common name is required');
        }
        if (quantity === null || quantity < 0) {
          warnings.push('Quantity must be zero or greater');
        }

        return {
          fishTankId: tank?.id ?? 0,
          tankName: tank?.name ?? (tankValue || 'Missing tank'),
          commonName: commonName.trim(),
          scientificName: scientificName.trim() || null,
          adultSize: adultSize.trim() || null,
          temperament: temperament.trim() || null,
          temperaturePreference: temperaturePreference.trim() || null,
          phPreference: phPreference.trim() || null,
          quantity: quantity ?? 0,
          isActive: this.importBoolean(activeValue, true),
          notes: notes.trim() || null,
          warnings
        };
      })
      .filter(row => row.commonName || row.warnings.length > 0);
  }

  private parseProductImportRows(text: string): AquariumProductImportRow[] {
    const rows = this.importRows(text);
    if (rows.length === 0) {
      return [];
    }

    const header = this.headerMap(rows[0], ['tank', 'product', 'name', 'category', 'quantity', 'qty', 'unit', 'percentleft', 'percent left', 'expirationdate', 'expiration date', 'active', 'notes']);
    const dataRows = header ? rows.slice(1) : rows;
    return dataRows
      .map(row => {
        const tankValue = header ? this.importValue(row, header, ['tank', 'tankname', 'tank name']) : '';
        const name = header ? this.importValue(row, header, ['product', 'name', 'productname', 'product name']) : row[0] ?? '';
        const categoryValue = header ? this.importValue(row, header, ['category', 'type']) : row[1] ?? '';
        const quantityValue = header ? this.importValue(row, header, ['quantity', 'qty', 'count']) : row[2] ?? '';
        const unit = header ? this.importValue(row, header, ['unit', 'units']) : row[3] ?? '';
        const percentValue = header ? this.importValue(row, header, ['percentleft', 'percent left', 'left', 'percent']) : row[4] ?? '';
        const expirationValue = header ? this.importValue(row, header, ['expirationdate', 'expiration date', 'expires', 'expiredate', 'expire date']) : row[5] ?? '';
        const activeValue = header ? this.importValue(row, header, ['active', 'isactive', 'is active', 'status']) : row[6] ?? '';
        const notes = header ? this.importValue(row, header, ['notes', 'note']) : row.slice(7).join(' ').trim();
        const tank = this.resolveTank(tankValue, this.productForm().fishTankId);
        const matchedCategory = this.productCategories.find(item => item.toLowerCase() === categoryValue.trim().toLowerCase());
        const category = matchedCategory ?? (categoryValue.trim() || this.productForm().category || 'Other');
        const quantity = this.optionalImportNumber(quantityValue, null);
        const percentLeft = this.optionalImportNumber(percentValue.replace('%', ''), null);
        const expirationDate = this.importDate(expirationValue);
        const warnings: string[] = [];

        if (!name.trim()) {
          warnings.push('Product name is required');
        }
        if (tankValue.trim() && !this.isGeneralTankImportValue(tankValue) && !tank) {
          warnings.push('Tank was not found');
        }
        if (percentLeft !== null && (percentLeft < 0 || percentLeft > 100)) {
          warnings.push('Percent left must be between 0 and 100');
        }
        if (expirationValue.trim() && !expirationDate) {
          warnings.push('Expiration date was not recognized');
        }

        return {
          fishTankId: tank?.id ?? null,
          tankName: tank?.name ?? 'General',
          name: name.trim(),
          category,
          quantity,
          unit: unit.trim() || null,
          percentLeft,
          expirationDate,
          isActive: this.importBoolean(activeValue, true),
          notes: notes.trim() || null,
          warnings
        };
      })
      .filter(row => row.name || row.warnings.length > 0);
  }

  private parseSpeciesProfileImportRows(text: string): FishSpeciesProfileImportRow[] {
    const rows = this.importRows(text);
    if (rows.length === 0) {
      return [];
    }

    const header = this.headerMap(rows[0], [
      'commonname', 'common name', 'name', 'species',
      'scientificname', 'scientific name', 'latin', 'latinname', 'latin name',
      'adultsize', 'adult size', 'size',
      'temperament', 'behavior', 'behaviour',
      'temperaturepreference', 'temperature preference', 'temp', 'temprange', 'temp range',
      'phpreference', 'ph preference', 'ph', 'phrange', 'ph range',
      'ghpreference', 'gh preference', 'gh',
      'khpreference', 'kh preference', 'kh',
      'carelevel', 'care level', 'care',
      'tanklevel', 'tank level', 'level',
      'quarantine', 'isquarantinerequired', 'is quarantine required',
      'notes'
    ]);
    const dataRows = header ? rows.slice(1) : rows;
    return dataRows
      .map(row => {
        const commonName = header ? this.importValue(row, header, ['commonname', 'common name', 'name', 'species']) : row[0] ?? '';
        const scientificName = header ? this.importValue(row, header, ['scientificname', 'scientific name', 'latin', 'latinname', 'latin name']) : row[1] ?? '';
        const adultSize = header ? this.importValue(row, header, ['adultsize', 'adult size', 'size']) : row[2] ?? '';
        const temperament = header ? this.importValue(row, header, ['temperament', 'behavior', 'behaviour']) : row[3] ?? '';
        const temperaturePreference = header ? this.importValue(row, header, ['temperaturepreference', 'temperature preference', 'temp', 'temprange', 'temp range']) : row[4] ?? '';
        const phPreference = header ? this.importValue(row, header, ['phpreference', 'ph preference', 'ph', 'phrange', 'ph range']) : row[5] ?? '';
        const ghPreference = header ? this.importValue(row, header, ['ghpreference', 'gh preference', 'gh']) : row[6] ?? '';
        const khPreference = header ? this.importValue(row, header, ['khpreference', 'kh preference', 'kh']) : row[7] ?? '';
        const careLevel = header ? this.importValue(row, header, ['carelevel', 'care level', 'care']) : row[8] ?? '';
        const tankLevel = header ? this.importValue(row, header, ['tanklevel', 'tank level', 'level']) : row[9] ?? '';
        const quarantineValue = header ? this.importValue(row, header, ['quarantine', 'isquarantinerequired', 'is quarantine required']) : row[10] ?? '';
        const notes = header ? this.importValue(row, header, ['notes', 'note']) : row.slice(11).join(' ').trim();
        const matchedProfile = this.findSpeciesProfileByName(commonName, scientificName);
        const warnings: string[] = [];

        if (!commonName.trim()) {
          warnings.push('Common name is required');
        }

        return {
          matchedProfileId: matchedProfile?.id ?? null,
          commonName: commonName.trim(),
          scientificName: scientificName.trim() || null,
          adultSize: adultSize.trim() || null,
          temperament: temperament.trim() || null,
          temperaturePreference: temperaturePreference.trim() || null,
          phPreference: phPreference.trim() || null,
          ghPreference: ghPreference.trim() || null,
          khPreference: khPreference.trim() || null,
          careLevel: careLevel.trim() || null,
          tankLevel: tankLevel.trim() || null,
          isQuarantineRequired: this.importBoolean(quarantineValue, true),
          notes: notes.trim() || null,
          warnings
        };
      })
      .filter(row => row.commonName || row.warnings.length > 0);
  }

  private parseSpeciesFoodImportRows(text: string): FishSpeciesFoodImportRow[] {
    const rows = this.importRows(text);
    if (rows.length === 0) {
      return [];
    }

    const header = this.headerMap(rows[0], [
      'commonname', 'common name', 'name', 'species',
      'scientificname', 'scientific name', 'latin', 'latinname', 'latin name',
      'food', 'foodname', 'food name',
      'foodtype', 'food type', 'type',
      'feedingfrequency', 'feeding frequency', 'frequency',
      'staple', 'isstaple', 'is staple',
      'notes'
    ]);
    const dataRows = header ? rows.slice(1) : rows;
    return dataRows
      .map(row => {
        const commonName = header ? this.importValue(row, header, ['commonname', 'common name', 'name', 'species']) : row[0] ?? '';
        const scientificName = header ? this.importValue(row, header, ['scientificname', 'scientific name', 'latin', 'latinname', 'latin name']) : row[1] ?? '';
        const foodName = header ? this.importValue(row, header, ['food', 'foodname', 'food name']) : row[2] ?? '';
        const foodType = header ? this.importValue(row, header, ['foodtype', 'food type', 'type']) : row[3] ?? '';
        const feedingFrequency = header ? this.importValue(row, header, ['feedingfrequency', 'feeding frequency', 'frequency']) : row[4] ?? '';
        const stapleValue = header ? this.importValue(row, header, ['staple', 'isstaple', 'is staple']) : row[5] ?? '';
        const notes = header ? this.importValue(row, header, ['notes', 'note']) : row.slice(6).join(' ').trim();
        const matchedProfile = this.findSpeciesProfileByName(commonName, scientificName);
        const warnings: string[] = [];

        if (!commonName.trim() && !scientificName.trim()) {
          warnings.push('Species name is required');
        }
        if (!foodName.trim()) {
          warnings.push('Food name is required');
        }
        if (!matchedProfile) {
          warnings.push('Matching species profile was not found');
        }

        return {
          commonName: commonName.trim(),
          scientificName: scientificName.trim() || null,
          fishSpeciesProfileId: matchedProfile?.id ?? null,
          foodName: foodName.trim(),
          foodType: foodType.trim() || null,
          feedingFrequency: feedingFrequency.trim() || null,
          isStaple: this.importBoolean(stapleValue, false),
          notes: notes.trim() || null,
          warnings
        };
      })
      .filter(row => row.commonName || row.scientificName || row.foodName || row.warnings.length > 0);
  }

  private readImportFile(event: Event, setContent: (content: string) => void, setName: (name: string | null) => void): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setName(file.name);
      setContent(String(reader.result ?? ''));
      this.message.set(null);
      this.error.set(null);
    };
    reader.onerror = () => this.error.set('The import file could not be read.');
    reader.readAsText(file);
    input.value = '';
  }

  private importRows(text: string): string[][] {
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.includes(',') || trimmed.includes('"')) {
      return this.parseCsv(trimmed).filter(row => row.some(cell => cell.trim()));
    }

    return trimmed
      .split(/\r?\n/)
      .map(line => line.includes('\t') ? line.split('\t').map(cell => cell.trim()) : [line.trim()])
      .filter(row => row.some(cell => cell.trim()));
  }

  private headerMap(row: string[], candidates: string[]): Map<string, number> | null {
    const normalized = row.map(cell => this.normalizeImportHeader(cell));
    const hasHeader = normalized.some(cell => candidates.map(candidate => this.normalizeImportHeader(candidate)).includes(cell));
    if (!hasHeader) {
      return null;
    }

    return new Map(normalized.map((header, index) => [header, index]));
  }

  private importValue(row: string[], header: Map<string, number>, names: string[]): string {
    for (const name of names) {
      const index = header.get(this.normalizeImportHeader(name));
      if (index !== undefined) {
        return row[index]?.trim() ?? '';
      }
    }

    return '';
  }

  private normalizeImportHeader(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private resolveTank(value: string, fallbackId: number | null): FishTank | null {
    const trimmed = value.trim();
    if (!trimmed && fallbackId) {
      return this.tanks().find(tank => tank.id === fallbackId) ?? null;
    }

    if (!trimmed || this.isGeneralTankImportValue(trimmed)) {
      return null;
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return this.tanks().find(tank => tank.id === numeric) ?? null;
    }

    return this.tanks().find(tank => tank.name.toLowerCase() === trimmed.toLowerCase()) ?? null;
  }

  private isGeneralTankImportValue(value: string): boolean {
    return ['general', 'general supply', 'none', 'n/a', 'na'].includes(value.trim().toLowerCase());
  }

  private optionalImportNumber(value: string, fallback: number | null): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private importBoolean(value: string, fallback: boolean): boolean {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return fallback;
    }

    if (['true', 'yes', 'y', '1', 'active', 'h', 'have'].includes(normalized)) {
      return true;
    }

    if (['false', 'no', 'n', '0', 'inactive'].includes(normalized)) {
      return false;
    }

    return fallback;
  }

  private importDate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private parseCsv(value: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      const next = value[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          index += 1;
        }
        row.push(cell.trim());
        if (row.some(part => part)) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(part => part)) {
      rows.push(row);
    }

    return rows;
  }

  private optionalNumber(value: number | null): number | null {
    return value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value);
  }

  private groupHistoryByDate(items: FishTankHistoryItem[]): FishTankHistoryGroup[] {
    const groups = new Map<string, FishTankHistoryItem[]>();
    for (const item of items) {
      const key = item.occurredAt.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([dateKey, groupedItems]) => ({
        dateKey,
        dateLabel: new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        items: groupedItems.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      }));
  }

  private dashboardCard(tank: FishTank): FishTankDashboardCard {
    const latestLog = this.latestTankLog(tank.id);
    const tankTasks = this.tankTasks().filter(task => task.fishTankId === tank.id);
    const taskIds = new Set(tankTasks.map(task => task.taskId));
    const nextOccurrence = this.fishOccurrences()
      .filter(occurrence => taskIds.has(occurrence.taskID))
      .filter(occurrence => occurrence.status === 'Scheduled')
      .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime())[0] ?? null;
    const nextTask = nextOccurrence
      ? tankTasks.find(task => task.taskId === nextOccurrence.taskID) ?? null
      : null;
    const stockCount = this.stock()
      .filter(stock => stock.fishTankId === tank.id && stock.isActive)
      .reduce((total, stock) => total + stock.quantity, 0);
    const supplyAlerts = this.products()
      .filter(product => product.isActive && (product.fishTankId === tank.id || product.fishTankId === null))
      .filter(product => ['Expired', 'Expiring Soon', 'Empty', 'Low'].includes(this.productStatus(product)))
      .length;

    return { tank, latestLog, nextOccurrence, nextTask, stockCount, supplyAlerts };
  }

  private latestTankLog(tankId: number): FishTankLog | null {
    return this.tankLogs()
      .filter(log => log.fishTankId === tankId)
      .sort((left, right) => new Date(right.loggedAt).getTime() - new Date(left.loggedAt).getTime())[0] ?? null;
  }

  private latestWaterTest(tankId: number): FishTankLog | null {
    return this.tankLogs()
      .filter(log => log.fishTankId === tankId)
      .filter(log => log.logType === 'Water Test')
      .sort((left, right) => new Date(right.loggedAt).getTime() - new Date(left.loggedAt).getTime())[0] ?? null;
  }

  private daysElapsed(value: string): number {
    const date = this.localDate(value.slice(0, 10));
    return Math.max(0, Math.floor((this.today().getTime() - date.getTime()) / 86400000));
  }

  private productReplacementRank(product: FishAquariumProduct): number {
    switch (this.productStatus(product)) {
      case 'Expired':
        return 0;
      case 'Empty':
        return 1;
      case 'Low':
        return 2;
      case 'Expiring Soon':
        return 3;
      default:
        return 4;
    }
  }

  private scrollToElement(id: string): void {
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private downloadCsv(fileName: string, rows: Array<Array<string | number | boolean | null>>): void {
    this.csvDownload.download(fileName, rows);
  }

  private isEmptyProduct(product: FishAquariumProduct): boolean {
    return product.quantity !== null && Number(product.quantity) <= 0
      || product.percentLeft !== null && Number(product.percentLeft) <= 0;
  }

  private isLowProduct(product: FishAquariumProduct): boolean {
    if (this.isEmptyProduct(product)) {
      return false;
    }

    return product.quantity !== null && Number(product.quantity) <= 1
      || product.percentLeft !== null && Number(product.percentLeft) <= this.reportLowProductPercent();
  }

  private isExpired(product: FishAquariumProduct): boolean {
    if (!product.expirationDate) {
      return false;
    }

    return this.localDate(product.expirationDate.slice(0, 10)) < this.today();
  }

  private isExpiringSoon(product: FishAquariumProduct): boolean {
    if (!product.expirationDate || this.isExpired(product)) {
      return false;
    }

    return this.localDate(product.expirationDate.slice(0, 10)) <= this.addDays(this.today(), this.reportExpiringSoonDays());
  }

  private ensureDefaultLogTank(): void {
    const current = this.logForm().fishTankId;
    if (current || this.activeTanks().length === 0) {
      return;
    }

    this.logForm.update(form => ({ ...form, fishTankId: this.activeTanks()[0].id }));
  }

  private ensureDefaultStockTank(): void {
    const current = this.stockForm().fishTankId;
    if (current || this.activeTanks().length === 0) {
      return;
    }

    this.stockForm.update(form => ({ ...form, fishTankId: this.activeTanks()[0].id }));
  }

  private ensureDefaultTaskTank(): void {
    const current = this.taskForm().fishTankId;
    if (current || this.activeTanks().length === 0) {
      return;
    }

    this.taskForm.update(form => ({ ...form, fishTankId: this.activeTanks()[0].id }));
  }

  private ensureDefaultLivestockTank(): void {
    const current = this.livestockForm().fishTankId;
    if (current || this.activeTanks().length === 0) {
      return;
    }

    this.livestockForm.update(form => ({ ...form, fishTankId: this.activeTanks()[0].id }));
  }

  private readingPart(label: string, value: number | null): string | null {
    return value === null || value === undefined ? null : `${label} ${value}`;
  }

  private toLocalInput(value: string): string {
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toDateInput(value: Date): string {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  private previewTaskDates(task: FishTankTask, days: number): string[] {
    const start = this.localDate(task.startDate.slice(0, 10));
    const rangeStart = start > this.today() ? start : this.today();
    const rangeEnd = this.addDays(this.today(), days);
    const end = task.endDate ? this.localDate(task.endDate.slice(0, 10)) : rangeEnd;
    const cappedEnd = end < rangeEnd ? end : rangeEnd;
    if (cappedEnd < rangeStart) {
      return [];
    }

    const parsed = this.parseInterval(task);
    const anchor = this.patternValue(task.recurrencePattern, 'anchor')
      ? this.localDate(this.patternValue(task.recurrencePattern, 'anchor') as string)
      : start;
    if (parsed.unit === 'months') {
      const dates: string[] = [];
      for (let date = anchor; date <= cappedEnd; date = new Date(date.getFullYear(), date.getMonth() + parsed.interval, date.getDate())) {
        if (date >= rangeStart) {
          dates.push(this.toDateInput(date));
        }
      }
      return dates;
    }

    const intervalDays = parsed.unit === 'weeks' ? parsed.interval * 7 : parsed.interval;
    return this.daysBetween(rangeStart, cappedEnd)
      .filter(date => ((date.getTime() - anchor.getTime()) / 86400000) % intervalDays === 0)
      .map(date => this.toDateInput(date));
  }

  private today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private localDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number(part));
    return new Date(year, month - 1, day);
  }

  private daysBetween(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    for (let date = start; date <= end; date = this.addDays(date, 1)) {
      dates.push(date);
    }
    return dates;
  }

  private addDays(value: Date, days: number): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);
  }

  private patternValue(pattern: string, key: string): string | null {
    const body = pattern.includes(':') ? pattern.split(':')[1] : pattern;
    return body
      .split(';')
      .map(part => part.split('='))
      .find(([name]) => name === key)?.[1] ?? null;
  }

  private parseInterval(task: FishTankTask): { interval: number; unit: 'days' | 'weeks' | 'months' } {
    const body = task.recurrencePattern.includes(':') ? task.recurrencePattern.split(':')[1] : task.recurrencePattern;
    const parts = new Map(body.split(';').map(part => {
      const [key, value] = part.split('=');
      return [key, value];
    }));
    const unit = parts.get('unit') as 'days' | 'weeks' | 'months' | undefined;
    return {
      interval: Number(parts.get('interval')) || 1,
      unit: unit === 'days' || unit === 'months' ? unit : 'weeks'
    };
  }
}






