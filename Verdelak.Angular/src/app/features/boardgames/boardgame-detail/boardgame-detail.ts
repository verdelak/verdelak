import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoardgameService } from '../boardgame';
import { BoardGame, GamePlay } from '../models/boardgamemodels';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-boardgame-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './boardgame-detail.html',
  styleUrl: './boardgame-detail.scss'
})
export class BoardgameDetailComponent  implements OnInit {
  readonly game = signal<BoardGame | null>(null);
  readonly error = signal<string | null>(null);
  readonly expansions = signal<BoardGame[]>([]);
  readonly baseGame = signal<BoardGame | null>(null);

  readonly isEditing = signal(false);
  readonly editModel = signal<BoardGame | null>(null);

  readonly playDate = signal(this.todayDate());
  readonly playCount = signal(1);
  readonly playNote = signal('');
  readonly playHistory = signal<GamePlay[]>([]);

  readonly allGames = signal<BoardGame[]>([]);
  readonly baseGameOptions = computed(() =>
    this.allGames().filter(g => !g.isExpansion && g.gameID !== this.editModel()?.gameID)
  );
  
  constructor(
    private service: BoardgameService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.error.set('Invalid game ID');
      return;
    }

    this.service.getGame(id).subscribe({
      next: game => {
        this.game.set(game);
        if (!game.isExpansion) {
          this.service.getExpansions(game.gameID).subscribe({
            next: exps => this.expansions.set(exps)
          });
          this.loadPlayHistory();
        }

        if (game.isExpansion && game.baseGameID) {
          this.service.getGame(game.baseGameID).subscribe({
            next: base => this.baseGame.set(base)
          });
        }
      },
      error: () => this.error.set('Game not found')
    });
  }

  goBack() {
    this.router.navigate(['/boardgames']);
  }


  startEdit(): void {
    const current = this.game();
    if (current) {
      this.editModel.set({ ...current }); // clone it
      this.isEditing.set(true);

      this.service.getAllGames().subscribe({
        next: games => this.allGames.set(games)
      });
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editModel.set(null);
  }

  saveChanges(): void {
    const updated = this.editModel();
    if (!updated) return;

    this.service.updateGame(updated).subscribe({
      next: () => {
        this.game.set(updated);
        this.isEditing.set(false);
        this.editModel.set(null);
      },
      error: () => this.error.set('Failed to save changes.')
    });
  }



  private todayDate(): string {
    return new Date().toISOString().substring(0, 10);
  }

  logPlay(): void {
    const id = this.game()?.gameID;
    if (!id) return;

    this.service.logPlay(id, this.playDate(), this.playCount(), this.playNote()).subscribe({
      next: () => {
        this.loadPlayHistory(); // refresh
        this.playNote.set('');
        this.playCount.set(1);
        this.playDate.set(this.todayDate());
      },
      error: err => console.error('Failed to log play', err)
    });
  }

  loadPlayHistory(): void {
    const id = this.game()?.gameID;
    if (!id) return;

    this.service.getPlayHistory(id).subscribe({
      next: plays => this.playHistory.set(plays),
      error: err => console.error('Failed to load play history', err)
    });
  }

}
