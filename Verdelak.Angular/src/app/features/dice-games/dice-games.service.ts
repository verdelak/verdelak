import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { DiceGameItem, DiceGameLookups, DiceInventoryReport, DragonDiceItem, DragonDiceLookups, PagedResult, UpsertDiceGameItem, UpsertDragonDiceItem } from './models/dice-games.models';

@Injectable({ providedIn: 'root' })
export class DiceGamesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dice-games`;

  listDiceGameItems(opts: Record<string, string | number | null | undefined>) {
    return this.http.get<PagedResult<DiceGameItem>>(`${this.base}/items`, { params: this.params(opts) });
  }

  diceGameReport() {
    return this.http.get<DiceInventoryReport>(`${this.base}/items/report`);
  }

  diceGameLookups() {
    return this.http.get<DiceGameLookups>(`${this.base}/items/lookups`);
  }

  createDiceGameItem(payload: UpsertDiceGameItem) {
    return this.http.post<DiceGameItem>(`${this.base}/items`, payload);
  }

  updateDiceGameItem(id: number, payload: UpsertDiceGameItem) {
    return this.http.put<DiceGameItem>(`${this.base}/items/${id}`, payload);
  }

  deleteDiceGameItem(id: number) {
    return this.http.delete<void>(`${this.base}/items/${id}`);
  }

  listDragonDiceItems(opts: Record<string, string | number | null | undefined>) {
    return this.http.get<PagedResult<DragonDiceItem>>(`${this.base}/dragon-dice`, { params: this.params(opts) });
  }

  dragonDiceReport() {
    return this.http.get<DiceInventoryReport>(`${this.base}/dragon-dice/report`);
  }

  dragonDiceLookups() {
    return this.http.get<DragonDiceLookups>(`${this.base}/dragon-dice/lookups`);
  }

  createDragonDiceItem(payload: UpsertDragonDiceItem) {
    return this.http.post<DragonDiceItem>(`${this.base}/dragon-dice`, payload);
  }

  updateDragonDiceItem(id: number, payload: UpsertDragonDiceItem) {
    return this.http.put<DragonDiceItem>(`${this.base}/dragon-dice/${id}`, payload);
  }

  deleteDragonDiceItem(id: number) {
    return this.http.delete<void>(`${this.base}/dragon-dice/${id}`);
  }

  private params(opts: Record<string, string | number | null | undefined>): HttpParams {
    let params = new HttpParams();
    Object.entries(opts).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
