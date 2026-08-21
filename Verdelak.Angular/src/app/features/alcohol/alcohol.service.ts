import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { AlcoholItem, AlcoholReport, PagedResult, UpsertAlcoholItem } from './models/alcohol.models';

export interface AlcoholListFilters {
  q?: string;
  category?: string;
  location?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class AlcoholService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/alcohol`;

  list(filters: AlcoholListFilters) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PagedResult<AlcoholItem>>(this.base, { params });
  }

  get(id: number) {
    return this.http.get<AlcoholItem>(`${this.base}/${id}`);
  }

  categories() {
    return this.http.get<string[]>(`${this.base}/categories`);
  }

  locations() {
    return this.http.get<string[]>(`${this.base}/locations`);
  }

  report() {
    return this.http.get<AlcoholReport>(`${this.base}/report`);
  }

  create(dto: UpsertAlcoholItem) {
    return this.http.post<AlcoholItem>(this.base, dto);
  }

  update(id: number, dto: UpsertAlcoholItem) {
    return this.http.put<AlcoholItem>(`${this.base}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

