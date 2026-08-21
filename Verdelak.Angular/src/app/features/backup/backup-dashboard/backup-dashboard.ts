import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BackupService } from '../backup-service';
import { BackupHealthReport, BackupHealthReportItem, BackupJobSummary, BackupLog, BackupLogCreate } from '../models/backup.models';
import { MasterScheduleItem, TaskOccurrenceActivity } from '../../tasks/models/scheduled-task.model';
import { ScheduleActionsComponent } from '../../../shared/schedule-actions/schedule-actions';

@Component({
  selector: 'app-backup-dashboard',
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, ScheduleActionsComponent],
  templateUrl: './backup-dashboard.html',
  styleUrl: './backup-dashboard.scss'
})
export class BackupDashboard {
  jobs = signal<BackupJobSummary[]>([]);
  report = signal<BackupHealthReport | null>(null);
  logs = signal<BackupLog[]>([]);
  activity = signal<TaskOccurrenceActivity[]>([]);
  backupSchedule = signal<MasterScheduleItem[]>([]);
  selectedJobId = signal<number | null>(null);
  selectedReportStatus = signal<string>('All');
  dueSoonDays = signal(7);
  loading = signal(false);
  reportLoading = signal(false);
  scheduleLoading = signal(false);
  saving = signal(false);
  scheduleActionId = signal<string | null>(null);
  scheduleMoveId = signal<string | null>(null);
  scheduleMoveDate = signal('');
  scheduleActionNote = signal('');
  error = signal<string | null>(null);
  message = signal<string | null>(null);

  logForm: BackupLogCreate = this.createDefaultLog();

  selectedJob = computed(() => {
    const id = this.selectedJobId();
    return this.jobs().find(job => job.backupJobID === id) ?? null;
  });

  selectedReportItem = computed(() => {
    const id = this.selectedJobId();
    return this.report()?.items.find(item => item.backupJobID === id) ?? null;
  });

  filteredReportItems = computed(() => {
    const status = this.selectedReportStatus();
    const items = this.report()?.items ?? [];
    return status === 'All'
      ? items
      : items.filter(item => item.healthStatus === status);
  });

  overdueItems = computed(() =>
    (this.report()?.items ?? [])
      .filter(item => item.healthStatus === 'Overdue' || item.healthStatus === 'NeverCompleted')
      .sort((a, b) => this.sortByUrgency(a, b)));

  lastCompletedItems = computed(() =>
    (this.report()?.items ?? [])
      .filter(item => item.lastCompletedAt)
      .sort((a, b) => new Date(b.lastCompletedAt!).getTime() - new Date(a.lastCompletedAt!).getTime())
      .slice(0, 8));

  frequencyHealthItems = computed(() =>
    (this.report()?.items ?? [])
      .filter(item => item.healthStatus === 'UnknownFrequency' || item.healthStatus === 'Inactive' || item.healthStatus === 'DueSoon')
      .sort((a, b) => this.sortByUrgency(a, b)));

  constructor(private service: BackupService) {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);
    this.loadReport();
    this.loadActivity();
    this.loadSchedule();

    this.service.getJobs().subscribe({
      next: jobs => {
        this.jobs.set(jobs);
        if (!this.selectedJobId() && jobs.length > 0) {
          this.selectJob(jobs[0].backupJobID);
        }
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.error || err?.message || 'Failed to load backup jobs.');
        this.loading.set(false);
      }
    });
  }

  loadReport() {
    this.reportLoading.set(true);
    this.service.getHealthReport(this.dueSoonDays()).subscribe({
      next: report => this.report.set(report),
      error: err => this.error.set(err?.error?.error || err?.message || 'Failed to load backup report.'),
      complete: () => this.reportLoading.set(false)
    });
  }

  selectJob(jobId: number) {
    this.selectedJobId.set(jobId);
    this.logForm = this.createDefaultLog(jobId);
    this.loadLogs(jobId);
  }

  loadLogs(jobId: number) {
    this.service.getLogs(jobId).subscribe({
      next: logs => this.logs.set(logs),
      error: err => this.error.set(err?.error?.error || err?.message || 'Failed to load backup logs.')
    });
  }

  loadActivity() {
    this.service.getBackupActivity().subscribe({
      next: activity => this.activity.set(activity),
      error: err => this.error.set(err?.error?.error || err?.message || 'Failed to load backup schedule activity.')
    });
  }
  loadSchedule() {
    this.scheduleLoading.set(true);
    const from = this.dateKey(new Date());
    const to = this.dateKey(this.addDays(new Date(), 30));
    this.service.getBackupMasterSchedule(from, to).subscribe({
      next: items => this.backupSchedule.set(items.filter(item => item.source === 'Backups')),
      error: err => this.error.set(err?.error?.error || err?.message || 'Failed to load backup schedule preview.'),
      complete: () => this.scheduleLoading.set(false)
    });
  }

  saveLog() {
    const jobId = this.selectedJobId();
    if (!jobId) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);

    const dto: BackupLogCreate = {
      ...this.logForm,
      backupJobID: jobId,
      bytesCopied: this.logForm.bytesCopied || undefined,
      durationSeconds: this.logForm.durationSeconds || undefined
    };

    this.service.logBackup(dto).subscribe({
      next: () => {
        this.message.set('Backup log saved.');
        this.saving.set(false);
        this.loadLogs(jobId);
        this.loadData();
      },
      error: err => {
        this.error.set(err?.error?.error || err?.message || 'Failed to save backup log.');
        this.saving.set(false);
      }
    });
  }

  ageText(job: BackupJobSummary) {
    if (!job.lastRun) {
      return 'Never logged';
    }

    const days = Math.floor((Date.now() - new Date(job.lastRun).getTime()) / 86400000);
    if (days <= 0) {
      return 'Today';
    }

    return `${days} day${days === 1 ? '' : 's'} old`;
  }

  statusLabel(item?: BackupHealthReportItem | null) {
    if (!item) {
      return 'Unknown';
    }

    return {
      Healthy: 'Healthy',
      DueSoon: 'Due soon',
      Overdue: 'Overdue',
      NeverCompleted: 'Never completed',
      UnknownFrequency: 'Check frequency',
      Inactive: 'Inactive'
    }[item.healthStatus];
  }

  statusClass(item?: BackupHealthReportItem | null) {
    return item ? `status-${item.healthStatus.toLowerCase()}` : 'status-unknown';
  }

  reportItemFor(job: BackupJobSummary) {
    return this.report()?.items.find(item => item.backupJobID === job.backupJobID) ?? null;
  }

  activityStatusClass(status: string) {
    if (status === 'Completed') {
      return 'status-healthy';
    }

    if (status === 'Skipped') {
      return 'status-unknownfrequency';
    }

    if (status === 'Missed') {
      return 'status-overdue';
    }

    return 'status-unknown';
  }

  activityWhen(item: TaskOccurrenceActivity) {
    return item.completedDate || item.scheduledDate;
  }

  selectStatus(status: string) {
    this.selectedReportStatus.set(status);
  }


  completeBackupOccurrence(item: MasterScheduleItem, note?: string | null) {
    if (!item.occurrenceId) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.message.set(null);
    this.error.set(null);
    this.service.completeOccurrence(item.occurrenceId, new Date().toISOString(), note).subscribe({
      next: () => {
        this.message.set(`${item.title} completed and reflected in backup logs.`);
        this.scheduleActionNote.set('');
        this.loadData();
      },
      error: err => this.error.set(err?.error?.error || err?.message || 'Could not complete backup occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  skipBackupOccurrence(item: MasterScheduleItem, note?: string | null) {
    if (!item.occurrenceId) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.message.set(null);
    this.error.set(null);
    this.service.skipOccurrence(item.occurrenceId, note ?? 'Skipped from the shared schedule.').subscribe({
      next: () => {
        this.message.set(`${item.title} skipped.`);
        this.scheduleActionNote.set('');
        this.loadData();
      },
      error: err => this.error.set(err?.error?.error || err?.message || 'Could not skip backup occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  reopenBackupOccurrence(item: MasterScheduleItem, note?: string | null) {
    if (!item.occurrenceId) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.message.set(null);
    this.error.set(null);
    this.service.reopenOccurrence(item.occurrenceId, note ?? 'Reopened from the shared schedule.').subscribe({
      next: () => {
        this.message.set(`${item.title} reopened.`);
        this.scheduleActionNote.set('');
        this.loadData();
      },
      error: err => this.error.set(err?.error?.error || err?.message || 'Could not reopen backup occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  startMoveBackupOccurrence(item: MasterScheduleItem) {
    this.scheduleMoveId.set(item.id);
    this.scheduleMoveDate.set(this.dateKey(new Date(item.scheduledDate)));
  }

  cancelMoveBackupOccurrence() {
    this.scheduleMoveId.set(null);
    this.scheduleMoveDate.set('');
  }

  moveBackupOccurrence(item: MasterScheduleItem, note?: string | null) {
    if (!item.occurrenceId || !this.scheduleMoveDate()) {
      return;
    }

    const originalDate = this.dateKey(new Date(item.scheduledDate));
    this.scheduleActionId.set(item.id);
    this.message.set(null);
    this.error.set(null);
    this.service.moveOccurrence(item.occurrenceId, this.scheduleMoveDate(), note ?? `Rescheduled from ${originalDate}.`).subscribe({
      next: () => {
        this.message.set(`${item.title} rescheduled.`);
        this.scheduleActionNote.set('');
        this.cancelMoveBackupOccurrence();
        this.loadData();
      },
      error: err => this.error.set(err?.error?.error || err?.message || 'Could not move backup occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  scheduleCapabilities(item: MasterScheduleItem) {
    return {
      canComplete: item.canComplete,
      canMove: item.canMove,
      canSkip: item.canSkip,
      canReopen: item.canReopen
    };
  }

  isBackupScheduleAction(item: MasterScheduleItem) {
    return this.scheduleActionId() === item.id;
  }

  isMovingBackupOccurrence(item: MasterScheduleItem) {
    return this.scheduleMoveId() === item.id;
  }

  private addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private dateKey(date: Date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
  private createDefaultLog(jobId = 0): BackupLogCreate {
    return {
      backupJobID: jobId,
      timestamp: this.toLocalInputValue(new Date()),
      success: true,
      message: ''
    };
  }

  private toLocalInputValue(date: Date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private sortByUrgency(a: BackupHealthReportItem, b: BackupHealthReportItem) {
    const aDue = a.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
    const bDue = b.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
    return aDue - bDue || a.sourceName.localeCompare(b.sourceName);
  }
}







