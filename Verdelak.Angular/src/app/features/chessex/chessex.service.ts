import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { ChessexLookup, ChessexSet, PagedResult, UpsertChessexSet } from './models/chessex.models';

@Injectable({ providedIn: 'root' })
export class ChessexService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/chessex`;

  list(opts: {
    q?: string;
    categoryId?: number;
    setTypeId?: number;
    status?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) {
    let params = new HttpParams();
    Object.entries(opts).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PagedResult<ChessexSet>>(this.baseUrl, { params });
  }

  getCategories() {
    return this.http.get<ChessexLookup[]>(`${this.baseUrl}/categories`);
  }

  getSetTypes() {
    return this.http.get<ChessexLookup[]>(`${this.baseUrl}/set-types`);
  }

  create(payload: UpsertChessexSet) {
    return this.http.post<ChessexSet>(this.baseUrl, payload);
  }

  update(id: number, payload: UpsertChessexSet) {
    return this.http.put<ChessexSet>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
