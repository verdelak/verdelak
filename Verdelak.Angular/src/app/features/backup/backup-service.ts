import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BackupJobDto, BackupSource, BackupDestination, BackupLog, ScheduledTaskDto, BackupJobSummary, BackupLogCreate, BackupHealthReport } from './models/backup.models';
import { environment } from '../../../environments/environments';
import { MasterScheduleItem, TaskOccurrence, TaskOccurrenceActivity, TaskOccurrenceUpdateRequest } from '../tasks/models/scheduled-task.model';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private http = inject(HttpClient);

  getSources() {
    return this.http.get<BackupSource[]>(`${environment.apiUrl}/backups/sources`);
  }

  getDestinations() {
    return this.http.get<BackupDestination[]>(`${environment.apiUrl}/backups/destinations`);
  }

  getJobs() {
    return this.http.get<BackupJobSummary[]>(`${environment.apiUrl}/backups/jobs`);
  }

  getHealthReport(dueSoonDays = 7) {
    return this.http.get<BackupHealthReport>(`${environment.apiUrl}/backups/reports/health?dueSoonDays=${dueSoonDays}`);
  }

  logBackup(dto: BackupLogCreate) {
    return this.http.post<BackupLog>(`${environment.apiUrl}/backups/logs`, dto);
  }

  getLogs(jobId: number) {
    return this.http.get<BackupLog[]>(`${environment.apiUrl}/backups/logs?jobId=${jobId}`);
  }

  getBackupActivity() {
    return this.http.get<TaskOccurrenceActivity[]>(`${environment.apiUrl}/occurrences/activity?taskType=Backup&take=20&daysBack=60&daysForward=30`);
  }

  createTask(dto: ScheduledTaskDto) { return this.http.post<ScheduledTaskDto>(`${environment.apiUrl}/tasks`, dto); }
  createBackupJob(dto: BackupJobDto) { return this.http.post<BackupJobDto>(`${environment.apiUrl}/backups/jobs`, dto); }
  getBackupMasterSchedule(from: string, to: string) {
    return this.http.get<MasterScheduleItem[]>(`${environment.apiUrl}/master-schedule?from=${from}&to=${to}`);
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
    return this.http.patch<TaskOccurrence>(`${environment.apiUrl}/occurrences/${id}`, request);
  }

}



