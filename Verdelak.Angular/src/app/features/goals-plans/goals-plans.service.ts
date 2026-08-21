import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import {
  AnnualPlanArchiveComparison,
  AnnualPlanCreateRequest,
  AnnualPlanSummary,
  AnnualPlanRolloverRequest,
  AnnualPlanRolloverPreview,
  AnnualPlanRolloverResult,
  AnnualPlanStatusUpdateRequest,
  GoalSchedulePreviewItem,
  PlanItem,
  PlanItemBulkCreateRequest,
  PlanItemDependencies,
  PlanItemDependency,
  PlanItemDependencyCreateRequest,
  PlanItemDependencyUpdateRequest,
  PlanItemDeleteResult,
  PlanItemMoveRequest,
  PlanItemMoveResult,
  PlanItemUpdateRequest,
  ProjectXmlImportResult,
  ProjectXmlRoundTripValidation
} from './models/goals-plans.models';

@Injectable({ providedIn: 'root' })
export class GoalsPlansService {
  private readonly baseUrl = `${environment.apiUrl}/admin/goals-plans`;

  constructor(private readonly http: HttpClient) {}

  getPlans(): Observable<AnnualPlanSummary[]> {
    return this.http.get<AnnualPlanSummary[]>(`${this.baseUrl}/plans`);
  }

  getPlanItems(planId: number): Observable<PlanItem[]> {
    return this.http.get<PlanItem[]>(`${this.baseUrl}/plans/${planId}/items`);
  }

  getSchedulePreview(planId: number, from: string, to: string): Observable<GoalSchedulePreviewItem[]> {
    return this.http.get<GoalSchedulePreviewItem[]>(`${this.baseUrl}/plans/${planId}/schedule-preview?from=${from}&to=${to}`);
  }

  createPlan(request: AnnualPlanCreateRequest): Observable<AnnualPlanSummary> {
    return this.http.post<AnnualPlanSummary>(`${this.baseUrl}/plans`, request);
  }

  compareArchivedPlans(leftPlanId: number, rightPlanId: number): Observable<AnnualPlanArchiveComparison> {
    return this.http.get<AnnualPlanArchiveComparison>(`${this.baseUrl}/plans/archive-comparison?leftPlanId=${leftPlanId}&rightPlanId=${rightPlanId}`);
  }

  exportProjectXml(planId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/plans/${planId}/export/project-xml`, { responseType: 'blob' });
  }

  validateProjectXmlRoundTrip(planId: number): Observable<ProjectXmlRoundTripValidation> {
    return this.http.get<ProjectXmlRoundTripValidation>(`${this.baseUrl}/plans/${planId}/export/project-xml/validate`);
  }

  updatePlanStatus(planId: number, request: AnnualPlanStatusUpdateRequest): Observable<AnnualPlanSummary> {
    return this.http.put<AnnualPlanSummary>(`${this.baseUrl}/plans/${planId}/status`, request);
  }

  rolloverPlan(request: AnnualPlanRolloverRequest): Observable<AnnualPlanRolloverResult> {
    return this.http.post<AnnualPlanRolloverResult>(`${this.baseUrl}/plans/rollover`, request);
  }

  previewRollover(request: AnnualPlanRolloverRequest): Observable<AnnualPlanRolloverPreview> {
    return this.http.post<AnnualPlanRolloverPreview>(`${this.baseUrl}/plans/rollover/preview`, request);
  }

  updatePlanItem(id: number, request: PlanItemUpdateRequest): Observable<PlanItem> {
    return this.http.put<PlanItem>(`${this.baseUrl}/items/${id}`, request);
  }

  bulkCreatePlanItems(planId: number, request: PlanItemBulkCreateRequest): Observable<PlanItem[]> {
    return this.http.post<PlanItem[]>(`${this.baseUrl}/plans/${planId}/items/bulk`, request);
  }

  deletePlanItem(id: number): Observable<PlanItemDeleteResult> {
    return this.http.delete<PlanItemDeleteResult>(`${this.baseUrl}/items/${id}`);
  }

  movePlanItem(id: number, request: PlanItemMoveRequest): Observable<PlanItemMoveResult> {
    return this.http.put<PlanItemMoveResult>(`${this.baseUrl}/items/${id}/move`, request);
  }

  getPlanItemDependencies(id: number): Observable<PlanItemDependencies> {
    return this.http.get<PlanItemDependencies>(`${this.baseUrl}/items/${id}/dependencies`);
  }

  addPlanItemDependency(id: number, request: PlanItemDependencyCreateRequest): Observable<PlanItemDependency> {
    return this.http.post<PlanItemDependency>(`${this.baseUrl}/items/${id}/dependencies`, request);
  }

  updatePlanItemDependency(itemId: number, dependencyId: number, request: PlanItemDependencyUpdateRequest): Observable<PlanItemDependency> {
    return this.http.put<PlanItemDependency>(`${this.baseUrl}/items/${itemId}/dependencies/${dependencyId}`, request);
  }

  deletePlanItemDependency(itemId: number, dependencyId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/items/${itemId}/dependencies/${dependencyId}`);
  }

  importProjectXml(file: File, year: number | null, replaceExisting: boolean): Observable<ProjectXmlImportResult> {
    const form = new FormData();
    form.append('file', file);

    if (year) {
      form.append('year', `${year}`);
    }

    form.append('replaceExisting', `${replaceExisting}`);
    return this.http.post<ProjectXmlImportResult>(`${this.baseUrl}/plans/import/project-xml`, form);
  }
}
