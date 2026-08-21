import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IdName, ProductDetail, ProductListItem, ProductListResponse, RpgStatusFilter } from './models/rpg.models';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class RpgService {
  private http = inject(HttpClient);

  // list state
  products = signal<ProductListItem[]>([]);
  total = signal(0);
  loading = signal(false);
  lastError = signal<string | null>(null);

  async fetchProducts(filters: {
    systemId?: number; seriesId?: number; typeId?: number; q?: string;
    status?: RpgStatusFilter;
    page?: number; pageSize?: number;
  } = {}) {
    this.loading.set(true);
    this.lastError.set(null);
    try {
      let params = new HttpParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
      }
      const res = await this.http.get<ProductListResponse>(`${environment.apiUrl}/rpg/products`, { params }).toPromise();
      this.products.set(res?.items ?? []);
      this.total.set(res?.total ?? 0);
    } catch (e: any) {
      this.lastError.set(e?.message ?? 'Failed to load products');
      this.products.set([]);
      this.total.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  getProduct(id: number) {
    return this.http.get<ProductDetail>(`${environment.apiUrl}/rpg/products/${id}`);
  }

  getSystems() { return this.http.get<IdName[]>(`${environment.apiUrl}/rpg/systems`); }
  getSeries()  { return this.http.get<IdName[]>(`${environment.apiUrl}/rpg/series`); }
  getTypes()   { return this.http.get<IdName[]>(`${environment.apiUrl}/rpg/types`); }

  // Admin endpoints you can implement later:
  createProduct(payload: Partial<ProductDetail>) { return this.http.post(`${environment.apiUrl}/rpg/products`, payload); }
  updateProduct(id: number, payload: Partial<ProductDetail>) { return this.http.put(`${environment.apiUrl}/rpg/products/${id}`, payload); }
  deleteProduct(id: number) { return this.http.delete(`${environment.apiUrl}/rpg/products/${id}`); }
}
