import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { GenerateOccurrencesResult, MasterScheduleItem, ScheduledTask, ScheduledTaskRequest, TaskOccurrence, TaskOccurrenceActivity, TaskOccurrenceUpdateRequest } from '../tasks/models/scheduled-task.model';

@Injectable({ providedIn: 'root' })
export class ChoreService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tasks`;
  private readonly occurrenceBase = `${environment.apiUrl}/occurrences`;
  private readonly masterScheduleBase = `${environment.apiUrl}/master-schedule`;

  getChores() {
    return this.http.get<ScheduledTask[]>(`${this.base}?taskType=Chore`);
  }

  createChore(request: ScheduledTaskRequest) {
    return this.http.post<ScheduledTask>(this.base, request);
  }

  updateChore(id: number, request: ScheduledTaskRequest) {
    return this.http.put<ScheduledTask>(`${this.base}/${id}`, request);
  }

  assignCategory(id: number, category: string) {
    return this.http.post<string[]>(`${this.base}/${id}/tags`, [category]);
  }

  deleteChore(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  generateOccurrences(id: number, from: string, to: string) {
    return this.http.post<GenerateOccurrencesResult>(`${this.base}/${id}/generate-occurrences?from=${from}&to=${to}`, {});
  }

  generateActiveChoreOccurrences(from: string, to: string) {
    return this.http.post<GenerateOccurrencesResult>(`${this.base}/generate-occurrences?taskType=Chore&from=${from}&to=${to}`, {});
  }

  getChoreActivity() {
    return this.http.get<TaskOccurrenceActivity[]>(`${this.occurrenceBase}/activity?taskType=Chore&take=20&daysBack=60&daysForward=30`);
  }

  getChoreMasterSchedule(from: string, to: string) {
    return this.http.get<MasterScheduleItem[]>(`${this.masterScheduleBase}?from=${from}&to=${to}`);
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

  updateOccurrence(id: number, request: TaskOccurrenceUpdateRequest) {
    return this.http.patch<TaskOccurrence>(`${this.occurrenceBase}/${id}`, request);
  }
}

