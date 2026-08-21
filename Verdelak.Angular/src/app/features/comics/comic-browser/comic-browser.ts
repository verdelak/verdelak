import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ComicIssue, ComicSeries, ComicSeriesReport, UpsertComicIssue } from '../models/comic.models';
import { ComicService } from '../comic.service';

type StatusFilter = 'H' | 'W' | 'all';

interface IssueForm {
  id: number | null;
  seriesId: number | null;
  issueNumber: number | null;
  name: string;
  issueMonth: number | null;
  issueYear: string;
  isSpecial: boolean;
  isGraphicNovel: boolean;
  isVariant: boolean;
  statusID: 'H' | 'W';
  rating: number | null;
  notes: string;
  storedID: number | null;
  price: number | null;
}

interface ComicImportRow {
  rowNumber: number;
  seriesTitle: string;
  issueNumber: number | null;
  name: string;
  issueMonth: number | null;
  issueYear: string;
  statusID: 'H' | 'W';
  isSpecial: boolean;
  isGraphicNovel: boolean;
  isVariant: boolean;
  rating: number | null;
  storedID: number | null;
  price: number | null;
  notes: string;
  warnings: string[];
}

@Component({
  selector: 'app-comic-browser',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './comic-browser.html',
  styleUrl: './comic-browser.scss'
})
export class ComicBrowser implements OnInit {
  readonly series = signal<ComicSeries[]>([]);
  readonly seriesReport = signal<ComicSeriesReport[]>([]);
  readonly issuesBySeries = signal<Record<number, ComicIssue[]>>({});
  readonly expanded = signal<Record<number, boolean>>({});
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly query = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly newTitle = signal('');
  readonly newTitleNotes = signal('');
  readonly activeIssueSeriesId = signal<number | null>(null);
  readonly issueForm = signal<IssueForm>(this.emptyIssueForm());
  readonly importText = signal('');
  readonly importRows = signal<ComicImportRow[]>([]);
  readonly importCommitting = signal(false);

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

  readonly filteredSeries = computed(() => {
    const term = this.query().trim().toLowerCase();
    const status = this.status();

    return this.series().filter(item => {
      const titleMatch = !term || item.title.toLowerCase().includes(term) || (item.notes ?? '').toLowerCase().includes(term);
      if (!titleMatch) {
        return false;
      }

      if (status === 'all') {
        return true;
      }

      const loadedIssues = this.issuesBySeries()[item.id];
      return !loadedIssues || loadedIssues.some(issue => issue.statusID === status);
    });
  });

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly loadedIssues = computed(() =>
    Object.values(this.issuesBySeries()).flat().sort((left, right) =>
      left.series.localeCompare(right.series) ||
      (left.issueNumber ?? Number.MAX_SAFE_INTEGER) - (right.issueNumber ?? Number.MAX_SAFE_INTEGER) ||
      (left.issueYear ?? '').localeCompare(right.issueYear ?? '') ||
      (left.name ?? '').localeCompare(right.name ?? '')));
  readonly reportRows = computed(() => this.loadedIssues().map(issue => ({
    Series: issue.series,
    IssueNumber: issue.issueNumber ?? '',
    Name: issue.name ?? '',
    Month: issue.issueMonth ?? '',
    Year: issue.issueYear ?? '',
    Status: issue.statusID === 'W' ? 'Wanted' : 'Owned',
    Special: issue.isSpecial ? 'Yes' : 'No',
    GraphicNovel: issue.isGraphicNovel ? 'Yes' : 'No',
    Variant: issue.isVariant ? 'Yes' : 'No',
    Rating: issue.rating ?? '',
    Value: issue.values[0]?.price ?? '',
    Notes: issue.notes ?? ''
  })));
  readonly summaryRows = computed(() => this.seriesReport().map(row => ({
    Series: row.series,
    Notes: row.notes ?? '',
    TotalIssues: row.issueCount,
    OwnedIssues: row.ownedIssueCount,
    WantedIssues: row.wantedIssueCount,
    Specials: row.specialCount,
    GraphicNovels: row.graphicNovelCount,
    Variants: row.variantCount,
    TotalValue: row.totalValue
  })));
  readonly totalIssueCount = computed(() => this.seriesReport().reduce((sum, row) => sum + row.issueCount, 0));
  readonly totalOwnedIssueCount = computed(() => this.seriesReport().reduce((sum, row) => sum + row.ownedIssueCount, 0));
  readonly totalWantedIssueCount = computed(() => this.seriesReport().reduce((sum, row) => sum + row.wantedIssueCount, 0));
  readonly titleOnlyWantCount = computed(() => this.seriesReport().filter(row => row.issueCount === 0).length);
  readonly totalComicValue = computed(() => this.seriesReport().reduce((sum, row) => sum + row.totalValue, 0));

  constructor(
    private readonly service: ComicService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSeries();
  }

  loadSeries(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getSeries().subscribe({
      next: series => this.series.set(series),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load comic titles.'),
      complete: () => this.loading.set(false)
    });
  }

  loadSeriesReport(): void {
    this.service.getSeriesReport().subscribe({
      next: report => this.seriesReport.set(report),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load comic report.')
    });
  }

  toggleSeries(series: ComicSeries): void {
    const isExpanded = !this.expanded()[series.id];
    this.expanded.set({ ...this.expanded(), [series.id]: isExpanded });

    if (isExpanded && !this.issuesBySeries()[series.id]) {
      this.loadIssues(series.id);
    }
  }

  loadIssues(seriesId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list({
      seriesId,
      status: 'all',
      sort: 'issue',
      page: 1,
      pageSize: 200
    }).subscribe({
      next: result => this.issuesBySeries.set({ ...this.issuesBySeries(), [seriesId]: result.items }),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load comic issues.'),
      complete: () => this.loading.set(false)
    });
  }

  issuesFor(seriesId: number, status: 'H' | 'W'): ComicIssue[] {
    return (this.issuesBySeries()[seriesId] ?? []).filter(issue => issue.statusID === status);
  }

  startNewIssue(series: ComicSeries, statusID: 'H' | 'W'): void {
    this.activeIssueSeriesId.set(series.id);
    this.issueForm.set({
      ...this.emptyIssueForm(),
      seriesId: series.id,
      statusID,
      name: statusID === 'W' ? 'Wanted issue' : ''
    });
  }

  editIssue(issue: ComicIssue): void {
    this.activeIssueSeriesId.set(issue.seriesId);
    this.issueForm.set({
      id: issue.id,
      seriesId: issue.seriesId,
      issueNumber: issue.issueNumber,
      name: issue.name ?? '',
      issueMonth: issue.issueMonth,
      issueYear: issue.issueYear ?? '',
      isSpecial: issue.isSpecial,
      isGraphicNovel: issue.isGraphicNovel,
      isVariant: issue.isVariant,
      statusID: issue.statusID,
      rating: issue.rating,
      notes: issue.notes ?? '',
      storedID: issue.values[0]?.storedID ?? null,
      price: issue.values[0]?.price ?? null
    });
  }

  setIssueField<K extends keyof IssueForm>(field: K, value: IssueForm[K]): void {
    this.issueForm.set({ ...this.issueForm(), [field]: value });
  }

  saveIssue(): void {
    const form = this.issueForm();
    if (!form.seriesId) {
      this.error.set('Choose a comic title before saving an issue.');
      return;
    }

    const payload: UpsertComicIssue = {
      seriesId: form.seriesId,
      seriesTitle: null,
      issueNumber: form.issueNumber,
      isSpecial: form.isSpecial,
      name: form.name.trim() || null,
      issueMonth: form.issueMonth,
      issueYear: form.issueYear.trim() || null,
      isGraphicNovel: form.isGraphicNovel,
      isVariant: form.isVariant,
      notes: form.notes.trim() || null,
      statusID: form.statusID,
      rating: form.rating,
      storedID: form.storedID,
      price: form.price
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = (saved: ComicIssue) => {
      this.message.set(`${saved.series} ${saved.displayLabel} saved.`);
      this.activeIssueSeriesId.set(null);
      this.issueForm.set(this.emptyIssueForm());
      this.loadIssues(saved.seriesId);
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save comic issue.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.updateIssue(form.id, payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
      return;
    }

    this.service.createIssue(payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
  }

  deleteIssue(issue: ComicIssue): void {
    if (!window.confirm(`Delete ${issue.displayLabel}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.deleteIssue(issue.id).subscribe({
      next: () => {
        this.message.set('Comic issue deleted.');
        this.loadIssues(issue.seriesId);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete comic issue.'),
      complete: () => this.loading.set(false)
    });
  }

  addWantedTitle(): void {
    const title = this.newTitle().trim();
    if (!title) {
      this.error.set('Title is required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.createSeries({
      title,
      notes: this.newTitleNotes().trim() || null
    }).subscribe({
      next: series => {
        this.message.set(`${series.title} added.`);
        this.newTitle.set('');
        this.newTitleNotes.set('');
        this.loadSeries();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to add comic title.'),
      complete: () => this.loading.set(false)
    });
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
    const hasHeader = first.some(value => ['series', 'title', 'issuenumber', 'issue', 'status'].includes(this.normalizeHeader(value)));
    const headers = hasHeader ? first.map(value => this.normalizeHeader(value)) : [];
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const parsed = dataRows.map((row, index) => this.parseImportRow(this.parseDelimitedRow(row), hasHeader ? headers : null, index + (hasHeader ? 2 : 1)));
    this.importRows.set(parsed);
    this.message.set(`${parsed.length} comic import rows staged.`);
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
      this.error.set('No staged comic rows to commit.');
      return;
    }

    const invalid = rows.filter(row => row.warnings.some(warning => warning.startsWith('Required')));
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

  exportLoadedIssuesCsv(): void {
    this.downloadCsv(`comic-loaded-issues-${this.today()}.csv`, this.reportRows());
  }

  exportSummaryCsv(): void {
    this.downloadCsv(`comic-title-summary-${this.today()}.csv`, this.summaryRows());
  }

  cancelIssueForm(): void {
    this.activeIssueSeriesId.set(null);
    this.issueForm.set(this.emptyIssueForm());
  }

  private commitImportRow(rows: ComicImportRow[], index: number, savedCount: number): void {
    if (index >= rows.length) {
      this.message.set(`Imported ${savedCount} comic rows.`);
      this.importCommitting.set(false);
      this.loading.set(false);
      this.clearImport();
      this.loadSeries();
      return;
    }

    const row = rows[index];
    const payload: UpsertComicIssue = {
      seriesId: null,
      seriesTitle: row.seriesTitle,
      issueNumber: row.issueNumber,
      isSpecial: row.isSpecial,
      name: row.name.trim() || null,
      issueMonth: row.issueMonth,
      issueYear: row.issueYear.trim() || null,
      isGraphicNovel: row.isGraphicNovel,
      isVariant: row.isVariant,
      notes: row.notes.trim() || null,
      statusID: row.statusID,
      rating: row.rating,
      storedID: row.storedID,
      price: row.price
    };

    this.service.createIssue(payload).subscribe({
      next: () => this.commitImportRow(rows, index + 1, savedCount + 1),
      error: err => {
        this.error.set(`Import failed on row ${row.rowNumber}: ${err.error ?? err.message ?? 'Save failed.'}`);
        this.importCommitting.set(false);
        this.loading.set(false);
      }
    });
  }

  private parseImportRow(values: string[], headers: string[] | null, rowNumber: number): ComicImportRow {
    const get = (...names: string[]) => {
      if (!headers) {
        const fallback = ['series', 'issueNumber', 'name', 'month', 'year', 'status', 'notes', 'special', 'graphicNovel', 'variant', 'rating', 'storedID', 'price'];
        const index = fallback.findIndex(header => names.includes(header));
        return index >= 0 ? values[index] ?? '' : '';
      }

      const index = headers.findIndex(header => names.includes(header));
      return index >= 0 ? values[index] ?? '' : '';
    };
    const seriesTitle = get('series', 'title', 'seriestitle').trim();
    const status = get('status', 'statusid', 'havewant').trim().toUpperCase();
    const issueYear = get('year', 'issueyear').trim();
    const warnings: string[] = [];
    if (!seriesTitle) {
      warnings.push('Required: series/title is missing.');
    }
    if (issueYear.length > 4) {
      warnings.push('Issue year should be four characters or fewer.');
    }

    return {
      rowNumber,
      seriesTitle,
      issueNumber: this.numberOrNull(get('issuenumber', 'issue', 'number')),
      name: get('name', 'issuename'),
      issueMonth: this.monthOrNull(get('month', 'issuemonth')),
      issueYear,
      statusID: status === 'W' || status === 'WANT' || status === 'WANTED' ? 'W' : 'H',
      isSpecial: this.booleanValue(get('special', 'isspecial')),
      isGraphicNovel: this.booleanValue(get('graphicnovel', 'gn', 'isgraphicnovel')),
      isVariant: this.booleanValue(get('variant', 'isvariant')),
      rating: this.numberOrNull(get('rating')),
      storedID: this.numberOrNull(get('storedid', 'stored')),
      price: this.numberOrNull(get('price', 'value')),
      notes: get('notes'),
      warnings
    };
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

  private numberOrNull(value: string): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && value.trim() !== '' ? parsed : null;
  }

  private monthOrNull(value: string): number | null {
    const parsed = this.numberOrNull(value);
    if (parsed !== null) {
      return Math.max(1, Math.min(12, Math.trunc(parsed)));
    }

    const month = this.months.find(item => item.label.toLowerCase().startsWith(value.trim().toLowerCase()));
    return month?.value ?? null;
  }

  private booleanValue(value: string): boolean {
    return ['1', 'true', 'yes', 'y', 'x'].includes(value.trim().toLowerCase());
  }

  private downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
    const csvRows = rows.length ? rows : [{ Message: 'No rows to export' }];
    const headers = Object.keys(csvRows[0]);
    const csv = [
      headers.join(','),
      ...csvRows.map(row => headers.map(header => this.csvValue(row[header])).join(','))
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvValue(value: string | number): string {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private emptyIssueForm(): IssueForm {
    return {
      id: null,
      seriesId: null,
      issueNumber: null,
      name: '',
      issueMonth: null,
      issueYear: '',
      isSpecial: false,
      isGraphicNovel: false,
      isVariant: false,
      statusID: 'H',
      rating: null,
      notes: '',
      storedID: null,
      price: null
    };
  }
}



