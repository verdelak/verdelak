import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import {
  BarcodeLookupCandidate,
  BarcodeBatchReport,
  BarcodeImportCommitRequest,
  BarcodeImportCommitResult,
  BarcodeImportHistoryFilters,
  BarcodeImportHistoryRow,
  BarcodeImportValidationPreview,
  BarcodeImportValidationRequest,
  BarcodeStagingBatchLookupRequest,
  BarcodeStagingBatchResult,
  BarcodeStagingBatchUpdateRequest,
  BarcodeStagingCleanupRequest,
  BarcodeStagingCleanupResult,
  BarcodeStagingCreateRequest,
  BarcodeStagingDuplicateGroup,
  BarcodeStagingItem,
  BarcodeStagingUpdateRequest
} from './models/barcode-staging.models';

@Injectable({ providedIn: 'root' })
export class BarcodeStagingService {
  private readonly baseUrl = `${environment.apiUrl}/barcode-staging`;

  constructor(private readonly http: HttpClient) {}

  getItems(status?: string, itemType?: string, source?: string, batchName?: string): Observable<BarcodeStagingItem[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    if (itemType) {
      params = params.set('itemType', itemType);
    }

    if (source) {
      params = params.set('source', source);
    }

    if (batchName) {
      params = params.set('batchName', batchName);
    }

    return this.http.get<BarcodeStagingItem[]>(this.baseUrl, { params });
  }

  getDuplicates(): Observable<BarcodeStagingDuplicateGroup[]> {
    return this.http.get<BarcodeStagingDuplicateGroup[]>(`${this.baseUrl}/duplicates`);
  }

  getBatchReports(): Observable<BarcodeBatchReport[]> {
    return this.http.get<BarcodeBatchReport[]>(`${this.baseUrl}/batch-reports`);
  }

  getImportHistory(filters: BarcodeImportHistoryFilters = {}): Observable<BarcodeImportHistoryRow[]> {
    let params = new HttpParams();

    if (filters.batchName) {
      params = params.set('batchName', filters.batchName);
    }

    if (filters.source) {
      params = params.set('source', filters.source);
    }

    if (filters.itemType) {
      params = params.set('itemType', filters.itemType);
    }

    if (filters.importedEntityType) {
      params = params.set('importedEntityType', filters.importedEntityType);
    }

    if (filters.fromUtc) {
      params = params.set('fromUtc', filters.fromUtc);
    }

    if (filters.toUtc) {
      params = params.set('toUtc', filters.toUtc);
    }

    if (filters.take) {
      params = params.set('take', String(filters.take));
    }

    return this.http.get<BarcodeImportHistoryRow[]>(`${this.baseUrl}/import-history`, { params });
  }
  previewCleanup(request: BarcodeStagingCleanupRequest): Observable<BarcodeStagingCleanupResult> {
    return this.http.post<BarcodeStagingCleanupResult>(`${this.baseUrl}/cleanup-preview`, request);
  }

  cleanup(request: BarcodeStagingCleanupRequest): Observable<BarcodeStagingCleanupResult> {
    return this.http.post<BarcodeStagingCleanupResult>(`${this.baseUrl}/cleanup`, request);
  }

  previewImport(request: BarcodeImportValidationRequest): Observable<BarcodeImportValidationPreview> {
    return this.http.post<BarcodeImportValidationPreview>(`${this.baseUrl}/import-preview`, request);
  }

  commitImport(request: BarcodeImportCommitRequest): Observable<BarcodeImportCommitResult> {
    return this.http.post<BarcodeImportCommitResult>(`${this.baseUrl}/import`, request);
  }

  stageItems(request: BarcodeStagingCreateRequest): Observable<BarcodeStagingItem[]> {
    return this.http.post<BarcodeStagingItem[]>(this.baseUrl, request);
  }

  updateItem(id: number, request: BarcodeStagingUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }

  batchUpdate(request: BarcodeStagingBatchUpdateRequest): Observable<BarcodeStagingBatchResult> {
    return this.http.post<BarcodeStagingBatchResult>(`${this.baseUrl}/batch/update`, request);
  }

  batchLookup(request: BarcodeStagingBatchLookupRequest): Observable<BarcodeStagingBatchResult> {
    return this.http.post<BarcodeStagingBatchResult>(`${this.baseUrl}/batch/lookup`, request);
  }

  getCandidates(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.get<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/candidates`);
  }

  lookupAuto(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/auto`, {});
  }

  lookupOpenLibrary(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/open-library`, {});
  }

  lookupGoogleBooks(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/google-books`, {});
  }

  lookupCrossref(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/crossref`, {});
  }

  lookupMusicBrainz(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/musicbrainz`, {});
  }

  lookupUpcItemDb(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/upcitemdb`, {});
  }

  lookupOpenFoodFacts(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/open-food-facts`, {});
  }
  lookupDiscogs(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/discogs`, {});
  }

  lookupWikidata(itemId: number): Observable<BarcodeLookupCandidate[]> {
    return this.http.post<BarcodeLookupCandidate[]>(`${this.baseUrl}/${itemId}/lookup/wikidata`, {});
  }

  selectCandidate(itemId: number, candidateId: number): Observable<BarcodeStagingItem> {
    return this.http.post<BarcodeStagingItem>(`${this.baseUrl}/${itemId}/candidates/${candidateId}/select`, {});
  }
}






