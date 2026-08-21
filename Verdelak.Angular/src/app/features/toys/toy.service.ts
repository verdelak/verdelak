import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { PagedResult, ToyFigure, ToyLookup, UpsertToyFigure } from './models/toy.models';

@Injectable({ providedIn: 'root' })
export class ToyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/toys`;

  list(opts: {
    q?: string;
    companyId?: number;
    lineId?: number;
    seriesId?: number;
    inBox?: boolean;
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

    return this.http.get<PagedResult<ToyFigure>>(this.baseUrl, { params });
  }

  getCompanies() {
    return this.http.get<ToyLookup[]>(`${this.baseUrl}/companies`);
  }

  getLines(companyId?: number | null) {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', String(companyId));
    }
    return this.http.get<ToyLookup[]>(`${this.baseUrl}/lines`, { params });
  }

  getSeries(lineId?: number | null) {
    let params = new HttpParams();
    if (lineId) {
      params = params.set('lineId', String(lineId));
    }
    return this.http.get<ToyLookup[]>(`${this.baseUrl}/series`, { params });
  }

  create(payload: UpsertToyFigure) {
    return this.http.post<ToyFigure>(this.baseUrl, payload);
  }

  update(id: number, payload: UpsertToyFigure) {
    return this.http.put<ToyFigure>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
