import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SpookytownItem, UpsertSpookytown, SpookytownType, PagedResult } from './models/spookytown.models';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class SpookytownService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Spookytown`;

  list(opts: {
    q?: string; typeId?: string; owned?: boolean; wanted?: boolean; retired?: boolean;
    year?: number; sort?: string; page?: number; pageSize?: number;
  }) {
    let p = new HttpParams();
    Object.entries(opts).forEach(([k,v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<PagedResult<SpookytownItem>>(this.base, { params: p });
  }

  getTypes() { return this.http.get<SpookytownType[]>(`${this.base}/types`); }
  get(id: number) { return this.http.get<SpookytownItem>(`${this.base}/${id}`); }
  create(dto: UpsertSpookytown) { return this.http.post<SpookytownItem>(this.base, dto); }
  update(id: number, dto: UpsertSpookytown) { return this.http.put<SpookytownItem>(`${this.base}/${id}`, dto); }
  delete(id: number) { return this.http.delete(`${this.base}/${id}`); }
  setOwn(id: number, value: boolean) { return this.http.patch(`${this.base}/${id}/toggle-own?value=${value}`, {}); }
  setWant(id: number, value: boolean) { return this.http.patch(`${this.base}/${id}/toggle-want?value=${value}`, {}); }
}
