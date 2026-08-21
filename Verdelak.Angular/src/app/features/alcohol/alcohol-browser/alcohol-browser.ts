import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { AlcoholItem, AlcoholReport, UpsertAlcoholItem } from '../models/alcohol.models';
import { AlcoholService } from '../alcohol.service';

type StatusFilter = 'all' | 'H' | 'W' | 'unknown';
type SortKey = 'name' | 'category' | 'producer' | 'location' | 'quantity' | 'rating';

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
  readonly report = signal<AlcoholReport | null>(null);
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
  readonly location = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly selectedItem = signal<AlcoholItem | null>(null);
  readonly isEditing = signal(false);
  readonly form = signal<AlcoholForm>(this.emptyForm());
  readonly importText = signal('');
  readonly importing = signal(false);
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
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly quantityOnPage = computed(() => this.items().reduce((sum, item) => sum + (item.quantityOnHand ?? 0), 0));

  constructor(
    private readonly service: AlcoholService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadReport();
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);
    this.service.list({
      q: this.query(),
      category: this.category(),
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
  loadLookups(): void {
    this.service.categories().subscribe({ next: values => this.categories.set(values) });
    this.service.locations().subscribe({ next: values => this.locations.set(values) });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.category.set('');
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
        this.load(1);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Alcohol import failed.'),
      complete: () => this.importing.set(false)
    });
  }

  clearImport(): void {
    this.importText.set('');
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


  private downloadAlcoholCsv(filename: string, items: AlcoholItem[]): void {
    const rows = [
      ['id', 'category', 'name', 'producer', 'style', 'type', 'variety', 'color', 'country', 'region', 'year', 'size', 'price', 'rating', 'qty', 'location', 'status', 'notes', 'sourceSheet', 'sourceRow'],
      ...items.map(item => [
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
      ])
    ];
    this.downloadCsv(filename, rows);
  }

  private downloadCsv(filename: string, rows: string[][]): void {
    const csv = rows.map(row => row.map(value => this.csvCell(value)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string): string {
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
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

    if (item.rating !== null && (item.rating < 0 || item.rating > 10)) {
      warnings.push('Rating should be 0 to 10');
    }

    if (rawQuantity.trim() && item.quantityOnHand === null) {
      warnings.push('Quantity is not numeric');
    }

    if (item.quantityOnHand !== null && item.quantityOnHand < 0) {
      warnings.push('Quantity cannot be negative');
    }

    const duplicate = this.items().some(existing =>
      existing.name.toLowerCase() === item.name.toLowerCase() &&
      (existing.producer ?? '').toLowerCase() === (item.producer ?? '').toLowerCase() &&
      (existing.vintageOrYear ?? '').toLowerCase() === (item.vintageOrYear ?? '').toLowerCase());
    if (duplicate) {
      warnings.push('Possible duplicate on current page');
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

  private nullIfBlank(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}





