import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { ComicService } from '../comic.service';
import { ComicWantListItem } from '../models/comic.models';

type SortKey = 'series' | 'issue' | 'year' | 'type';
type CsvValue = string | number | boolean | null | undefined;

@Component({
  selector: 'app-comic-want-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './comic-want-list.html',
  styleUrl: './comic-want-list.scss'
})
export class ComicWantList implements OnInit {
  readonly items = signal<ComicWantListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly sortKey = signal<SortKey>('series');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly filteredItems = computed(() => {
    const term = this.query().trim().toLowerCase();
    const sorted = [...this.items()].filter(item => {
      if (!term) {
        return true;
      }

      return item.series.toLowerCase().includes(term) ||
        (item.name ?? '').toLowerCase().includes(term) ||
        (item.notes ?? '').toLowerCase().includes(term) ||
        (item.seriesNotes ?? '').toLowerCase().includes(term);
    });

    sorted.sort((a, b) => this.compare(a, b));
    return sorted;
  });

  readonly titleOnlyCount = computed(() => this.items().filter(item => item.issueId === null).length);
  readonly issueCount = computed(() => this.items().filter(item => item.issueId !== null).length);

  constructor(
    private readonly service: ComicService,
    private readonly csvDownload: CsvDownloadService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getWantList().subscribe({
      next: items => this.items.set(items),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load comic want list.'),
      complete: () => this.loading.set(false)
    });
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortKey.set(key);
    this.sortDirection.set('asc');
  }

  sortLabel(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  exportWantListCsv(): void {
    const rows = this.filteredItems().map(item => ({
      Series: item.series,
      IssueNumber: item.issueNumber ?? '',
      Date: [item.issueMonth, item.issueYear].filter(Boolean).join(' '),
      Name: item.name ?? '',
      Type: this.typeLabel(item),
      Details: item.issueId ? item.displayLabel : 'Title wanted',
      Rating: item.rating ?? '',
      Notes: item.notes || item.seriesNotes || ''
    }));

    this.downloadCsv(`comic-want-list-${this.today()}.csv`, rows);
  }

  private compare(a: ComicWantListItem, b: ComicWantListItem): number {
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    const result = this.compareByKey(a, b, this.sortKey());
    return result * direction;
  }

  private compareByKey(a: ComicWantListItem, b: ComicWantListItem, key: SortKey): number {
    switch (key) {
      case 'issue':
        return this.compareNumber(a.issueNumber, b.issueNumber) || this.compareText(a.series, b.series);
      case 'year':
        return this.compareText(a.issueYear, b.issueYear) || this.compareText(a.series, b.series) || this.compareNumber(a.issueNumber, b.issueNumber);
      case 'type':
        return this.compareText(this.typeLabel(a), this.typeLabel(b)) || this.compareText(a.series, b.series);
      default:
        return this.compareText(a.series, b.series) || this.compareNumber(a.issueNumber, b.issueNumber) || this.compareText(a.name, b.name);
    }
  }

  private compareText(a: string | null, b: string | null): number {
    return (a ?? '').localeCompare(b ?? '', undefined, { numeric: true, sensitivity: 'base' });
  }

  private compareNumber(a: number | null, b: number | null): number {
    return (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER);
  }

  private typeLabel(item: ComicWantListItem): string {
    if (item.issueId === null) {
      return 'Title';
    }

    if (item.isGraphicNovel) {
      return 'Graphic Novel';
    }

    if (item.isSpecial) {
      return 'Special';
    }

    if (item.isVariant) {
      return 'Variant';
    }

    return 'Issue';
  }

  private downloadCsv(filename: string, rows: Record<string, CsvValue>[]): void {
    this.csvDownload.downloadObjects(filename, rows);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
