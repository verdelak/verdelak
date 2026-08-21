import { Component, computed, OnInit, signal } from '@angular/core';
import { BoardgameService } from '../boardgame';
import { BoardGame } from '../models/boardgamemodels';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  readonly filterOwned = signal(false);
  readonly filterWishlist = signal(false);
  readonly searchTerm = signal('');

  readonly sortColumn = signal<keyof BoardGame>('title');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');


  readonly pagedGames = computed(() => {
    let filtered = this.games();

    if (this.filterOwned()) {
      filtered = filtered.filter(g => g.owns);
    }

    if (this.filterWishlist()) {
      filtered = filtered.filter(g => g.wishlist);
    }

    const term = this.searchTerm().toLowerCase().trim();
    if (term.length > 0) {
      filtered = filtered.filter(g => g.title.toLowerCase().includes(term));
    }

    const sorted = [...filtered].sort((a, b) => {
      const col = this.sortColumn();
      const dir = this.sortDirection() === 'asc' ? 1 : -1;

      const aVal = a[col] ?? '';
      const bVal = b[col] ?? '';

      return aVal < bVal ? -1 * dir : aVal > bVal ? 1 * dir : 0;
    });

    const start = (this.currentPage() - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  });

  constructor(private service: BoardgameService) {}

  ngOnInit(): void {
    this.service.getGames().subscribe({
      next: (data) => this.games.set(data),
      error: () => this.error.set('Failed to load games.')
    });
  }


  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
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

  get totalPages(): number {
    return Math.ceil(
      this.games().filter(g =>
        (!this.filterOwned() || g.owns) &&
        (!this.filterWishlist() || g.wishlist) &&
        (this.searchTerm().trim() === '' || g.title.toLowerCase().includes(this.searchTerm().toLowerCase()))
      ).length / this.pageSize
    );
  }

}
