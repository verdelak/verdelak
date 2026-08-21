import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { GenerateOccurrencesResult, MasterScheduleItem, ScheduledTask, ScheduledTaskRequest, TaskOccurrence, TaskOccurrenceActivity, TaskOccurrenceUpdateRequest } from '../tasks/models/scheduled-task.model';
import { GardenHarvest, GardenHarvestReport, GardenHarvestUpsert, GardenNote, GardenNoteReport, GardenNoteUpsert, GardenPlot, GardenPlotDimension, GardenPlotDimensionUpsert, GardenPlotPlant, GardenPlotPlantUpsert, GardenPlotUpsert, GardenSeed, GardenSeedImportRequest, GardenSeedImportResult, GardenSeedInventory, GardenSeedInventoryUpsert, GardenSeedTray, GardenSeedTrayPlant, GardenSeedTrayPlantUpsert, GardenSeedUpsert, GardenYearComparison, GardenYearCopyPreview, GardenYearCopyRequest, GardenYearCopyResult } from './models/gardening.models';

@Injectable({ providedIn: 'root' })
export class GardeningService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/gardening`;
  private readonly taskBase = `${environment.apiUrl}/tasks`;
  private readonly occurrenceBase = `${environment.apiUrl}/occurrences`;
  private readonly masterScheduleBase = `${environment.apiUrl}/master-schedule`;

  getSeeds() {
    return this.http.get<GardenSeed[]>(`${this.base}/seeds`);
  }

  createSeed(dto: GardenSeedUpsert) {
    return this.http.post<GardenSeed>(`${this.base}/seeds`, dto);
  }

  updateSeed(id: number, dto: GardenSeedUpsert) {
    return this.http.put<GardenSeed>(`${this.base}/seeds/${id}`, dto);
  }

  deleteSeed(id: number) {
    return this.http.delete<void>(`${this.base}/seeds/${id}`);
  }

  exportSeedsCsv() {
    return this.http.get(`${this.base}/seeds/export.csv`, { responseType: 'blob' });
  }

  importSeeds(dto: GardenSeedImportRequest) {
    return this.http.post<GardenSeedImportResult>(`${this.base}/seeds/import`, dto);
  }

  updateSeedInventory(seedId: number, dto: GardenSeedInventoryUpsert) {
    return this.http.put<GardenSeedInventory>(`${this.base}/seeds/${seedId}/inventory`, dto);
  }

  getTrays() {
    return this.http.get<GardenSeedTray[]>(`${this.base}/trays`);
  }

  getTrayPlants(year?: number, trayId?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (trayId) {
      params = params.set('trayId', String(trayId));
    }

    return this.http.get<GardenSeedTrayPlant[]>(`${this.base}/tray-plants`, { params });
  }

  createTrayPlant(dto: GardenSeedTrayPlantUpsert) {
    return this.http.post<GardenSeedTrayPlant>(`${this.base}/tray-plants`, dto);
  }

  updateTrayPlant(id: number, dto: GardenSeedTrayPlantUpsert) {
    return this.http.put<GardenSeedTrayPlant>(`${this.base}/tray-plants/${id}`, dto);
  }

  deleteTrayPlant(id: number) {
    return this.http.delete<void>(`${this.base}/tray-plants/${id}`);
  }

  previewCopyTrayPlants(dto: GardenYearCopyRequest) {
    return this.http.post<GardenYearCopyPreview>(`${this.base}/tray-plants/copy-year/preview`, dto);
  }

  copyTrayPlants(dto: GardenYearCopyRequest) {
    return this.http.post<GardenYearCopyResult>(`${this.base}/tray-plants/copy-year`, dto);
  }

  getPlots() {
    return this.http.get<GardenPlot[]>(`${this.base}/plots`);
  }

  createPlot(dto: GardenPlotUpsert) {
    return this.http.post<GardenPlot>(`${this.base}/plots`, dto);
  }

  updatePlot(id: number, dto: GardenPlotUpsert) {
    return this.http.put<GardenPlot>(`${this.base}/plots/${id}`, dto);
  }

  createPlotDimension(dto: GardenPlotDimensionUpsert) {
    return this.http.post<GardenPlotDimension>(`${this.base}/plot-dimensions`, dto);
  }

  getPlotPlants(year?: number, gardenPlotId?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (gardenPlotId) {
      params = params.set('gardenPlotId', String(gardenPlotId));
    }

    return this.http.get<GardenPlotPlant[]>(`${this.base}/plot-plants`, { params });
  }

  createPlotPlant(dto: GardenPlotPlantUpsert) {
    return this.http.post<GardenPlotPlant>(`${this.base}/plot-plants`, dto);
  }

  updatePlotPlant(id: number, dto: GardenPlotPlantUpsert) {
    return this.http.put<GardenPlotPlant>(`${this.base}/plot-plants/${id}`, dto);
  }

  deletePlotPlant(id: number) {
    return this.http.delete<void>(`${this.base}/plot-plants/${id}`);
  }

  previewCopyPlotPlants(dto: GardenYearCopyRequest) {
    return this.http.post<GardenYearCopyPreview>(`${this.base}/plot-plants/copy-year/preview`, dto);
  }

  copyPlotPlants(dto: GardenYearCopyRequest) {
    return this.http.post<GardenYearCopyResult>(`${this.base}/plot-plants/copy-year`, dto);
  }

  getNotes(year?: number, gardenPlotId?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (gardenPlotId) {
      params = params.set('gardenPlotId', String(gardenPlotId));
    }

    return this.http.get<GardenNote[]>(`${this.base}/notes`, { params });
  }

  getNoteReport(year?: number, gardenPlotId?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (gardenPlotId) {
      params = params.set('gardenPlotId', String(gardenPlotId));
    }

    return this.http.get<GardenNoteReport>(`${this.base}/notes/report`, { params });
  }

  exportNotesCsv(year?: number, gardenPlotId?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (gardenPlotId) {
      params = params.set('gardenPlotId', String(gardenPlotId));
    }

    return this.http.get(`${this.base}/notes/export.csv`, { params, responseType: 'blob' });
  }

  getHarvests(year?: number, gardenPlotId?: number | null, seedId?: number | null, take?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (gardenPlotId) {
      params = params.set('gardenPlotId', String(gardenPlotId));
    }
    if (seedId) {
      params = params.set('seedId', String(seedId));
    }
    if (take) {
      params = params.set('take', String(take));
    }

    return this.http.get<GardenHarvest[]>(`${this.base}/harvests`, { params });
  }

  getHarvestReport(year?: number, gardenPlotId?: number | null, seedId?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (gardenPlotId) {
      params = params.set('gardenPlotId', String(gardenPlotId));
    }
    if (seedId) {
      params = params.set('seedId', String(seedId));
    }

    return this.http.get<GardenHarvestReport>(`${this.base}/harvests/report`, { params });
  }

  exportHarvestsCsv(year?: number, gardenPlotId?: number | null, seedId?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (gardenPlotId) {
      params = params.set('gardenPlotId', String(gardenPlotId));
    }
    if (seedId) {
      params = params.set('seedId', String(seedId));
    }

    return this.http.get(`${this.base}/harvests/export.csv`, { params, responseType: 'blob' });
  }
  getYearComparison(year?: number, compareYear?: number | null) {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', String(year));
    }
    if (compareYear) {
      params = params.set('compareYear', String(compareYear));
    }

    return this.http.get<GardenYearComparison>(`${this.base}/year-comparison`, { params });
  }

  createHarvest(dto: GardenHarvestUpsert) {
    return this.http.post<GardenHarvest>(`${this.base}/harvests`, dto);
  }

  updateHarvest(id: number, dto: GardenHarvestUpsert) {
    return this.http.put<GardenHarvest>(`${this.base}/harvests/${id}`, dto);
  }

  deleteHarvest(id: number) {
    return this.http.delete<void>(`${this.base}/harvests/${id}`);
  }

  createNote(dto: GardenNoteUpsert) {
    return this.http.post<GardenNote>(`${this.base}/notes`, dto);
  }

  updateNote(id: number, dto: GardenNoteUpsert) {
    return this.http.put<GardenNote>(`${this.base}/notes/${id}`, dto);
  }

  deleteNote(id: number) {
    return this.http.delete<void>(`${this.base}/notes/${id}`);
  }

  getGardeningTasks() {
    return this.http.get<ScheduledTask[]>(`${this.taskBase}?taskType=Gardening`);
  }

  createGardeningTask(dto: ScheduledTaskRequest) {
    return this.http.post<ScheduledTask>(this.taskBase, dto);
  }

  updateGardeningTask(id: number, dto: ScheduledTaskRequest) {
    return this.http.put<ScheduledTask>(`${this.taskBase}/${id}`, dto);
  }

  deleteGardeningTask(id: number) {
    return this.http.delete<void>(`${this.taskBase}/${id}`);
  }

  generateGardeningOccurrences(from: string, to: string) {
    return this.http.post<GenerateOccurrencesResult>(`${this.taskBase}/generate-occurrences?taskType=Gardening&from=${from}&to=${to}`, {});
  }

  getGardeningActivity() {
    return this.http.get<TaskOccurrenceActivity[]>(`${this.occurrenceBase}/activity?taskType=Gardening&take=20&daysBack=60&daysForward=30`);
  }

  getGardeningMasterSchedule(from: string, to: string) {
    return this.http.get<MasterScheduleItem[]>(`${this.masterScheduleBase}?from=${from}&to=${to}`);
  }

  updateOccurrence(id: number, request: TaskOccurrenceUpdateRequest) {
    return this.http.patch<TaskOccurrence>(`${this.occurrenceBase}/${id}`, request);
  }

  completeOccurrence(id: number, completedDate: string, notes?: string | null) {
    return this.updateOccurrence(id, { status: 'Completed', completedDate, notes });
  }

  skipOccurrence(id: number, notes?: string | null) {
    return this.updateOccurrence(id, { status: 'Skipped', notes });
  }

  moveOccurrence(id: number, scheduledDate: string, notes?: string | null) {
    return this.updateOccurrence(id, { status: 'Scheduled', scheduledDate, notes });
  }

  reopenOccurrence(id: number, notes?: string | null) {
    return this.updateOccurrence(id, { status: 'Scheduled', notes });
  }
}











