import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSettingsService, BoardGameGeekImporterSettings, SteamImporterSettings } from '../../admin-settings/admin-settings.service';
import { ExternalImportBatch, ExternalImportStageItemRequest, ExternalImportStagingItem } from '../models/external-import.models';
import { ExternalImportsService } from '../external-imports.service';

@Component({
  selector: 'app-external-import-workbench',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './external-import-workbench.html'
})
export class ExternalImportWorkbench implements OnInit {
  readonly batches = signal<ExternalImportBatch[]>([]);
  readonly items = signal<ExternalImportStagingItem[]>([]);
  readonly selectedBatchId = signal<number | null>(null);
  readonly source = signal('Steam');
  readonly targetArea = signal('Software');
  readonly batchName = signal('');
  readonly notes = signal('');
  readonly importText = signal('');
  readonly steamSettings = signal<SteamImporterSettings>({
    apiKey: null,
    steamId: null,
    includePlayedFreeGames: true,
    includeAppInfo: true
  });
  readonly boardGameGeekSettings = signal<BoardGameGeekImporterSettings>({
    username: null,
    includeOwned: true,
    includeWishlist: false,
    includeExpansions: false
  });
  readonly savingSteamSettings = signal(false);
  readonly savingBoardGameGeekSettings = signal(false);
  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly itemSearch = signal('');
  readonly matchFilter = signal('all');
  readonly actionFilter = signal('all');
  readonly statusFilter = signal('all');

  readonly selectedBatch = computed(() => this.batches().find(batch => batch.id === this.selectedBatchId()) ?? null);
  readonly filteredItems = computed(() => {
    const search = this.itemSearch().trim().toLowerCase();
    const match = this.matchFilter();
    const action = this.actionFilter();
    const status = this.statusFilter();

    return this.items().filter(item => {
      const matchesSearch = !search
        || item.title.toLowerCase().includes(search)
        || (item.externalId ?? '').toLowerCase().includes(search)
        || (item.matchedTitle ?? '').toLowerCase().includes(search)
        || (item.platformName ?? '').toLowerCase().includes(search)
        || (item.locationName ?? '').toLowerCase().includes(search);
      const matchesMatch = match === 'all' || item.matchStatus === match;
      const matchesAction = action === 'all' || item.selectedAction === action;
      const matchesStatus = status === 'all' || item.status === status;

      return matchesSearch && matchesMatch && matchesAction && matchesStatus;
    });
  });
  readonly importableCount = computed(() => this.items().filter(item => item.selectedAction === 'Import' && item.status !== 'Imported').length);
  readonly filteredImportableCount = computed(() => this.filteredItems().filter(item => item.selectedAction === 'Import' && item.status !== 'Imported').length);
  readonly missingPlatformCount = computed(() => this.items().filter(item => item.matchStatus === 'MissingPlatform').length);
  readonly missingDatabaseCount = computed(() => this.items().filter(item => item.matchStatus === 'MissingFromDatabase').length);
  readonly steamOnlyCount = computed(() => this.items().filter(item => item.matchStatus === 'OwnedOnSteamOnly').length);
  readonly gogOnlyCount = computed(() => this.items().filter(item => item.matchStatus === 'OwnedOnGogOnly').length);
  readonly bothCount = computed(() => this.items().filter(item => item.matchStatus === 'OwnedOnBoth').length);
  readonly duplicateCount = computed(() => this.items().filter(item => ['AlreadyInDatabase', 'OwnedElsewhere', 'PossibleDuplicate', 'OwnedOnSteamOnly', 'OwnedOnGogOnly', 'OwnedOnBoth'].includes(item.matchStatus)).length);
  readonly parsedRows = computed(() => this.parseRows(this.importText()));
  readonly matchOptions = computed(() => this.distinctValues(this.items().map(item => item.matchStatus)));
  readonly actionOptions = computed(() => this.distinctValues(this.items().map(item => item.selectedAction)));
  readonly statusOptions = computed(() => this.distinctValues(this.items().map(item => item.status)));

  readonly providers = [
    { name: 'Steam', description: 'Steam library import will use Steam AppID and store/source matching.' },
    { name: 'GOG', description: 'GOG import can use staged CSV/library exports until a reliable source is wired.' },
    { name: 'BoardGameGeek', description: 'BGG import will feed board game staging with ObjectID matching.' }
  ];

  constructor(
    private readonly service: ExternalImportsService,
    private readonly settingsService: AdminSettingsService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadSteamSettings();
    this.loadBoardGameGeekSettings();
  }

  chooseProvider(provider: string): void {
    this.source.set(provider);
    this.targetArea.set(provider === 'BoardGameGeek' ? 'BoardGames' : 'Software');
    if (!this.batchName().trim()) {
      this.batchName.set(`${provider} import`);
    }
  }

  loadSteamSettings(): void {
    this.settingsService.getSteamImporterSettings().subscribe({
      next: settings => this.steamSettings.set(settings),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Steam importer settings.')
    });
  }

  updateSteamSetting<K extends keyof SteamImporterSettings>(field: K, value: SteamImporterSettings[K]): void {
    this.steamSettings.set({ ...this.steamSettings(), [field]: value });
  }

  saveSteamSettings(): void {
    this.savingSteamSettings.set(true);
    this.error.set(null);
    this.message.set(null);
    this.settingsService.updateSteamImporterSettings(this.steamSettings()).subscribe({
      next: settings => {
        this.steamSettings.set(settings);
        this.message.set('Steam importer settings saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save Steam importer settings.'),
      complete: () => this.savingSteamSettings.set(false)
    });
  }

  importSteamLibrary(): void {
    const settings = this.steamSettings();
    if (!settings.apiKey?.trim() || !settings.steamId?.trim()) {
      this.error.set('Save a Steam API key and SteamID64 before importing.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.stageSteamLibrary({
      batchName: this.batchName().trim() || null,
      includePlayedFreeGames: settings.includePlayedFreeGames
    }).subscribe({
      next: result => {
        this.message.set(`Staged ${result.stagedCount} Steam game${result.stagedCount === 1 ? '' : 's'} in ${result.batchName}.`);
        this.source.set('Steam');
        this.targetArea.set('Software');
        this.selectedBatchId.set(result.batchId);
        this.items.set(result.items);
        this.loadBatches();
      },
      error: err => this.error.set(err.error?.detail ?? err.error ?? err.message ?? 'Failed to import Steam library.'),
      complete: () => this.loading.set(false)
    });
  }

  loadBoardGameGeekSettings(): void {
    this.settingsService.getBoardGameGeekImporterSettings().subscribe({
      next: settings => this.boardGameGeekSettings.set(settings),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load BoardGameGeek importer settings.')
    });
  }

  updateBoardGameGeekSetting<K extends keyof BoardGameGeekImporterSettings>(field: K, value: BoardGameGeekImporterSettings[K]): void {
    this.boardGameGeekSettings.set({ ...this.boardGameGeekSettings(), [field]: value });
  }

  saveBoardGameGeekSettings(): void {
    this.savingBoardGameGeekSettings.set(true);
    this.error.set(null);
    this.message.set(null);
    this.settingsService.updateBoardGameGeekImporterSettings(this.boardGameGeekSettings()).subscribe({
      next: settings => {
        this.boardGameGeekSettings.set(settings);
        this.message.set('BoardGameGeek importer settings saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save BoardGameGeek importer settings.'),
      complete: () => this.savingBoardGameGeekSettings.set(false)
    });
  }

  importBoardGameGeekCollection(): void {
    const settings = this.boardGameGeekSettings();
    if (!settings.username?.trim()) {
      this.error.set('Save a BoardGameGeek username before importing.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.stageBoardGameGeekCollection({
      batchName: this.batchName().trim() || null,
      username: settings.username.trim(),
      includeOwned: settings.includeOwned,
      includeWishlist: settings.includeWishlist,
      includeExpansions: settings.includeExpansions
    }).subscribe({
      next: result => {
        this.message.set(`Staged ${result.importedFromProviderCount} BoardGameGeek item${result.importedFromProviderCount === 1 ? '' : 's'} in ${result.batchName}.`);
        this.source.set('BoardGameGeek');
        this.targetArea.set('BoardGames');
        this.selectedBatchId.set(result.batchId);
        this.items.set(result.items);
        this.loadBatches();
      },
      error: err => this.error.set(this.errorMessage(err, 'Failed to import BoardGameGeek collection.')),
      complete: () => this.loading.set(false)
    });
  }

  loadBatches(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getBatches().subscribe({
      next: batches => {
        this.batches.set(batches);
        if (!this.selectedBatchId() && batches.length) {
          this.selectBatch(batches[0].id);
        }
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load import batches.'),
      complete: () => this.loading.set(false)
    });
  }

  selectBatch(batchId: number): void {
    this.selectedBatchId.set(batchId);
    this.loadItems();
  }

  loadItems(): void {
    const batchId = this.selectedBatchId();
    if (!batchId) {
      this.items.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.service.getItems({ batchId }).subscribe({
      next: items => this.items.set(items),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load import items.'),
      complete: () => this.loading.set(false)
    });
  }

  stageBatch(): void {
    const rows = this.parsedRows();
    if (rows.length === 0) {
      this.error.set('Paste at least one row with a title.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.stageBatch({
      source: this.source(),
      targetArea: this.targetArea(),
      batchName: this.batchName().trim() || null,
      notes: this.notes().trim() || null,
      items: rows
    }).subscribe({
      next: batch => {
        this.message.set(`Staged ${rows.length} row${rows.length === 1 ? '' : 's'} in ${batch.batchName}.`);
        this.importText.set('');
        this.selectedBatchId.set(batch.id);
        this.loadBatches();
        this.loadItems();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to stage import rows.'),
      complete: () => this.loading.set(false)
    });
  }

  preview(): void {
    const batchId = this.selectedBatchId();
    if (!batchId) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.previewBatch(batchId).subscribe({
      next: result => {
        this.items.set(result.items);
        this.message.set(`Preview checked ${result.totalCount} row${result.totalCount === 1 ? '' : 's'}: ${result.newCount} new, ${result.possibleDuplicateCount} possible duplicate, ${result.missingPlatformCount} missing platform.`);
        this.loadBatches();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to preview import matches.'),
      complete: () => this.loading.set(false)
    });
  }

  updateItem(item: ExternalImportStagingItem, changes: Partial<ExternalImportStagingItem>): void {
    const updated = { ...item, ...changes };
    this.items.set(this.items().map(row => row.id === item.id ? updated : row));
    this.service.updateItem(item.id, {
      platformName: updated.platformName,
      locationName: updated.locationName,
      publisher: updated.publisher,
      developer: updated.developer,
      versionEdition: updated.versionEdition,
      mediaType: updated.mediaType,
      selectedAction: updated.selectedAction,
      notes: updated.notes
    }).subscribe({
      next: saved => this.items.set(this.items().map(row => row.id === saved.id ? saved : row)),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to update staged row.')
    });
  }

  commit(): void {
    const batchId = this.selectedBatchId();
    if (!batchId || this.importableCount() === 0) {
      this.error.set('No importable rows are selected.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.commit({ ids: [], batchId, importOnlySelected: true }).subscribe({
      next: result => {
        this.message.set(`Imported ${result.importedCount}; skipped ${result.skippedCount}.`);
        this.preview();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to commit staged rows.'),
      complete: () => this.loading.set(false)
    });
  }

  setAllActions(action: string): void {
    this.items()
      .filter(item => item.status !== 'Imported')
      .forEach(item => this.updateItem(item, { selectedAction: action }));
  }

  setFilteredActions(action: string): void {
    this.filteredItems()
      .filter(item => item.status !== 'Imported')
      .forEach(item => this.updateItem(item, { selectedAction: action }));
  }

  clearItemFilters(): void {
    this.itemSearch.set('');
    this.matchFilter.set('all');
    this.actionFilter.set('all');
    this.statusFilter.set('all');
  }

  matchTone(status: string): string {
    switch (status) {
      case 'MissingFromDatabase':
        return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
      case 'MissingPlatform':
        return 'bg-rose-50 text-rose-800 ring-rose-200';
      case 'OwnedOnBoth':
        return 'app-token-soft-surface app-token-text-primary app-token-ring';
      case 'OwnedOnSteamOnly':
        return 'app-token-soft-surface app-token-text-primary app-token-ring';
      case 'OwnedOnGogOnly':
        return 'app-token-soft-surface app-token-text-primary app-token-ring';
      case 'AlreadyInDatabase':
      case 'AlreadyImported':
        return 'bg-slate-100 text-slate-700 ring-slate-200';
      case 'OwnedElsewhere':
      case 'PossibleDuplicate':
        return 'bg-amber-50 text-amber-800 ring-amber-200';
      default:
        return 'app-token-soft-surface app-token-text-strong';
    }
  }

  matchLabel(status: string): string {
    switch (status) {
      case 'MissingFromDatabase':
        return 'Missing from database';
      case 'MissingPlatform':
        return 'Missing platform';
      case 'OwnedOnBoth':
        return 'Owned on Steam and GOG';
      case 'OwnedOnSteamOnly':
        return 'Owned on Steam only';
      case 'OwnedOnGogOnly':
        return 'Owned on GOG only';
      case 'AlreadyInDatabase':
        return 'Already in database';
      case 'AlreadyImported':
        return 'Already imported';
      case 'OwnedElsewhere':
        return 'Owned elsewhere';
      case 'PossibleDuplicate':
        return 'Possible duplicate';
      default:
        return status;
    }
  }

  private parseRows(text: string): ExternalImportStageItemRequest[] {
    const rows = text
      .split(/\r?\n/)
      .map(row => row.trim())
      .filter(Boolean)
      .map(row => this.splitRow(row));

    if (rows.length === 0) {
      return [];
    }

    const header = rows[0].map(value => value.toLowerCase().replace(/\s+/g, ''));
    const hasHeader = header.includes('title') || header.includes('name');
    const dataRows = hasHeader ? rows.slice(1) : rows;

    return dataRows
      .map(row => this.rowToItem(row, hasHeader ? header : null))
      .filter((row): row is ExternalImportStageItemRequest => Boolean(row));
  }

  private rowToItem(row: string[], header: string[] | null): ExternalImportStageItemRequest | null {
    const value = (names: string[], index: number) => {
      if (!header) {
        return row[index]?.trim() || null;
      }

      const found = names
        .map(name => header.indexOf(name))
        .find(position => position >= 0);
      return found === undefined ? null : row[found]?.trim() || null;
    };

    const title = value(['title', 'name'], 1) ?? value(['game'], 1);
    if (!title) {
      return null;
    }

    return {
      externalId: value(['externalid', 'appid', 'objectid', 'id'], 0),
      title,
      platformName: value(['platform', 'system'], 2) ?? (this.targetArea() === 'Software' ? 'PC' : null),
      locationName: value(['location', 'store', 'source'], 3) ?? (this.targetArea() === 'Software' ? this.source() : null),
      publisher: value(['publisher'], 4),
      developer: value(['developer'], 5),
      versionEdition: value(['version', 'edition', 'versionedition'], 6),
      mediaType: value(['media', 'mediatype', 'format'], 7) ?? (this.targetArea() === 'Software' ? 'Digital' : null),
      artworkUrl: value(['artwork', 'artworkurl', 'image', 'imageurl'], 8),
      notes: value(['notes', 'note'], 9),
      rawJson: JSON.stringify(row)
    };
  }

  private splitRow(row: string): string[] {
    if (row.includes('\t')) {
      return row.split('\t').map(value => value.trim());
    }

    const values: string[] = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  private distinctValues(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  private errorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string') {
      return err.error;
    }

    return err?.error?.detail ?? err?.error?.title ?? err?.message ?? fallback;
  }
}
