import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import {
  DinoTaxonomyNode,
  DinoTaxonomyNodeUpsert,
  DinosaurDetail,
  DinosaurSummary,
  DinosaurUpsert,
  PublicDinoTaxonomyNode,
  PublicDinosaurDetail,
  PublicDinosaurSummary
} from './models/dino.models';

@Injectable({ providedIn: 'root' })
export class DinoAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/dino`;
  private readonly publicBaseUrl = `${environment.apiUrl}/dino`;

  listDinosaurs(search = '', isPublished: boolean | null = null) {
    let params = new HttpParams();
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    if (isPublished !== null) {
      params = params.set('isPublished', String(isPublished));
    }

    return this.http.get<DinosaurSummary[]>(`${this.baseUrl}/dinosaurs`, { params });
  }

  getDinosaur(id: number) {
    return this.http.get<DinosaurDetail>(`${this.baseUrl}/dinosaurs/${id}`);
  }

  createDinosaur(payload: DinosaurUpsert) {
    return this.http.post<DinosaurDetail>(`${this.baseUrl}/dinosaurs`, payload);
  }

  updateDinosaur(id: number, payload: DinosaurUpsert) {
    return this.http.put<DinosaurDetail>(`${this.baseUrl}/dinosaurs/${id}`, payload);
  }

  deleteDinosaur(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/dinosaurs/${id}`);
  }

  listTaxonomy(rank = '') {
    let params = new HttpParams();
    if (rank.trim()) {
      params = params.set('rank', rank.trim());
    }

    return this.http.get<DinoTaxonomyNode[]>(`${this.baseUrl}/taxonomy`, { params });
  }

  createTaxonomy(payload: DinoTaxonomyNodeUpsert) {
    return this.http.post<DinoTaxonomyNode>(`${this.baseUrl}/taxonomy`, payload);
  }

  updateTaxonomy(id: number, payload: DinoTaxonomyNodeUpsert) {
    return this.http.put<DinoTaxonomyNode>(`${this.baseUrl}/taxonomy/${id}`, payload);
  }

  deleteTaxonomy(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/taxonomy/${id}`);
  }

  listPublicDinosaurs(search = '', taxonomy = '', limit = 200) {
    let params = new HttpParams().set('limit', String(limit));
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    if (taxonomy.trim()) {
      params = params.set('taxonomy', taxonomy.trim());
    }

    return this.http.get<PublicDinosaurSummary[]>(this.publicBaseUrl, { params });
  }

  getPublicDinosaur(slugOrId: string | number) {
    return this.http.get<PublicDinosaurDetail>(`${this.publicBaseUrl}/${encodeURIComponent(String(slugOrId))}`);
  }

  listPublicTaxonomy() {
    return this.http.get<PublicDinoTaxonomyNode[]>(`${this.publicBaseUrl}/taxonomy`);
  }
}
