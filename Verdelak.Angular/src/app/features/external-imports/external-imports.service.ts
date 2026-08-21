import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import {
  BoardGameGeekImportStageRequest,
  BoardGameGeekImportStageResult,
  ExternalImportBatch,
  ExternalImportCommitRequest,
  ExternalImportCommitResult,
  ExternalImportPreviewResult,
  ExternalImportStageBatchRequest,
  ExternalImportStagingItem,
  ExternalImportUpdateItemRequest,
  SteamImportStageRequest,
  SteamImportStageResult
} from './models/external-import.models';

@Injectable({ providedIn: 'root' })
export class ExternalImportsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/external-imports`;

  getBatches(filters: { source?: string; targetArea?: string; status?: string } = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<ExternalImportBatch[]>(`${this.url}/batches`, { params });
  }

  getItems(filters: { batchId?: number | null; source?: string; targetArea?: string; status?: string; matchStatus?: string } = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<ExternalImportStagingItem[]>(`${this.url}/items`, { params });
  }

  stageBatch(request: ExternalImportStageBatchRequest) {
    return this.http.post<ExternalImportBatch>(`${this.url}/batches`, request);
  }

  updateItem(id: number, request: ExternalImportUpdateItemRequest) {
    return this.http.put<ExternalImportStagingItem>(`${this.url}/items/${id}`, request);
  }

  previewBatch(batchId: number) {
    return this.http.post<ExternalImportPreviewResult>(`${this.url}/batches/${batchId}/preview`, {});
  }

  commit(request: ExternalImportCommitRequest) {
    return this.http.post<ExternalImportCommitResult>(`${this.url}/commit`, request);
  }

  stageSteamLibrary(request: SteamImportStageRequest) {
    return this.http.post<SteamImportStageResult>(`${this.url}/steam/stage`, request);
  }

  stageBoardGameGeekCollection(request: BoardGameGeekImportStageRequest) {
    return this.http.post<BoardGameGeekImportStageResult>(`${this.url}/boardgamegeek/stage`, request);
  }
}
