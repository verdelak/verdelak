import { Component, OnInit, signal } from '@angular/core';
import { BoardgameService } from '../boardgame';
import { BoardGame } from '../models/boardgamemodels';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-boardgame-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './boardgame-form.html',
  styleUrl: './boardgame-form.scss'
})
export class BoardgameFormComponent  implements OnInit {
  readonly allGames = signal<BoardGame[]>([]);
  readonly model = signal<BoardGame>({
    gameID: 0,
    title: '',
    isExpansion: false,
    baseGameID: null,
    bgg_Rating: null,
    personalRating: null,
    owns: false,
    wishlist: false,
    notes: ''
  });

  constructor(private service: BoardgameService, private router: Router) {}

  ngOnInit(): void {
    this.service.getAllGames().subscribe({
      next: games => this.allGames.set(games)
    });
  }

  get baseGameOptions() {
    return this.allGames().filter(g => !g.isExpansion);
  }

  save(): void {
    const game = this.model();
    if (!game.isExpansion) {
      game.baseGameID = null;
    }

    this.service.addGame(game).subscribe({
      next: () => this.router.navigate(['/boardgames']),
      error: err => console.error('Failed to save', err)
    });
  }
}
