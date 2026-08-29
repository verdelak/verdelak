import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { AlcoholItem, AlcoholLookupCleanup, AlcoholLookupCleanupSuggestion, AlcoholProductDuplicateCluster, AlcoholProductDuplicateReport, AlcoholReport, UpsertAlcoholItem } from '../models/alcohol.models';
import { AlcoholService } from '../alcohol.service';

type StatusFilter = 'all' | 'H' | 'W' | 'unknown';
type SortKey = 'name' | 'category' | 'type' | 'style' | 'country' | 'region' | 'producer' | 'location' | 'quantity' | 'rating';
type LookupField = 'Category' | 'Type' | 'Style' | 'Location' | 'Country' | 'Region';
type AlcoholReportItemListKey = 'priceReviewItems' | 'ratingReviewItems' | 'highValueItems' | 'topRatedItems' | 'vintageReviewItems';

interface AlcoholImportRow {
  rowNumber: number;
  item: UpsertAlcoholItem;
  warnings: string[];
  raw: string[];
}

interface AlcoholForm {
  id: number | null;
  category: string;
  name: string;
  producer: string;
  style: string;
  type: string;
  variety: string;
  color: string;
  country: string;
  region: string;
  vintageOrYear: string;
  size: string;
  price: number | null;
  rating: number | null;
  quantityOnHand: number | null;
  location: string;
  statusID: string;
  notes: string;
  sourceSheet: string;
  sourceRowLabel: string;
}

interface LookupMergeForm {
  field: LookupField;
  sourceValue: string;
  targetValue: string;
  clearTarget: boolean;
}

const alcoholCsvHeader = ['id', 'category', 'name', 'producer', 'style', 'type', 'variety', 'color', 'country', 'region', 'year', 'size', 'price', 'rating', 'qty', 'location', 'status', 'notes', 'sourceSheet', 'sourceRow'];

const focusedReportExports: Record<AlcoholReportItemListKey, string> = {
  priceReviewItems: 'alcohol-price-review.csv',
  ratingReviewItems: 'alcohol-rating-review.csv',
  highValueItems: 'alcohol-high-value.csv',
  topRatedItems: 'alcohol-top-rated.csv',
  vintageReviewItems: 'alcohol-vintage-review.csv'
};

@Component({
  selector: 'app-alcohol-browser',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './alcohol-browser.html',
  styleUrl: './alcohol-browser.scss'
})
export class AlcoholBrowser implements OnInit {
  readonly items = signal<AlcoholItem[]>([]);
  readonly categories = signal<string[]>([]);
  readonly locations = signal<string[]>([]);
  readonly types = signal<string[]>([]);
  readonly styles = signal<string[]>([]);
  readonly regions = signal<string[]>([]);
  readonly countries = signal<string[]>([]);
  readonly report = signal<AlcoholReport | null>(null);
  readonly lookupCleanup = signal<AlcoholLookupCleanup | null>(null);
  readonly productDuplicates = signal<AlcoholProductDuplicateReport | null>(null);
  readonly inventoryDuplicateKeys = signal<Set<string>>(new Set());
  readonly applyingLookupCleanup = signal<string | null>(null);
  readonly mergingProductDuplicates = signal<string | null>(null);
  readonly reportLoading = signal(false);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly category = signal('');
  readonly type = signal('');
  readonly style = signal('');
  readonly country = signal('');
  readonly region = signal('');
  readonly location = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly selectedItem = signal<AlcoholItem | null>(null);
  readonly isEditing = signal(false);
  readonly form = signal<AlcoholForm>(this.emptyForm());
  readonly importText = signal('');
  readonly importing = signal(false);
  readonly mergeForm = signal<LookupMergeForm>(this.emptyMergeForm());
  readonly mergingLookup = signal(false);
  readonly importPreview = computed(() => this.parseImportRows(this.importText()));
  readonly validImportRows = computed(() => this.importPreview().filter(row => row.warnings.length === 0));
  readonly warningImportRows = computed(() => this.importPreview().filter(row => row.warnings.length > 0));
  readonly reportValueLabel = computed(() => {
    const value = this.report()?.totalValue;
    return value === null || value === undefined ? '-' : '$' + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  });

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly canApplyLookupCleanup = computed(() => this.auth.user()?.role === 'Admin');
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly quantityOnPage = computed(() => this.items().reduce((sum, item) => sum + (item.quantityOnHand ?? 0), 0));

  constructor(
    private readonly service: AlcoholService,
    private readonly auth: AuthService,
    private readonly csvDownload: CsvDownloadService
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadReport();
    this.loadLookupCleanup();
    this.loadProductDuplicates();
    this.loadInventoryDuplicateKeys();
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);
    this.service.list({
      q: this.query(),
      category: this.category(),
      type: this.type(),
      style: this.style(),
      country: this.country(),
      region: this.region(),
      location: this.location(),
      status: this.status(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol inventory.'),
      complete: () => this.loading.set(false)
    });
  }


  loadReport(): void {
    this.reportLoading.set(true);
    this.service.report().subscribe({
      next: report => this.report.set(report),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol report.'),
      complete: () => this.reportLoading.set(false)
    });
  }

  loadLookupCleanup(): void {
    this.service.lookupCleanup().subscribe({
      next: cleanup => this.lookupCleanup.set(cleanup),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol lookup cleanup suggestions.')
    });
  }

  loadProductDuplicates(): void {
    this.service.productDuplicates().subscribe({
      next: report => this.productDuplicates.set(report),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol product duplicate suggestions.')
    });
  }

  loadInventoryDuplicateKeys(): void {
    this.service.importDuplicateKeys().subscribe({
      next: rows => this.inventoryDuplicateKeys.set(new Set(rows.map(row => row.key))),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol duplicate check keys.')
    });
  }

  loadLookups(): void {
    forkJoin({
      categories: this.service.categories(),
      locations: this.service.locations(),
      types: this.service.types(),
      styles: this.service.styles(),
      regions: this.service.regions(),
      countries: this.service.countries()
    }).subscribe({
      next: values => {
        this.categories.set(values.categories);
        this.locations.set(values.locations);
        this.types.set(values.types);
        this.styles.set(values.styles);
        this.regions.set(values.regions);
        this.countries.set(values.countries);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol lookups.')
    });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.category.set('');
    this.type.set('');
    this.style.set('');
    this.country.set('');
    this.region.set('');
    this.location.set('');
    this.status.set('all');
    this.load(1);
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
    this.load(1);
  }

  selectItem(item: AlcoholItem): void {
    this.detailLoading.set(true);
    this.error.set(null);
    this.service.get(item.id).subscribe({
      next: detail => {
        this.selectedItem.set(detail);
        if (this.isEditing()) {
          this.loadForm(detail);
        }
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol item.'),
      complete: () => this.detailLoading.set(false)
    });
  }

  newItem(): void {
    this.selectedItem.set(null);
    this.isEditing.set(true);
    this.form.set(this.emptyForm());
    this.message.set(null);
  }

  editSelected(): void {
    const item = this.selectedItem();
    if (!item) {
      return;
    }
    this.isEditing.set(true);
    this.loadForm(item);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.form.set(this.emptyForm());
  }

  patchForm(patch: Partial<AlcoholForm>): void {
    this.form.update(form => ({ ...form, ...patch }));
  }

  save(): void {
    const form = this.form();
    if (!form.category.trim() || !form.name.trim()) {
      this.message.set('Category and name are required.');
      return;
    }

    const payload = this.toRequest(form);
    const request = form.id ? this.service.update(form.id, payload) : this.service.create(payload);
    this.message.set(null);
    request.subscribe({
      next: saved => {
        this.selectedItem.set(saved);
        this.isEditing.set(false);
        this.message.set(`${saved.name} saved.`);
        this.loadLookups();
        this.loadReport();
        this.loadLookupCleanup();
        this.loadProductDuplicates();
        this.loadInventoryDuplicateKeys();
        this.load(this.page());
      },
      error: err => this.message.set(err.error ?? err.message ?? 'Failed to save alcohol item.')
    });
  }

  deleteSelected(): void {
    const item = this.selectedItem();
    if (!item || !confirm(`Delete ${item.name}?`)) {
      return;
    }

    this.service.delete(item.id).subscribe({
      next: () => {
        this.selectedItem.set(null);
        this.isEditing.set(false);
        this.message.set(`${item.name} deleted.`);
        this.loadLookups();
        this.loadReport();
        this.loadLookupCleanup();
        this.loadProductDuplicates();
        this.loadInventoryDuplicateKeys();
        this.load(1);
      },
      error: err => this.message.set(err.error ?? err.message ?? 'Failed to delete alcohol item.')
    });
  }

  handleImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.importText.set(String(reader.result ?? ''));
    reader.readAsText(file);
    input.value = '';
  }

  importRows(): void {
    const rows = this.validImportRows();
    if (!rows.length) {
      this.error.set('No clean Alcohol rows are ready to import. Fix warnings or adjust Admin Settings lookups first.');
      return;
    }

    if (!confirm(`Import ${rows.length.toLocaleString()} clean Alcohol row${rows.length === 1 ? '' : 's'}? Rows with warnings will be skipped.`)) {
      return;
    }

    this.importing.set(true);
    this.error.set(null);
    this.message.set(null);
    forkJoin(rows.map(row => this.service.create(row.item))).subscribe({
      next: created => {
        this.message.set(`${created.length.toLocaleString()} Alcohol row${created.length === 1 ? '' : 's'} imported.`);
        this.importText.set('');
        this.loadLookups();
        this.loadReport();
        this.loadLookupCleanup();
        this.loadProductDuplicates();
        this.loadInventoryDuplicateKeys();
        this.load(1);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Alcohol import failed.'),
      complete: () => this.importing.set(false)
    });
  }

  clearImport(): void {
    this.importText.set('');
  }

  patchMergeForm(patch: Partial<LookupMergeForm>): void {
    this.mergeForm.update(form => ({ ...form, ...patch }));
  }

  mergeLookup(): void {
    if (!this.canApplyLookupCleanup()) {
      return;
    }

    const form = this.mergeForm();
    const sourceValue = form.sourceValue.trim();
    const targetValue = form.clearTarget ? null : this.nullIfBlank(form.targetValue);
    if (!sourceValue) {
      this.error.set('Choose a source lookup value to merge or clear.');
      return;
    }

    const targetLabel = targetValue ?? 'clear this value';
    if (!confirm(`Merge Alcohol ${form.field} "${sourceValue}" -> ${targetLabel}?`)) {
      return;
    }

    this.mergingLookup.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.mergeLookup({
      field: form.field,
      sourceValue,
      targetValue
    }).subscribe({
      next: result => {
        const replacement = result.targetValue ?? 'cleared';
        this.message.set(`${result.field} "${result.sourceValue}" ${replacement}; ${result.updatedRows} row${result.updatedRows === 1 ? '' : 's'} updated, ${result.removedRows} lookup row${result.removedRows === 1 ? '' : 's'} removed.`);
        this.mergeForm.set(this.emptyMergeForm(form.field));
        this.loadLookups();
        this.loadReport();
        this.loadLookupCleanup();
        this.loadProductDuplicates();
        this.loadInventoryDuplicateKeys();
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to merge alcohol lookup value.'),
      complete: () => this.mergingLookup.set(false)
    });
  }

  mergeSourceOptions(): string[] {
    return this.lookupOptions(this.mergeForm().field);
  }

  mergeTargetOptions(): string[] {
    return this.lookupOptions(this.mergeForm().field).filter(value => value !== this.mergeForm().sourceValue);
  }


  downloadImportTemplate(): void {
    const header = ['category', 'name', 'producer', 'style', 'type', 'variety', 'color', 'country', 'region', 'year', 'size', 'price', 'rating', 'qty', 'location', 'status', 'notes', 'source sheet', 'source row'];
    const sample = ['Wine', 'Example Cabernet', 'Example Winery', '', '', 'Cabernet Sauvignon', 'Red', 'USA', 'California', '2020', '750ml', '18.99', '8', '1', 'Wine Rack', 'H', 'Needs cleanup review', 'Alcohol.xlsx', 'Row 12'];
    this.downloadCsv('alcohol-import-template.csv', [header, sample]);
  }

  downloadCurrentPageCsv(): void {
    this.downloadAlcoholCsv('alcohol-current-page.csv', this.items());
  }

  downloadWantedCsv(): void {
    this.downloadAlcoholCsv('alcohol-wanted-list.csv', this.report()?.wantedList ?? []);
  }

  downloadCleanupCsv(): void {
    this.downloadAlcoholCsv('alcohol-cleanup-review.csv', this.report()?.cleanupItems ?? []);
  }

  downloadPriceReviewCsv(): void {
    this.downloadFocusedReportCsv('priceReviewItems');
  }

  downloadRatingReviewCsv(): void {
    this.downloadFocusedReportCsv('ratingReviewItems');
  }

  downloadHighValueCsv(): void {
    this.downloadFocusedReportCsv('highValueItems');
  }

  downloadTopRatedCsv(): void {
    this.downloadFocusedReportCsv('topRatedItems');
  }

  downloadVintageReviewCsv(): void {
    this.downloadFocusedReportCsv('vintageReviewItems');
  }

  downloadLookupCleanupCsv(): void {
    const rows = [
      ['field', 'currentValue', 'suggestedValue', 'count', 'reason'],
      ...(this.lookupCleanup()?.suggestions ?? []).map(row => [
        row.field,
        row.currentValue,
        row.suggestedValue ?? '',
        String(row.count),
        row.reason
      ])
    ];
    this.downloadCsv('alcohol-lookup-cleanup.csv', rows);
  }

  applyLookupCleanup(row: AlcoholLookupCleanupSuggestion): void {
    if (!this.canApplyLookupCleanup()) {
      return;
    }

    const target = row.suggestedValue ?? 'clear this value';
    if (!confirm(`Apply Alcohol lookup cleanup: ${row.field} "${row.currentValue}" -> ${target}?`)) {
      return;
    }

    const key = this.lookupCleanupKey(row);
    this.applyingLookupCleanup.set(key);
    this.error.set(null);
    this.message.set(null);
    this.service.applyLookupCleanup({
      field: row.field,
      currentValue: row.currentValue,
      suggestedValue: row.suggestedValue
    }).subscribe({
      next: result => {
        const replacement = result.suggestedValue ?? 'cleared';
        this.message.set(`${result.field} "${result.currentValue}" ${replacement}; ${result.updatedRows} row${result.updatedRows === 1 ? '' : 's'} updated.`);
        this.loadLookups();
        this.loadReport();
        this.loadLookupCleanup();
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to apply alcohol lookup cleanup.'),
      complete: () => this.applyingLookupCleanup.set(null)
    });
  }

  lookupCleanupKey(row: AlcoholLookupCleanupSuggestion): string {
    return `${row.field}:${row.currentValue}:${row.suggestedValue ?? ''}`;
  }

  downloadProductDuplicatesCsv(): void {
    const rows = [
      ['product', 'category', 'producer', 'style', 'type', 'country', 'region', 'year', 'size', 'productId', 'inventoryRows', 'quantity', 'locations', 'price', 'rating', 'sourceSheet', 'sourceRow'],
      ...(this.productDuplicates()?.clusters ?? []).flatMap(cluster => cluster.members.map(member => [
        cluster.product,
        cluster.category,
        cluster.producer ?? '',
        cluster.style ?? '',
        cluster.type ?? '',
        cluster.country ?? '',
        cluster.region ?? '',
        cluster.vintageOrYear ?? '',
        cluster.size ?? '',
        String(member.productId),
        String(member.inventoryRows),
        String(member.quantity),
        member.locations ?? '',
        member.price?.toString() ?? '',
        member.rating?.toString() ?? '',
        member.sourceSheet ?? '',
        member.sourceRowLabel ?? ''
      ]))
    ];
    this.downloadCsv('alcohol-product-duplicates.csv', rows);
  }

  mergeProductDuplicateCluster(cluster: AlcoholProductDuplicateCluster): void {
    if (!this.canApplyLookupCleanup() || cluster.members.length < 2) {
      return;
    }

    const target = cluster.members[0];
    const productIds = cluster.members.map(member => member.productId);
    if (!confirm(`Merge ${cluster.productRows} Alcohol product rows for "${cluster.product}" into product #${target.productId}?`)) {
      return;
    }

    const key = this.productDuplicateKey(cluster);
    this.mergingProductDuplicates.set(key);
    this.error.set(null);
    this.message.set(null);
    this.service.mergeProductDuplicates({
      targetProductId: target.productId,
      productIds
    }).subscribe({
      next: result => {
        this.message.set(`Product #${result.targetProductId} kept; ${result.mergedProductRows} duplicate product row${result.mergedProductRows === 1 ? '' : 's'} merged with ${result.movedInventoryRows} inventory row${result.movedInventoryRows === 1 ? '' : 's'} moved.`);
        this.loadLookups();
        this.loadReport();
        this.loadLookupCleanup();
        this.loadProductDuplicates();
        this.loadInventoryDuplicateKeys();
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to merge alcohol product duplicates.'),
      complete: () => this.mergingProductDuplicates.set(null)
    });
  }

  productDuplicateKey(cluster: AlcoholProductDuplicateCluster): string {
    return cluster.members.map(member => member.productId).join(':');
  }

  downloadReportCsv(): void {
    const report = this.report();
    if (!report) {
      return;
    }

    const rows = [
      ['section', 'label', 'count', 'quantity', 'value'],
      ['summary', 'Total items', String(report.totalItems), String(report.totalQuantity), report.totalValue?.toString() ?? ''],
      ['summary', 'Owned items', String(report.ownedItems), '', ''],
      ['summary', 'Wanted items', String(report.wantedItems), '', ''],
      ['summary', 'Unknown status', String(report.unknownStatusItems), '', ''],
      ['summary', 'Missing location', String(report.missingLocationItems), '', ''],
      ['summary', 'Cleanup needed', String(report.cleanupNeededItems), '', ''],
      ...report.categoryBreakdown.map(row => ['category', row.label, String(row.count), String(row.quantity), row.value?.toString() ?? '']),
      ...report.typeBreakdown.map(row => ['type', row.label, String(row.count), String(row.quantity), row.value?.toString() ?? '']),
      ...report.styleBreakdown.map(row => ['style', row.label, String(row.count), String(row.quantity), row.value?.toString() ?? '']),
      ...report.countryBreakdown.map(row => ['country', row.label, String(row.count), String(row.quantity), row.value?.toString() ?? '']),
      ...report.regionBreakdown.map(row => ['region', row.label, String(row.count), String(row.quantity), row.value?.toString() ?? '']),
      ...report.locationBreakdown.map(row => ['location', row.label, String(row.count), String(row.quantity), row.value?.toString() ?? '']),
      ...report.statusBreakdown.map(row => ['status', row.label, String(row.count), String(row.quantity), row.value?.toString() ?? ''])
    ];
    this.downloadCsv('alcohol-report-summary.csv', rows);
  }

  showWanted(): void {
    this.status.set('W');
    this.load(1);
  }

  showCleanup(): void {
    this.status.set('unknown');
    this.load(1);
  }
  fieldSummary(item: AlcoholItem): string {
    return [item.producer, item.style, item.type, item.variety, item.vintageOrYear, item.size]
      .filter(Boolean)
      .join(' | ') || '-';
  }

  statusLabel(value: string | null): string {
    return value === 'W' ? 'Wanted' : value === 'H' ? 'Owned' : 'Unknown';
  }

  itemValue(item: AlcoholItem): string {
    if (item.price === null || item.price === undefined) {
      return '-';
    }

    return '$' + (item.price * Math.max(item.quantityOnHand ?? 0, 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }


  private downloadAlcoholCsv(filename: string, items: AlcoholItem[]): void {
    const rows = [alcoholCsvHeader, ...items.map(item => this.alcoholCsvRow(item))];
    this.downloadCsv(filename, rows);
  }

  private downloadFocusedReportCsv(key: AlcoholReportItemListKey): void {
    this.downloadAlcoholCsv(focusedReportExports[key], this.report()?.[key] ?? []);
  }

  private alcoholCsvRow(item: AlcoholItem): string[] {
    return [
      String(item.id),
      item.category,
      item.name,
      item.producer ?? '',
      item.style ?? '',
      item.type ?? '',
      item.variety ?? '',
      item.color ?? '',
      item.country ?? '',
      item.region ?? '',
      item.vintageOrYear ?? '',
      item.size ?? '',
      item.price?.toString() ?? '',
      item.rating?.toString() ?? '',
      item.quantityOnHand?.toString() ?? '',
      item.location ?? '',
      item.statusID,
      item.notes ?? '',
      item.sourceSheet ?? '',
      item.sourceRowLabel ?? ''
    ];
  }

  private downloadCsv(filename: string, rows: string[][]): void {
    this.csvDownload.download(filename, rows);
  }
  private loadForm(item: AlcoholItem): void {
    this.form.set({
      id: item.id,
      category: item.category,
      name: item.name,
      producer: item.producer ?? '',
      style: item.style ?? '',
      type: item.type ?? '',
      variety: item.variety ?? '',
      color: item.color ?? '',
      country: item.country ?? '',
      region: item.region ?? '',
      vintageOrYear: item.vintageOrYear ?? '',
      size: item.size ?? '',
      price: item.price,
      rating: item.rating,
      quantityOnHand: item.quantityOnHand,
      location: item.location ?? '',
      statusID: item.statusID || 'H',
      notes: item.notes ?? '',
      sourceSheet: item.sourceSheet ?? '',
      sourceRowLabel: item.sourceRowLabel ?? ''
    });
  }

  private toRequest(form: AlcoholForm): UpsertAlcoholItem {
    return {
      category: form.category.trim(),
      name: form.name.trim(),
      producer: this.nullIfBlank(form.producer),
      style: this.nullIfBlank(form.style),
      type: this.nullIfBlank(form.type),
      variety: this.nullIfBlank(form.variety),
      color: this.nullIfBlank(form.color),
      country: this.nullIfBlank(form.country),
      region: this.nullIfBlank(form.region),
      vintageOrYear: this.nullIfBlank(form.vintageOrYear),
      size: this.nullIfBlank(form.size),
      price: form.price,
      rating: form.rating,
      quantityOnHand: form.quantityOnHand,
      location: this.nullIfBlank(form.location),
      statusID: form.statusID || 'H',
      notes: this.nullIfBlank(form.notes),
      sourceSheet: this.nullIfBlank(form.sourceSheet),
      sourceRowLabel: this.nullIfBlank(form.sourceRowLabel)
    };
  }

  private emptyForm(): AlcoholForm {
    return {
      id: null,
      category: '',
      name: '',
      producer: '',
      style: '',
      type: '',
      variety: '',
      color: '',
      country: '',
      region: '',
      vintageOrYear: '',
      size: '',
      price: null,
      rating: null,
      quantityOnHand: null,
      location: '',
      statusID: 'H',
      notes: '',
      sourceSheet: '',
      sourceRowLabel: ''
    };
  }

  private emptyMergeForm(field: LookupField = 'Category'): LookupMergeForm {
    return {
      field,
      sourceValue: '',
      targetValue: '',
      clearTarget: false
    };
  }

  private lookupOptions(field: LookupField): string[] {
    switch (field) {
      case 'Category':
        return this.categories();
      case 'Type':
        return this.types();
      case 'Style':
        return this.styles();
      case 'Location':
        return this.locations();
      case 'Country':
        return this.countries();
      case 'Region':
        return this.regions();
    }
  }

  private sort(): string {
    return `${this.sortDirection() === 'desc' ? '-' : ''}${this.sortKey()}`;
  }

  private parseImportRows(text: string): AlcoholImportRow[] {
    const parsed = this.parseDelimited(text);
    if (!parsed.length) {
      return [];
    }

    const header = this.looksLikeHeader(parsed[0])
      ? new Map(parsed[0].map((value, index) => [this.headerKey(value), index]))
      : null;
    const rows = header ? parsed.slice(1) : parsed;

    return rows
      .map((row, index) => this.toImportRow(row, header, index + (header ? 2 : 1)))
      .filter(row => row.item.name || row.item.category || row.raw.some(value => value.trim()));
  }

  private toImportRow(row: string[], header: Map<string, number> | null, rowNumber: number): AlcoholImportRow {
    const category = header ? this.importValue(row, header, ['category', 'cat']) : row[0] ?? '';
    const name = header ? this.importValue(row, header, ['name', 'item', 'title', 'description']) : row[1] ?? '';
    const producer = header ? this.importValue(row, header, ['producer', 'maker', 'brewery', 'winery', 'distillery', 'brand']) : row[2] ?? '';
    const style = header ? this.importValue(row, header, ['style']) : row[3] ?? '';
    const type = header ? this.importValue(row, header, ['type']) : row[4] ?? '';
    const variety = header ? this.importValue(row, header, ['variety', 'varietal', 'grape']) : row[5] ?? '';
    const color = header ? this.importValue(row, header, ['color', 'colour']) : row[6] ?? '';
    const country = header ? this.importValue(row, header, ['country']) : row[7] ?? '';
    const region = header ? this.importValue(row, header, ['region', 'appellation']) : row[8] ?? '';
    const vintageOrYear = header ? this.importValue(row, header, ['vintage', 'year', 'vintageoryear']) : row[9] ?? '';
    const size = header ? this.importValue(row, header, ['size', 'volume', 'bottle size']) : row[10] ?? '';
    const price = header ? this.importValue(row, header, ['price', 'cost']) : row[11] ?? '';
    const rating = header ? this.importValue(row, header, ['rating', 'score']) : row[12] ?? '';
    const quantity = header ? this.importValue(row, header, ['quantity', 'qty', 'on hand', 'quantityonhand']) : row[13] ?? '';
    const location = header ? this.importValue(row, header, ['location', 'storage', 'where']) : row[14] ?? '';
    const status = header ? this.importValue(row, header, ['status', 'statusid', 'have', 'owned', 'want']) : row[15] ?? '';
    const notes = header ? this.importValue(row, header, ['notes', 'note', 'comments']) : row[16] ?? '';
    const sourceSheet = header ? this.importValue(row, header, ['source sheet', 'sheet', 'sourcesheet']) : row[17] ?? '';
    const sourceRowLabel = header ? this.importValue(row, header, ['source row', 'row', 'sourcerow', 'sourcerowlabel']) : row[18] ?? '';

    const item: UpsertAlcoholItem = {
      category: category.trim(),
      name: name.trim(),
      producer: this.nullIfBlank(producer),
      style: this.nullIfBlank(style),
      type: this.nullIfBlank(type),
      variety: this.nullIfBlank(variety),
      color: this.nullIfBlank(color),
      country: this.nullIfBlank(country),
      region: this.nullIfBlank(region),
      vintageOrYear: this.nullIfBlank(vintageOrYear),
      size: this.nullIfBlank(size),
      price: this.toImportNumber(price),
      rating: this.toImportNumber(rating),
      quantityOnHand: this.toImportNumber(quantity),
      location: this.nullIfBlank(location),
      statusID: this.normalizeStatus(status),
      notes: this.nullIfBlank(notes),
      sourceSheet: this.nullIfBlank(sourceSheet),
      sourceRowLabel: this.nullIfBlank(sourceRowLabel) ?? `Import row ${rowNumber}`
    };

    return { rowNumber, item, raw: row, warnings: this.cleanupWarnings(item, price, rating, quantity) };
  }

  private cleanupWarnings(item: UpsertAlcoholItem, rawPrice: string, rawRating: string, rawQuantity: string): string[] {
    const warnings: string[] = [];
    if (!item.category) {
      warnings.push('Missing category');
    } else if (!this.isKnownValue(item.category, this.categories())) {
      warnings.push('Category is not in Admin Settings');
    }

    if (!item.name) {
      warnings.push('Missing name');
    }

    if (item.location && !this.isKnownValue(item.location, this.locations())) {
      warnings.push('Location is not in Admin Settings');
    }

    if (rawPrice.trim() && item.price === null) {
      warnings.push('Price is not numeric');
    }

    if (rawRating.trim() && item.rating === null) {
      warnings.push('Rating is not numeric');
    }

    if (item.rating !== null && (item.rating < 0 || item.rating > 100)) {
      warnings.push('Rating should be 0 to 100');
    }

    if (rawQuantity.trim() && item.quantityOnHand === null) {
      warnings.push('Quantity is not numeric');
    }

    if (item.quantityOnHand !== null && item.quantityOnHand < 0) {
      warnings.push('Quantity cannot be negative');
    }

    if (item.name && this.inventoryDuplicateKeys().has(this.importDuplicateKey(item))) {
      warnings.push('Possible duplicate in Alcohol inventory');
    }

    if (item.category.toLowerCase() === 'wine' && !item.variety && !item.color) {
      warnings.push('Wine row may need variety/color cleanup');
    }

    return warnings;
  }

  private parseDelimited(text: string): string[][] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!normalized) {
      return [];
    }

    const delimiter = normalized.includes('\t') ? '\t' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < normalized.length; index += 1) {
      const char = normalized[index];
      const next = normalized[index + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(cell.trim());
        if (row.some(value => value.trim())) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(value => value.trim())) {
      rows.push(row);
    }
    return rows;
  }

  private looksLikeHeader(row: string[]): boolean {
    const keys = new Set(row.map(value => this.headerKey(value)));
    return ['name', 'category', 'producer', 'maker', 'brewery', 'winery', 'location'].some(key => keys.has(key));
  }

  private importValue(row: string[], header: Map<string, number>, names: string[]): string {
    for (const name of names) {
      const index = header.get(this.headerKey(name));
      if (index !== undefined) {
        return row[index] ?? '';
      }
    }
    return '';
  }

  private headerKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private toImportNumber(value: string): number | null {
    const clean = value.replace(/[$,]/g, '').trim();
    if (!clean) {
      return null;
    }
    const parsed = Number(clean);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeStatus(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (['w', 'want', 'wanted', 'wish'].includes(normalized)) {
      return 'W';
    }
    return 'H';
  }

  private isKnownValue(value: string, knownValues: string[]): boolean {
    return knownValues.some(known => known.toLowerCase() === value.toLowerCase());
  }

  private importDuplicateKey(item: UpsertAlcoholItem): string {
    return [
      item.category,
      item.name,
      item.producer,
      item.vintageOrYear,
      item.size
    ].map(value => this.keyPart(value)).join('\u001f');
  }

  private keyPart(value: string | null): string {
    return (value ?? '').trim().toUpperCase();
  }

  private nullIfBlank(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
