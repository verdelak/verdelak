import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { BulkAddShowSeasons, CreateShowGoalItems, CreateShowGoalItemsResult, PagedResult, ShowReportSummary, ShowSeasonReport, ShowSeriesDetail, ShowSeriesSummary, UpsertShowBoxSet, UpsertShowSeason, UpsertShowSeries } from './models/show.models';

@Injectable({ providedIn: 'root' })
export class ShowsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/shows`;

  list(opts: {
    q?: string;
    status?: string;
    watch?: string;
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

    return this.http.get<PagedResult<ShowSeriesSummary>>(this.baseUrl, { params });
  }

  get(id: number) {
    return this.http.get<ShowSeriesDetail>(`${this.baseUrl}/${id}`);
  }

  createSeries(payload: UpsertShowSeries) {
    return this.http.post<ShowSeriesDetail>(this.baseUrl, payload);
  }

  updateSeries(id: number, payload: UpsertShowSeries) {
    return this.http.put<ShowSeriesDetail>(`${this.baseUrl}/${id}`, payload);
  }

  deleteSeries(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  createSeason(seriesId: number, payload: UpsertShowSeason) {
    return this.http.post<ShowSeriesDetail>(`${this.baseUrl}/${seriesId}/seasons`, payload);
  }

  bulkCreateSeasons(seriesId: number, payload: BulkAddShowSeasons) {
    return this.http.post<ShowSeriesDetail>(`${this.baseUrl}/${seriesId}/seasons/bulk`, payload);
  }

  updateSeason(seasonId: number, payload: UpsertShowSeason) {
    return this.http.put<ShowSeriesDetail>(`${this.baseUrl}/seasons/${seasonId}`, payload);
  }

  deleteSeason(seasonId: number) {
    return this.http.delete<ShowSeriesDetail>(`${this.baseUrl}/seasons/${seasonId}`);
  }

  createBoxSet(seriesId: number, payload: UpsertShowBoxSet) {
    return this.http.post<ShowSeriesDetail>(`${this.baseUrl}/${seriesId}/boxsets`, payload);
  }

  updateBoxSet(boxSetId: number, payload: UpsertShowBoxSet) {
    return this.http.put<ShowSeriesDetail>(`${this.baseUrl}/boxsets/${boxSetId}`, payload);
  }

  deleteBoxSet(boxSetId: number) {
    return this.http.delete<ShowSeriesDetail>(`${this.baseUrl}/boxsets/${boxSetId}`);
  }

  createGoalItems(seriesId: number, payload: CreateShowGoalItems) {
    return this.http.post<CreateShowGoalItemsResult>(`${this.baseUrl}/${seriesId}/goals`, payload);
  }

  createGoalItemsBatch(payload: CreateShowGoalItems) {
    return this.http.post<CreateShowGoalItemsResult>(`${this.baseUrl}/goals/batch`, payload);
  }

  getReportSummary() {
    return this.http.get<ShowReportSummary>(`${this.baseUrl}/reports/summary`);
  }

  getSeasonReport(report: string, q?: string) {
    let params = new HttpParams().set('report', report);
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<ShowSeasonReport[]>(`${this.baseUrl}/reports/seasons`, { params });
  }
}
