import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { FishReportThresholds } from '../admin-settings/admin-settings.service';
import { GenerateOccurrencesResult, TaskOccurrence, TaskOccurrenceUpdateRequest } from '../tasks/models/scheduled-task.model';
import { FishAquariumProduct, FishAquariumProductRequest, FishAquariumProductUsage, FishAquariumProductUsageRequest, FishLivestockEvent, FishLivestockEventRequest, FishSpeciesFood, FishSpeciesFoodRequest, FishSpeciesProfile, FishSpeciesProfileGap, FishSpeciesProfileRequest, FishStock, FishStockRequest, FishTank, FishTankHistoryItem, FishTankLog, FishTankLogRequest, FishTankRequest, FishTankTask, FishTankTaskRequest, ShoppingListItem } from './models/fish-tank.model';

@Injectable({ providedIn: 'root' })
export class FishService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/fish`;
  private readonly taskBase = `${environment.apiUrl}/tasks`;
  private readonly settingsBase = `${environment.apiUrl}/admin/settings`;

  getTanks() {
    return this.http.get<FishTank[]>(`${this.base}/tanks`);
  }

  getReportThresholds() {
    return this.http.get<FishReportThresholds>(`${this.settingsBase}/fish-report-thresholds`);
  }

  createTank(request: FishTankRequest) {
    return this.http.post<FishTank>(`${this.base}/tanks`, request);
  }

  updateTank(id: number, request: FishTankRequest) {
    return this.http.put<FishTank>(`${this.base}/tanks/${id}`, request);
  }

  deleteTank(id: number) {
    return this.http.delete<void>(`${this.base}/tanks/${id}`);
  }

  getTankLogs(tankId?: number | null, take = 50) {
    const params = tankId ? `?tankId=${tankId}&take=${take}` : `?take=${take}`;
    return this.http.get<FishTankLog[]>(`${this.base}/tank-logs${params}`);
  }

  createTankLog(request: FishTankLogRequest) {
    return this.http.post<FishTankLog>(`${this.base}/tank-logs`, request);
  }

  updateTankLog(id: number, request: FishTankLogRequest) {
    return this.http.put<FishTankLog>(`${this.base}/tank-logs/${id}`, request);
  }

  deleteTankLog(id: number) {
    return this.http.delete<void>(`${this.base}/tank-logs/${id}`);
  }

  getTankHistory(tankId?: number | null, take = 200) {
    const params = tankId ? `?tankId=${tankId}&take=${take}` : `?take=${take}`;
    return this.http.get<FishTankHistoryItem[]>(`${this.base}/tank-history${params}`);
  }

  getStock(tankId?: number | null, includeInactive = false) {
    const params = new URLSearchParams();
    if (tankId) {
      params.set('tankId', String(tankId));
    }
    params.set('includeInactive', String(includeInactive));
    return this.http.get<FishStock[]>(`${this.base}/stock?${params.toString()}`);
  }

  createStock(request: FishStockRequest) {
    return this.http.post<FishStock>(`${this.base}/stock`, request);
  }

  updateStock(id: number, request: FishStockRequest) {
    return this.http.put<FishStock>(`${this.base}/stock/${id}`, request);
  }

  deleteStock(id: number) {
    return this.http.delete<void>(`${this.base}/stock/${id}`);
  }

  getSpeciesProfiles(q?: string | null, foodsOnly = false) {
    const params = new URLSearchParams();
    if (q) {
      params.set('q', q);
    }
    if (foodsOnly) {
      params.set('foodsOnly', String(foodsOnly));
    }
    const query = params.toString();
    return this.http.get<FishSpeciesProfile[]>(`${this.base}/species-profiles${query ? '?' + query : ''}`);
  }

  createSpeciesProfile(request: FishSpeciesProfileRequest) {
    return this.http.post<FishSpeciesProfile>(`${this.base}/species-profiles`, request);
  }

  updateSpeciesProfile(id: number, request: FishSpeciesProfileRequest) {
    return this.http.put<FishSpeciesProfile>(`${this.base}/species-profiles/${id}`, request);
  }

  deleteSpeciesProfile(id: number) {
    return this.http.delete<void>(`${this.base}/species-profiles/${id}`);
  }

  createSpeciesFood(profileId: number, request: FishSpeciesFoodRequest) {
    return this.http.post<FishSpeciesFood>(`${this.base}/species-profiles/${profileId}/foods`, request);
  }

  updateSpeciesFood(id: number, request: FishSpeciesFoodRequest) {
    return this.http.put<FishSpeciesFood>(`${this.base}/species-foods/${id}`, request);
  }

  deleteSpeciesFood(id: number) {
    return this.http.delete<void>(`${this.base}/species-foods/${id}`);
  }

  getSpeciesProfileGaps() {
    return this.http.get<FishSpeciesProfileGap[]>(`${this.base}/reports/species-profile-gaps`);
  }

  getTankTasks(tankId?: number | null, includeInactive = true) {
    const params = new URLSearchParams();
    if (tankId) {
      params.set('tankId', String(tankId));
    }
    params.set('includeInactive', String(includeInactive));
    return this.http.get<FishTankTask[]>(`${this.base}/tank-tasks?${params.toString()}`);
  }

  createTankTask(request: FishTankTaskRequest) {
    return this.http.post<FishTankTask>(`${this.base}/tank-tasks`, request);
  }

  updateTankTask(id: number, request: FishTankTaskRequest) {
    return this.http.put<FishTankTask>(`${this.base}/tank-tasks/${id}`, request);
  }

  deleteTankTask(id: number) {
    return this.http.delete<void>(`${this.base}/tank-tasks/${id}`);
  }

  generateFishOccurrences(from: string, to: string) {
    return this.http.post<GenerateOccurrencesResult>(`${this.taskBase}/generate-occurrences?taskType=Fish&from=${from}&to=${to}`, {});
  }

  getOccurrences(from: string, to: string) {
    return this.http.get<TaskOccurrence[]>(`${environment.apiUrl}/occurrences?from=${from}&to=${to}`);
  }

  updateOccurrence(id: number, request: TaskOccurrenceUpdateRequest) {
    return this.http.patch<TaskOccurrence>(`${environment.apiUrl}/occurrences/${id}`, request);
  }

  getLivestockEvents(tankId?: number | null, take = 100) {
    const params = tankId ? `?tankId=${tankId}&take=${take}` : `?take=${take}`;
    return this.http.get<FishLivestockEvent[]>(`${this.base}/livestock-events${params}`);
  }

  createLivestockEvent(request: FishLivestockEventRequest) {
    return this.http.post<FishLivestockEvent>(`${this.base}/livestock-events`, request);
  }

  updateLivestockEvent(id: number, request: FishLivestockEventRequest) {
    return this.http.put<FishLivestockEvent>(`${this.base}/livestock-events/${id}`, request);
  }

  deleteLivestockEvent(id: number) {
    return this.http.delete<void>(`${this.base}/livestock-events/${id}`);
  }

  getProducts(tankId?: number | null, category?: string | null, includeInactive = true) {
    const params = new URLSearchParams();
    if (tankId) {
      params.set('tankId', String(tankId));
    }
    if (category && category !== 'All') {
      params.set('category', category);
    }
    params.set('includeInactive', String(includeInactive));
    return this.http.get<FishAquariumProduct[]>(`${this.base}/products?${params.toString()}`);
  }

  createProduct(request: FishAquariumProductRequest) {
    return this.http.post<FishAquariumProduct>(`${this.base}/products`, request);
  }

  updateProduct(id: number, request: FishAquariumProductRequest) {
    return this.http.put<FishAquariumProduct>(`${this.base}/products/${id}`, request);
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  addProductShoppingCandidate(id: number, reason: string) {
    return this.http.post<ShoppingListItem>(`${this.base}/products/${id}/shopping-list-candidate`, { reason });
  }

  getProductUsage(productId?: number | null, shoppingOnly = false, take = 100) {
    const params = new URLSearchParams();
    if (productId) {
      params.set('productId', String(productId));
    }
    params.set('shoppingOnly', String(shoppingOnly));
    params.set('take', String(take));
    return this.http.get<FishAquariumProductUsage[]>(`${this.base}/product-usage?${params.toString()}`);
  }

  createProductUsage(request: FishAquariumProductUsageRequest) {
    return this.http.post<FishAquariumProductUsage>(`${this.base}/product-usage`, request);
  }

  updateProductUsage(id: number, request: FishAquariumProductUsageRequest) {
    return this.http.put<FishAquariumProductUsage>(`${this.base}/product-usage/${id}`, request);
  }

  deleteProductUsage(id: number) {
    return this.http.delete<void>(`${this.base}/product-usage/${id}`);
  }
}
