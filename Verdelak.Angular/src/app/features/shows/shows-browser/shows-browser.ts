import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BulkAddShowSeasons, CreateShowGoalItems, ShowBoxSet, ShowSeason, ShowSeriesDetail, ShowSeriesSummary, UpsertShowBoxSet, UpsertShowSeason, UpsertShowSeries } from '../models/show.models';
import { ShowsService } from '../shows.service';

type StatusFilter = 'all' | 'owned' | 'wanted' | 'missing';
type WatchFilter = 'all' | 'watch' | 'rewatch' | 'watched' | 'unwatched';
type SortKey = 'title' | 'owned' | 'wanted' | 'watch';

interface SeriesForm {
  id: number | null;
  title: string;
  sortTitle: string;
  notes: string;
  wantToWatch: boolean;
  wantToRewatch: boolean;
}

interface SeasonForm {
  id: number | null;
  seasonNumber: number | null;
  seasonLabel: string;
  statusID: 'H' | 'W';
  format: string;
  isWatched: boolean;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  lastWatchedDate: string;
  notes: string;
}

interface BulkSeasonForm {
  startSeason: number;
  endSeason: number;
  statusID: 'H' | 'W';
  format: string;
  wantToWatch: boolean;
  wantToRewatch: boolean;
  notes: string;
}

interface BoxSetForm {
  id: number | null;
  name: string;
  statusID: 'H' | 'W';
  format: string;
  isCompleteSeries: boolean;
  seasonIds: number[];
  startSeason: number | null;
  endSeason: number | null;
  notes: string;
}

interface GoalPlanForm {
  year: number;
  planningWindowType: string;
  targetStartDate: string;
  targetEndDate: string;
  scheduleSurfaceMode: string;
}

interface SeasonOwnershipMapRow {
  season: ShowSeason;
  ownershipLabel: string;
  ownershipTone: 'owned' | 'wanted' | 'missing';
  sourceLabel: string;
  watchLabel: string;
  isGoalCandidate: boolean;
}

@Component({
  selector: 'app-shows-browser',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shows-browser.html',
  styleUrl: './shows-browser.scss'
})
export class ShowsBrowser implements OnInit {
  readonly series = signal<ShowSeriesSummary[]>([]);
  readonly selected = signal<ShowSeriesDetail | null>(null);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly watch = signal<WatchFilter>('all');
  readonly sortKey = signal<SortKey>('title');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly editingSeries = signal(false);
  readonly editingSeason = signal(false);
  readonly bulkAddingSeasons = signal(false);
  readonly editingBoxSet = signal(false);
  readonly creatingGoalItems = signal(false);
  readonly seriesForm = signal<SeriesForm>(this.emptySeriesForm());
  readonly seasonForm = signal<SeasonForm>(this.emptySeasonForm());
  readonly bulkSeasonForm = signal<BulkSeasonForm>(this.emptyBulkSeasonForm());
  readonly boxSetForm = signal<BoxSetForm>(this.emptyBoxSetForm());
  readonly goalPlanForm = signal<GoalPlanForm>(this.emptyGoalPlanForm());
  readonly selectedGoalSeasonIds = signal<number[]>([]);

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly canCreateGoals = computed(() => this.auth.user()?.role === 'Admin');
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly ownedOnPage = computed(() => this.series().reduce((sum, item) => sum + item.ownedSeasonCount, 0));
  readonly wantedOnPage = computed(() => this.series().reduce((sum, item) => sum + item.wantedSeasonCount, 0));
  readonly watchListOnPage = computed(() => this.series().filter(item => item.wantToWatch || item.wantToRewatch).length);
  readonly effectiveOwnedSeasonCount = computed(() => this.selected()?.seasons.filter(season => this.isEffectivelyOwned(season)).length ?? 0);
  readonly wantedSeasonCount = computed(() => this.selected()?.seasons.filter(season => season.statusID === 'W').length ?? 0);
  readonly missingOwnedSeasonCount = computed(() => this.selected()?.ownershipGaps.filter(gap => !gap.isDirectlyOwned && !gap.isOwnedByBoxSet).length ?? 0);
  readonly goalCandidateSeasons = computed(() => (this.selected()?.seasons ?? []).filter(season =>
    season.wantToWatch || season.wantToRewatch || !season.isWatched));
  readonly ownershipMapRows = computed<SeasonOwnershipMapRow[]>(() => (this.selected()?.seasons ?? []).map(season => {
    const isDirectlyOwned = season.statusID === 'H';
    const isOwnedByBoxSet = season.isOwnedByBoxSet;
    const isOwned = isDirectlyOwned || isOwnedByBoxSet;
    const isGoalCandidate = season.wantToWatch || season.wantToRewatch || !season.isWatched;

    return {
      season,
      ownershipLabel: isOwned ? 'Owned' : season.statusID === 'W' ? 'Wanted' : 'Missing',
      ownershipTone: isOwned ? 'owned' : season.statusID === 'W' ? 'wanted' : 'missing',
      sourceLabel: isDirectlyOwned
        ? 'Direct season'
        : isOwnedByBoxSet
          ? `Boxset: ${season.ownedBoxSetNames.join(', ')}`
          : 'No owned source',
      watchLabel: season.isWatched
        ? 'Watched'
        : season.wantToRewatch
          ? 'Rewatch'
          : season.wantToWatch
            ? 'Watch'
            : 'Open',
      isGoalCandidate
    };
  }));
  readonly directOwnedSeasonCount = computed(() => this.selected()?.seasons.filter(season => season.statusID === 'H').length ?? 0);
  readonly boxSetOwnedSeasonCount = computed(() => this.selected()?.seasons.filter(season => season.statusID !== 'H' && season.isOwnedByBoxSet).length ?? 0);
  readonly ownershipCoveragePercent = computed(() => {
    const seasonCount = this.selected()?.seasons.length ?? 0;
    if (seasonCount === 0) {
      return 0;
    }

    return Math.round((this.effectiveOwnedSeasonCount() / seasonCount) * 100);
  });

  constructor(
    private readonly shows: ShowsService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.shows.list({
      q: this.query(),
      status: this.status(),
      watch: this.watch(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.series.set(result.items);
        this.total.set(result.total);
        const selected = this.selected();
        if (selected && !result.items.some(item => item.id === selected.id)) {
          this.selected.set(null);
          this.cancelForms();
        }
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load shows.'),
      complete: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.status.set('all');
    this.watch.set('all');
    this.sortKey.set('title');
    this.sortDirection.set('asc');
    this.load(1);
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }

    this.load(1);
  }

  selectSeries(item: ShowSeriesSummary): void {
    this.detailLoading.set(true);
    this.error.set(null);
    this.shows.get(item.id).subscribe({
      next: detail => {
        this.selected.set(detail);
        this.editingSeason.set(false);
        this.selectedGoalSeasonIds.set(this.goalCandidateIds(detail));
        this.seasonForm.set(this.emptySeasonForm());
        if (this.editingSeries()) {
          this.loadSeriesForm(detail);
        }
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load show details.'),
      complete: () => this.detailLoading.set(false)
    });
  }

  startNewSeries(): void {
    this.selected.set(null);
    this.editingSeason.set(false);
    this.editingSeries.set(true);
    this.seriesForm.set(this.emptySeriesForm());
  }

  editSelectedSeries(): void {
    const detail = this.selected();
    if (!detail) {
      return;
    }

    this.editingSeries.set(true);
    this.loadSeriesForm(detail);
  }

  saveSeries(): void {
    const form = this.seriesForm();
    if (!form.title.trim()) {
      this.error.set('Title is required.');
      return;
    }

    const payload: UpsertShowSeries = {
      title: form.title.trim(),
      sortTitle: this.valueOrNull(form.sortTitle),
      notes: this.valueOrNull(form.notes),
      wantToWatch: form.wantToWatch,
      wantToRewatch: form.wantToRewatch
    };

    const request = form.id
      ? this.shows.updateSeries(form.id, payload)
      : this.shows.createSeries(payload);

    request.subscribe({
      next: detail => {
        this.selected.set(detail);
        this.selectedGoalSeasonIds.set(this.goalCandidateIds(detail));
        this.editingSeries.set(false);
        this.message.set(form.id ? 'Show updated.' : 'Show added.');
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save show.')
    });
  }

  deleteSelectedSeries(): void {
    const detail = this.selected();
    if (!detail || !confirm(`Delete ${detail.title}?`)) {
      return;
    }

    this.shows.deleteSeries(detail.id).subscribe({
      next: () => {
        this.message.set('Show deleted.');
        this.selected.set(null);
        this.cancelForms();
        this.load(1);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete show.')
    });
  }

  startNewSeason(): void {
    if (!this.selected()) {
      return;
    }

    this.editingSeason.set(true);
    this.seasonForm.set(this.emptySeasonForm());
  }

  startNewBoxSet(): void {
    this.editingSeason.set(false);
    this.bulkAddingSeasons.set(false);
    this.editingBoxSet.set(true);
    this.boxSetForm.set(this.emptyBoxSetForm());
  }

  editBoxSet(boxSet: ShowBoxSet): void {
    this.editingSeason.set(false);
    this.bulkAddingSeasons.set(false);
    this.editingBoxSet.set(true);
    this.boxSetForm.set({
      id: boxSet.id,
      name: boxSet.name,
      statusID: boxSet.statusID,
      format: boxSet.format ?? '',
      isCompleteSeries: boxSet.isCompleteSeries,
      seasonIds: [...boxSet.seasonIds],
      startSeason: null,
      endSeason: null,
      notes: boxSet.notes ?? ''
    });
  }

  startBulkAddSeasons(): void {
    const existingSeasonNumbers = this.selected()?.seasons.map(season => season.seasonNumber ?? 0) ?? [0];
    const nextSeason = Math.max(0, ...existingSeasonNumbers) + 1;
    this.editingSeason.set(false);
    this.bulkAddingSeasons.set(true);
    this.bulkSeasonForm.set({
      ...this.emptyBulkSeasonForm(),
      startSeason: nextSeason,
      endSeason: nextSeason
    });
  }

  editSeason(season: ShowSeason): void {
    this.editingSeason.set(true);
    this.seasonForm.set({
      id: season.id,
      seasonNumber: season.seasonNumber,
      seasonLabel: season.seasonLabel,
      statusID: season.statusID,
      format: season.format ?? '',
      isWatched: season.isWatched,
      wantToWatch: season.wantToWatch,
      wantToRewatch: season.wantToRewatch,
      lastWatchedDate: season.lastWatchedDate ?? '',
      notes: season.notes ?? ''
    });
  }

  saveSeason(): void {
    const selected = this.selected();
    if (!selected) {
      return;
    }

    const form = this.seasonForm();
    const payload: UpsertShowSeason = {
      seasonNumber: form.seasonNumber,
      seasonLabel: this.valueOrNull(form.seasonLabel),
      statusID: form.statusID,
      format: this.valueOrNull(form.format),
      isWatched: form.isWatched,
      wantToWatch: form.wantToWatch,
      wantToRewatch: form.wantToRewatch,
      lastWatchedDate: this.valueOrNull(form.lastWatchedDate),
      notes: this.valueOrNull(form.notes)
    };

    const request = form.id
      ? this.shows.updateSeason(form.id, payload)
      : this.shows.createSeason(selected.id, payload);

    request.subscribe({
      next: detail => {
        this.selected.set(detail);
        this.selectedGoalSeasonIds.set(this.goalCandidateIds(detail));
        this.editingSeason.set(false);
        this.seasonForm.set(this.emptySeasonForm());
        this.message.set(form.id ? 'Season updated.' : 'Season added.');
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save season.')
    });
  }

  saveBulkSeasons(): void {
    const selected = this.selected();
    if (!selected) {
      return;
    }

    const form = this.bulkSeasonForm();
    if (form.endSeason < form.startSeason) {
      this.error.set('End season must be greater than or equal to start season.');
      return;
    }

    const payload: BulkAddShowSeasons = {
      startSeason: form.startSeason,
      endSeason: form.endSeason,
      statusID: form.statusID,
      format: this.valueOrNull(form.format),
      wantToWatch: form.wantToWatch,
      wantToRewatch: form.wantToRewatch,
      notes: this.valueOrNull(form.notes)
    };

    this.shows.bulkCreateSeasons(selected.id, payload).subscribe({
      next: detail => {
        this.selected.set(detail);
        this.selectedGoalSeasonIds.set(this.goalCandidateIds(detail));
        this.bulkAddingSeasons.set(false);
        this.bulkSeasonForm.set(this.emptyBulkSeasonForm());
        this.message.set('Season range added.');
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to add season range.')
    });
  }

  saveBoxSet(): void {
    const selected = this.selected();
    if (!selected) {
      return;
    }

    const form = this.boxSetForm();
    if (!form.name.trim()) {
      this.error.set('Boxset name is required.');
      return;
    }

    const payload: UpsertShowBoxSet = {
      name: form.name.trim(),
      statusID: form.statusID,
      format: this.valueOrNull(form.format),
      isCompleteSeries: form.isCompleteSeries,
      seasonIds: form.isCompleteSeries ? [] : form.seasonIds,
      startSeason: form.isCompleteSeries ? null : form.startSeason,
      endSeason: form.isCompleteSeries ? null : form.endSeason,
      notes: this.valueOrNull(form.notes)
    };

    const request = form.id
      ? this.shows.updateBoxSet(form.id, payload)
      : this.shows.createBoxSet(selected.id, payload);

    request.subscribe({
      next: detail => {
        this.selected.set(detail);
        this.selectedGoalSeasonIds.set(this.goalCandidateIds(detail));
        this.editingBoxSet.set(false);
        this.boxSetForm.set(this.emptyBoxSetForm());
        this.message.set(form.id ? 'Boxset updated.' : 'Boxset added.');
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save boxset.')
    });
  }

  deleteBoxSet(boxSet: ShowBoxSet): void {
    if (!confirm(`Delete ${boxSet.name}?`)) {
      return;
    }

    this.shows.deleteBoxSet(boxSet.id).subscribe({
      next: detail => {
        this.selected.set(detail);
        this.selectedGoalSeasonIds.set(this.goalCandidateIds(detail));
        this.message.set('Boxset deleted.');
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete boxset.')
    });
  }


  deleteSeason(season: ShowSeason): void {
    if (!confirm(`Delete ${season.seasonLabel}?`)) {
      return;
    }

    this.shows.deleteSeason(season.id).subscribe({
      next: detail => {
        this.selected.set(detail);
        this.selectedGoalSeasonIds.set(this.goalCandidateIds(detail));
        this.message.set('Season deleted.');
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete season.')
    });
  }


  downloadOwnershipMapCsv(): void {
    const detail = this.selected();
    if (!detail) {
      return;
    }

    const rows = [
      ['show', 'seasonLabel', 'seasonNumber', 'ownership', 'source', 'watchStatus', 'format', 'lastWatched', 'notes'],
      ...this.ownershipMapRows().map(row => [
        detail.title,
        row.season.seasonLabel,
        row.season.seasonNumber?.toString() ?? '',
        row.ownershipLabel,
        row.sourceLabel,
        row.watchLabel,
        row.season.format ?? '',
        row.season.lastWatchedDate ?? '',
        row.season.notes ?? ''
      ])
    ];
    this.downloadCsv(`${this.fileSlug(detail.title)}-ownership-map.csv`, rows);
  }

  downloadBoxSetsCsv(): void {
    const detail = this.selected();
    if (!detail) {
      return;
    }

    const rows = [
      ['show', 'boxset', 'status', 'format', 'completeSeries', 'includedSeasons', 'notes'],
      ...detail.boxSets.map(boxSet => [
        detail.title,
        boxSet.name,
        boxSet.statusID === 'H' ? 'Owned' : 'Wanted',
        boxSet.format ?? '',
        boxSet.isCompleteSeries ? 'Yes' : 'No',
        boxSet.seasonLabels.join('; '),
        boxSet.notes ?? ''
      ])
    ];
    this.downloadCsv(`${this.fileSlug(detail.title)}-boxsets.csv`, rows);
  }
  setSeriesFormField<K extends keyof SeriesForm>(field: K, value: SeriesForm[K]): void {
    this.seriesForm.set({ ...this.seriesForm(), [field]: value });
  }

  setSeasonFormField<K extends keyof SeasonForm>(field: K, value: SeasonForm[K]): void {
    this.seasonForm.set({ ...this.seasonForm(), [field]: value });
  }

  setBulkSeasonFormField<K extends keyof BulkSeasonForm>(field: K, value: BulkSeasonForm[K]): void {
    this.bulkSeasonForm.set({ ...this.bulkSeasonForm(), [field]: value });
  }

  setBoxSetFormField<K extends keyof BoxSetForm>(field: K, value: BoxSetForm[K]): void {
    this.boxSetForm.set({ ...this.boxSetForm(), [field]: value });
  }

  toggleBoxSetSeason(seasonId: number, checked: boolean): void {
    const current = this.boxSetForm();
    const seasonIds = new Set(current.seasonIds);
    if (checked) {
      seasonIds.add(seasonId);
    } else {
      seasonIds.delete(seasonId);
    }

    this.boxSetForm.set({ ...current, seasonIds: [...seasonIds].sort((left, right) => left - right) });
  }

  toggleGoalSeason(seasonId: number, checked: boolean): void {
    const seasonIds = new Set(this.selectedGoalSeasonIds());
    if (checked) {
      seasonIds.add(seasonId);
    } else {
      seasonIds.delete(seasonId);
    }

    this.selectedGoalSeasonIds.set([...seasonIds].sort((left, right) => left - right));
  }

  selectGoalCandidateSeasons(): void {
    this.selectedGoalSeasonIds.set(this.goalCandidateSeasons().map(season => season.id));
  }

  selectOwnershipGapSeasons(): void {
    this.selectedGoalSeasonIds.set(this.selected()?.ownershipGaps.map(gap => gap.seasonId) ?? []);
  }

  selectOwnedGoalSeasons(): void {
    this.selectedGoalSeasonIds.set((this.selected()?.seasons ?? [])
      .filter(season => this.isEffectivelyOwned(season))
      .map(season => season.id));
  }

  selectUnwatchedGoalSeasons(): void {
    this.selectedGoalSeasonIds.set((this.selected()?.seasons ?? [])
      .filter(season => !season.isWatched)
      .map(season => season.id));
  }

  clearGoalSeasons(): void {
    this.selectedGoalSeasonIds.set([]);
  }

  setGoalPlanFormField<K extends keyof GoalPlanForm>(field: K, value: GoalPlanForm[K]): void {
    this.goalPlanForm.set({ ...this.goalPlanForm(), [field]: value });
  }

  createGoalItems(): void {
    const detail = this.selected();
    if (!detail) {
      return;
    }

    const form = this.goalPlanForm();
    if (this.selectedGoalSeasonIds().length === 0) {
      this.error.set('Choose at least one season to add to Goals.');
      return;
    }

    const payload: CreateShowGoalItems = {
      year: Number(form.year),
      seasonIds: this.selectedGoalSeasonIds(),
      planningWindowType: form.planningWindowType,
      targetStartDate: this.valueOrNull(form.targetStartDate),
      targetEndDate: this.valueOrNull(form.targetEndDate),
      scheduleSurfaceMode: form.scheduleSurfaceMode
    };

    this.creatingGoalItems.set(true);
    this.error.set(null);
    this.shows.createGoalItems(detail.id, payload).subscribe({
      next: result => this.message.set(`Added ${result.createdCount} show season${result.createdCount === 1 ? '' : 's'} to ${result.year} Goals under ${result.sectionTitle}. ${result.skippedDuplicateCount} duplicate${result.skippedDuplicateCount === 1 ? '' : 's'} skipped.`),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to add show seasons to Goals.'),
      complete: () => this.creatingGoalItems.set(false)
    });
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

  cancelForms(): void {
    this.editingSeries.set(false);
    this.editingSeason.set(false);
    this.bulkAddingSeasons.set(false);
    this.editingBoxSet.set(false);
    this.seriesForm.set(this.emptySeriesForm());
    this.seasonForm.set(this.emptySeasonForm());
    this.bulkSeasonForm.set(this.emptyBulkSeasonForm());
    this.boxSetForm.set(this.emptyBoxSetForm());
  }

  isEffectivelyOwned(season: ShowSeason): boolean {
    return season.statusID === 'H' || season.isOwnedByBoxSet;
  }

  ownershipToneClass(tone: SeasonOwnershipMapRow['ownershipTone']): string {
    switch (tone) {
      case 'owned':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'wanted':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      default:
        return 'border-rose-200 bg-rose-50 text-rose-800';
    }
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

  private fileSlug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'show';
  }
  private loadSeriesForm(detail: ShowSeriesDetail): void {
    this.seriesForm.set({
      id: detail.id,
      title: detail.title,
      sortTitle: detail.sortTitle ?? '',
      notes: detail.notes ?? '',
      wantToWatch: detail.wantToWatch,
      wantToRewatch: detail.wantToRewatch
    });
  }

  private sort(): string {
    return this.sortDirection() === 'desc' ? `-${this.sortKey()}` : this.sortKey();
  }

  private emptySeriesForm(): SeriesForm {
    return {
      id: null,
      title: '',
      sortTitle: '',
      notes: '',
      wantToWatch: true,
      wantToRewatch: false
    };
  }

  private emptySeasonForm(): SeasonForm {
    return {
      id: null,
      seasonNumber: null,
      seasonLabel: '',
      statusID: 'H',
      format: 'DVD',
      isWatched: false,
      wantToWatch: false,
      wantToRewatch: false,
      lastWatchedDate: '',
      notes: ''
    };
  }

  private emptyBulkSeasonForm(): BulkSeasonForm {
    return {
      startSeason: 1,
      endSeason: 1,
      statusID: 'H',
      format: 'DVD',
      wantToWatch: false,
      wantToRewatch: false,
      notes: ''
    };
  }

  private emptyBoxSetForm(): BoxSetForm {
    return {
      id: null,
      name: '',
      statusID: 'H',
      format: 'DVD',
      isCompleteSeries: false,
      seasonIds: [],
      startSeason: null,
      endSeason: null,
      notes: ''
    };
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

  private goalCandidateIds(detail: ShowSeriesDetail): number[] {
    return detail.seasons
      .filter(season => season.wantToWatch || season.wantToRewatch || !season.isWatched)
      .map(season => season.id);
  }

  private valueOrNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}

