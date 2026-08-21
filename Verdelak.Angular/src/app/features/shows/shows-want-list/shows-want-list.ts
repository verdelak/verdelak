import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CreateShowGoalItems, ShowReportSummary, ShowSeasonReport } from '../models/show.models';
import { ShowsService } from '../shows.service';

type ShowReportMode = 'wanted' | 'missing' | 'watch' | 'rewatch' | 'unwatched' | 'scheduled' | 'unscheduled' | 'all';

interface GoalPlanForm {
  year: number;
  planningWindowType: string;
  targetStartDate: string;
  targetEndDate: string;
  scheduleSurfaceMode: string;
}

@Component({
  selector: 'app-shows-want-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shows-want-list.html',
  styleUrl: './shows-want-list.scss'
})
export class ShowsWantList implements OnInit {
  readonly rows = signal<ShowSeasonReport[]>([]);
  readonly summary = signal<ShowReportSummary | null>(null);
  readonly query = signal('');
  readonly reportMode = signal<ShowReportMode>('wanted');
  readonly loading = signal(false);
  readonly creatingGoalItems = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly selectedSeasonIds = signal<number[]>([]);
  readonly goalPlanForm = signal<GoalPlanForm>(this.emptyGoalPlanForm());

  readonly canCreateGoals = computed(() => this.auth.user()?.role === 'Admin');
  readonly selectableRows = computed(() => this.rows().filter(row => row.seasonId !== null));
  readonly selectedCount = computed(() => this.selectedSeasonIds().length);
  readonly wantedRows = computed(() => this.rows().filter(row => row.isWanted).length);
  readonly missingRows = computed(() => this.rows().filter(row => row.isMissing).length);
  readonly noSeasonRows = computed(() => this.rows().filter(row => row.seasonId === null).length);
  readonly scheduledRows = computed(() => this.rows().filter(row => row.scheduledGoalYears.length > 0).length);
  readonly unscheduledRows = computed(() => this.rows().filter(row => row.seasonId !== null && row.scheduledGoalYears.length === 0).length);

  constructor(
    private readonly shows: ShowsService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.shows.getSeasonReport(this.reportMode(), this.query()).subscribe({
      next: rows => {
        this.rows.set(rows);
        const validIds = new Set(rows.map(row => row.seasonId).filter((id): id is number => id !== null));
        this.selectedSeasonIds.set(this.selectedSeasonIds().filter(id => validIds.has(id)));
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load show report.'),
      complete: () => this.loading.set(false)
    });
  }

  loadSummary(): void {
    this.shows.getReportSummary().subscribe({
      next: summary => this.summary.set(summary),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load show report summary.')
    });
  }

  clear(): void {
    this.query.set('');
    this.reportMode.set('wanted');
    this.selectedSeasonIds.set([]);
    this.load();
  }

  setReportMode(mode: ShowReportMode): void {
    this.reportMode.set(mode);
    this.selectedSeasonIds.set([]);
    this.load();
  }

  toggleSeason(row: ShowSeasonReport, checked: boolean): void {
    if (row.seasonId === null) {
      return;
    }

    const seasonIds = new Set(this.selectedSeasonIds());
    if (checked) {
      seasonIds.add(row.seasonId);
    } else {
      seasonIds.delete(row.seasonId);
    }

    this.selectedSeasonIds.set([...seasonIds].sort((left, right) => left - right));
  }

  selectVisible(): void {
    this.selectedSeasonIds.set(this.selectableRows()
      .map(row => row.seasonId)
      .filter((id): id is number => id !== null)
      .sort((left, right) => left - right));
  }

  selectWanted(): void {
    this.selectedSeasonIds.set(this.selectableRows()
      .filter(row => row.isWanted)
      .map(row => row.seasonId)
      .filter((id): id is number => id !== null)
      .sort((left, right) => left - right));
  }

  selectWatchOrRewatch(): void {
    this.selectedSeasonIds.set(this.selectableRows()
      .filter(row => row.wantToWatch || row.wantToRewatch || !row.isWatched)
      .map(row => row.seasonId)
      .filter((id): id is number => id !== null)
      .sort((left, right) => left - right));
  }

  selectNotYetInGoals(): void {
    this.selectedSeasonIds.set(this.selectableRows()
      .filter(row => row.scheduledGoalYears.length === 0)
      .map(row => row.seasonId)
      .filter((id): id is number => id !== null)
      .sort((left, right) => left - right));
  }

  clearSelection(): void {
    this.selectedSeasonIds.set([]);
  }

  setGoalPlanFormField<K extends keyof GoalPlanForm>(field: K, value: GoalPlanForm[K]): void {
    this.goalPlanForm.set({ ...this.goalPlanForm(), [field]: value });
  }

  setGoalYear(year: number): void {
    const safeYear = Math.max(2000, Math.min(2100, year));
    this.goalPlanForm.set({
      ...this.goalPlanForm(),
      year: safeYear,
      targetStartDate: `${safeYear}-01-01`,
      targetEndDate: `${safeYear}-12-31`
    });
  }

  createGoalItems(): void {
    if (this.selectedSeasonIds().length === 0) {
      this.error.set('Choose at least one season to add to Goals.');
      return;
    }

    const form = this.goalPlanForm();
    const payload: CreateShowGoalItems = {
      year: Number(form.year),
      seasonIds: this.selectedSeasonIds(),
      planningWindowType: form.planningWindowType,
      targetStartDate: this.valueOrNull(form.targetStartDate),
      targetEndDate: this.valueOrNull(form.targetEndDate),
      scheduleSurfaceMode: form.scheduleSurfaceMode
    };

    this.creatingGoalItems.set(true);
    this.error.set(null);
    this.message.set(null);
    this.shows.createGoalItemsBatch(payload).subscribe({
      next: result => {
        this.message.set(`Added ${result.createdCount} show season${result.createdCount === 1 ? '' : 's'} to ${result.year} Goals under ${result.sectionTitle}. ${result.skippedDuplicateCount} duplicate${result.skippedDuplicateCount === 1 ? '' : 's'} skipped.`);
        this.clearSelection();
        this.loadSummary();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to add show seasons to Goals.'),
      complete: () => this.creatingGoalItems.set(false)
    });
  }


  downloadReportCsv(): void {
    const rows = [
      ['reportMode', 'seriesTitle', 'seasonLabel', 'seasonNumber', 'ownership', 'watchStatus', 'format', 'ownedByBoxSet', 'boxsets', 'scheduledGoalYears'],
      ...this.rows().map(row => [
        this.reportMode(),
        row.seriesTitle,
        row.seasonLabel,
        row.seasonNumber?.toString() ?? '',
        this.ownershipLabel(row),
        this.watchLabel(row),
        row.format ?? '',
        row.isOwnedByBoxSet ? 'Yes' : 'No',
        row.ownedBoxSetNames.join('; '),
        row.scheduledGoalYears.join('; ')
      ])
    ];
    this.downloadCsv(`shows-${this.reportMode()}-report.csv`, rows);
  }

  downloadSelectedCsv(): void {
    const selected = new Set(this.selectedSeasonIds());
    const rows = [
      ['goalYear', 'goalsStatus', 'planningWindow', 'targetStart', 'targetEnd', 'seriesTitle', 'seasonLabel', 'ownership', 'watchStatus', 'format', 'alreadyScheduledGoalYears'],
      ...this.rows()
        .filter(row => row.seasonId !== null && selected.has(row.seasonId))
        .map(row => [
          String(this.goalPlanForm().year),
          this.goalPlanForm().scheduleSurfaceMode === 'Never' ? 'Unscheduled' : 'Scheduled',
          this.goalPlanForm().planningWindowType,
          this.goalPlanForm().targetStartDate,
          this.goalPlanForm().targetEndDate,
          row.seriesTitle,
          row.seasonLabel,
          this.ownershipLabel(row),
          this.watchLabel(row),
          row.format ?? '',
          row.scheduledGoalYears.join('; ')
        ])
    ];
    this.downloadCsv('shows-selected-goals-batch.csv', rows);
  }

  private downloadCsv(filename: string, rows: string[][]): void {
    const csv = rows.map(row => row.map(value => this.csvCell(value)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string): string {
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }
  ownershipLabel(row: ShowSeasonReport): string {
    if (row.isDirectlyOwned || row.isOwnedByBoxSet) {
      return row.isOwnedByBoxSet && !row.isDirectlyOwned ? 'Boxset owned' : 'Owned';
    }

    return row.isWanted ? 'Wanted' : 'Missing';
  }

  ownershipTone(row: ShowSeasonReport): string {
    if (row.isDirectlyOwned || row.isOwnedByBoxSet) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }

    return row.isWanted
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-rose-200 bg-rose-50 text-rose-800';
  }

  scheduledGoalsLabel(row: ShowSeasonReport): string {
    return row.scheduledGoalYears.length ? row.scheduledGoalYears.join(', ') : '-';
  }

  watchLabel(row: ShowSeasonReport): string {
    if (row.wantToRewatch) {
      return 'Rewatch';
    }

    if (row.wantToWatch) {
      return 'Watch';
    }

    return row.isWatched ? 'Watched' : 'Unwatched';
  }

  private emptyGoalPlanForm(): GoalPlanForm {
    const year = new Date().getFullYear() + 1;
    return {
      year,
      planningWindowType: 'Year',
      targetStartDate: `${year}-01-01`,
      targetEndDate: `${year}-12-31`,
      scheduleSurfaceMode: 'DuringTargetWindow'
    };
  }

  private valueOrNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}


