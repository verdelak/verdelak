import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { MiniLookup, MiniatureItem, PagedResult, UpsertMiniatureItem } from './models/miniature.models';

export interface MiniatureListFilters {
  q?: string;
  companyId?: number | null;
  systemId?: number | null;
  seriesId?: number | null;
  number?: string;
  subset?: string;
  rarity?: string;
  size?: string;
  type?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class MiniaturesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/miniatures`;

  list(filters: MiniatureListFilters) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PagedResult<MiniatureItem>>(this.baseUrl, { params });
  }

  get(id: number) {
    return this.http.get<MiniatureItem>(`${this.baseUrl}/${id}`);
  }

  getCompanies() {
    return this.http.get<MiniLookup[]>(`${this.baseUrl}/companies`);
  }

  getSystems(companyId?: number | null) {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', companyId);
    }

    return this.http.get<MiniLookup[]>(`${this.baseUrl}/systems`, { params });
  }

  getSeries(systemId?: number | null) {
    let params = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId);
    }

    return this.http.get<MiniLookup[]>(`${this.baseUrl}/series`, { params });
  }

  getSubsets() {
    return this.http.get<string[]>(`${this.baseUrl}/subsets`);
  }

  getRarities() {
    return this.http.get<string[]>(`${this.baseUrl}/rarities`);
  }

  getSizes() {
    return this.http.get<string[]>(`${this.baseUrl}/sizes`);
  }

  getTypes() {
    return this.http.get<string[]>(`${this.baseUrl}/types`);
  }

  create(payload: UpsertMiniatureItem) {
    return this.http.post<MiniatureItem>(this.baseUrl, payload);
  }

  update(id: number, payload: UpsertMiniatureItem) {
    return this.http.put<MiniatureItem>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
