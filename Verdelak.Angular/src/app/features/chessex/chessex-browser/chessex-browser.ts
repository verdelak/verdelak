import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ChessexService } from '../chessex.service';
import { ChessexLookup, ChessexSet, UpsertChessexSet } from '../models/chessex.models';

type StatusFilter = 'H' | 'W' | 'all';
type SortKey = 'name' | 'category' | 'setType' | 'qty';

interface ChessexSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface ChessexReportRow {
  name: string;
  setCount: number;
  ownedCount: number;
  wantedCount: number;
  quantity: number;
  diceCount: number;
  missingCodeCount: number;
}

interface ChessexForm {
  id: number | null;
  name: string;
  productCode: string;
  categoryId: number | null;
  categoryName: string;
  setTypeId: number | null;
  setTypeName: string;
  diceCount: number | null;
  color: string;
  notes: string;
  wantStatusID: 'H' | 'W';
  qty: number | null;
}

@Component({
  selector: 'app-chessex-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './chessex-browser.html',
  styleUrl: './chessex-browser.scss'
})
export class ChessexBrowser implements OnInit {
  readonly items = signal<ChessexSet[]>([]);
  readonly categories = signal<ChessexLookup[]>([]);
  readonly setTypes = signal<ChessexLookup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly categoryId = signal<number | null>(null);
  readonly setTypeId = signal<number | null>(null);
  readonly status = signal<StatusFilter>('H');
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly form = signal<ChessexForm>(this.emptyForm());

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly statusLabel = computed(() => this.status() === 'W' ? 'wanted' : this.status() === 'all' ? 'total' : 'owned');
  readonly shownQuantity = computed(() => this.items().reduce((sum, item) => sum + item.qty, 0));
  readonly shownDiceCount = computed(() => this.items().reduce((sum, item) => sum + (item.diceCount ?? 0) * item.qty, 0));
  readonly wantedShown = computed(() => this.items().filter(item => item.wantStatusID === 'W').length);
  readonly missingCodeShown = computed(() => this.items().filter(item => !item.productCode).length);
  readonly chessexSummaryCards = computed<ChessexSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.items().length,
      detail: `${this.total().toLocaleString()} total matches`
    },
    {
      label: 'Quantity',
      value: this.shownQuantity(),
      detail: 'Sets in current view'
    },
    {
      label: 'Dice counted',
      value: this.shownDiceCount(),
      detail: 'Known dice count times quantity'
    },
    {
      label: 'Wanted',
      value: this.wantedShown(),
      detail: `${this.missingCodeShown().toLocaleString()} rows missing product codes`
    }
  ]);
  readonly categoryReportRows = computed(() => this.buildReportRows(this.items(), item => item.category || 'Uncategorized'));
  readonly setTypeReportRows = computed(() => this.buildReportRows(this.items(), item => item.setType || 'Unspecified'));
  readonly attentionRows = computed(() => this.items()
    .filter(item => item.wantStatusID === 'W' || !item.productCode || !item.diceCount || item.qty <= 0)
    .slice(0, 10));

  constructor(
    private readonly service: ChessexService,
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
      categoryId: this.categoryId() ?? undefined,
      setTypeId: this.setTypeId() ?? undefined,
      status: this.status(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Chessex sets.'),
      complete: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.categoryId.set(null);
    this.setTypeId.set(null);
    this.status.set('H');
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

  selectItem(item: ChessexSet): void {
    this.form.set({
      id: item.id,
      name: item.name,
      productCode: item.productCode ?? '',
      categoryId: item.categoryId,
      categoryName: '',
      setTypeId: item.setTypeId,
      setTypeName: '',
      diceCount: item.diceCount,
      color: item.color ?? '',
      notes: item.notes ?? '',
      wantStatusID: item.wantStatusID,
      qty: item.qty
    });
  }

  applyCategoryReport(row: ChessexReportRow): void {
    const category = this.categories().find(item => item.name === row.name);
    this.categoryId.set(category?.id ?? null);
    this.load(1);
  }

  applySetTypeReport(row: ChessexReportRow): void {
    const setType = this.setTypes().find(item => item.name === row.name);
    this.setTypeId.set(setType?.id ?? null);
    this.load(1);
  }

  startNew(): void {
    this.error.set(null);
    this.message.set(null);
    this.form.set(this.emptyForm());
  }

  setFormField<K extends keyof ChessexForm>(field: K, value: ChessexForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();

    if (!form.name.trim()) {
      this.error.set('Name is required.');
      return;
    }

    const payload: UpsertChessexSet = {
      name: form.name.trim(),
      productCode: form.productCode.trim() || null,
      categoryId: form.categoryId,
      categoryName: form.categoryId ? null : form.categoryName.trim() || null,
      setTypeId: form.setTypeId,
      setTypeName: form.setTypeId ? null : form.setTypeName.trim() || null,
      diceCount: form.diceCount,
      color: form.color.trim() || null,
      notes: form.notes.trim() || null,
      wantStatusID: form.wantStatusID,
      qty: form.qty
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = (saved: ChessexSet) => {
      this.message.set(`${saved.name} saved.`);
      this.startNew();
      this.loadLookups();
      this.load();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save Chessex set.');
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
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete Chessex set.'),
      complete: () => this.loading.set(false)
    });
  }

  exportCurrentPageCsv(): void {
    this.downloadCsv(`chessex-current-page-${this.today()}.csv`, [
      ['Category', 'Set Type', 'Name', 'Product Code', 'Color', 'Dice Count', 'Quantity', 'Status', 'Notes'],
      ...this.items().map(item => [
        item.category,
        item.setType,
        item.name,
        item.productCode ?? '',
        item.color ?? '',
        item.diceCount ?? '',
        item.qty,
        item.wantStatusID === 'W' ? 'Want' : 'Have',
        item.notes ?? ''
      ])
    ]);
  }

  exportReportCsv(): void {
    this.downloadCsv(`chessex-report-${this.today()}.csv`, [
      ['Report', 'Name', 'Rows', 'Quantity', 'Dice Count', 'Owned Rows', 'Wanted Rows', 'Missing Product Codes'],
      ...this.categoryReportRows().map(row => [
        'Category',
        row.name,
        row.setCount,
        row.quantity,
        row.diceCount,
        row.ownedCount,
        row.wantedCount,
        row.missingCodeCount
      ]),
      ...this.setTypeReportRows().map(row => [
        'Set Type',
        row.name,
        row.setCount,
        row.quantity,
        row.diceCount,
        row.ownedCount,
        row.wantedCount,
        row.missingCodeCount
      ])
    ]);
  }

  private loadLookups(): void {
    this.service.getCategories().subscribe({
      next: categories => this.categories.set(categories),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Chessex categories.')
    });
    this.service.getSetTypes().subscribe({
      next: setTypes => this.setTypes.set(setTypes),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Chessex set types.')
    });
  }

  private sort(): string {
    return this.sortDirection() === 'desc' ? `-${this.sortKey()}` : this.sortKey();
  }

  private emptyForm(): ChessexForm {
    return {
      id: null,
      name: '',
      productCode: '',
      categoryId: null,
      categoryName: '',
      setTypeId: null,
      setTypeName: '',
      diceCount: null,
      color: '',
      notes: '',
      wantStatusID: 'H',
      qty: 1
    };
  }

  private buildReportRows(items: ChessexSet[], nameSelector: (item: ChessexSet) => string): ChessexReportRow[] {
    const rows = new Map<string, ChessexReportRow>();

    items.forEach(item => {
      const name = nameSelector(item);
      const row = rows.get(name) ?? {
        name,
        setCount: 0,
        ownedCount: 0,
        wantedCount: 0,
        quantity: 0,
        diceCount: 0,
        missingCodeCount: 0
      };

      row.setCount += 1;
      row.quantity += item.qty;
      row.diceCount += (item.diceCount ?? 0) * item.qty;
      row.ownedCount += item.wantStatusID === 'H' ? 1 : 0;
      row.wantedCount += item.wantStatusID === 'W' ? 1 : 0;
      row.missingCodeCount += item.productCode ? 0 : 1;
      rows.set(name, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.setCount - left.setCount || left.name.localeCompare(right.name));
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    const csv = rows
      .map(row => row.map(cell => this.csvCell(cell)).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
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
}
