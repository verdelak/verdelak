import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { AlcoholImportDuplicateKey, AlcoholItem, AlcoholLookupCleanup, AlcoholProductDuplicateReport, AlcoholReport, ApplyAlcoholLookupCleanup, ApplyAlcoholLookupCleanupResult, MergeAlcoholLookup, MergeAlcoholLookupResult, MergeAlcoholProductDuplicates, MergeAlcoholProductDuplicatesResult, PagedResult, UpsertAlcoholItem } from './models/alcohol.models';

export interface AlcoholListFilters {
  q?: string;
  category?: string;
  type?: string;
  style?: string;
  country?: string;
  region?: string;
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

  types() {
    return this.http.get<string[]>(`${this.base}/types`);
  }

  styles() {
    return this.http.get<string[]>(`${this.base}/styles`);
  }

  regions() {
    return this.http.get<string[]>(`${this.base}/regions`);
  }

  countries() {
    return this.http.get<string[]>(`${this.base}/countries`);
  }

  report() {
    return this.http.get<AlcoholReport>(`${this.base}/report`);
  }

  lookupCleanup() {
    return this.http.get<AlcoholLookupCleanup>(`${this.base}/lookup-cleanup`);
  }

  productDuplicates() {
    return this.http.get<AlcoholProductDuplicateReport>(`${this.base}/product-duplicates`);
  }

  importDuplicateKeys() {
    return this.http.get<AlcoholImportDuplicateKey[]>(`${this.base}/import-duplicate-keys`);
  }

  applyLookupCleanup(dto: ApplyAlcoholLookupCleanup) {
    return this.http.post<ApplyAlcoholLookupCleanupResult>(`${this.base}/lookup-cleanup/apply`, dto);
  }

  mergeLookup(dto: MergeAlcoholLookup) {
    return this.http.post<MergeAlcoholLookupResult>(`${this.base}/lookups/merge`, dto);
  }

  mergeProductDuplicates(dto: MergeAlcoholProductDuplicates) {
    return this.http.post<MergeAlcoholProductDuplicatesResult>(`${this.base}/product-duplicates/merge`, dto);
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

