import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import {
  PagedResult,
  SoftwareBulkImportCommitResult,
  SoftwareBulkImportPreview,
  SoftwareBulkImportRequest,
  SoftwareItem,
  SoftwareLookup,
  SoftwareReportSummary,
  UpsertSoftwareItem
} from './models/software.models';

@Injectable({ providedIn: 'root' })
export class SoftwareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/software`;

  list(opts: {
    q?: string;
    platformId?: number;
    locationId?: number;
    mediaType?: string;
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

    return this.http.get<PagedResult<SoftwareItem>>(this.baseUrl, { params });
  }

  get(id: number) {
    return this.http.get<SoftwareItem>(`${this.baseUrl}/${id}`);
  }

  getPlatforms() {
    return this.http.get<SoftwareLookup[]>(`${this.baseUrl}/platforms`);
  }

  getLocations() {
    return this.http.get<SoftwareLookup[]>(`${this.baseUrl}/locations`);
  }

  getMediaTypes() {
    return this.http.get<string[]>(`${this.baseUrl}/media-types`);
  }

  getReportSummary() {
    return this.http.get<SoftwareReportSummary>(`${this.baseUrl}/reports/summary`);
  }


  getWantListReport(opts: {
    q?: string;
    platformId?: number;
    locationId?: number;
    mediaType?: string;
    sort?: string;
  }) {
    let params = new HttpParams();
    Object.entries(opts).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<SoftwareItem[]>(`${this.baseUrl}/reports/want-list`, { params });
  }
  create(payload: UpsertSoftwareItem) {
    return this.http.post<SoftwareItem>(this.baseUrl, payload);
  }

  previewBulkImport(payload: SoftwareBulkImportRequest) {
    return this.http.post<SoftwareBulkImportPreview>(`${this.baseUrl}/import/preview`, payload);
  }

  commitBulkImport(payload: SoftwareBulkImportRequest) {
    return this.http.post<SoftwareBulkImportCommitResult>(`${this.baseUrl}/import/commit`, payload);
  }

  update(id: number, payload: UpsertSoftwareItem) {
    return this.http.put<SoftwareItem>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
