import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { ChoreService } from '../chore-service';
import { MasterScheduleItem, ScheduledTask, ScheduledTaskRequest, TaskOccurrenceActivity } from '../../tasks/models/scheduled-task.model';
import { ScheduleActionsComponent } from '../../../shared/schedule-actions/schedule-actions';

type ChoreScheduleType = 'OneTime' | 'Daily' | 'Weekly' | 'Monthly';

interface ChoreForm {
  taskID: number | null;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  scheduleType: ChoreScheduleType;
  startDate: string;
  endDate: string;
  oneTimeDate: string;
  monthlyDay: number;
  monthlyInterval: number;
  weeklyDays: Record<string, boolean>;
}

interface BulkChoreRow {
  title: string;
  category: string;
  notes: string;
  scheduleType: ChoreScheduleType;
  weeklyDays: Record<string, boolean>;
  monthlyDay: number;
  monthlyInterval: number;
}

interface ChoreSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface ChoreBreakdownRow {
  label: string;
  count: number;
  activeCount: number;
  next30Count: number;
}

interface ChoreAttentionItem {
  title: string;
  detail: string;
  tone: string;
}

interface MasterScheduleReflection {
  label: string;
  value: number;
  detail: string;
}

interface RecurringRuleCard {
  label: string;
  value: number;
  detail: string;
}

interface RecurringRuleRow {
  chore: ScheduledTask;
  category: string;
  recurrence: string;
  status: string;
  statusTone: string;
  nextDates: string[];
  generatedCount: number;
  detail: string;
}

type CsvCell = string | number | boolean | null | undefined;

@Component({
  selector: 'app-chore-manager',
  imports: [CommonModule, FormsModule, RouterLink, ScheduleActionsComponent],
  templateUrl: './chore-manager.html',
  styleUrl: './chore-manager.scss'
})
export class ChoreManager {
  readonly dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly categories = ['Household', 'Medical', 'Pets', 'Cleaning', 'Errands'];
  readonly previewWindowDays = [30, 60, 90];
  readonly chores = signal<ScheduledTask[]>([]);
  readonly activity = signal<TaskOccurrenceActivity[]>([]);
  readonly choreSchedule = signal<MasterScheduleItem[]>([]);
  readonly loading = signal(false);
  readonly activityLoading = signal(false);
  readonly scheduleLoading = signal(false);
  readonly saving = signal(false);
  readonly generating = signal(false);
  readonly scheduleActionId = signal<string | null>(null);
  readonly scheduleMoveId = signal<string | null>(null);
  readonly scheduleMoveDate = signal('');
  readonly scheduleActionNote = signal('');
  readonly importing = signal(false);
  readonly previewDays = signal(30);
  readonly schedulePreviewDays = signal(30);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly showInactive = signal(false);
  readonly bulkText = signal('');
  readonly form = signal<ChoreForm>(this.emptyForm());
  readonly formPreview = computed(() => this.previewFormOccurrences(this.form(), this.previewDays()));
  readonly bulkPreview = computed(() => this.parseBulkRows(this.bulkText(), this.form()));
  readonly visibleChores = computed(() => this.showInactive()
    ? this.chores()
    : this.chores().filter(chore => chore.isActive));
  readonly activeChoreCount = computed(() => this.chores().filter(chore => chore.isActive).length);
  readonly scheduledPreviewCount = computed(() => this.choreSchedule().filter(item => item.status === 'Scheduled').length);
  readonly completedPreviewCount = computed(() => this.choreSchedule().filter(item => item.status === 'Completed').length);
  readonly skippedPreviewCount = computed(() => this.choreSchedule().filter(item => item.status === 'Skipped').length);
  readonly scheduleRangeLabel = computed(() => `Next ${this.schedulePreviewDays()} days`);
  readonly scheduleExportSuffix = computed(() => {
    const range = this.scheduleRange();
    return `${range.from}-to-${range.to}`;
  });
  readonly choreSummaryCards = computed<ChoreSummaryCard[]>(() => [
    {
      label: 'Active chores',
      value: this.activeChoreCount(),
      detail: `${this.chores().length.toLocaleString()} total configured`
    },
    {
      label: this.scheduleRangeLabel(),
      value: this.choreSchedule().length,
      detail: `${this.scheduledPreviewCount().toLocaleString()} still scheduled`
    },
    {
      label: 'Completed',
      value: this.completedPreviewCount(),
      detail: 'Generated Chore rows in preview'
    },
    {
      label: 'Skipped',
      value: this.skippedPreviewCount(),
      detail: 'Generated Chore rows in preview'
    }
  ]);
  readonly categoryReport = computed(() => this.buildCategoryReport());
  readonly frequencyReport = computed(() => this.buildFrequencyReport());
  readonly scheduleStatusReport = computed(() => this.buildScheduleStatusReport());
  readonly attentionItems = computed(() => this.buildAttentionItems());
  readonly masterScheduleReflection = computed<MasterScheduleReflection[]>(() => [
    {
      label: 'Reflected rows',
      value: this.choreSchedule().length,
      detail: 'Chore rows pulled from Master Schedule'
    },
    {
      label: 'Actionable',
      value: this.choreSchedule().filter(item => item.canComplete || item.canMove || item.canSkip || item.canReopen).length,
      detail: 'Rows exposing schedule actions here'
    },
    {
      label: 'Activity notes',
      value: this.activity().filter(item => !!item.notes?.trim()).length,
      detail: 'Recent Chore occurrence notes'
    },
    {
      label: 'Generated gaps',
      value: this.attentionItems().filter(item => item.detail.includes('no generated rows')).length,
      detail: `Active chores missing ${this.scheduleRangeLabel().toLocaleLowerCase()} rows`
    }
  ]);
  readonly reflectedActions = computed(() => this.activity()
    .filter(item => ['Completed', 'Skipped', 'Scheduled'].includes(item.status) || !!item.notes?.trim())
    .slice(0, 8));
  readonly reflectedUpcomingRows = computed(() => this.choreSchedule()
    .filter(item => item.status === 'Scheduled')
    .slice()
    .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate))
    .slice(0, 8));
  readonly recurringRuleRows = computed(() => this.buildRecurringRuleRows());
  readonly recurringRuleCards = computed<RecurringRuleCard[]>(() => {
    const rows = this.recurringRuleRows();
    return [
      {
        label: 'Managed rules',
        value: rows.length,
        detail: `${rows.filter(row => row.chore.isActive).length.toLocaleString()} active`
      },
      {
        label: 'Need generation',
        value: rows.filter(row => row.status === 'Needs generation').length,
        detail: 'Active rules with preview dates but no generated rows'
      },
      {
        label: 'Ending soon',
        value: rows.filter(row => row.status === 'Ending soon').length,
        detail: 'Active rules ending inside the next 30 days'
      },
      {
        label: 'Paused/expired',
        value: rows.filter(row => row.status === 'Paused' || row.status === 'Expired').length,
        detail: 'Rules intentionally inactive or past their end date'
      }
    ];
  });

  constructor(private readonly service: ChoreService) {
    this.loadChores();
    this.loadActivity();
    this.loadSchedule();
  }

  loadChores(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getChores().subscribe({
      next: chores => this.chores.set(chores),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load chores.'),
      complete: () => this.loading.set(false)
    });
  }

  loadActivity(): void {
    this.activityLoading.set(true);
    this.service.getChoreActivity().subscribe({
      next: activity => this.activity.set(activity),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load chore activity.'),
      complete: () => this.activityLoading.set(false)
    });
  }
  loadSchedule(days = this.schedulePreviewDays()): void {
    this.schedulePreviewDays.set(days);
    const range = this.scheduleRange(days);
    this.scheduleLoading.set(true);
    this.service.getChoreMasterSchedule(range.from, range.to).subscribe({
      next: items => this.choreSchedule.set(items.filter(item => item.source === 'Chores')),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load chore schedule preview.'),
      complete: () => this.scheduleLoading.set(false)
    });
  }

  save(): void {
    const form = this.form();
    if (!form.title.trim()) {
      this.error.set('Chores need a title.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    const request = this.toRequest(form);
    const call = form.taskID
      ? this.service.updateChore(form.taskID, request)
      : this.service.createChore(request);

    call.subscribe({
      next: chore => {
        this.service.assignCategory(chore.taskID, form.category).subscribe({
          next: () => {
            this.message.set(`${chore.title} saved.`);
            this.resetForm();
            this.loadChores();
          },
          error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Chore saved, but category update failed.')
        });
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to save the chore.'),
      complete: () => this.saving.set(false)
    });
  }

  edit(chore: ScheduledTask): void {
    this.form.set(this.fromTask(chore));
    this.message.set(null);
    this.error.set(null);
  }

  resetForm(): void {
    this.form.set(this.emptyForm());
  }

  delete(chore: ScheduledTask): void {
    if (!confirm(`Delete "${chore.title}" and its generated schedule occurrences?`)) {
      return;
    }

    this.service.deleteChore(chore.taskID).subscribe({
      next: () => {
        this.message.set(`${chore.title} deleted.`);
        this.loadChores();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to delete the chore.')
    });
  }

  generate(chore: ScheduledTask): void {
    const from = this.localDateKey(new Date());
    const to = this.localDateKey(this.addDays(new Date(), 31));
    const preview = this.previewTaskOccurrences(chore, 30);
    if (!confirm(`Generate the next ${preview.length} previewed occurrence${preview.length === 1 ? '' : 's'} for "${chore.title}"?`)) {
      return;
    }

    this.service.generateOccurrences(chore.taskID, from, to).subscribe({
      next: result => {
        this.message.set(`${chore.title}: ${result.created.toLocaleString()} new schedule occurrence${result.created === 1 ? '' : 's'} created.`);
        this.loadActivity();
        this.loadSchedule();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to generate occurrences.')
    });
  }

  generateAll(days: number): void {
    const activeCount = this.activeChoreCount();
    if (activeCount === 0) {
      this.error.set('There are no active chores to generate.');
      return;
    }

    if (!confirm(`Generate occurrences for ${activeCount.toLocaleString()} active chore${activeCount === 1 ? '' : 's'} over the next ${days} days?`)) {
      return;
    }

    this.generating.set(true);
    this.message.set(null);
    this.error.set(null);
    const from = this.localDateKey(new Date());
    const to = this.localDateKey(this.addDays(new Date(), days));
    this.service.generateActiveChoreOccurrences(from, to).subscribe({
      next: result => {
        this.message.set(`Active chores: ${result.created.toLocaleString()} new schedule occurrence${result.created === 1 ? '' : 's'} created for the next ${days} days.`);
        this.loadActivity();
        this.loadSchedule();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to generate active chores.'),
      complete: () => this.generating.set(false)
    });
  }

  importBulk(): void {
    const rows = this.bulkPreview();
    if (rows.length === 0) {
      this.error.set('Paste at least one chore title before importing.');
      return;
    }

    if (!confirm(`Import ${rows.length.toLocaleString()} chore${rows.length === 1 ? '' : 's'} using the previewed values?`)) {
      return;
    }

    this.importing.set(true);
    this.error.set(null);
    this.message.set(null);
    const calls = rows.map(row => this.service.createChore(this.bulkRowRequest(row)).pipe(
      switchMap(chore => this.service.assignCategory(chore.taskID, row.category))
    ));

    forkJoin(calls).subscribe({
      next: () => {
        this.message.set(`${rows.length.toLocaleString()} chore${rows.length === 1 ? '' : 's'} imported.`);
        this.bulkText.set('');
        this.loadChores();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Bulk chore import failed.'),
      complete: () => this.importing.set(false)
    });
  }

  exportChoreReportCsv(): void {
    this.downloadCsv('chores-report.csv', [
      ['Report', 'Label', 'Count', 'Active Count', this.scheduleRangeLabel()],
      ...this.categoryReport().map(row => ['Category', row.label, row.count, row.activeCount, row.next30Count]),
      ...this.frequencyReport().map(row => ['Frequency', row.label, row.count, row.activeCount, row.next30Count]),
      ...this.scheduleStatusReport().map(row => ['Schedule Status', row.label, row.count, row.activeCount, row.next30Count])
    ]);
  }

  exportChoreScheduleCsv(): void {
    this.downloadCsv(`chores-schedule-${this.scheduleExportSuffix()}.csv`, [
      ['Title', 'Category', 'Scheduled Date', 'Status', 'Detail', 'Occurrence ID'],
      ...this.choreSchedule().map(item => [
        item.title,
        this.scheduleCategory(item),
        item.scheduledDate,
        item.status,
        item.detail,
        item.occurrenceId
      ])
    ]);
  }

  exportMasterScheduleReflectionCsv(): void {
    this.downloadCsv(`chores-master-schedule-reflection-${this.scheduleExportSuffix()}.csv`, [
      ['Section', 'Title', 'Category', 'Scheduled Date', 'Completed Date', 'Status', 'Notes', 'Occurrence ID'],
      ...this.choreSchedule().map(item => [
        'Upcoming',
        item.title,
        this.scheduleCategory(item),
        item.scheduledDate,
        '',
        item.status,
        item.detail,
        item.occurrenceId
      ]),
      ...this.activity().map(item => [
        'Activity',
        item.taskTitle,
        this.activityCategory(item),
        item.scheduledDate,
        item.completedDate,
        item.status,
        item.notes,
        item.occurrenceID
      ])
    ]);
  }

  exportRecurringRulesCsv(): void {
    this.downloadCsv('chores-recurring-rules.csv', [
      ['Title', 'Category', 'Rule Type', 'Recurrence', 'Start Date', 'End Date', 'Active', 'Rule Status', 'Next Preview Dates', `Generated ${this.scheduleRangeLabel()}`, 'Notes'],
      ...this.recurringRuleRows().map(row => [
        row.chore.title,
        row.category,
        row.chore.scheduleType,
        row.recurrence,
        row.chore.startDate,
        row.chore.endDate,
        row.chore.isActive,
        row.status,
        row.nextDates.join('|'),
        row.generatedCount,
        row.chore.description
      ])
    ]);
  }

  setForm<K extends keyof ChoreForm>(key: K, value: ChoreForm[K]): void {
    this.form.update(form => ({ ...form, [key]: value }));
  }

  setWeeklyDay(day: string, value: boolean): void {
    this.form.update(form => ({
      ...form,
      weeklyDays: { ...form.weeklyDays, [day]: value }
    }));
  }

  applyDailyTemplate(): void {
    this.form.update(form => ({
      ...form,
      scheduleType: 'Daily',
      weeklyDays: this.weeklyDays()
    }));
  }

  applyWeekdayTemplate(): void {
    this.form.update(form => ({
      ...form,
      scheduleType: 'Weekly',
      weeklyDays: this.weeklyDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    }));
  }

  applyWeeklyDayTemplate(day: string): void {
    this.form.update(form => ({
      ...form,
      scheduleType: 'Weekly',
      weeklyDays: this.weeklyDays([day])
    }));
  }

  applyMonthlyTemplate(): void {
    this.form.update(form => ({
      ...form,
      scheduleType: 'Monthly',
      monthlyDay: form.monthlyDay || 1,
      monthlyInterval: form.monthlyInterval || 1,
      weeklyDays: this.weeklyDays()
    }));
  }

  recurrenceLabel(chore: ScheduledTask): string {
    if (chore.scheduleType === 'Weekly') {
      return `Weekly: ${this.patternValue(chore.recurrencePattern, 'days') ?? this.patternBody(chore.recurrencePattern)}`;
    }

    if (chore.scheduleType === 'Monthly') {
      const day = this.patternValue(chore.recurrencePattern, 'day') ?? '1';
      const interval = this.patternValue(chore.recurrencePattern, 'interval') ?? '1';
      return interval === '1' ? `Monthly on day ${day}` : `Every ${interval} months on day ${day}`;
    }

    if (chore.scheduleType === 'OneTime') {
      return `One time: ${chore.recurrencePattern}`;
    }

    return 'Daily';
  }

  previewTaskOccurrences(chore: ScheduledTask, days = 30): string[] {
    const form = this.fromTask(chore);
    return this.previewFormOccurrences(form, days);
  }

  category(chore: ScheduledTask): string {
    return chore.tags?.[0]?.tag ?? 'Household';
  }

  categoryTone(category: string): string {
    return category === 'Medical'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : category === 'Pets'
        ? 'border-pink-200 bg-pink-50 text-pink-800'
      : category === 'Cleaning'
          ? 'border-lime-200 bg-lime-50 text-lime-800'
          : category === 'Errands'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-orange-200 bg-orange-50 text-orange-800';
  }

  activityStatusTone(status: string): string {
    return status === 'Completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'Skipped'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : status === 'Missed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-slate-200 bg-slate-50 text-slate-700';
  }

  activityWhen(item: TaskOccurrenceActivity): string {
    return item.completedDate || item.scheduledDate;
  }

  activityCategory(item: TaskOccurrenceActivity): string {
    return item.tags?.[0] ?? 'Chore';
  }

  scheduleCategory(item: MasterScheduleItem): string {
    return item.detail?.split('/')[0]?.trim() || item.sourceType || 'Chore';
  }


  completeChoreOccurrence(item: MasterScheduleItem, note?: string | null): void {
    if (!item.occurrenceId) {
      return;
    }

    this.scheduleActionId.set(item.id);
    this.message.set(null);
    this.error.set(null);
    this.service.completeOccurrence(item.occurrenceId, new Date().toISOString(), note).subscribe({
      next: () => {
        this.message.set(`${item.title} completed.`);
        this.scheduleActionNote.set('');
        this.loadSchedule();
        this.loadActivity();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Could not complete chore occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  skipChoreOccurrence(item: MasterScheduleItem, note?: string | null): void {
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
        this.loadSchedule();
        this.loadActivity();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Could not skip chore occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  reopenChoreOccurrence(item: MasterScheduleItem, note?: string | null): void {
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
        this.loadSchedule();
        this.loadActivity();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Could not reopen chore occurrence.'),
      complete: () => this.scheduleActionId.set(null)
    });
  }

  startMoveChoreOccurrence(item: MasterScheduleItem): void {
    this.scheduleMoveId.set(item.id);
    this.scheduleMoveDate.set(this.localDateKey(new Date(item.scheduledDate)));
  }

  cancelMoveChoreOccurrence(): void {
    this.scheduleMoveId.set(null);
    this.scheduleMoveDate.set('');
  }

  moveChoreOccurrence(item: MasterScheduleItem, note?: string | null): void {
    if (!item.occurrenceId || !this.scheduleMoveDate()) {
      return;
    }

    const originalDate = this.localDateKey(new Date(item.scheduledDate));
    this.scheduleActionId.set(item.id);
    this.message.set(null);
    this.error.set(null);
    this.service.moveOccurrence(item.occurrenceId, this.scheduleMoveDate(), note ?? `Rescheduled from ${originalDate}.`).subscribe({
      next: () => {
        this.message.set(`${item.title} rescheduled.`);
        this.scheduleActionNote.set('');
        this.cancelMoveChoreOccurrence();
        this.loadSchedule();
        this.loadActivity();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Could not move chore occurrence.'),
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

  isChoreScheduleAction(item: MasterScheduleItem): boolean {
    return this.scheduleActionId() === item.id;
  }

  isMovingChoreOccurrence(item: MasterScheduleItem): boolean {
    return this.scheduleMoveId() === item.id;
  }

  ruleStatusTone(status: string): string {
    return status === 'Ready'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'Needs generation' || status === 'Ending soon'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : status === 'Expired'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-slate-200 bg-slate-50 text-slate-700';
  }

  private toRequest(form: ChoreForm): ScheduledTaskRequest {
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      taskType: 'Chore',
      isActive: form.isActive,
      scheduleType: form.scheduleType,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      recurrencePattern: this.compilePattern(form)
    };
  }

  private bulkRowRequest(row: BulkChoreRow): ScheduledTaskRequest {
    const form = {
      ...this.form(),
      title: row.title,
      description: row.notes,
      category: row.category,
      scheduleType: row.scheduleType,
      weeklyDays: row.weeklyDays,
      monthlyDay: row.monthlyDay,
      monthlyInterval: row.monthlyInterval
    };
    return this.toRequest(form);
  }

  private buildCategoryReport(): ChoreBreakdownRow[] {
    const next30ByTitle = this.countBy(this.choreSchedule(), item => item.title);
    const rows = new Map<string, ChoreBreakdownRow>();
    this.chores().forEach(chore => {
      const label = this.category(chore);
      const row = rows.get(label) ?? { label, count: 0, activeCount: 0, next30Count: 0 };
      row.count += 1;
      row.activeCount += chore.isActive ? 1 : 0;
      row.next30Count += next30ByTitle.get(chore.title) ?? 0;
      rows.set(label, row);
    });

    return this.sortBreakdown(rows);
  }

  private buildFrequencyReport(): ChoreBreakdownRow[] {
    const next30ByTitle = this.countBy(this.choreSchedule(), item => item.title);
    const rows = new Map<string, ChoreBreakdownRow>();
    this.chores().forEach(chore => {
      const label = chore.scheduleType || 'Unknown';
      const row = rows.get(label) ?? { label, count: 0, activeCount: 0, next30Count: 0 };
      row.count += 1;
      row.activeCount += chore.isActive ? 1 : 0;
      row.next30Count += next30ByTitle.get(chore.title) ?? 0;
      rows.set(label, row);
    });

    return this.sortBreakdown(rows);
  }

  private buildScheduleStatusReport(): ChoreBreakdownRow[] {
    const rows = new Map<string, ChoreBreakdownRow>();
    this.choreSchedule().forEach(item => {
      const row = rows.get(item.status) ?? { label: item.status, count: 0, activeCount: 0, next30Count: 0 };
      row.count += 1;
      row.next30Count += 1;
      rows.set(item.status, row);
    });

    return this.sortBreakdown(rows);
  }

  private buildAttentionItems(): ChoreAttentionItem[] {
    const items: ChoreAttentionItem[] = [];
    const next30ByTitle = this.countBy(this.choreSchedule(), item => item.title);
    const rangeLabel = this.scheduleRangeLabel().toLocaleLowerCase();
    this.chores()
      .filter(chore => chore.isActive && (next30ByTitle.get(chore.title) ?? 0) === 0)
      .slice(0, 8)
      .forEach(chore => items.push({
        title: chore.title,
        detail: `${this.category(chore)} / ${this.recurrenceLabel(chore)} / no generated rows in the ${rangeLabel}`,
        tone: 'amber'
      }));

    this.choreSchedule()
      .filter(item => item.status === 'Missed')
      .slice(0, 8)
      .forEach(item => items.push({
        title: item.title,
        detail: `Missed occurrence due ${new Date(item.scheduledDate).toLocaleDateString()}`,
        tone: 'rose'
      }));

    return items.slice(0, 12);
  }

  private buildRecurringRuleRows(): RecurringRuleRow[] {
    const today = this.today();
    const next30ByTask = this.countBy(this.choreSchedule(), item => String(item.sourceId));
    const rangeLabel = this.scheduleRangeLabel().toLocaleLowerCase();
    return this.chores()
      .slice()
      .sort((left, right) => this.category(left).localeCompare(this.category(right)) || left.title.localeCompare(right.title))
      .map(chore => {
        const nextDates = this.previewTaskOccurrences(chore, 90);
        const generatedCount = next30ByTask.get(String(chore.taskID)) ?? 0;
        const endDate = chore.endDate ? this.localDate(chore.endDate.slice(0, 10)) : null;
        const daysUntilEnd = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / 86400000) : null;
        const status = !chore.isActive
          ? 'Paused'
          : daysUntilEnd !== null && daysUntilEnd < 0
            ? 'Expired'
            : daysUntilEnd !== null && daysUntilEnd <= 30
              ? 'Ending soon'
              : nextDates.length > 0 && generatedCount === 0
                ? 'Needs generation'
                : 'Ready';
        const detail = status === 'Needs generation'
          ? `Preview dates exist, but Master Schedule has no generated rows in the ${rangeLabel}.`
          : status === 'Ending soon'
            ? `Ends ${endDate?.toLocaleDateString()}.`
            : status === 'Expired'
              ? `Ended ${endDate?.toLocaleDateString()}.`
              : status === 'Paused'
                ? 'Inactive rule stays out of bulk generation.'
                : `${generatedCount.toLocaleString()} generated row${generatedCount === 1 ? '' : 's'} in the ${rangeLabel}.`;

        return {
          chore,
          category: this.category(chore),
          recurrence: this.recurrenceLabel(chore),
          status,
          statusTone: this.ruleStatusTone(status),
          nextDates,
          generatedCount,
          detail
        };
      });
  }

  private countBy<T>(items: T[], keySelector: (item: T) => string): Map<string, number> {
    const counts = new Map<string, number>();
    items.forEach(item => {
      const key = keySelector(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }

  private sortBreakdown(rows: Map<string, ChoreBreakdownRow>): ChoreBreakdownRow[] {
    return Array.from(rows.values())
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  }

  private scheduleRange(days = this.schedulePreviewDays()): { from: string; to: string } {
    const today = new Date();
    return {
      from: this.localDateKey(today),
      to: this.localDateKey(this.addDays(today, days))
    };
  }

  private downloadCsv(fileName: string, rows: CsvCell[][]): void {
    const csv = rows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: CsvCell): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private parseBulkRows(text: string, defaults: ChoreForm): BulkChoreRow[] {
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => this.parseBulkRow(line, defaults))
      .filter((row): row is BulkChoreRow => row !== null);
  }

  private parseBulkRow(line: string, defaults: ChoreForm): BulkChoreRow | null {
    const columns = this.splitBulkColumns(line);
    const title = (columns[0] ?? '').trim();
    if (!title || title.toLowerCase() === 'title') {
      return null;
    }

    const category = this.categories.includes(columns[1]?.trim())
      ? columns[1].trim()
      : defaults.category;
    const scheduleText = (columns[2] ?? defaults.scheduleType).trim().toLowerCase();
    const scheduleType = scheduleText === 'daily'
      ? 'Daily'
      : scheduleText === 'monthly'
        ? 'Monthly'
        : scheduleText === 'one-time' || scheduleText === 'onetime'
          ? 'OneTime'
          : 'Weekly';
    const daysText = columns[3]?.trim() ?? '';
    const weeklyDays = scheduleType === 'Weekly'
      ? this.weeklyDays(daysText
        ? daysText.split(/[|, ]+/).map(day => this.normalizeDay(day)).filter(Boolean) as string[]
        : Object.entries(defaults.weeklyDays).filter(([, selected]) => selected).map(([day]) => day))
      : this.weeklyDays();
    const monthlyDay = Number(columns[4]) || defaults.monthlyDay;
    const notes = columns[5]?.trim() ?? columns.slice(6).join(',').trim() ?? '';

    return {
      title,
      category,
      notes,
      scheduleType,
      weeklyDays,
      monthlyDay,
      monthlyInterval: defaults.monthlyInterval || 1
    };
  }

  private splitBulkColumns(line: string): string[] {
    return line.includes('\t') ? line.split('\t') : line.split(',');
  }

  private normalizeDay(value: string): string | null {
    const lower = value.trim().slice(0, 3).toLowerCase();
    return this.dayKeys.find(day => day.toLowerCase() === lower) ?? null;
  }

  private compilePattern(form: ChoreForm): string {
    if (form.scheduleType === 'Weekly') {
      const days = Object.entries(form.weeklyDays)
        .filter(([, selected]) => selected)
        .map(([day]) => day);
      return `Weekly:days=${days.length ? days.join(',') : 'Sun'}`;
    }

    if (form.scheduleType === 'Monthly') {
      return `Monthly:day=${form.monthlyDay || 1};interval=${form.monthlyInterval || 1}`;
    }

    if (form.scheduleType === 'OneTime') {
      return form.oneTimeDate || form.startDate;
    }

    return 'Daily';
  }

  private previewFormOccurrences(form: ChoreForm, days: number): string[] {
    const start = this.localDate(form.startDate);
    const rangeStart = start > this.today() ? start : this.today();
    const rangeEnd = this.addDays(this.today(), days);
    const end = form.endDate ? this.localDate(form.endDate) : rangeEnd;
    const cappedEnd = end < rangeEnd ? end : rangeEnd;
    if (cappedEnd < rangeStart) {
      return [];
    }

    if (form.scheduleType === 'OneTime') {
      const date = this.localDate(form.oneTimeDate || form.startDate);
      return date >= rangeStart && date <= cappedEnd ? [this.localDateKey(date)] : [];
    }

    if (form.scheduleType === 'Daily') {
      return this.daysBetween(rangeStart, cappedEnd).map(date => this.localDateKey(date));
    }

    if (form.scheduleType === 'Weekly') {
      const selectedDays = new Set(Object.entries(form.weeklyDays)
        .filter(([, selected]) => selected)
        .map(([day]) => this.dayKeys.indexOf(day)));
      const daysOfWeek = selectedDays.size ? selectedDays : new Set([0]);
      return this.daysBetween(rangeStart, cappedEnd)
        .filter(date => daysOfWeek.has(date.getDay()))
        .map(date => this.localDateKey(date));
    }

    const day = Math.min(Math.max(Number(form.monthlyDay) || 1, 1), 31);
    const interval = Math.min(Math.max(Number(form.monthlyInterval) || 1, 1), 24);
    const dates: string[] = [];
    for (let date = new Date(start.getFullYear(), start.getMonth(), 1); date <= cappedEnd; date = new Date(date.getFullYear(), date.getMonth() + 1, 1)) {
      const monthOffset = ((date.getFullYear() - start.getFullYear()) * 12) + date.getMonth() - start.getMonth();
      if (monthOffset < 0 || monthOffset % interval !== 0) {
        continue;
      }

      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      if (day <= lastDay) {
        const occurrence = new Date(date.getFullYear(), date.getMonth(), day);
        if (occurrence >= rangeStart && occurrence <= cappedEnd) {
          dates.push(this.localDateKey(occurrence));
        }
      }
    }

    return dates;
  }

  private fromTask(chore: ScheduledTask): ChoreForm {
    const form = this.emptyForm();
    form.taskID = chore.taskID;
    form.title = chore.title;
    form.description = chore.description ?? '';
    form.category = this.category(chore);
    form.isActive = chore.isActive;
    form.scheduleType = chore.scheduleType as ChoreScheduleType;
    form.startDate = chore.startDate.slice(0, 10);
    form.endDate = chore.endDate?.slice(0, 10) ?? '';
    form.oneTimeDate = chore.scheduleType === 'OneTime' ? chore.recurrencePattern.slice(0, 10) : form.oneTimeDate;
    form.monthlyDay = Number(this.patternValue(chore.recurrencePattern, 'day') ?? '1');
    form.monthlyInterval = Number(this.patternValue(chore.recurrencePattern, 'interval') ?? '1');

    const weeklyDays = this.patternValue(chore.recurrencePattern, 'days') ?? this.patternBody(chore.recurrencePattern);
    for (const day of weeklyDays.split(',').map(value => value.trim()).filter(Boolean)) {
      const key = this.dayKeys.find(candidate => candidate.toLowerCase() === day.slice(0, 3).toLowerCase());
      if (key) {
        form.weeklyDays[key] = true;
      }
    }

    return form;
  }

  private emptyForm(): ChoreForm {
    const today = this.localDateKey(new Date());
    return {
      taskID: null,
      title: '',
      description: '',
      category: 'Household',
      isActive: true,
      scheduleType: 'Weekly',
      startDate: today,
      endDate: '',
      oneTimeDate: today,
      monthlyDay: 1,
      monthlyInterval: 1,
      weeklyDays: { Sun: false, Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false }
    };
  }

  private weeklyDays(selectedDays: string[] = []): Record<string, boolean> {
    const selected = new Set(selectedDays);
    return {
      Sun: selected.has('Sun'),
      Mon: selected.has('Mon'),
      Tue: selected.has('Tue'),
      Wed: selected.has('Wed'),
      Thu: selected.has('Thu'),
      Fri: selected.has('Fri'),
      Sat: selected.has('Sat')
    };
  }

  private patternBody(pattern: string): string {
    const separator = pattern.indexOf(':');
    return separator >= 0 ? pattern.slice(separator + 1) : pattern;
  }

  private patternValue(pattern: string, key: string): string | null {
    return this.patternBody(pattern)
      .split(';')
      .map(part => part.trim().split('='))
      .find(([name]) => name?.toLowerCase() === key.toLowerCase())?.[1] ?? null;
  }

  private localDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private localDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number(part));
    return new Date(year, month - 1, day);
  }

  private today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private daysBetween(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    for (let date = start; date <= end; date = this.addDays(date, 1)) {
      dates.push(date);
    }

    return dates;
  }

  private addDays(value: Date, days: number): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);
  }
}






