import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { ToyFigure, ToyLookup, UpsertToyFigure } from '../models/toy.models';
import { ToyService } from '../toy.service';

type StatusFilter = 'H' | 'W' | 'all';
type BoxFilter = 'all' | 'true' | 'false';
type SortKey = 'name' | 'company' | 'line' | 'series' | 'qty';

interface ToySummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface ToyReportRow {
  key: string;
  company: string;
  line: string;
  figureCount: number;
  ownedCount: number;
  wantedCount: number;
  inBoxCount: number;
  looseCount: number;
  quantity: number;
}

interface ToyForm {
  id: number | null;
  name: string;
  qty: number | null;
  companyId: number | null;
  companyName: string;
  lineId: number | null;
  lineName: string;
  seriesId: number | null;
  seriesName: string;
  inBox: boolean;
  statusID: 'H' | 'W';
}

@Component({
  selector: 'app-toy-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './toy-browser.html',
  styleUrl: './toy-browser.scss'
})
export class ToyBrowser implements OnInit {
  private readonly csvDownload = inject(CsvDownloadService);

  readonly items = signal<ToyFigure[]>([]);
  readonly companies = signal<ToyLookup[]>([]);
  readonly lines = signal<ToyLookup[]>([]);
  readonly series = signal<ToyLookup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly companyId = signal<number | null>(null);
  readonly lineId = signal<number | null>(null);
  readonly seriesId = signal<number | null>(null);
  readonly inBox = signal<BoxFilter>('all');
  readonly status = signal<StatusFilter>('H');
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly form = signal<ToyForm>(this.emptyForm());

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly statusLabel = computed(() => this.status() === 'W' ? 'wanted' : this.status() === 'all' ? 'total' : 'owned');
  readonly shownQuantity = computed(() => this.items().reduce((sum, item) => sum + item.qty, 0));
  readonly ownedShown = computed(() => this.items().filter(item => item.statusID === 'H').length);
  readonly wantedShown = computed(() => this.items().filter(item => item.statusID === 'W').length);
  readonly inBoxShown = computed(() => this.items().filter(item => item.inBox).length);
  readonly looseShown = computed(() => this.items().filter(item => !item.inBox).length);
  readonly toySummaryCards = computed<ToySummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.items().length,
      detail: `${this.total().toLocaleString()} total matches`
    },
    {
      label: 'Quantity',
      value: this.shownQuantity(),
      detail: 'Copies in current view'
    },
    {
      label: 'Wanted',
      value: this.wantedShown(),
      detail: `${this.ownedShown().toLocaleString()} owned rows shown`
    },
    {
      label: 'Loose',
      value: this.looseShown(),
      detail: `${this.inBoxShown().toLocaleString()} in-box rows shown`
    }
  ]);
  readonly toyReportRows = computed(() => this.buildReportRows(this.items()));
  readonly attentionRows = computed(() => this.items()
    .filter(item => item.statusID === 'W' || !item.inBox || item.qty <= 0 || !item.series)
    .slice(0, 10));

  constructor(
    private readonly service: ToyService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.service.list({
      q: this.query(),
      companyId: this.companyId() ?? undefined,
      lineId: this.lineId() ?? undefined,
      seriesId: this.seriesId() ?? undefined,
      inBox: this.booleanFilter(this.inBox()),
      status: this.status(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load toys.'),
      complete: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.companyId.set(null);
    this.lineId.set(null);
    this.seriesId.set(null);
    this.inBox.set('all');
    this.status.set('H');
    this.loadLookups();
    this.load(1);
  }

  onCompanyFilterChange(value: number | null): void {
    this.companyId.set(value);
    this.lineId.set(null);
    this.seriesId.set(null);
    this.loadLines(value);
    this.loadSeries(null);
  }

  onLineFilterChange(value: number | null): void {
    this.lineId.set(value);
    this.seriesId.set(null);
    this.loadSeries(value);
  }

  onFormCompanyChange(value: number | null): void {
    this.setFormField('companyId', value);
    this.setFormField('lineId', null);
    this.setFormField('seriesId', null);
    this.loadLines(value);
    this.loadSeries(null);
  }

  onFormLineChange(value: number | null): void {
    this.setFormField('lineId', value);
    this.setFormField('seriesId', null);
    this.loadSeries(value);
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

  sortLabel(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  applyReportRow(row: ToyReportRow): void {
    const line = this.lines().find(item => item.name === row.line);
    if (line) {
      this.lineId.set(line.id);
      this.seriesId.set(null);
      this.loadSeries(line.id);
      this.load(1);
      return;
    }

    this.query.set(row.line);
    this.load(1);
  }

  selectItem(item: ToyFigure): void {
    this.form.set({
      id: item.id,
      name: item.name,
      qty: item.qty,
      companyId: item.companyId,
      companyName: '',
      lineId: item.lineId,
      lineName: '',
      seriesId: item.seriesId,
      seriesName: '',
      inBox: item.inBox,
      statusID: item.statusID
    });
    this.loadLines(item.companyId);
    this.loadSeries(item.lineId);
  }

  startNew(): void {
    this.error.set(null);
    this.message.set(null);
    this.form.set(this.emptyForm());
    this.loadLookups();
  }

  setFormField<K extends keyof ToyForm>(field: K, value: ToyForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();

    if (!form.name.trim()) {
      this.error.set('Name is required.');
      return;
    }

    const payload: UpsertToyFigure = {
      name: form.name.trim(),
      qty: form.qty,
      companyId: form.companyId,
      companyName: form.companyId ? null : form.companyName.trim() || null,
      lineId: form.lineId,
      lineName: form.lineId ? null : form.lineName.trim() || null,
      seriesId: form.seriesId,
      seriesName: form.seriesId ? null : form.seriesName.trim() || null,
      inBox: form.inBox,
      statusID: form.statusID
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = (saved: ToyFigure) => {
      this.message.set(`${saved.name} saved.`);
      this.startNew();
      this.load();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save toy.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.update(form.id, payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
      return;
    }

    this.service.create(payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
  }

  deleteSelected(): void {
    const form = this.form();
    if (!form.id || !window.confirm(`Delete ${form.name}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.delete(form.id).subscribe({
      next: () => {
        this.message.set(`${form.name} deleted.`);
        this.startNew();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete toy.'),
      complete: () => this.loading.set(false)
    });
  }

  exportCurrentPageCsv(): void {
    this.downloadCsv(`toys-current-page-${this.today()}.csv`, [
      ['Company', 'Line', 'Series', 'Figure', 'Quantity', 'Status', 'Box'],
      ...this.items().map(item => [
        item.company ?? '',
        item.line,
        item.series ?? '',
        item.name,
        item.qty,
        item.statusID === 'W' ? 'Want' : 'Have',
        item.inBox ? 'In Box' : 'Loose'
      ])
    ]);
  }

  exportReportCsv(): void {
    this.downloadCsv(`toys-report-${this.today()}.csv`, [
      ['Company', 'Line', 'Rows', 'Quantity', 'Owned Rows', 'Wanted Rows', 'In Box Rows', 'Loose Rows'],
      ...this.toyReportRows().map(row => [
        row.company,
        row.line,
        row.figureCount,
        row.quantity,
        row.ownedCount,
        row.wantedCount,
        row.inBoxCount,
        row.looseCount
      ])
    ]);
  }

  private loadLookups(): void {
    this.service.getCompanies().subscribe({
      next: companies => this.companies.set(companies),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load toy companies.')
    });
    this.loadLines(this.companyId());
    this.loadSeries(this.lineId());
  }

  private loadLines(companyId: number | null): void {
    this.service.getLines(companyId).subscribe({
      next: lines => this.lines.set(lines),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load toy lines.')
    });
  }

  private loadSeries(lineId: number | null): void {
    this.service.getSeries(lineId).subscribe({
      next: series => this.series.set(series),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load toy series.')
    });
  }

  private booleanFilter(value: BoxFilter): boolean | undefined {
    return value === 'all' ? undefined : value === 'true';
  }

  private sort(): string {
    return this.sortDirection() === 'desc' ? `-${this.sortKey()}` : this.sortKey();
  }

  private emptyForm(): ToyForm {
    return {
      id: null,
      name: '',
      qty: 1,
      companyId: null,
      companyName: '',
      lineId: null,
      lineName: '',
      seriesId: null,
      seriesName: '',
      inBox: true,
      statusID: 'H'
    };
  }

  private buildReportRows(items: ToyFigure[]): ToyReportRow[] {
    const rows = new Map<string, ToyReportRow>();

    items.forEach(item => {
      const company = item.company || 'Unknown';
      const line = item.line || 'Uncategorized';
      const key = `${company}|${line}`;
      const row = rows.get(key) ?? {
        key,
        company,
        line,
        figureCount: 0,
        ownedCount: 0,
        wantedCount: 0,
        inBoxCount: 0,
        looseCount: 0,
        quantity: 0
      };

      row.figureCount += 1;
      row.quantity += item.qty;
      row.ownedCount += item.statusID === 'H' ? 1 : 0;
      row.wantedCount += item.statusID === 'W' ? 1 : 0;
      row.inBoxCount += item.inBox ? 1 : 0;
      row.looseCount += item.inBox ? 0 : 1;
      rows.set(key, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.figureCount - left.figureCount || left.company.localeCompare(right.company) || left.line.localeCompare(right.line));
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    this.csvDownload.download(filename, rows);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
