import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { SpookytownItem, SpookytownType, UpsertSpookytown } from '../models/spookytown.models';
import { SpookytownService } from '../spookytown-service';

type SortKey = 'name' | 'year' | 'type' | 'qty';

interface SpookytownForm {
  id: number | null;
  name: string;
  sku: string;
  year: number | null;
  retired: boolean;
  url: string;
  qty: number | null;
  typeId: string | null;
  own: boolean;
  want: boolean;
}

interface SpookytownSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface SpookytownReportRow {
  name: string;
  itemCount: number;
  quantity: number;
  ownedCount: number;
  wantedCount: number;
  retiredCount: number;
  missingSkuCount: number;
}

@Component({
  selector: 'app-spookytown-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './spookytown-browser.html',
  styleUrl: './spookytown-browser.scss'
})
export class SpookytownBrowser implements OnInit {
  private readonly csvDownload = inject(CsvDownloadService);

  readonly items = signal<SpookytownItem[]>([]);
  readonly types = signal<SpookytownType[]>([]);
  readonly selectedItem = signal<SpookytownItem | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly typeId = signal<string | null>(null);
  readonly owned = signal<'all' | 'true' | 'false'>('all');
  readonly wanted = signal<'all' | 'true' | 'false'>('all');
  readonly retired = signal<'all' | 'true' | 'false'>('all');
  readonly year = signal<number | null>(null);
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly form = signal<SpookytownForm>(this.emptyForm());

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly summaryCards = computed<SpookytownSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.items().length,
      detail: `${this.total().toLocaleString()} total matches`
    },
    {
      label: 'Quantity',
      value: this.items().reduce((sum, item) => sum + (item.qty ?? 0), 0),
      detail: 'Current page total'
    },
    {
      label: 'Wanted',
      value: this.items().filter(item => item.want).length,
      detail: `${this.items().filter(item => item.own).length.toLocaleString()} owned in view`
    },
    {
      label: 'Retired',
      value: this.items().filter(item => item.retired).length,
      detail: `${this.items().filter(item => !item.sku).length.toLocaleString()} missing SKU`
    }
  ]);
  readonly typeReportRows = computed(() => this.buildReportRows(this.items(), item => item.typeName || 'Unspecified'));
  readonly yearReportRows = computed(() => this.buildReportRows(this.items(), item => item.year ? String(item.year) : 'Unknown year'));
  readonly attentionRows = computed(() => this.items()
    .filter(item => item.want || !item.sku || !item.typeName || !item.year || (item.qty ?? 0) <= 0)
    .slice(0, 10));

  constructor(
    private readonly service: SpookytownService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.service.getTypes().subscribe({
      next: types => this.types.set(types),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Spookytown types.')
    });
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.service.list({
      q: this.query(),
      typeId: this.typeId() ?? undefined,
      owned: this.booleanFilter(this.owned()),
      wanted: this.booleanFilter(this.wanted()),
      retired: this.booleanFilter(this.retired()),
      year: this.year() ?? undefined,
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Spookytown.'),
      complete: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.typeId.set(null);
    this.owned.set('all');
    this.wanted.set('all');
    this.retired.set('all');
    this.year.set(null);
    this.load(1);
  }

  applyTypeReport(row: SpookytownReportRow): void {
    const type = this.types().find(item => item.type === row.name);
    this.typeId.set(type?.id ?? null);
    this.load(1);
  }

  applyYearReport(row: SpookytownReportRow): void {
    const parsedYear = Number(row.name);
    this.year.set(Number.isFinite(parsedYear) ? parsedYear : null);
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

  selectItem(item: SpookytownItem): void {
    this.selectedItem.set(item);
    this.form.set({
      id: item.id,
      name: item.name,
      sku: item.sku ?? '',
      year: item.year ?? null,
      retired: item.retired ?? false,
      url: item.url ?? '',
      qty: item.qty ?? null,
      typeId: item.typeId ?? null,
      own: item.own,
      want: item.want
    });
  }

  startNew(): void {
    this.selectedItem.set(null);
    this.message.set(null);
    this.error.set(null);
    this.form.set(this.emptyForm());
  }

  setFormField<K extends keyof SpookytownForm>(field: K, value: SpookytownForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();

    if (!form.name.trim()) {
      this.error.set('Name is required.');
      return;
    }

    const request: UpsertSpookytown = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      year: form.year,
      retired: form.retired,
      url: form.url.trim() || null,
      qty: form.qty,
      typeId: form.typeId,
      own: form.own,
      want: form.want
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = () => {
      this.message.set(`${request.name} saved.`);
      this.startNew();
      this.load();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save Spookytown item.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.update(form.id, request).subscribe({ next: onSaved, error: onError, complete: onComplete });
      return;
    }

    this.service.create(request).subscribe({ next: onSaved, error: onError, complete: onComplete });
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
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete Spookytown item.'),
      complete: () => this.loading.set(false)
    });
  }

  exportCurrentPageCsv(): void {
    this.downloadCsv(`spookytown-current-page-${this.today()}.csv`, [
      ['Type', 'Name', 'SKU', 'Year', 'Quantity', 'Owned', 'Wanted', 'Retired', 'URL'],
      ...this.items().map(item => [
        item.typeName ?? '',
        item.name,
        item.sku ?? '',
        item.year ?? '',
        item.qty ?? '',
        item.own ? 'Yes' : 'No',
        item.want ? 'Yes' : 'No',
        item.retired ? 'Yes' : 'No',
        item.url ?? ''
      ])
    ]);
  }

  exportReportCsv(): void {
    this.downloadCsv(`spookytown-report-${this.today()}.csv`, [
      ['Report', 'Name', 'Rows', 'Quantity', 'Owned Rows', 'Wanted Rows', 'Retired Rows', 'Missing SKU'],
      ...this.typeReportRows().map(row => [
        'Type',
        row.name,
        row.itemCount,
        row.quantity,
        row.ownedCount,
        row.wantedCount,
        row.retiredCount,
        row.missingSkuCount
      ]),
      ...this.yearReportRows().map(row => [
        'Year',
        row.name,
        row.itemCount,
        row.quantity,
        row.ownedCount,
        row.wantedCount,
        row.retiredCount,
        row.missingSkuCount
      ])
    ]);
  }

  private booleanFilter(value: 'all' | 'true' | 'false'): boolean | undefined {
    return value === 'all' ? undefined : value === 'true';
  }

  private sort(): string {
    return this.sortDirection() === 'desc' ? `-${this.sortKey()}` : this.sortKey();
  }

  private emptyForm(): SpookytownForm {
    return {
      id: null,
      name: '',
      sku: '',
      year: null,
      retired: false,
      url: '',
      qty: 1,
      typeId: null,
      own: true,
      want: false
    };
  }

  private buildReportRows(items: SpookytownItem[], nameSelector: (item: SpookytownItem) => string): SpookytownReportRow[] {
    const rows = new Map<string, SpookytownReportRow>();

    items.forEach(item => {
      const name = nameSelector(item);
      const row = rows.get(name) ?? {
        name,
        itemCount: 0,
        quantity: 0,
        ownedCount: 0,
        wantedCount: 0,
        retiredCount: 0,
        missingSkuCount: 0
      };

      row.itemCount += 1;
      row.quantity += item.qty ?? 0;
      row.ownedCount += item.own ? 1 : 0;
      row.wantedCount += item.want ? 1 : 0;
      row.retiredCount += item.retired ? 1 : 0;
      row.missingSkuCount += item.sku ? 0 : 1;
      rows.set(name, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.itemCount - left.itemCount || left.name.localeCompare(right.name));
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    this.csvDownload.download(filename, rows);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
