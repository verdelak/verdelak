import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { MusicService } from '../music.service';
import { MusicWantListItem } from '../models/music.models';

type WantListSortKey = 'artist' | 'title' | 'format';

@Component({
  selector: 'app-music-want-list',
  imports: [CommonModule],
  templateUrl: './music-want-list.html',
  styleUrl: './music-want-list.scss'
})
export class MusicWantList implements OnInit {
  readonly items = signal<MusicWantListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sortKey = signal<WantListSortKey>('artist');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly sortedItems = computed(() => {
    const key = this.sortKey();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...this.items()].sort((left, right) =>
      left[key].localeCompare(right[key], undefined, { sensitivity: 'base' }) * direction);
  });

  constructor(private readonly service: MusicService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getWantList().subscribe({
      next: items => this.items.set(items),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load want list.'),
      complete: () => this.loading.set(false)
    });
  }

  sortBy(key: WantListSortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortKey.set(key);
    this.sortDirection.set('asc');
  }

  sortLabel(key: WantListSortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }
}
