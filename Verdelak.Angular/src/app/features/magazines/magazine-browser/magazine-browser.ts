import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { MagazineIssue, MagazineLookup, MagazineReport, UpsertMagazineIssue } from '../models/magazine.models';
import { MagazineService } from '../magazine.service';

type StatusFilter = 'H' | 'W' | 'all';
type BooleanFilter = 'all' | 'true' | 'false';
type SortKey = 'series' | 'year' | 'number' | 'title';
type FilterKey = 'query' | 'seriesId' | 'number' | 'numberFrom' | 'numberTo' | 'year' | 'month' | 'season' | 'special' | 'alternate' | 'coverId' | 'status';

interface MagazineForm {
  id: number | null;
  number: number | null;
  month: number | null;
  year: number | null;
  season: string;
  title: string;
  special: boolean;
  alternate: boolean;
  statusID: 'H' | 'W';
  info: string;
  seriesId: number | null;
  seriesName: string;
  coverID: string;
}

interface ActiveFilterChip {
  key: FilterKey;
  label: string;
}

@Component({
  selector: 'app-magazine-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './magazine-browser.html',
  styleUrl: './magazine-browser.scss'
})
export class MagazineBrowser implements OnInit {
  private readonly csvDownload = inject(CsvDownloadService);

  readonly items = signal<MagazineIssue[]>([]);
  readonly series = signal<MagazineLookup[]>([]);
  readonly report = signal<MagazineReport | null>(null);
  readonly loading = signal(false);
  readonly reportLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly seriesId = signal<number | null>(null);
  readonly number = signal<number | null>(null);
  readonly numberFrom = signal<number | null>(null);
  readonly numberTo = signal<number | null>(null);
  readonly year = signal<number | null>(null);
  readonly month = signal<number | null>(null);
  readonly season = signal('');
  readonly special = signal<BooleanFilter>('all');
  readonly alternate = signal<BooleanFilter>('all');
  readonly coverId = signal('');
  readonly status = signal<StatusFilter>('H');
  readonly sortKey = signal<SortKey>('series');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly form = signal<MagazineForm>(this.emptyForm());

  readonly months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly statusLabel = computed(() => this.status() === 'W' ? 'wanted' : this.status() === 'all' ? 'total' : 'owned');
  readonly missingIssueCount = computed(() => this.report()?.missingRanges.reduce((sum, row) => sum + row.count, 0) ?? 0);
  readonly activeFilters = computed<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const selectedSeries = this.series().find(item => item.id === this.seriesId());
    const selectedMonth = this.months.find(item => item.value === this.month());

    if (this.query().trim()) {
      chips.push({ key: 'query', label: `Search: ${this.query().trim()}` });
    }

    if (selectedSeries) {
      chips.push({ key: 'seriesId', label: `Series: ${selectedSeries.name}` });
    }

    if (this.number() !== null) {
      chips.push({ key: 'number', label: `Issue: #${this.number()}` });
    }

    if (this.numberFrom() !== null) {
      chips.push({ key: 'numberFrom', label: `From: #${this.numberFrom()}` });
    }

    if (this.numberTo() !== null) {
      chips.push({ key: 'numberTo', label: `To: #${this.numberTo()}` });
    }

    if (this.year() !== null) {
      chips.push({ key: 'year', label: `Year: ${this.year()}` });
    }

    if (selectedMonth) {
      chips.push({ key: 'month', label: `Month: ${selectedMonth.label}` });
    }

    if (this.season().trim()) {
      chips.push({ key: 'season', label: `Season: ${this.season().trim()}` });
    }

    if (this.special() !== 'all') {
      chips.push({ key: 'special', label: this.special() === 'true' ? 'Special only' : 'Regular only' });
    }

    if (this.alternate() !== 'all') {
      chips.push({ key: 'alternate', label: this.alternate() === 'true' ? 'Variants only' : 'Non-variants only' });
    }

    if (this.coverId().trim()) {
      chips.push({ key: 'coverId', label: `Cover: ${this.coverId().trim()}` });
    }

    if (this.status() !== 'H') {
      chips.push({ key: 'status', label: this.status() === 'W' ? 'Wanted' : 'All statuses' });
    }

    return chips;
  });

  constructor(
    private readonly service: MagazineService,
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
      seriesId: this.seriesId() ?? undefined,
      number: this.number() ?? undefined,
      numberFrom: this.numberFrom() ?? undefined,
      numberTo: this.numberTo() ?? undefined,
      year: this.year() ?? undefined,
      month: this.month() ?? undefined,
      season: this.season().trim() || undefined,
      special: this.booleanFilter(this.special()),
      alternate: this.booleanFilter(this.alternate()),
      coverId: this.coverId().trim() || undefined,
      status: this.status(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load magazines.'),
      complete: () => this.loading.set(false)
    });
  }

  loadReport(): void {
    this.reportLoading.set(true);
    this.service.report(this.reportParams()).subscribe({
      next: report => this.report.set(report),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load magazine report.'),
      complete: () => this.reportLoading.set(false)
    });
  }

  applyFilters(): void {
    this.loadReport();
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.seriesId.set(null);
    this.number.set(null);
    this.numberFrom.set(null);
    this.numberTo.set(null);
    this.year.set(null);
    this.month.set(null);
    this.season.set('');
    this.special.set('all');
    this.alternate.set('all');
    this.coverId.set('');
    this.status.set('H');
    this.loadReport();
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

  sortLabel(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  selectItem(item: MagazineIssue): void {
    this.form.set({
      id: item.id,
      number: item.number,
      month: item.month,
      year: item.year,
      season: item.season ?? '',
      title: item.title ?? '',
      special: item.special,
      alternate: item.alternate,
      statusID: item.statusID,
      info: item.info ?? '',
      seriesId: item.seriesId,
      seriesName: '',
      coverID: item.coverID ?? ''
    });
  }

  startNew(): void {
    this.error.set(null);
    this.message.set(null);
    this.form.set(this.emptyForm());
  }

  setFormField<K extends keyof MagazineForm>(field: K, value: MagazineForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();
    const payload: UpsertMagazineIssue = {
      number: form.number,
      month: form.month,
      year: form.year,
      season: form.season.trim() || null,
      title: form.title.trim() || null,
      special: form.special,
      alternate: form.alternate,
      statusID: form.statusID,
      info: form.info.trim() || null,
      seriesId: form.seriesId,
      seriesName: form.seriesId ? null : form.seriesName.trim() || null,
      coverID: form.coverID.trim() || null
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = (saved: MagazineIssue) => {
      this.message.set(`${saved.series} ${saved.displayLabel} saved.`);
      this.startNew();
      this.loadLookups();
      this.loadReport();
      this.load();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save magazine.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.update(form.id, payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
      return;
    }

    this.service.create(payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
  }

  deleteSelected(): void {
    const form = this.form();
    if (!form.id || !window.confirm('Delete this magazine issue?')) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.delete(form.id).subscribe({
      next: () => {
        this.message.set('Magazine issue deleted.');
        this.startNew();
        this.loadReport();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete magazine.'),
      complete: () => this.loading.set(false)
    });
  }

  exportCurrentPageCsv(): void {
    const rows = [
      ['id', 'series', 'number', 'month', 'year', 'season', 'title', 'status', 'special', 'variant', 'cover', 'info', 'displayLabel'],
      ...this.items().map(item => [
        String(item.id),
        item.series,
        item.number?.toString() ?? '',
        item.month?.toString() ?? '',
        item.year?.toString() ?? '',
        item.season ?? '',
        item.title ?? '',
        item.statusID,
        item.special ? 'Yes' : 'No',
        item.alternate ? 'Yes' : 'No',
        item.coverID ?? '',
        item.info ?? '',
        item.displayLabel
      ])
    ];

    this.downloadCsv('magazine-current-page.csv', rows);
  }

  exportReportCsv(): void {
    const report = this.report();
    if (!report) {
      return;
    }

    const rows = [
      ['section', 'label', 'count', 'series', 'number', 'rangeStart', 'rangeEnd'],
      ['summary', 'Filtered issues', String(report.totalIssues), '', '', '', ''],
      ['summary', 'Owned issues', String(report.ownedIssues), '', '', '', ''],
      ['summary', 'Wanted issues', String(report.wantedIssues), '', '', '', ''],
      ['summary', 'Missing issue numbers', String(report.missingNumberIssues), '', '', '', ''],
      ['summary', 'Missing dates', String(report.missingDateIssues), '', '', '', ''],
      ['summary', 'Special issues', String(report.specialIssues), '', '', '', ''],
      ['summary', 'Variant issues', String(report.alternateIssues), '', '', '', ''],
      ...report.seriesBreakdown.map(row => ['series', row.label, String(row.count), row.label, '', '', '']),
      ...report.yearBreakdown.map(row => ['year', row.label, String(row.count), '', '', '', '']),
      ...report.missingRanges.map(row => ['missing-range', `${row.series} #${row.startNumber}${row.startNumber === row.endNumber ? '' : '-' + row.endNumber}`, String(row.count), row.series, '', String(row.startNumber), String(row.endNumber)]),
      ...report.duplicateNumbers.map(row => ['duplicate-number', `${row.series} #${row.number}`, String(row.count), row.series, String(row.number), '', ''])
    ];

    this.downloadCsv('magazine-report-summary.csv', rows);
  }

  focusSeries(seriesName: string): void {
    const match = this.series().find(item => item.name === seriesName);
    if (!match) {
      return;
    }

    this.seriesId.set(match.id);
    this.loadReport();
    this.load(1);
  }

  focusYear(yearLabel: string): void {
    const parsed = Number(yearLabel);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.year.set(parsed);
    this.loadReport();
    this.load(1);
  }

  focusDuplicateNumber(seriesId: number, number: number): void {
    this.seriesId.set(seriesId);
    this.number.set(number);
    this.numberFrom.set(null);
    this.numberTo.set(null);
    this.loadReport();
    this.load(1);
  }

  focusMissingRange(seriesId: number, startNumber: number, endNumber: number): void {
    this.seriesId.set(seriesId);
    this.number.set(null);
    this.numberFrom.set(Math.max(1, startNumber - 1));
    this.numberTo.set(endNumber + 1);
    this.loadReport();
    this.load(1);
  }

  removeFilter(key: FilterKey): void {
    switch (key) {
      case 'query':
        this.query.set('');
        break;
      case 'seriesId':
        this.seriesId.set(null);
        break;
      case 'number':
        this.number.set(null);
        break;
      case 'numberFrom':
        this.numberFrom.set(null);
        break;
      case 'numberTo':
        this.numberTo.set(null);
        break;
      case 'year':
        this.year.set(null);
        break;
      case 'month':
        this.month.set(null);
        break;
      case 'season':
        this.season.set('');
        break;
      case 'special':
        this.special.set('all');
        break;
      case 'alternate':
        this.alternate.set('all');
        break;
      case 'coverId':
        this.coverId.set('');
        break;
      case 'status':
        this.status.set('H');
        break;
    }

    this.loadReport();
    this.load(1);
  }

  private loadLookups(): void {
    this.service.getSeries().subscribe({
      next: series => this.series.set(series),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load magazine series.')
    });
  }

  private booleanFilter(value: BooleanFilter): boolean | undefined {
    return value === 'all' ? undefined : value === 'true';
  }

  private sort(): string {
    return this.sortDirection() === 'desc' ? `-${this.sortKey()}` : this.sortKey();
  }

  private reportParams() {
    return {
      q: this.query(),
      seriesId: this.seriesId() ?? undefined,
      number: this.number() ?? undefined,
      numberFrom: this.numberFrom() ?? undefined,
      numberTo: this.numberTo() ?? undefined,
      year: this.year() ?? undefined,
      month: this.month() ?? undefined,
      season: this.season().trim() || undefined,
      special: this.booleanFilter(this.special()),
      alternate: this.booleanFilter(this.alternate()),
      coverId: this.coverId().trim() || undefined,
      status: this.status()
    };
  }

  private downloadCsv(filename: string, rows: string[][]): void {
    this.csvDownload.download(filename, rows);
  }

  private emptyForm(): MagazineForm {
    return {
      id: null,
      number: null,
      month: null,
      year: null,
      season: '',
      title: '',
      special: false,
      alternate: false,
      statusID: 'H',
      info: '',
      seriesId: this.series()[0]?.id ?? null,
      seriesName: '',
      coverID: ''
    };
  }
}
