import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../task';
import { MasterScheduleItem, ScheduleGenerationResult, ScheduleGenerationTaskSummary } from '../models/scheduled-task.model';
import { ScheduleActionsComponent } from '../../../shared/schedule-actions/schedule-actions';

type ScheduleScope = 'overdue' | 'today' | 'week' | 'month';
type ScheduleView = 'agenda' | 'calendar';

interface MasterScheduleDay {
  date: string;
  items: MasterScheduleItem[];
  isToday: boolean;
  isInRange: boolean;
}

interface SourceSummary {
  source: string;
  count: number;
}

interface CategorySummary {
  label: string;
  tone: string;
  count: number;
}

interface StatusSummary {
  status: string;
  count: number;
}

interface ReportMetric {
  label: string;
  count: number;
  detail: string;
  tone: string;
  statusFilter?: string;
}

@Component({
  selector: 'app-task-dashboard',
  imports: [CommonModule, FormsModule, ScheduleActionsComponent],
  templateUrl: './task-dashboard.html',
  styleUrl: './task-dashboard.scss'
})
export class TaskDashboard  {
  readonly items = signal<MasterScheduleItem[]>([]);
  readonly anchorDate = signal(this.localDateKey(new Date()));
  readonly scope = signal<ScheduleScope>('today');
  readonly view = signal<ScheduleView>('calendar');
  readonly sourceFilter = signal('');
  readonly categoryFilter = signal('');
  readonly statusFilter = signal('');
  readonly searchFilter = signal('');
  readonly movingItemId = signal<string | null>(null);
  readonly moveDate = signal('');
  readonly actionNote = signal('');
  readonly actionId = signal<string | null>(null);
  readonly generationFrom = signal(this.localDateKey(new Date()));
  readonly generationTo = signal(this.localDateKey(this.addDays(new Date(), 30)));
  readonly generationTaskType = signal('');
  readonly generationMissingOnly = signal(true);
  readonly generationLoading = signal(false);
  readonly generationPreviewLoading = signal(false);
  readonly generationPreview = signal<ScheduleGenerationResult | null>(null);
  readonly generationResult = signal<ScheduleGenerationResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sourceFilteredItems = computed(() => this.sourceFilter()
    ? this.items().filter(item => item.source === this.sourceFilter())
    : this.items());
  readonly categoryFilteredItems = computed(() => this.categoryFilter()
    ? this.sourceFilteredItems().filter(item => this.categoryLabel(item) === this.categoryFilter())
    : this.sourceFilteredItems());
  readonly statusFilteredItems = computed(() => {
    const status = this.statusFilter();
    if (!status) {
      return this.categoryFilteredItems();
    }

    if (status === 'Open') {
      return this.categoryFilteredItems().filter(item => item.status === 'Scheduled' || item.status === 'Missed');
    }

    return this.categoryFilteredItems().filter(item => item.status === status);
  });
  readonly filteredItems = computed(() => {
    const term = this.searchFilter().trim().toLowerCase();
    if (!term) {
      return this.statusFilteredItems();
    }

    return this.statusFilteredItems().filter(item => this.searchHaystack(item).includes(term));
  });
  readonly days = computed(() => this.groupDays(this.filteredItems(), false));
  readonly calendarDays = computed(() => this.groupDays(this.filteredItems(), true));
  readonly sourceSummaries = computed(() => this.summarizeSources(this.items()));
  readonly categorySummaries = computed(() => this.summarizeCategories(this.sourceFilteredItems()));
  readonly statusSummaries = computed(() => this.summarizeStatuses(this.categoryFilteredItems()));
  readonly statusFilteredCount = computed(() => this.statusFilteredItems().length);
  readonly hasActiveFilters = computed(() => !!this.sourceFilter() || !!this.categoryFilter() || !!this.statusFilter() || !!this.searchFilter().trim());
  readonly activeFilterChips = computed(() => this.buildActiveFilterChips());
  readonly dateRange = computed(() => this.scopeRange(this.anchorDate(), this.scope()));
  readonly openCount = computed(() => this.filteredItems().filter(item => item.status === 'Scheduled').length);
  readonly completedCount = computed(() => this.filteredItems().filter(item => item.status === 'Completed').length);
  readonly skippedCount = computed(() => this.filteredItems().filter(item => item.status === 'Skipped').length);
  readonly overdueCount = computed(() => this.items().filter(item => this.isOverdueItem(item)).length);
  readonly actionableCount = computed(() => this.filteredItems().filter(item => item.canComplete || item.canMove || item.canSkip || item.canReopen).length);
  readonly reportMetrics = computed(() => this.buildReportMetrics());
  readonly reportSourceBreakdown = computed(() => this.summarizeSources(this.filteredItems()).slice(0, 8));
  readonly reportCategoryBreakdown = computed(() => this.summarizeCategories(this.filteredItems()).slice(0, 10));
  readonly attentionItems = computed(() => this.filteredItems()
    .filter(item => this.isOpenItem(item))
    .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate)
      || left.source.localeCompare(right.source)
      || left.title.localeCompare(right.title))
    .slice(0, 8));

  constructor(private readonly service: TaskService, private readonly route: ActivatedRoute) {
    const source = this.route.snapshot.queryParamMap.get('source');
    if (source) {
      this.sourceFilter.set(source);
    }
    this.loadSchedule();
  }

  selectScope(scope: ScheduleScope): void {
    this.scope.set(scope);
    this.loadSchedule();
  }

  setAnchorDate(value: string): void {
    if (!value) {
      return;
    }

    this.anchorDate.set(value);
    this.loadSchedule();
  }

  setView(view: ScheduleView): void {
    this.view.set(view);
  }

  setSourceFilter(source: string): void {
    this.sourceFilter.set(source);
    if (this.categoryFilter() && !this.sourceFilteredItems().some(item => this.categoryLabel(item) === this.categoryFilter())) {
      this.categoryFilter.set('');
    }

    if (this.statusFilter() && this.statusFilteredCount() === 0) {
      this.statusFilter.set('');
    }
  }

  setCategoryFilter(category: string): void {
    this.categoryFilter.set(category);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
  }

  setSearchFilter(value: string): void {
    this.searchFilter.set(value);
  }

  clearFilter(kind: 'source' | 'category' | 'status' | 'search'): void {
    if (kind === 'source') {
      this.sourceFilter.set('');
      this.categoryFilter.set('');
    } else if (kind === 'category') {
      this.categoryFilter.set('');
    } else if (kind === 'status') {
      this.statusFilter.set('');
    } else {
      this.searchFilter.set('');
    }
  }

  clearFilters(): void {
    this.sourceFilter.set('');
    this.categoryFilter.set('');
    this.statusFilter.set('');
    this.searchFilter.set('');
  }

  loadSchedule(): void {
    const range = this.dateRange();
    this.loading.set(true);
    this.error.set(null);
    this.service.getMasterSchedule(range.from, range.to).subscribe({
      next: items => this.items.set(items),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to load the schedule.'),
      complete: () => this.loading.set(false)
    });
  }


  previewMissingOccurrences(): void {
    if (!this.validateGenerationRange()) {
      return;
    }

    this.generationPreviewLoading.set(true);
    this.error.set(null);
    this.generationPreview.set(null);
    this.generationResult.set(null);
    this.service.previewMissingOccurrences(this.generationFrom(), this.generationTo(), this.generationTaskType() || null).subscribe({
      next: result => this.generationPreview.set(result),
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to preview missing occurrences.'),
      complete: () => this.generationPreviewLoading.set(false)
    });
  }

  generateMissingOccurrences(): void {
    if (!this.validateGenerationRange()) {
      return;
    }

    this.generationLoading.set(true);
    this.error.set(null);
    this.generationResult.set(null);
    this.service.generateMissingOccurrences(this.generationFrom(), this.generationTo(), this.generationTaskType() || null).subscribe({
      next: result => {
        this.generationResult.set(result);
        this.generationPreview.set(null);
        this.loadSchedule();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to generate missing occurrences.'),
      complete: () => this.generationLoading.set(false)
    });
  }

  private validateGenerationRange(): boolean {
    if (!this.generationFrom() || !this.generationTo()) {
      this.error.set('Choose a valid generation date range.');
      return false;
    }

    if (this.generationFrom() > this.generationTo()) {
      this.error.set('Generation start date must be before the end date.');
      return false;
    }

    return true;
  }
  markComplete(item: MasterScheduleItem, note?: string | null): void {
    if (!item.canComplete) {
      return;
    }

    if (item.source === 'Goals') {
      this.actionId.set(item.id);
      this.service.completeGoal(item.sourceId, note).subscribe({
        next: () => {
          this.actionNote.set('');
          this.loadSchedule();
        },
        error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to complete the goal item.'),
        complete: () => this.actionId.set(null)
      });
      return;
    }

    if (!item.occurrenceId) {
      return;
    }

    this.actionId.set(item.id);
    const date = new Date().toISOString();
    this.service.markComplete(item.occurrenceId, date, note).subscribe({
      next: () => {
        this.actionNote.set('');
        this.loadSchedule();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to complete the task.'),
      complete: () => this.actionId.set(null)
    });
  }

  skipItem(item: MasterScheduleItem, note?: string | null): void {
    if (!item.canSkip) {
      return;
    }

    this.actionId.set(item.id);
    if (item.source === 'Goals') {
      this.service.skipGoal(item.sourceId, note ?? 'Skipped from the shared schedule.').subscribe({
        next: () => {
          this.actionNote.set('');
          this.loadSchedule();
        },
        error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to skip the goal item.'),
        complete: () => this.actionId.set(null)
      });
      return;
    }

    if (!item.occurrenceId) {
      this.actionId.set(null);
      return;
    }

    this.service.skipOccurrence(item.occurrenceId, note ?? 'Skipped from the shared schedule.').subscribe({
      next: () => {
        this.actionNote.set('');
        this.loadSchedule();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to skip the task.'),
      complete: () => this.actionId.set(null)
    });
  }

  reopenItem(item: MasterScheduleItem, note?: string | null): void {
    if (!item.canReopen || !item.occurrenceId) {
      return;
    }

    this.actionId.set(item.id);
    this.service.reopenOccurrence(item.occurrenceId, note ?? 'Reopened from the shared schedule.').subscribe({
      next: () => {
        this.actionNote.set('');
        this.loadSchedule();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to reopen the task.'),
      complete: () => this.actionId.set(null)
    });
  }

  startMove(item: MasterScheduleItem): void {
    if (!item.canMove || (item.source !== 'Goals' && !item.occurrenceId)) {
      return;
    }

    this.movingItemId.set(item.id);
    this.moveDate.set(item.scheduledDate.slice(0, 10));
  }

  cancelMove(): void {
    this.movingItemId.set(null);
    this.moveDate.set('');
  }

  moveItem(item: MasterScheduleItem, note?: string | null): void {
    if (!item.canMove || !this.moveDate()) {
      return;
    }

    this.actionId.set(item.id);
    if (item.source === 'Goals') {
      this.service.rescheduleGoal(item.sourceId, this.moveDate(), note ?? `Rescheduled from ${item.scheduledDate.slice(0, 10)}.`).subscribe({
        next: () => {
          this.actionNote.set('');
          this.cancelMove();
          this.loadSchedule();
        },
        error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to reschedule the goal item.'),
        complete: () => this.actionId.set(null)
      });
      return;
    }

    if (!item.occurrenceId) {
      this.actionId.set(null);
      return;
    }

    this.service.moveOccurrence(item.occurrenceId, this.moveDate(), note ?? `Rescheduled from ${item.scheduledDate.slice(0, 10)}.`).subscribe({
      next: () => {
        this.actionNote.set('');
        this.cancelMove();
        this.loadSchedule();
      },
      error: err => this.error.set(typeof err.error === 'string' ? err.error : err.message ?? 'Failed to reschedule the task.'),
      complete: () => this.actionId.set(null)
    });
  }

  dayLabel(date: string): Date {
    return this.localDate(date);
  }

  trackDay(_: number, day: MasterScheduleDay): string {
    return day.date;
  }

  trackItem(_: number, item: MasterScheduleItem): string {
    return item.id;
  }

  sourceTone(source: string): string {
    return source === 'Goals'
      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
      : source === 'Backups'
        ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
        : source === 'Fish'
          ? 'border-blue-200 bg-blue-50 text-blue-800'
          : source === 'Gardening'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-slate-50 text-slate-700';
  }

  itemTone(item: MasterScheduleItem): string {
    if (item.source === 'Goals') {
      return this.goalCategoryTone(item.sourceType);
    }

    return item.source === 'Backups'
      ? 'border-cyan-300 bg-cyan-50 text-cyan-900'
      : item.source === 'Fish'
        ? 'border-blue-300 bg-blue-50 text-blue-900'
        : item.source === 'Gardening'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
          : item.source === 'Chores'
            ? this.choreCategoryTone(item.sourceType)
            : this.sourceTone(item.source);
  }

  categoryLabel(item: MasterScheduleItem): string {
    return (item.source === 'Goals' || item.source === 'Chores') && item.sourceType
      ? item.sourceType
      : item.source;
  }

  statusTone(status: string): string {
    return status === 'Completed'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'Skipped'
        ? 'bg-slate-200 text-slate-700'
        : status === 'Missed'
          ? 'bg-rose-100 text-rose-800'
          : 'bg-amber-100 text-amber-800';
  }

  isMoving(item: MasterScheduleItem): boolean {
    return this.movingItemId() === item.id;
  }

  isActing(item: MasterScheduleItem): boolean {
    return this.actionId() === item.id;
  }

  scheduleCapabilities(item: MasterScheduleItem) {
    return {
      canComplete: item.canComplete,
      canMove: item.canMove,
      canSkip: item.canSkip,
      canReopen: item.canReopen
    };
  }

  itemKindLabel(item: MasterScheduleItem): string {
    return item.source === 'Goals' ? 'Goal item' : 'Generated occurrence';
  }

  filterResultLabel(): string {
    const filtered = this.filteredItems().length;
    const total = this.items().length;
    return this.hasActiveFilters()
      ? `${filtered.toLocaleString()} of ${total.toLocaleString()} shown`
      : `${total.toLocaleString()} shown`;
  }

  scopeLabel(): string {
    const range = this.dateRange();
    return this.scope() === 'overdue'
      ? `Overdue through ${range.to}`
      : range.from === range.to
        ? range.from
        : `${range.from} to ${range.to}`;
  }

  applyReportMetric(metric: ReportMetric): void {
    if (metric.statusFilter) {
      this.setStatusFilter(metric.statusFilter);
    }
  }

  generationTaskRows(result: ScheduleGenerationResult): ScheduleGenerationTaskSummary[] {
    const tasks = result.tasks ?? [];
    const rows = this.generationMissingOnly()
      ? tasks.filter(task => task.missingCount > 0 || task.createdCount > 0)
      : tasks;

    return [...rows].sort((left, right) =>
      right.missingCount - left.missingCount
      || right.createdCount - left.createdCount
      || left.source.localeCompare(right.source)
      || left.title.localeCompare(right.title));
  }

  generationReportLabel(result: ScheduleGenerationResult): string {
    const rows = this.generationTaskRows(result).length;
    const total = (result.tasks ?? []).length;
    return this.generationMissingOnly()
      ? `${rows.toLocaleString()} of ${total.toLocaleString()} tasks with missing/created occurrences`
      : `${total.toLocaleString()} active tasks checked`;
  }

  downloadGenerationReportCsv(result: ScheduleGenerationResult, mode: 'preview' | 'result'): void {
    const rows = this.generationTaskRows(result).map(task => [
      task.source,
      task.taskType,
      task.taskID.toString(),
      task.title,
      task.missingCount.toString(),
      task.createdCount.toString()
    ]);

    this.downloadCsv(`master-schedule-generation-${mode}-${this.localDateKey(new Date())}.csv`, [
      ['Source', 'Task Type', 'Task ID', 'Title', 'Missing Count', 'Created Count'],
      ...rows
    ]);
  }

  generationSourceTone(source: string): string {
    return this.sourceTone(source);
  }

  downloadScheduleReportCsv(): void {
    const rows = this.filteredItems().map(item => [
      item.scheduledDate.slice(0, 10),
      item.source,
      this.categoryLabel(item),
      item.status,
      item.title,
      item.detail ?? '',
      item.windowStart?.slice(0, 10) ?? '',
      item.windowEnd?.slice(0, 10) ?? '',
      item.percentComplete?.toString() ?? '',
      this.itemKindLabel(item)
    ]);

    this.downloadCsv(`master-schedule-${this.scope()}-${this.localDateKey(new Date())}.csv`, [
      ['Date', 'Source', 'Category', 'Status', 'Title', 'Detail', 'Window Start', 'Window End', 'Percent Complete', 'Kind'],
      ...rows
    ]);
  }

  statusCount(status: string): number {
    if (status === 'Open') {
      return this.categoryFilteredItems().filter(item => this.isOpenItem(item)).length;
    }

    return this.categoryFilteredItems().filter(item => item.status === status).length;
  }

  occurrenceBehavior(): { label: string; detail: string }[] {
    return [
      {
        label: 'Move',
        detail: 'Changes only the selected occurrence date and reopens skipped or missed work as scheduled. The parent recurrence is unchanged.'
      },
      {
        label: 'Complete',
        detail: 'Marks the selected occurrence complete. For Goals, this completes the underlying plan item and removes it from open schedule views.'
      },
      {
        label: 'Skip',
        detail: 'For recurring tasks, skips only the selected occurrence. For Goals, removes that goal item from shared schedule views without completing it.'
      },
      {
        label: 'Reopen',
        detail: 'Returns a skipped, missed, or completed occurrence to scheduled. Backup logs created by a previous completion are cleaned up.'
      }
    ];
  }

  private buildReportMetrics(): ReportMetric[] {
    const items = this.filteredItems();
    const open = items.filter(item => item.status === 'Scheduled').length;
    const missed = items.filter(item => item.status === 'Missed').length;
    const completed = items.filter(item => item.status === 'Completed').length;
    const skipped = items.filter(item => item.status === 'Skipped').length;
    const actionable = items.filter(item => item.canComplete || item.canMove || item.canSkip || item.canReopen).length;

    return [
      {
        label: 'Open',
        count: open + missed,
        detail: `${open.toLocaleString()} scheduled / ${missed.toLocaleString()} missed`,
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        statusFilter: 'Open'
      },
      {
        label: 'Actionable',
        count: actionable,
        detail: 'Can be completed, moved, skipped, or reopened',
        tone: 'border-blue-200 bg-blue-50 text-blue-900'
      },
      {
        label: 'Completed',
        count: completed,
        detail: 'Done inside this range',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        statusFilter: 'Completed'
      },
      {
        label: 'Skipped',
        count: skipped,
        detail: 'Skipped inside this range',
        tone: 'border-slate-200 bg-slate-50 text-slate-700',
        statusFilter: 'Skipped'
      }
    ];
  }

  private buildActiveFilterChips(): { kind: 'source' | 'category' | 'status' | 'search'; label: string; value: string }[] {
    const chips: { kind: 'source' | 'category' | 'status' | 'search'; label: string; value: string }[] = [];
    if (this.sourceFilter()) {
      chips.push({ kind: 'source', label: 'Source', value: this.sourceFilter() });
    }

    if (this.categoryFilter()) {
      chips.push({ kind: 'category', label: 'Category', value: this.categoryFilter() });
    }

    if (this.statusFilter()) {
      chips.push({ kind: 'status', label: 'Status', value: this.statusFilter() });
    }

    const search = this.searchFilter().trim();
    if (search) {
      chips.push({ kind: 'search', label: 'Search', value: search });
    }

    return chips;
  }

  private searchHaystack(item: MasterScheduleItem): string {
    return [
      item.title,
      item.detail,
      item.source,
      item.sourceType,
      item.status,
      this.categoryLabel(item),
      this.itemKindLabel(item)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private groupDays(items: MasterScheduleItem[], includeEmptyDays: boolean): MasterScheduleDay[] {
    const groups = new Map<string, MasterScheduleItem[]>();
    for (const item of items) {
      const date = item.scheduledDate.slice(0, 10);
      const dayItems = groups.get(date) ?? [];
      dayItems.push(item);
      groups.set(date, dayItems);
    }

    if (includeEmptyDays) {
      const range = this.dateRange();
      for (let date = this.localDate(range.from); this.localDateKey(date) <= range.to; date = this.addDays(date, 1)) {
        const key = this.localDateKey(date);
        if (!groups.has(key)) {
          groups.set(key, []);
        }
      }
    }

    const range = this.dateRange();
    const today = this.localDateKey(new Date());
    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, dayItems]) => ({
        date,
        isToday: date === today,
        isInRange: date >= range.from && date <= range.to,
        items: dayItems.sort((left, right) =>
          left.source.localeCompare(right.source)
          || left.sourceType.localeCompare(right.sourceType)
          || left.title.localeCompare(right.title))
      }));
  }

  private summarizeSources(items: MasterScheduleItem[]): SourceSummary[] {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.source, (counts.get(item.source) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([source, count]) => ({ source, count }));
  }

  private summarizeStatuses(items: MasterScheduleItem[]): StatusSummary[] {
    const preferred = ['Scheduled', 'Missed', 'Completed', 'Skipped'];
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([left], [right]) => {
        const leftIndex = preferred.indexOf(left);
        const rightIndex = preferred.indexOf(right);
        if (leftIndex >= 0 || rightIndex >= 0) {
          return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
        }
        return left.localeCompare(right);
      })
      .map(([status, count]) => ({ status, count }));
  }

  private summarizeCategories(items: MasterScheduleItem[]): CategorySummary[] {
    const summaries = new Map<string, CategorySummary>();
    for (const item of items) {
      const label = this.categoryLabel(item);
      const existing = summaries.get(label);
      if (existing) {
        existing.count += 1;
      } else {
        summaries.set(label, { label, tone: this.itemTone(item), count: 1 });
      }
    }

    return [...summaries.values()].sort((left, right) => left.label.localeCompare(right.label));
  }

  private goalCategoryTone(category: string): string {
    const normalized = category.toLowerCase();
    if (normalized.includes('listen') || normalized.includes('music')) {
      return 'border-violet-300 bg-violet-50 text-violet-900';
    }

    if (normalized.includes('read') || normalized.includes('book')) {
      return 'border-amber-300 bg-amber-50 text-amber-900';
    }

    if (normalized.includes('watch') || normalized.includes('movie') || normalized.includes('film') || normalized.includes('show')) {
      return 'border-rose-300 bg-rose-50 text-rose-900';
    }

    if (normalized.includes('gaming') || normalized.includes('game') || normalized.includes('warhammer') || normalized.includes('rpg')) {
      return 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900';
    }

    if (normalized.includes('house') || normalized.includes('yard') || normalized.includes('garage')) {
      return 'border-orange-300 bg-orange-50 text-orange-900';
    }

    if (normalized.includes('learn') || normalized.includes('program') || normalized.includes('mcse') || normalized.includes('cert')) {
      return 'border-sky-300 bg-sky-50 text-sky-900';
    }

    if (normalized.includes('fitness') || normalized.includes('workout') || normalized.includes('health')) {
      return 'border-lime-300 bg-lime-50 text-lime-900';
    }

    if (normalized.includes('holiday') || normalized.includes('christmas') || normalized.includes('xmas')) {
      return 'border-red-300 bg-red-50 text-red-900';
    }

    if (normalized.includes('write') || normalized.includes('blog')) {
      return 'border-teal-300 bg-teal-50 text-teal-900';
    }

    if (normalized.includes('personal') || normalized.includes('family')) {
      return 'border-pink-300 bg-pink-50 text-pink-900';
    }

    return 'border-slate-300 bg-slate-50 text-slate-800';
  }

  private choreCategoryTone(category: string): string {
    return category === 'Medical'
      ? 'border-rose-300 bg-rose-50 text-rose-900'
      : category === 'Pets'
        ? 'border-sky-300 bg-sky-50 text-sky-900'
        : category === 'Cleaning'
          ? 'border-teal-300 bg-teal-50 text-teal-900'
          : category === 'Errands'
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-orange-300 bg-orange-50 text-orange-900';
  }

  private isOpenItem(item: MasterScheduleItem): boolean {
    return item.status === 'Scheduled' || item.status === 'Missed';
  }

  private isOverdueItem(item: MasterScheduleItem): boolean {
    const today = this.localDateKey(new Date());
    return item.scheduledDate.slice(0, 10) < today && item.status !== 'Completed' && item.status !== 'Skipped';
  }

  private downloadCsv(filename: string, rows: string[][]): void {
    const csv = rows
      .map(row => row.map(value => this.escapeCsv(value)).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: string): string {
    const escaped = value.replace(/"/g, '""');
    return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
  }

  private scopeRange(anchor: string, scope: ScheduleScope): { from: string; to: string } {
    const date = this.localDate(anchor);
    if (scope === 'overdue') {
      return {
        from: this.localDateKey(new Date(date.getFullYear(), 0, 1)),
        to: this.localDateKey(this.addDays(date, -1))
      };
    }

    if (scope === 'week') {
      const dayOffset = (date.getDay() + 6) % 7;
      const weekStart = this.addDays(date, -dayOffset);
      return {
        from: this.localDateKey(weekStart),
        to: this.localDateKey(this.addDays(weekStart, 6))
      };
    }

    if (scope === 'month') {
      return {
        from: this.localDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
        to: this.localDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0))
      };
    }

    return { from: anchor, to: anchor };
  }

  private localDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number(part));
    return new Date(year, month - 1, day);
  }

  private localDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDays(value: Date, days: number): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);
  }
}










