import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MiniLookup, MiniatureItem } from '../models/miniature.models';
import { MiniaturesService } from '../miniatures.service';

type MiniWantSort = 'number' | '-number' | 'name' | '-name' | 'rarity' | '-rarity';

@Component({
  selector: 'app-miniatures-want-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './miniatures-want-list.html',
  styleUrl: './miniatures-want-list.scss'
})
export class MiniaturesWantList implements OnInit {
  readonly items = signal<MiniatureItem[]>([]);
  readonly systems = signal<MiniLookup[]>([]);
  readonly series = signal<MiniLookup[]>([]);
  readonly rarities = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly systemId = signal<number | null>(null);
  readonly seriesId = signal<number | null>(null);
  readonly rarity = signal('');
  readonly number = signal('');
  readonly sort = signal<MiniWantSort>('number');

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  constructor(private readonly service: MiniaturesService) {}

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.service.list({
      status: 'want',
      systemId: this.systemId(),
      seriesId: this.seriesId(),
      rarity: this.rarity(),
      number: this.number(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load miniature want list.'),
      complete: () => this.loading.set(false)
    });
  }

  loadLookups(): void {
    this.service.getSystems().subscribe({ next: values => this.systems.set(values) });
    this.loadSeries();
    this.service.getRarities().subscribe({ next: values => this.rarities.set(values) });
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
    this.load(1);
  }

  clearFilters(): void {
    this.systemId.set(null);
    this.seriesId.set(null);
    this.rarity.set('');
    this.number.set('');
    this.sort.set('number');
    this.loadSeries();
    this.load(1);
  }

  statusLabel(item: MiniatureItem): string {
    return item.wantedQuantity > 0 ? `Wanted: ${item.wantedQuantity}` : 'Wanted';
  }

  private loadSeries(): void {
    this.service.getSeries(this.systemId()).subscribe({ next: values => this.series.set(values) });
  }

  private toNullableNumber(value: string | number | null): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
