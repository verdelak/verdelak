import { Component, computed, OnInit, signal } from '@angular/core';
import { BoardgameService } from '../boardgame';
import { BoardGame } from '../models/boardgamemodels';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

type BoardGameStatusFilter = 'all' | 'owned' | 'wishlist';
type BoardGameTypeFilter = 'all' | 'base' | 'expansion';

@Component({
  selector: 'app-boardgame-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './boardgame-list.html',
  styleUrl: './boardgame-list.scss'
})
export class BoardgameListComponent  implements OnInit {
  readonly games = signal<BoardGame[]>([]);
  readonly error = signal<string | null>(null);
  readonly pageSize = 50;
  readonly currentPage = signal(1); // 1-based
  readonly statusFilter = signal<BoardGameStatusFilter>('all');
  readonly typeFilter = signal<BoardGameTypeFilter>('all');
  readonly searchTerm = signal('');

  readonly sortColumn = signal<keyof BoardGame>('title');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly ownedCount = computed(() => this.games().filter(game => game.owns).length);
  readonly wishlistCount = computed(() => this.games().filter(game => game.wishlist).length);
  readonly expansionCount = computed(() => this.games().filter(game => game.isExpansion).length);
  readonly baseGameCount = computed(() => this.games().filter(game => !game.isExpansion).length);
  readonly linkedExpansionCount = computed(() => this.games().filter(game => game.isExpansion && game.baseGameID !== null).length);
  readonly ratedCount = computed(() => this.games().filter(game => game.personalRating !== null || game.bgg_Rating !== null).length);
  readonly topRatedGames = computed(() => [...this.games()]
    .filter(game => game.bgg_Rating !== null)
    .sort((a, b) => (b.bgg_Rating ?? 0) - (a.bgg_Rating ?? 0))
    .slice(0, 5));
  readonly baseGameLookup = computed(() => new Map(this.games().map(game => [game.gameID, game.title])));

  readonly filteredGames = computed(() => {
    let filtered = this.games();

    switch (this.statusFilter()) {
      case 'owned':
        filtered = filtered.filter(game => game.owns);
        break;
      case 'wishlist':
        filtered = filtered.filter(game => game.wishlist);
        break;
    }

    switch (this.typeFilter()) {
      case 'base':
        filtered = filtered.filter(game => !game.isExpansion);
        break;
      case 'expansion':
        filtered = filtered.filter(game => game.isExpansion);
        break;
    }

    const term = this.searchTerm().toLowerCase().trim();
    if (term.length > 0) {
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(term) ||
        this.parentTitle(game).toLowerCase().includes(term) ||
        (game.notes ?? '').toLowerCase().includes(term));
    }

    return [...filtered].sort((a, b) => this.compareGames(a, b));
  });

  readonly pagedGames = computed(() => {
    const sorted = this.filteredGames();
    const start = (this.currentPage() - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredGames().length / this.pageSize)));
  readonly hasFilters = computed(() =>
    this.statusFilter() !== 'all' ||
    this.typeFilter() !== 'all' ||
    this.searchTerm().trim().length > 0);

  constructor(private service: BoardgameService) {}

  ngOnInit(): void {
    this.service.getGames().subscribe({
      next: (data) => this.games.set(data),
      error: () => this.error.set('Failed to load games.')
    });
  }


  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }


  // Toggle sorting
  toggleSort(column: keyof BoardGame) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  setStatusFilter(value: BoardGameStatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  setTypeFilter(value: BoardGameTypeFilter): void {
    this.typeFilter.set(value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.statusFilter.set('all');
    this.typeFilter.set('all');
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  sortLabel(column: keyof BoardGame): string {
    if (this.sortColumn() !== column) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'Asc' : 'Desc';
  }

  parentTitle(game: BoardGame): string {
    return game.baseGameID === null ? '' : this.baseGameLookup().get(game.baseGameID) ?? 'Unlinked base game';
  }

  statusTone(game: BoardGame): string {
    if (game.wishlist && !game.owns) {
      return 'bg-amber-50 text-amber-800 ring-amber-200';
    }

    if (game.owns && game.wishlist) {
      return 'app-token-soft-surface app-token-text-primary app-token-ring';
    }

    return game.owns
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : 'bg-slate-100 text-slate-700 ring-slate-200';
  }

  statusLabel(game: BoardGame): string {
    if (game.owns && game.wishlist) {
      return 'Owned / wanted';
    }

    if (game.wishlist) {
      return 'Wanted';
    }

    return game.owns ? 'Owned' : 'Review';
  }

  pageSummary(): string {
    if (this.filteredGames().length === 0) {
      return 'No rows';
    }

    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, this.filteredGames().length);
    return `${start}-${end} of ${this.filteredGames().length}`;
  }

  private compareGames(a: BoardGame, b: BoardGame): number {
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    const aVal = a[col] ?? '';
    const bVal = b[col] ?? '';

    if (typeof aVal === 'string' || typeof bVal === 'string') {
      return String(aVal).localeCompare(String(bVal)) * dir;
    }

    return aVal < bVal ? -1 * dir : aVal > bVal ? 1 * dir : 0;
  }

}
