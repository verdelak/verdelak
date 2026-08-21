import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { MiniLookup, MiniatureItem, UpsertMiniatureItem } from '../models/miniature.models';
import { MiniaturesService } from '../miniatures.service';

type StatusFilter = 'all' | 'owned' | 'want';

interface MiniSubsetGroup {
  key: string;
  name: string;
  items: MiniatureItem[];
  ownedQuantity: number;
}

interface MiniSeriesGroup {
  key: string;
  name: string;
  subsets: MiniSubsetGroup[];
  itemCount: number;
  ownedQuantity: number;
}

interface MiniSystemGroup {
  key: string;
  name: string;
  series: MiniSeriesGroup[];
  itemCount: number;
  ownedQuantity: number;
}

interface MiniSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface MiniSystemReportRow {
  systemName: string;
  itemCount: number;
  ownedQuantity: number;
  wantedQuantity: number;
  ownedRows: number;
  wantedRows: number;
  zeroOwnedRows: number;
  completionPercent: number;
}

interface MiniRarityReportRow {
  rarity: string;
  itemCount: number;
  ownedQuantity: number;
  wantedQuantity: number;
  missingWantedRows: number;
}

interface MiniImportRow {
  rowNumber: number;
  companyName: string;
  systemName: string;
  seriesName: string;
  number: string;
  name: string;
  subset: string;
  rarity: string;
  size: string;
  type: string;
  ownedQuantity: number;
  wantedQuantity: number;
  isWanted: boolean;
  warnings: string[];
}

interface MiniatureForm {
  id: number | null;
  name: string;
  number: string;
  companyId: number | null;
  systemId: number | null;
  seriesId: number | null;
  subset: string;
  rarity: string;
  size: string;
  type: string;
  ownedQuantity: number;
  isWanted: boolean;
  wantedQuantity: number;
}

@Component({
  selector: 'app-miniatures-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './miniatures-browser.html',
  styleUrl: './miniatures-browser.scss'
})
export class MiniaturesBrowser implements OnInit {
  readonly items = signal<MiniatureItem[]>([]);
  readonly companies = signal<MiniLookup[]>([]);
  readonly systems = signal<MiniLookup[]>([]);
  readonly series = signal<MiniLookup[]>([]);
  readonly allSystems = signal<MiniLookup[]>([]);
  readonly allSeries = signal<MiniLookup[]>([]);
  readonly subsets = signal<string[]>([]);
  readonly rarities = signal<string[]>([]);
  readonly sizes = signal<string[]>([]);
  readonly types = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly pageSize = 5000;
  readonly query = signal('');
  readonly companyId = signal<number | null>(null);
  readonly systemId = signal<number | null>(null);
  readonly seriesId = signal<number | null>(null);
  readonly subset = signal('');
  readonly rarity = signal('');
  readonly size = signal('');
  readonly type = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly collapsedSystems = signal<Set<string>>(new Set<string>());
  readonly collapsedSeries = signal<Set<string>>(new Set<string>());
  readonly collapsedSubsets = signal<Set<string>>(new Set<string>());
  readonly selectedItem = signal<MiniatureItem | null>(null);
  readonly isEditing = signal(false);
  readonly form = signal<MiniatureForm>(this.emptyForm());
  readonly importText = signal('');
  readonly importRows = signal<MiniImportRow[]>([]);
  readonly importCommitting = signal(false);

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly shownCount = computed(() => this.items().length);
  readonly ownedQuantityShown = computed(() => this.items().reduce((sum, item) => sum + item.ownedQuantity, 0));
  readonly groupedItems = computed(() => this.groupItems(this.items()));
  readonly wantedQuantityShown = computed(() => this.items().reduce((sum, item) => sum + item.wantedQuantity, 0));
  readonly ownedRowsShown = computed(() => this.items().filter(item => item.ownedQuantity > 0).length);
  readonly wantedRowsShown = computed(() => this.items().filter(item => item.isWanted || item.wantedQuantity > 0).length);
  readonly zeroOwnedRowsShown = computed(() => this.items().filter(item => item.ownedQuantity === 0).length);
  readonly miniSummaryCards = computed<MiniSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.shownCount(),
      detail: `${this.total().toLocaleString()} total matches`
    },
    {
      label: 'Owned copies',
      value: this.ownedQuantityShown(),
      detail: `${this.ownedRowsShown().toLocaleString()} unique owned rows`
    },
    {
      label: 'Want quantity',
      value: this.wantedQuantityShown(),
      detail: `${this.wantedRowsShown().toLocaleString()} wanted rows`
    },
    {
      label: 'Zero owned',
      value: this.zeroOwnedRowsShown(),
      detail: 'Candidates for want-list review'
    }
  ]);
  readonly systemReportRows = computed(() => this.buildSystemReportRows(this.items()));
  readonly rarityReportRows = computed(() => this.buildRarityReportRows(this.items()));
  readonly ownershipGaps = computed(() => this.items()
    .filter(item => item.ownedQuantity === 0 || item.wantedQuantity > item.ownedQuantity)
    .sort((left, right) => {
      const wantedDelta = (right.wantedQuantity - right.ownedQuantity) - (left.wantedQuantity - left.ownedQuantity);
      return wantedDelta !== 0 ? wantedDelta : left.name.localeCompare(right.name);
    })
    .slice(0, 12));
  readonly validImportRows = computed(() => this.importRows().filter(row => !this.hasBlockingImportWarnings(row)));

  constructor(
    private readonly service: MiniaturesService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list({
      q: this.query(),
      companyId: this.companyId(),
      systemId: this.systemId(),
      seriesId: this.seriesId(),
      subset: this.subset(),
      rarity: this.rarity(),
      size: this.size(),
      type: this.type(),
      status: this.status(),
      page: 1,
      pageSize: this.pageSize
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load miniatures.'),
      complete: () => this.loading.set(false)
    });
  }

  loadLookups(): void {
    this.service.getCompanies().subscribe({ next: values => this.companies.set(values) });
    this.service.getSystems().subscribe({ next: values => this.allSystems.set(values) });
    this.service.getSeries().subscribe({ next: values => this.allSeries.set(values) });
    this.loadSystems();
    this.loadSeries();
    this.service.getSubsets().subscribe({ next: values => this.subsets.set(values) });
    this.service.getRarities().subscribe({ next: values => this.rarities.set(values) });
    this.service.getSizes().subscribe({ next: values => this.sizes.set(values) });
    this.service.getTypes().subscribe({ next: values => this.types.set(values) });
  }

  onCompanyChange(value: string | number | null): void {
    this.companyId.set(this.toNullableNumber(value));
    this.systemId.set(null);
    this.seriesId.set(null);
    this.loadSystems();
    this.loadSeries();
    this.applyFilters();
  }

  onSystemChange(value: string | number | null): void {
    this.systemId.set(this.toNullableNumber(value));
    this.seriesId.set(null);
    this.loadSeries();
    this.applyFilters();
  }

  onSeriesChange(value: string | number | null): void {
    this.seriesId.set(this.toNullableNumber(value));
    this.applyFilters();
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.query.set('');
    this.companyId.set(null);
    this.systemId.set(null);
    this.seriesId.set(null);
    this.subset.set('');
    this.rarity.set('');
    this.size.set('');
    this.type.set('');
    this.status.set('all');
    this.loadSystems();
    this.loadSeries();
    this.load();
  }

  selectItem(item: MiniatureItem): void {
    this.selectedItem.set(item);
    if (this.isEditing()) {
      this.loadForm(item);
    }
  }

  startNew(): void {
    this.selectedItem.set(null);
    this.isEditing.set(true);
    this.error.set(null);
    this.message.set(null);
    this.form.set({
      ...this.emptyForm(),
      companyId: this.companyId(),
      systemId: this.systemId(),
      seriesId: this.seriesId(),
      subset: this.subset(),
      rarity: this.rarity(),
      size: this.size(),
      type: this.type()
    });
  }

  editItem(item: MiniatureItem): void {
    this.selectItem(item);
    this.isEditing.set(true);
    this.loadForm(item);
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

  patchForm(patch: Partial<MiniatureForm>): void {
    this.form.update(form => ({ ...form, ...patch }));
  }

  save(): void {
    const form = this.form();
    if (!form.name.trim()) {
      this.error.set('Miniature name is required.');
      return;
    }

    if (!form.seriesId) {
      this.error.set('Choose a series before saving.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    const payload = this.toRequest(form);
    const request = form.id
      ? this.service.update(form.id, payload)
      : this.service.create(payload);

    request.subscribe({
      next: saved => {
        this.selectedItem.set(saved);
        this.isEditing.set(false);
        this.message.set(`${saved.name} saved.`);
        this.loadLookups();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save miniature.'),
      complete: () => this.saving.set(false)
    });
  }

  deleteSelected(): void {
    const item = this.selectedItem();
    if (!item || !confirm(`Delete ${item.name}?`)) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.delete(item.id).subscribe({
      next: () => {
        this.selectedItem.set(null);
        this.isEditing.set(false);
        this.message.set(`${item.name} deleted.`);
        this.loadLookups();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete miniature.'),
      complete: () => this.saving.set(false)
    });
  }

  statusLabel(item: MiniatureItem): string {
    if (item.ownedQuantity > 0) {
      return `Owned: ${item.ownedQuantity}`;
    }

    return item.wantedQuantity > 0 ? `Wanted: ${item.wantedQuantity}` : 'Wanted';
  }

  itemRowClasses(item: MiniatureItem): string {
    return this.selectedItem()?.id === item.id ? 'bg-indigo-50' : '';
  }

  isSystemCollapsed(key: string): boolean {
    return this.collapsedSystems().has(key);
  }

  isSeriesCollapsed(key: string): boolean {
    return this.collapsedSeries().has(key);
  }

  isSubsetCollapsed(key: string): boolean {
    return this.collapsedSubsets().has(key);
  }

  toggleSystem(key: string): void {
    this.toggleSet(this.collapsedSystems, key);
  }

  toggleSeries(key: string): void {
    this.toggleSet(this.collapsedSeries, key);
  }

  toggleSubset(key: string): void {
    this.toggleSet(this.collapsedSubsets, key);
  }

  expandAll(): void {
    this.collapsedSystems.set(new Set<string>());
    this.collapsedSeries.set(new Set<string>());
    this.collapsedSubsets.set(new Set<string>());
  }

  collapseAll(): void {
    const systems = new Set<string>();
    const series = new Set<string>();
    const subsets = new Set<string>();

    this.groupedItems().forEach(system => {
      systems.add(system.key);
      system.series.forEach(set => {
        series.add(set.key);
        set.subsets.forEach(subset => subsets.add(subset.key));
      });
    });

    this.collapsedSystems.set(systems);
    this.collapsedSeries.set(series);
    this.collapsedSubsets.set(subsets);
  }

  applySystemReport(row: MiniSystemReportRow): void {
    const system = this.allSystems().find(value => value.name === row.systemName);
    this.systemId.set(system?.id ?? null);
    this.seriesId.set(null);
    this.loadSeries();
    this.applyFilters();
  }

  applyRarityReport(row: MiniRarityReportRow): void {
    this.rarity.set(row.rarity === 'Unspecified' ? '' : row.rarity);
    this.applyFilters();
  }

  exportCurrentPageCsv(): void {
    this.downloadCsv('minis-current-page.csv', [
      ['System', 'Series', 'Subset', 'Number', 'Name', 'Rarity', 'Size', 'Type', 'Owned Quantity', 'Wanted Quantity', 'Latest Value'],
      ...this.items().map(item => [
        item.system ?? '',
        item.series ?? '',
        item.subset ?? '',
        item.number ?? '',
        item.name,
        item.rarity ?? '',
        item.size ?? '',
        item.type ?? '',
        item.ownedQuantity,
        item.wantedQuantity,
        item.latestValue ?? ''
      ])
    ]);
  }

  exportSummaryCsv(): void {
    this.downloadCsv('minis-summary-report.csv', [
      ['Report', 'Name', 'Rows', 'Owned Quantity', 'Wanted Quantity', 'Owned Rows', 'Wanted Rows', 'Zero Owned Rows', 'Completion Percent', 'Missing Wanted Rows'],
      ...this.systemReportRows().map(row => [
        'System',
        row.systemName,
        row.itemCount,
        row.ownedQuantity,
        row.wantedQuantity,
        row.ownedRows,
        row.wantedRows,
        row.zeroOwnedRows,
        row.completionPercent,
        ''
      ]),
      ...this.rarityReportRows().map(row => [
        'Rarity',
        row.rarity,
        row.itemCount,
        row.ownedQuantity,
        row.wantedQuantity,
        '',
        '',
        '',
        '',
        row.missingWantedRows
      ])
    ]);
  }

  parseImport(): void {
    const rows = this.importText()
      .split(/\r?\n/)
      .map(row => row.trim())
      .filter(Boolean);

    if (!rows.length) {
      this.importRows.set([]);
      this.error.set('Paste CSV/TXT rows or upload a file first.');
      return;
    }

    const first = this.parseDelimitedRow(rows[0]);
    const hasHeader = first.some(value => ['name', 'miniature', 'series', 'system', 'ownedquantity', 'wantedquantity'].includes(this.normalizeHeader(value)));
    const headers = hasHeader ? first.map(value => this.normalizeHeader(value)) : [];
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const parsed = dataRows.map((row, index) => this.parseImportRow(this.parseDelimitedRow(row), hasHeader ? headers : null, index + (hasHeader ? 2 : 1)));

    this.importRows.set(parsed);
    this.message.set(`${parsed.length} miniature import rows staged.`);
    this.error.set(null);
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.importText.set(String(reader.result ?? ''));
      this.parseImport();
      input.value = '';
    };
    reader.readAsText(file);
  }

  clearImport(): void {
    this.importText.set('');
    this.importRows.set([]);
  }

  commitImport(): void {
    const rows = this.importRows();
    if (!rows.length) {
      this.error.set('No staged miniature rows to commit.');
      return;
    }

    const invalid = rows.filter(row => this.hasBlockingImportWarnings(row));
    if (invalid.length) {
      this.error.set(`${invalid.length} import rows are missing required fields.`);
      return;
    }

    this.importCommitting.set(true);
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.commitImportRow(rows, 0, 0);
  }

  exportImportPreviewCsv(): void {
    this.downloadCsv(`minis-import-preview-${this.today()}.csv`, [
      ['Row', 'Company', 'System', 'Series', 'Number', 'Name', 'Subset', 'Rarity', 'Size', 'Type', 'Owned Quantity', 'Wanted Quantity', 'Warnings'],
      ...this.importRows().map(row => [
        row.rowNumber,
        row.companyName,
        row.systemName,
        row.seriesName,
        row.number,
        row.name,
        row.subset,
        row.rarity,
        row.size,
        row.type,
        row.ownedQuantity,
        row.wantedQuantity,
        row.warnings.join('; ')
      ])
    ]);
  }

  private loadSystems(): void {
    this.service.getSystems(this.companyId()).subscribe({ next: values => this.systems.set(values) });
  }

  private loadSeries(): void {
    this.service.getSeries(this.systemId()).subscribe({ next: values => this.series.set(values) });
  }

  private toNullableNumber(value: string | number | null): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private loadForm(item: MiniatureItem): void {
    this.form.set({
      id: item.id,
      name: item.name,
      number: item.number ?? '',
      companyId: item.companyId,
      systemId: item.systemId,
      seriesId: item.seriesId,
      subset: item.subset ?? '',
      rarity: item.rarity ?? '',
      size: item.size ?? '',
      type: item.type ?? '',
      ownedQuantity: item.ownedQuantity,
      isWanted: item.isWanted,
      wantedQuantity: item.wantedQuantity
    });
  }

  private toRequest(form: MiniatureForm): UpsertMiniatureItem {
    return {
      name: form.name.trim(),
      number: this.nullIfBlank(form.number),
      seriesId: form.seriesId,
      seriesName: null,
      systemId: form.systemId,
      systemName: null,
      companyId: form.companyId,
      companyName: null,
      subset: this.nullIfBlank(form.subset),
      rarity: this.nullIfBlank(form.rarity),
      size: this.nullIfBlank(form.size),
      type: this.nullIfBlank(form.type),
      ownedQuantity: Math.max(0, Number(form.ownedQuantity) || 0),
      isWanted: form.isWanted,
      wantedQuantity: form.isWanted ? Math.max(0, Number(form.wantedQuantity) || 0) : 0
    };
  }

  private emptyForm(): MiniatureForm {
    return {
      id: null,
      name: '',
      number: '',
      companyId: null,
      systemId: null,
      seriesId: null,
      subset: '',
      rarity: '',
      size: '',
      type: '',
      ownedQuantity: 0,
      isWanted: true,
      wantedQuantity: 1
    };
  }

  private nullIfBlank(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private commitImportRow(rows: MiniImportRow[], index: number, savedCount: number): void {
    if (index >= rows.length) {
      this.message.set(`Imported ${savedCount} miniature rows.`);
      this.importCommitting.set(false);
      this.loading.set(false);
      this.clearImport();
      this.loadLookups();
      this.load();
      return;
    }

    const row = rows[index];
    const payload: UpsertMiniatureItem = {
      name: row.name.trim(),
      number: this.nullIfBlank(row.number),
      seriesId: null,
      seriesName: row.seriesName.trim(),
      systemId: null,
      systemName: this.nullIfBlank(row.systemName),
      companyId: null,
      companyName: this.nullIfBlank(row.companyName),
      subset: this.nullIfBlank(row.subset),
      rarity: this.nullIfBlank(row.rarity),
      size: this.nullIfBlank(row.size),
      type: this.nullIfBlank(row.type),
      ownedQuantity: row.ownedQuantity,
      isWanted: row.isWanted,
      wantedQuantity: row.wantedQuantity
    };

    this.service.create(payload).subscribe({
      next: () => this.commitImportRow(rows, index + 1, savedCount + 1),
      error: err => {
        this.error.set(`Import failed on row ${row.rowNumber}: ${err.error ?? err.message ?? 'Save failed.'}`);
        this.importCommitting.set(false);
        this.loading.set(false);
      }
    });
  }

  private parseImportRow(values: string[], headers: string[] | null, rowNumber: number): MiniImportRow {
    const get = (...names: string[]) => {
      if (!headers) {
        const fallback = ['company', 'system', 'series', 'number', 'name', 'subset', 'rarity', 'size', 'type', 'ownedquantity', 'wantedquantity'];
        const index = fallback.findIndex(header => names.includes(header));
        return index >= 0 ? values[index] ?? '' : '';
      }

      const index = headers.findIndex(header => names.includes(header));
      return index >= 0 ? values[index] ?? '' : '';
    };

    const name = get('name', 'miniature', 'mininame').trim();
    const seriesName = get('series', 'set', 'setname').trim();
    const ownedQuantity = this.quantityValue(get('ownedquantity', 'owned', 'havequantity', 'have', 'qty'));
    const wantedQuantity = this.quantityValue(get('wantedquantity', 'wanted', 'wantquantity', 'want'));
    const warnings: string[] = [];
    if (!name) {
      warnings.push('Required: name is missing.');
    }
    if (!seriesName) {
      warnings.push('Required: series/set is missing.');
    }
    if (name.length > 100) {
      warnings.push('Name will be limited to 100 characters by the API.');
    }
    if (get('number', 'num', 'collector').trim().length > 12) {
      warnings.push('Number will be limited to 12 characters by the API.');
    }

    return {
      rowNumber,
      companyName: get('company', 'manufacturer'),
      systemName: get('system', 'game'),
      seriesName,
      number: get('number', 'num', 'collector'),
      name,
      subset: get('subset'),
      rarity: get('rarity'),
      size: get('size'),
      type: get('type'),
      ownedQuantity,
      wantedQuantity,
      isWanted: wantedQuantity > 0 || ownedQuantity === 0,
      warnings
    };
  }

  private hasBlockingImportWarnings(row: MiniImportRow): boolean {
    return row.warnings.some(warning => warning.startsWith('Required'));
  }

  private parseDelimitedRow(row: string): string[] {
    const values: string[] = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const next = row[i + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if ((char === ',' || char === '\t') && !quoted) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  private normalizeHeader(value: string): string {
    return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  private quantityValue(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && value.trim() !== '' ? Math.max(0, Math.trunc(parsed)) : 0;
  }

  private buildSystemReportRows(items: MiniatureItem[]): MiniSystemReportRow[] {
    const rows = new Map<string, MiniSystemReportRow>();

    items.forEach(item => {
      const systemName = item.system || 'Unassigned System';
      const row = rows.get(systemName) ?? {
        systemName,
        itemCount: 0,
        ownedQuantity: 0,
        wantedQuantity: 0,
        ownedRows: 0,
        wantedRows: 0,
        zeroOwnedRows: 0,
        completionPercent: 0
      };

      row.itemCount += 1;
      row.ownedQuantity += item.ownedQuantity;
      row.wantedQuantity += item.wantedQuantity;
      row.ownedRows += item.ownedQuantity > 0 ? 1 : 0;
      row.wantedRows += item.isWanted || item.wantedQuantity > 0 ? 1 : 0;
      row.zeroOwnedRows += item.ownedQuantity === 0 ? 1 : 0;
      rows.set(systemName, row);
    });

    return Array.from(rows.values())
      .map(row => ({
        ...row,
        completionPercent: row.itemCount ? Math.round((row.ownedRows / row.itemCount) * 100) : 0
      }))
      .sort((left, right) => right.itemCount - left.itemCount || left.systemName.localeCompare(right.systemName));
  }

  private buildRarityReportRows(items: MiniatureItem[]): MiniRarityReportRow[] {
    const rows = new Map<string, MiniRarityReportRow>();

    items.forEach(item => {
      const rarity = item.rarity || 'Unspecified';
      const row = rows.get(rarity) ?? {
        rarity,
        itemCount: 0,
        ownedQuantity: 0,
        wantedQuantity: 0,
        missingWantedRows: 0
      };

      row.itemCount += 1;
      row.ownedQuantity += item.ownedQuantity;
      row.wantedQuantity += item.wantedQuantity;
      row.missingWantedRows += item.wantedQuantity > item.ownedQuantity ? 1 : 0;
      rows.set(rarity, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.itemCount - left.itemCount || left.rarity.localeCompare(right.rarity));
  }

  private downloadCsv(fileName: string, rows: Array<Array<string | number>>): void {
    const csv = rows
      .map(row => row.map(cell => this.csvCell(cell)).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string | number): string {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private groupItems(items: MiniatureItem[]): MiniSystemGroup[] {
    const systemMap = new Map<string, MiniSystemGroup>();

    items.forEach(item => {
      const systemName = item.system || 'Unassigned System';
      const systemKey = `system:${item.systemId ?? systemName}`;
      const seriesName = item.series || 'Unassigned Series';
      const seriesKey = `${systemKey}|series:${item.seriesId ?? seriesName}`;
      const subsetName = item.subset || 'Main Set';
      const subsetKey = `${seriesKey}|subset:${subsetName}`;

      let systemGroup = systemMap.get(systemKey);
      if (!systemGroup) {
        systemGroup = { key: systemKey, name: systemName, series: [], itemCount: 0, ownedQuantity: 0 };
        systemMap.set(systemKey, systemGroup);
      }

      let seriesGroup = systemGroup.series.find(group => group.key === seriesKey);
      if (!seriesGroup) {
        seriesGroup = { key: seriesKey, name: seriesName, subsets: [], itemCount: 0, ownedQuantity: 0 };
        systemGroup.series.push(seriesGroup);
      }

      let subsetGroup = seriesGroup.subsets.find(group => group.key === subsetKey);
      if (!subsetGroup) {
        subsetGroup = { key: subsetKey, name: subsetName, items: [], ownedQuantity: 0 };
        seriesGroup.subsets.push(subsetGroup);
      }

      subsetGroup.items.push(item);
      subsetGroup.ownedQuantity += item.ownedQuantity;
      seriesGroup.itemCount += 1;
      seriesGroup.ownedQuantity += item.ownedQuantity;
      systemGroup.itemCount += 1;
      systemGroup.ownedQuantity += item.ownedQuantity;
    });

    return Array.from(systemMap.values()).map(system => ({
      ...system,
      series: system.series.map(series => ({
        ...series,
        subsets: series.subsets.sort((left, right) => left.name.localeCompare(right.name))
      })).sort((left, right) => left.name.localeCompare(right.name))
    }));
  }

  private toggleSet(target: { set(value: Set<string>): void; (): Set<string> }, key: string): void {
    const values = new Set(target());
    if (values.has(key)) {
      values.delete(key);
    } else {
      values.add(key);
    }
    target.set(values);
  }
}
