import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { MagazineIssue, MagazineLookup, UpsertMagazineIssue } from '../models/magazine.models';
import { MagazineService } from '../magazine.service';

type StatusFilter = 'H' | 'W' | 'all';
type BooleanFilter = 'all' | 'true' | 'false';
type SortKey = 'series' | 'year' | 'number' | 'title';

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

@Component({
  selector: 'app-magazine-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './magazine-browser.html',
  styleUrl: './magazine-browser.scss'
})
export class MagazineBrowser implements OnInit {
  readonly items = signal<MagazineIssue[]>([]);
  readonly series = signal<MagazineLookup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly seriesId = signal<number | null>(null);
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

  constructor(
    private readonly service: MagazineService,
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
      seriesId: this.seriesId() ?? undefined,
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

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.seriesId.set(null);
    this.year.set(null);
    this.month.set(null);
    this.season.set('');
    this.special.set('all');
    this.alternate.set('all');
    this.coverId.set('');
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
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete magazine.'),
      complete: () => this.loading.set(false)
    });
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
