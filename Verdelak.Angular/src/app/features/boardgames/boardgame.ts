import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardGame, GamePlay } from './models/boardgamemodels';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class BoardgameService { 
 

  constructor(private http: HttpClient) {}

  getGames(): Observable<BoardGame[]> {
    return this.http.get<BoardGame[]>(`${environment.apiUrl}/BoardGames`);
  }

  getGame(id: number): Observable<BoardGame> {
    return this.http.get<BoardGame>(`${environment.apiUrl}/BoardGames/${id}`);
  }

  addGame(game: BoardGame): Observable<BoardGame> {
    return this.http.post<BoardGame>(`${environment.apiUrl}/BoardGames`, game);
  }

  updateGame(game: BoardGame): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/BoardGames/${game.gameID}`, game);
  }

  getExpansions(baseGameId: number): Observable<BoardGame[]> {
    return this.http.get<BoardGame[]>(`${environment.apiUrl}/BoardGames/${baseGameId}/expansions`);
  }

  getAllGames(): Observable<BoardGame[]> {
    return this.http.get<BoardGame[]>(`${environment.apiUrl}/BoardGames`);
  }

  
  logPlay(gameID: number, playDate: string, playCount: number, notes?: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/BoardGames/${gameID}/plays`, {
      playDate,
      playCount,
      notes
    });
  }

  getPlayHistory(gameID: number): Observable<GamePlay[]> {
    return this.http.get<GamePlay[]>(`${environment.apiUrl}/BoardGames/${gameID}/plays`);
  }
}

