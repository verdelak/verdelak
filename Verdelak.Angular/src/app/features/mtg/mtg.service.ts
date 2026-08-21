import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { MtgCollectionItem, MtgCollectionReport, MtgLookup, PagedResult, UpsertMtgCollectionItem } from './models/mtg.models';

@Injectable({ providedIn: 'root' })
export class MtgService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/mtg`;

  list(opts: {
    q?: string;
    setCode?: string;
    color?: string;
    rarity?: string;
    type?: string;
    location?: string;
    condition?: string;
    language?: string;
    finish?: string;
    cleanup?: string;
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

    return this.http.get<PagedResult<MtgCollectionItem>>(this.baseUrl, { params });
  }

  getReport(opts: {
    q?: string;
    setCode?: string;
    color?: string;
    rarity?: string;
    type?: string;
    location?: string;
    condition?: string;
    language?: string;
    finish?: string;
    cleanup?: string;
    status?: string;
  }) {
    let params = new HttpParams();
    Object.entries(opts).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<MtgCollectionReport>(`${this.baseUrl}/report`, { params });
  }

  getSets() {
    return this.http.get<MtgLookup[]>(`${this.baseUrl}/sets`);
  }

  getRarities() {
    return this.http.get<MtgLookup[]>(`${this.baseUrl}/rarities`);
  }

  getLocations() {
    return this.http.get<MtgLookup[]>(`${this.baseUrl}/locations`);
  }

  getConditions() {
    return this.http.get<MtgLookup[]>(`${this.baseUrl}/conditions`);
  }

  getLanguages() {
    return this.http.get<MtgLookup[]>(`${this.baseUrl}/languages`);
  }

  getFinishes() {
    return this.http.get<MtgLookup[]>(`${this.baseUrl}/finishes`);
  }

  create(payload: UpsertMtgCollectionItem) {
    return this.http.post<MtgCollectionItem>(this.baseUrl, payload);
  }

  update(id: number, payload: UpsertMtgCollectionItem) {
    return this.http.put<MtgCollectionItem>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
