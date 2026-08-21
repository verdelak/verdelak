import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { MasterScheduleItem, ScheduleGenerationResult, TaskOccurrence, TaskOccurrenceActivity, TaskOccurrenceUpdateRequest } from './models/scheduled-task.model'

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/master-schedule`;
  private occBase = `${environment.apiUrl}/occurrences`;

  getMasterSchedule(from: string, to: string) {
    return this.http.get<MasterScheduleItem[]>(`${this.base}?from=${from}&to=${to}`);
  }

  getOccurrences(from: string, to: string) {
    return this.http.get<TaskOccurrence[]>(`${this.occBase}?from=${from}&to=${to}`);
  }

  getOccurrenceActivity(taskType?: string, take = 25, daysBack = 60, daysForward = 30) {
    const params = new URLSearchParams();
    if (taskType) {
      params.set('taskType', taskType);
    }
    params.set('take', String(take));
    params.set('daysBack', String(daysBack));
    params.set('daysForward', String(daysForward));
    return this.http.get<TaskOccurrenceActivity[]>(`${this.occBase}/activity?${params.toString()}`);
  }

  markComplete(id: number, date: string, notes?: string | null) {
    return this.updateOccurrence(id, {
      status: 'Completed',
      completedDate: date,
      notes
    });
  }

  completeGoal(id: number, notes?: string | null) {
    return this.http.post<void>(`${this.base}/goals/${id}/complete`, { notes });
  }

  rescheduleGoal(id: number, scheduledDate: string, notes?: string | null) {
    return this.http.patch<void>(`${this.base}/goals/${id}/schedule`, { scheduledDate, notes });
  }

  skipGoal(id: number, notes?: string | null) {
    return this.http.post<void>(`${this.base}/goals/${id}/skip`, { scheduledDate: null, notes });
  }
  updateGoalProgress(id: number, percentComplete: number) {
    return this.http.patch<void>(`${this.base}/goals/${id}/progress`, { percentComplete });
  }

  skipOccurrence(id: number, notes?: string | null) {
    return this.updateOccurrence(id, {
      status: 'Skipped',
      notes
    });
  }

  moveOccurrence(id: number, scheduledDate: string, notes?: string | null) {
    return this.updateOccurrence(id, {
      status: 'Scheduled',
      scheduledDate,
      notes
    });
  }

  reopenOccurrence(id: number, notes?: string | null) {
    return this.updateOccurrence(id, {
      status: 'Scheduled',
      notes
    });
  }



  previewMissingOccurrences(from: string, to: string, taskType?: string | null) {
    const params = new URLSearchParams();
    params.set('from', from);
    params.set('to', to);
    if (taskType) {
      params.set('taskType', taskType);
    }
    return this.http.get<ScheduleGenerationResult>(`${environment.apiUrl}/tasks/generate-occurrences/preview?${params.toString()}`);
  }  generateMissingOccurrences(from: string, to: string, taskType?: string | null) {
    const params = new URLSearchParams();
    params.set('from', from);
    params.set('to', to);
    if (taskType) {
      params.set('taskType', taskType);
    }
    return this.http.post<ScheduleGenerationResult>(`${environment.apiUrl}/tasks/generate-occurrences?${params.toString()}`, {});
  }
  updateOccurrence(id: number, request: TaskOccurrenceUpdateRequest) {
    return this.http.patch<TaskOccurrence>(`${this.occBase}/${id}`, request);
  }
}
