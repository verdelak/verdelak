import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { BookListItem } from '../models/book.models';
import { BooksService } from '../books.service';

type BookWantSortKey = 'author' | 'title' | 'series' | 'subSeries' | 'format';

@Component({
  selector: 'app-book-want-list',
  imports: [CommonModule],
  templateUrl: './book-want-list.html',
  styleUrl: './book-want-list.scss'
})
export class BookWantList implements OnInit {
  readonly items = signal<BookListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sortKey = signal<BookWantSortKey>('author');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly sortedItems = computed(() => {
    const key = this.sortKey();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...this.items()].sort((left, right) =>
      this.value(left, key).localeCompare(this.value(right, key), undefined, { sensitivity: 'base' }) * direction);
  });

  constructor(private readonly service: BooksService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getWantList().subscribe({
      next: items => this.items.set(items),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load book want list.'),
      complete: () => this.loading.set(false)
    });
  }

  sortBy(key: BookWantSortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortKey.set(key);
    this.sortDirection.set('asc');
  }

  sortLabel(key: BookWantSortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  displaySeries(item: BookListItem): string {
    return [item.series, item.subSeries].filter(Boolean).join(' / ');
  }

  private value(item: BookListItem, key: BookWantSortKey): string {
    return key === 'series' || key === 'subSeries'
      ? item[key] ?? ''
      : item[key];
  }
}
