import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { ComicIssue, ComicSeries, ComicSeriesReport, ComicWantListItem, PagedResult, UpsertComicIssue, UpsertComicSeries } from './models/comic.models';

@Injectable({ providedIn: 'root' })
export class ComicService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/comics`;

  list(opts: {
    q?: string;
    seriesId?: number;
    issueNumber?: number;
    month?: number;
    year?: string;
    special?: boolean;
    graphicNovel?: boolean;
    variant?: boolean;
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

    return this.http.get<PagedResult<ComicIssue>>(this.baseUrl, { params });
  }

  getSeries() {
    return this.http.get<ComicSeries[]>(`${this.baseUrl}/series`);
  }

  getSeriesReport() {
    return this.http.get<ComicSeriesReport[]>(`${this.baseUrl}/series-report`);
  }

  getWantList() {
    return this.http.get<ComicWantListItem[]>(`${this.baseUrl}/want-list`);
  }

  createSeries(payload: UpsertComicSeries) {
    return this.http.post<ComicSeries>(`${this.baseUrl}/series`, payload);
  }

  createIssue(payload: UpsertComicIssue) {
    return this.http.post<ComicIssue>(this.baseUrl, payload);
  }

  updateIssue(id: number, payload: UpsertComicIssue) {
    return this.http.put<ComicIssue>(`${this.baseUrl}/${id}`, payload);
  }

  deleteIssue(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

