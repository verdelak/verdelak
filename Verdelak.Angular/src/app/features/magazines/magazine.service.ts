import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { MagazineIssue, MagazineLookup, PagedResult, UpsertMagazineIssue } from './models/magazine.models';

@Injectable({ providedIn: 'root' })
export class MagazineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/magazines`;

  list(opts: {
    q?: string;
    seriesId?: number;
    year?: number;
    month?: number;
    season?: string;
    special?: boolean;
    alternate?: boolean;
    coverId?: string;
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

    return this.http.get<PagedResult<MagazineIssue>>(this.baseUrl, { params });
  }

  getSeries() {
    return this.http.get<MagazineLookup[]>(`${this.baseUrl}/series`);
  }

  create(payload: UpsertMagazineIssue) {
    return this.http.post<MagazineIssue>(this.baseUrl, payload);
  }

  update(id: number, payload: UpsertMagazineIssue) {
    return this.http.put<MagazineIssue>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
