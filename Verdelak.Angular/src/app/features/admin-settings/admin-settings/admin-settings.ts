import { CommonModule } from '@angular/common';
import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { SpookytownType } from '../../spookytown/models/spookytown.models';
import { AdminSettingsService, BarcodeLookupProviderSetting, BoardGameGeekImporterSettings, ExternalSiteSetting, ExternalSitesSettings, FinanceTrackerSettings, FishReportThresholds, MainAppearanceSettings, MusicFolderImportResult, SoftwareLocationSetting, SoftwarePlatformSetting, SteamImporterSettings } from '../admin-settings.service';
import { AppearanceSettingsPanel } from './appearance-settings-panel';

interface SpookytownTypeForm {
  id: string;
  type: string;
  originalId: string | null;
}

interface SoftwarePlatformForm {
  id: number | null;
  name: string;
}

interface SoftwareLocationForm {
  id: number | null;
  name: string;
}

interface ExternalSiteSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface ExternalSiteRow {
  site: ExternalSiteSetting;
  index: number;
}

interface LookupSummaryCard {
  label: string;
  value: number;
  detail: string;
}

type FinanceNumericSetting = 'yearCloseMonth' | 'yearCloseDay' | 'defaultReportYear' | 'defaultReportMonth';

@Component({
  selector: 'app-admin-settings',
  imports: [CommonModule, FormsModule, AppearanceSettingsPanel],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss'
})
export class AdminSettings implements OnInit {
  private readonly csvDownload = inject(CsvDownloadService);

  readonly spookytownTypes = signal<SpookytownType[]>([]);
  readonly selectedTypeId = signal<string | null>(null);
  readonly form = signal<SpookytownTypeForm>({ id: '', type: '', originalId: null });
  readonly fishThresholds = signal<FishReportThresholds>(this.defaultFishThresholds());
  readonly shoppingCategoryText = signal(this.defaultShoppingCategories().join('\n'));
  readonly shoppingCategorySummaryCards = computed<LookupSummaryCard[]>(() => {
    const rawRows = this.shoppingCategoryRawRows();
    const parsed = this.parseShoppingCategoryText();
    const duplicates = this.duplicateLookupValues(rawRows);
    return [
      { label: 'Will save', value: parsed.length, detail: 'Unique category suggestions' },
      { label: 'Input rows', value: rawRows.length, detail: 'Non-blank rows or comma values' },
      { label: 'Duplicates', value: duplicates.length, detail: 'Ignored when saving' }
    ];
  });
  readonly shoppingCategoryWarnings = computed(() => {
    const warnings: string[] = [];
    const rawRows = this.shoppingCategoryRawRows();
    const duplicates = this.duplicateLookupValues(rawRows);
    if (duplicates.length) {
      warnings.push(`Duplicate categories ignored on save: ${duplicates.join(', ')}`);
    }
    if (rawRows.length > 0 && this.parseShoppingCategoryText().length === 0) {
      warnings.push('No valid category names were found.');
    }
    return warnings;
  });
  readonly recipeCategoryText = signal(this.defaultRecipeCategories().join('\n'));
  readonly recipeCuisineText = signal(this.defaultRecipeCuisines().join('\n'));
  readonly recipeTagText = signal(this.defaultRecipeTags().join('\n'));
  readonly recipeLookupSummaryCards = computed<LookupSummaryCard[]>(() => [
    ...this.lookupSummaryCards('Recipe categories', this.recipeCategoryText()),
    ...this.lookupSummaryCards('Cuisines', this.recipeCuisineText()),
    ...this.lookupSummaryCards('Tags', this.recipeTagText())
  ]);
  readonly recipeLookupWarnings = computed(() => [
    ...this.lookupWarnings('Recipe categories', this.recipeCategoryText()),
    ...this.lookupWarnings('Cuisines', this.recipeCuisineText()),
    ...this.lookupWarnings('Tags', this.recipeTagText())
  ]);
  readonly alcoholCategoryText = signal(this.defaultAlcoholCategories().join('\n'));
  readonly alcoholLocationText = signal(this.defaultAlcoholLocations().join('\n'));
  readonly alcoholLookupSummaryCards = computed<LookupSummaryCard[]>(() => [
    ...this.lookupSummaryCards('Alcohol categories', this.alcoholCategoryText()),
    ...this.lookupSummaryCards('Locations', this.alcoholLocationText())
  ]);
  readonly alcoholLookupWarnings = computed(() => [
    ...this.lookupWarnings('Alcohol categories', this.alcoholCategoryText()),
    ...this.lookupWarnings('Locations', this.alcoholLocationText())
  ]);
  readonly barcodeProviders = signal<BarcodeLookupProviderSetting[]>(this.defaultBarcodeProviders());
  readonly barcodeProviderOrderPreview = computed(() =>
    this.normalizeBarcodeProviderPriorities(this.barcodeProviders())
      .filter(provider => provider.enabled)
      .map(provider => provider.provider)
      .join(' > ') || 'No enabled providers');
  readonly mainAppearance = signal<MainAppearanceSettings>(this.defaultMainAppearance());
  readonly mainAppearanceWarnings = computed(() => this.appearanceWarnings(this.mainAppearance()));
  readonly cdSiteAppearance = signal<MainAppearanceSettings>(this.defaultCdSiteAppearance());
  readonly cdSiteAppearanceWarnings = computed(() => this.appearanceWarnings(this.cdSiteAppearance()));
  readonly dinoSiteAppearance = signal<MainAppearanceSettings>(this.defaultDinoSiteAppearance());
  readonly dinoSiteAppearanceWarnings = computed(() => this.appearanceWarnings(this.dinoSiteAppearance()));
  readonly blogAppearance = signal<MainAppearanceSettings>(this.defaultBlogAppearance());
  readonly blogAppearanceWarnings = computed(() => this.appearanceWarnings(this.blogAppearance()));
  readonly filmReviewAppearance = signal<MainAppearanceSettings>(this.defaultFilmReviewAppearance());
  readonly filmReviewAppearanceWarnings = computed(() => this.appearanceWarnings(this.filmReviewAppearance()));
  readonly steamImporterSettings = signal<SteamImporterSettings>(this.defaultSteamImporterSettings());
  readonly boardGameGeekImporterSettings = signal<BoardGameGeekImporterSettings>(this.defaultBoardGameGeekImporterSettings());
  readonly musicFolderImportRoot = signal('Z:\\Rips');
  readonly musicFolderImportResult = signal<MusicFolderImportResult | null>(null);
  readonly musicFolderImportStatusFilter = signal('All');
  readonly musicFolderImportSummaryCards = computed<LookupSummaryCard[]>(() => {
    const result = this.musicFolderImportResult();
    if (!result) {
      return [
        { label: 'Artists', value: 0, detail: 'Run preview to scan folders' },
        { label: 'Albums', value: 0, detail: 'Run preview to scan folders' },
        { label: 'Missing', value: 0, detail: 'Albums that can be added' },
        { label: 'Existing', value: 0, detail: 'Already matched in DB' },
        { label: 'DB only', value: 0, detail: 'Owned CDs missing from folder scan' }
      ];
    }

    return [
      { label: 'Artists', value: result.artistFoldersScanned, detail: 'Top-level folders scanned' },
      { label: 'Albums', value: result.albumFoldersScanned, detail: 'Album folders scanned' },
      { label: 'Missing', value: result.albumsCreated, detail: result.applied ? 'Albums added' : 'Albums ready to add' },
      { label: 'Existing', value: result.existingAlbums, detail: 'Already matched in DB' },
      { label: 'DB only', value: result.databaseOnlyAlbums, detail: 'Owned CDs not seen in folders' }
    ];
  });
  readonly musicFolderImportStatusOptions = computed(() => {
    const statuses = this.musicFolderImportResult()?.rows.map(row => row.status) ?? [];
    return ['All', ...Array.from(new Set(statuses)).sort((left, right) => this.musicFolderImportStatusLabel(left).localeCompare(this.musicFolderImportStatusLabel(right)))];
  });
  readonly filteredMusicFolderImportRows = computed(() => {
    const result = this.musicFolderImportResult();
    const statusFilter = this.musicFolderImportStatusFilter();
    if (!result) {
      return [];
    }

    return statusFilter === 'All'
      ? result.rows
      : result.rows.filter(row => row.status === statusFilter);
  });
  readonly musicFolderImportPreviewRows = computed(() => this.filteredMusicFolderImportRows().slice(0, 25));
  readonly musicFolderImportWarnings = computed(() => {
    const result = this.musicFolderImportResult();
    if (!result) {
      return [];
    }

    return result.messages.slice(0, 8);
  });
  readonly importerSettingsSummaryCards = computed<LookupSummaryCard[]>(() => [
    {
      label: 'Steam',
      value: Number(Boolean(this.steamImporterSettings().apiKey?.trim()) && Boolean(this.steamImporterSettings().steamId?.trim())),
      detail: this.steamImporterStatus()
    },
    {
      label: 'BoardGameGeek',
      value: Number(Boolean(this.boardGameGeekImporterSettings().username?.trim())),
      detail: this.boardGameGeekImporterStatus()
    }
  ]);
  readonly importerSettingsWarnings = computed(() => {
    const warnings: string[] = [];
    const steam = this.steamImporterSettings();
    const boardGameGeek = this.boardGameGeekImporterSettings();
    if (!steam.apiKey?.trim()) {
      warnings.push('Steam imports need a Steam Web API key.');
    }
    if (!steam.steamId?.trim()) {
      warnings.push('Steam imports need a Steam ID.');
    }
    if (!boardGameGeek.username?.trim()) {
      warnings.push('BoardGameGeek imports need a username.');
    }
    if (!boardGameGeek.includeOwned && !boardGameGeek.includeWishlist) {
      warnings.push('BoardGameGeek imports should include owned games, wishlist games, or both.');
    }
    return warnings;
  });
  readonly financeSettings = signal<FinanceTrackerSettings>(this.defaultFinanceSettings());
  readonly externalSites = signal<ExternalSitesSettings>(this.defaultExternalSites());
  readonly sortedExternalSiteRows = computed<ExternalSiteRow[]>(() => this.externalSites().sites
    .map((site, index) => ({ site, index }))
    .sort((left, right) => left.site.sortOrder - right.site.sortOrder || left.site.label.localeCompare(right.site.label)));
  readonly sortedExternalSites = computed(() => [...this.externalSites().sites]
    .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label)));
  readonly externalSiteWarnings = computed(() => this.buildExternalSiteWarnings());
  readonly externalSiteSummaryCards = computed<ExternalSiteSummaryCard[]>(() => {
    const sites = this.externalSites().sites;
    const active = sites.filter(site => site.isActive);
    const ready = active.filter(site => this.externalSiteResolvedUrl(site));
    return [
      { label: 'Configured', value: sites.length, detail: 'External menu records' },
      { label: 'Active', value: active.length, detail: 'Enabled for the External menu' },
      { label: 'Ready', value: ready.length, detail: 'Active with a resolved URL' },
      { label: 'Needs URL', value: active.length - ready.length, detail: 'Active but hidden until a URL is set' }
    ];
  });
  readonly financeAccountCategoryText = signal(this.defaultFinanceSettings().accountCategories.join('\n'));
  readonly financeBillCategoryText = signal(this.defaultFinanceSettings().billCategories.join('\n'));
  readonly financeDonationMethodText = signal(this.defaultFinanceSettings().donationMethods.join('\n'));
  readonly financeLookupSummaryCards = computed<LookupSummaryCard[]>(() => [
    ...this.lookupSummaryCards('Account categories', this.financeAccountCategoryText()),
    ...this.lookupSummaryCards('Bill categories', this.financeBillCategoryText()),
    ...this.lookupSummaryCards('Donation methods', this.financeDonationMethodText())
  ]);
  readonly financeLookupWarnings = computed(() => [
    ...this.lookupWarnings('Account categories', this.financeAccountCategoryText()),
    ...this.lookupWarnings('Bill categories', this.financeBillCategoryText()),
    ...this.lookupWarnings('Donation methods', this.financeDonationMethodText())
  ]);
  readonly softwarePlatforms = signal<SoftwarePlatformSetting[]>([]);
  readonly selectedSoftwarePlatformId = signal<number | null>(null);
  readonly softwarePlatformForm = signal<SoftwarePlatformForm>({ id: null, name: '' });
  readonly softwareLocations = signal<SoftwareLocationSetting[]>([]);
  readonly selectedSoftwareLocationId = signal<number | null>(null);
  readonly softwareLocationForm = signal<SoftwareLocationForm>({ id: null, name: '' });
  readonly loading = signal(false);
  readonly fishThresholdsLoading = signal(false);
  readonly shoppingCategoriesLoading = signal(false);
  readonly recipeLookupsLoading = signal(false);
  readonly alcoholLookupsLoading = signal(false);
  readonly barcodeLookupsLoading = signal(false);
  readonly mainAppearanceLoading = signal(false);
  readonly cdSiteAppearanceLoading = signal(false);
  readonly dinoSiteAppearanceLoading = signal(false);
  readonly blogAppearanceLoading = signal(false);
  readonly filmReviewAppearanceLoading = signal(false);
  readonly importerSettingsLoading = signal(false);
  readonly musicFolderImportLoading = signal(false);
  readonly financeSettingsLoading = signal(false);
  readonly externalSitesLoading = signal(false);
  readonly softwarePlatformsLoading = signal(false);
  readonly softwareLocationsLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  constructor(private readonly service: AdminSettingsService) {}

  ngOnInit(): void {
    this.loadSpookytownTypes();
    this.loadFishThresholds();
    this.loadShoppingCategories();
    this.loadRecipeLookups();
    this.loadAlcoholLookups();
    this.loadBarcodeLookups();
    this.loadMainAppearance();
    this.loadCdSiteAppearance();
    this.loadDinoSiteAppearance();
    this.loadBlogAppearance();
    this.loadFilmReviewAppearance();
    this.loadImporterSettings();
    this.loadFinanceSettings();
    this.loadExternalSites();
    this.loadSoftwarePlatforms();
    this.loadSoftwareLocations();
  }

  loadSpookytownTypes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getSpookytownTypes().subscribe({
      next: types => this.spookytownTypes.set(types),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Spookytown types.'),
      complete: () => this.loading.set(false)
    });
  }

  selectSpookytownType(type: SpookytownType): void {
    this.selectedTypeId.set(type.id);
    this.error.set(null);
    this.message.set(null);
    this.form.set({ id: type.id, type: type.type, originalId: type.id });
  }

  startNewSpookytownType(): void {
    this.selectedTypeId.set(null);
    this.error.set(null);
    this.message.set(null);
    this.form.set({ id: '', type: '', originalId: null });
  }

  setFormField<K extends keyof SpookytownTypeForm>(field: K, value: SpookytownTypeForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  saveSpookytownType(): void {
    const form = this.form();
    const id = form.id.trim().slice(0, 1).toUpperCase();
    const type = form.type.trim();

    if (!id || !type) {
      this.error.set('Type ID and name are required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const request = { id, type };
    const saveRequest = form.originalId
      ? this.service.updateSpookytownType(form.originalId, request)
      : this.service.createSpookytownType(request);

    saveRequest.subscribe({
      next: saved => {
        this.message.set(`${saved.type} saved.`);
        this.form.set({ id: saved.id, type: saved.type, originalId: saved.id });
        this.selectedTypeId.set(saved.id);
        this.loadSpookytownTypes();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save Spookytown type.'),
      complete: () => this.loading.set(false)
    });
  }

  deleteSelectedSpookytownType(): void {
    const form = this.form();

    if (!form.originalId) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.getSpookytownTypeUsage(form.originalId).subscribe({
      next: usage => {
        const confirmed = window.confirm(
          `Delete ${form.type}? ${usage.itemCount} Spookytown item(s) currently point to this type and will point to a deleted type.`
        );

        if (!confirmed) {
          this.loading.set(false);
          return;
        }

        this.service.deleteSpookytownType(form.originalId!).subscribe({
          next: () => {
            this.message.set(`${form.type} deleted.`);
            this.startNewSpookytownType();
            this.loadSpookytownTypes();
          },
          error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete Spookytown type.'),
          complete: () => this.loading.set(false)
        });
      },
      error: err => {
        this.error.set(err.error ?? err.message ?? 'Failed to check Spookytown type usage.');
        this.loading.set(false);
      }
    });
  }

  loadSoftwarePlatforms(): void {
    this.softwarePlatformsLoading.set(true);
    this.service.getSoftwarePlatforms().subscribe({
      next: platforms => this.softwarePlatforms.set(platforms),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software platforms.'),
      complete: () => this.softwarePlatformsLoading.set(false)
    });
  }

  loadExternalSites(): void {
    this.externalSitesLoading.set(true);
    this.service.getExternalSites().subscribe({
      next: settings => this.externalSites.set(settings),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load external sites.'),
      complete: () => this.externalSitesLoading.set(false)
    });
  }

  saveExternalSites(): void {
    const warnings = this.externalSiteWarnings();
    if (warnings.some(warning => warning.startsWith('Duplicate key'))) {
      this.error.set('External site keys must be unique before saving.');
      return;
    }

    this.externalSitesLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updateExternalSites({
      ...this.externalSites(),
      sites: this.sortedExternalSites()
    }).subscribe({
      next: settings => {
        this.externalSites.set(settings);
        this.message.set('External sites saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save external sites.'),
      complete: () => this.externalSitesLoading.set(false)
    });
  }

  resetExternalSites(): void {
    this.externalSites.set(this.defaultExternalSites());
  }

  addExternalSite(): void {
    const sites = this.externalSites().sites;
    const nextOrder = Math.max(0, ...sites.map(site => site.sortOrder)) + 10;
    this.externalSites.set({
      ...this.externalSites(),
      sites: [
        ...sites,
        {
          key: `custom-${nextOrder}`,
          label: 'New Site',
          localUrl: null,
          productionUrl: null,
          isActive: true,
          openInNewTab: true,
          sortOrder: nextOrder
        }
      ]
    });
  }

  removeExternalSite(index: number): void {
    this.externalSites.set({
      ...this.externalSites(),
      sites: this.externalSites().sites.filter((_, current) => current !== index)
    });
  }

  setExternalEnvironment(environmentName: 'local' | 'production'): void {
    this.externalSites.set({ ...this.externalSites(), environmentName });
  }

  setExternalSiteField<K extends keyof ExternalSiteSetting>(index: number, field: K, value: ExternalSiteSetting[K]): void {
    this.externalSites.set({
      ...this.externalSites(),
      sites: this.externalSites().sites.map((site, current) => current === index ? { ...site, [field]: value } : site)
    });
  }

  openExternalSite(site: ExternalSiteSetting): void {
    const url = this.externalSiteResolvedUrl(site);
    if (!url) {
      return;
    }

    window.open(url, site.openInNewTab ? '_blank' : '_self', 'noopener');
  }

  exportExternalSitesCsv(): void {
    this.downloadCsv('external-sites.csv', [
      ['Key', 'Label', 'Active', 'Environment', 'Local URL', 'Production URL', 'Resolved URL', 'New Tab', 'Sort Order', 'Status'],
      ...this.sortedExternalSites().map(site => [
        site.key,
        site.label,
        site.isActive,
        this.externalSites().environmentName,
        site.localUrl,
        site.productionUrl,
        this.externalSiteResolvedUrl(site),
        site.openInNewTab,
        site.sortOrder,
        this.externalSiteStatus(site)
      ])
    ]);
  }

  externalSiteResolvedUrl(site: ExternalSiteSetting): string | null {
    const useProduction = this.externalSites().environmentName === 'production';
    return useProduction
      ? site.productionUrl || site.localUrl || null
      : site.localUrl || site.productionUrl || null;
  }

  externalSiteStatus(site: ExternalSiteSetting): string {
    if (!site.isActive) {
      return 'Inactive';
    }

    return this.externalSiteResolvedUrl(site) ? 'Menu link ready' : 'Hidden until URL is added';
  }

  private buildExternalSiteWarnings(): string[] {
    const sites = this.externalSites().sites;
    const warnings: string[] = [];
    const keyCounts = sites.reduce((map, site) => {
      const key = site.key.trim().toLowerCase();
      if (key) {
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return map;
    }, new Map<string, number>());

    for (const site of sites) {
      if (!site.key.trim()) {
        warnings.push(`${site.label || 'Unnamed site'} is missing a key.`);
      } else if ((keyCounts.get(site.key.trim().toLowerCase()) ?? 0) > 1) {
        warnings.push(`Duplicate key: ${site.key}`);
      }
      if (!site.label.trim()) {
        warnings.push(`${site.key || 'Unnamed site'} is missing a label.`);
      }
      if (site.isActive && !this.externalSiteResolvedUrl(site)) {
        warnings.push(`${site.label || site.key} is active but has no usable URL.`);
      }
    }

    return [...new Set(warnings)];
  }

  selectSoftwarePlatform(platform: SoftwarePlatformSetting): void {
    this.selectedSoftwarePlatformId.set(platform.id);
    this.error.set(null);
    this.message.set(null);
    this.softwarePlatformForm.set({ id: platform.id, name: platform.name });
  }

  startNewSoftwarePlatform(): void {
    this.selectedSoftwarePlatformId.set(null);
    this.error.set(null);
    this.message.set(null);
    this.softwarePlatformForm.set({ id: null, name: '' });
  }

  setSoftwarePlatformName(value: string): void {
    this.softwarePlatformForm.set({ ...this.softwarePlatformForm(), name: value });
  }

  saveSoftwarePlatform(): void {
    const form = this.softwarePlatformForm();
    const name = form.name.trim();
    if (!name) {
      this.error.set('Platform name is required.');
      return;
    }

    this.softwarePlatformsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    const request = { id: form.id ?? 0, name };
    const saveRequest = form.id
      ? this.service.updateSoftwarePlatform(form.id, request)
      : this.service.createSoftwarePlatform(request);

    saveRequest.subscribe({
      next: saved => {
        this.message.set(`${saved.name} saved.`);
        this.softwarePlatformForm.set({ id: saved.id, name: saved.name });
        this.selectedSoftwarePlatformId.set(saved.id);
        this.loadSoftwarePlatforms();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save software platform.'),
      complete: () => this.softwarePlatformsLoading.set(false)
    });
  }

  deleteSelectedSoftwarePlatform(): void {
    const form = this.softwarePlatformForm();
    if (!form.id) {
      return;
    }

    this.softwarePlatformsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.getSoftwarePlatformUsage(form.id).subscribe({
      next: usage => {
        if (usage.itemCount > 0) {
          this.error.set(`${form.name} is used by ${usage.itemCount} software item(s). Move those items before deleting this platform.`);
          this.softwarePlatformsLoading.set(false);
          return;
        }

        if (!window.confirm(`Delete ${form.name}? No software items currently use this platform.`)) {
          this.softwarePlatformsLoading.set(false);
          return;
        }

        this.service.deleteSoftwarePlatform(form.id!).subscribe({
          next: () => {
            this.message.set(`${form.name} deleted.`);
            this.startNewSoftwarePlatform();
            this.loadSoftwarePlatforms();
          },
          error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete software platform.'),
          complete: () => this.softwarePlatformsLoading.set(false)
        });
      },
      error: err => {
        this.error.set(err.error ?? err.message ?? 'Failed to check software platform usage.');
        this.softwarePlatformsLoading.set(false);
      }
    });
  }

  seedSoftwareDefaults(): void {
    this.softwarePlatformsLoading.set(true);
    this.softwareLocationsLoading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.seedSoftwareDefaults().subscribe({
      next: result => {
        this.message.set(`Added ${result.platformsCreated} software platform${result.platformsCreated === 1 ? '' : 's'} and ${result.locationsCreated} software location${result.locationsCreated === 1 ? '' : 's'}.`);
        this.loadSoftwarePlatforms();
        this.loadSoftwareLocations();
      },
      error: err => {
        this.error.set(err.error ?? err.message ?? 'Failed to add software defaults.');
        this.softwarePlatformsLoading.set(false);
        this.softwareLocationsLoading.set(false);
      }
    });
  }

  loadSoftwareLocations(): void {
    this.softwareLocationsLoading.set(true);
    this.service.getSoftwareLocations().subscribe({
      next: locations => this.softwareLocations.set(locations),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software locations.'),
      complete: () => this.softwareLocationsLoading.set(false)
    });
  }

  selectSoftwareLocation(location: SoftwareLocationSetting): void {
    this.selectedSoftwareLocationId.set(location.id);
    this.error.set(null);
    this.message.set(null);
    this.softwareLocationForm.set({ id: location.id, name: location.name });
  }

  startNewSoftwareLocation(): void {
    this.selectedSoftwareLocationId.set(null);
    this.error.set(null);
    this.message.set(null);
    this.softwareLocationForm.set({ id: null, name: '' });
  }

  setSoftwareLocationName(value: string): void {
    this.softwareLocationForm.set({ ...this.softwareLocationForm(), name: value });
  }

  saveSoftwareLocation(): void {
    const form = this.softwareLocationForm();
    const name = form.name.trim();
    if (!name) {
      this.error.set('Location name is required.');
      return;
    }

    this.softwareLocationsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    const request = { id: form.id ?? 0, name };
    const saveRequest = form.id
      ? this.service.updateSoftwareLocation(form.id, request)
      : this.service.createSoftwareLocation(request);

    saveRequest.subscribe({
      next: saved => {
        this.message.set(`${saved.name} saved.`);
        this.softwareLocationForm.set({ id: saved.id, name: saved.name });
        this.selectedSoftwareLocationId.set(saved.id);
        this.loadSoftwareLocations();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save software location.'),
      complete: () => this.softwareLocationsLoading.set(false)
    });
  }

  deleteSelectedSoftwareLocation(): void {
    const form = this.softwareLocationForm();
    if (!form.id) {
      return;
    }

    this.softwareLocationsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.getSoftwareLocationUsage(form.id).subscribe({
      next: usage => {
        if (usage.itemCount > 0) {
          this.error.set(`${form.name} is used by ${usage.itemCount} software item(s). Move those items before deleting this location.`);
          this.softwareLocationsLoading.set(false);
          return;
        }

        if (!window.confirm(`Delete ${form.name}? No software items currently use this location.`)) {
          this.softwareLocationsLoading.set(false);
          return;
        }

        this.service.deleteSoftwareLocation(form.id!).subscribe({
          next: () => {
            this.message.set(`${form.name} deleted.`);
            this.startNewSoftwareLocation();
            this.loadSoftwareLocations();
          },
          error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete software location.'),
          complete: () => this.softwareLocationsLoading.set(false)
        });
      },
      error: err => {
        this.error.set(err.error ?? err.message ?? 'Failed to check software location usage.');
        this.softwareLocationsLoading.set(false);
      }
    });
  }

  loadFishThresholds(): void {
    this.fishThresholdsLoading.set(true);
    this.service.getFishReportThresholds().subscribe({
      next: thresholds => this.fishThresholds.set(thresholds),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Fish report thresholds.'),
      complete: () => this.fishThresholdsLoading.set(false)
    });
  }

  setFishThreshold<K extends keyof FishReportThresholds>(field: K, value: string | number): void {
    const parsed = Number(value);
    this.fishThresholds.update(thresholds => ({
      ...thresholds,
      [field]: Number.isFinite(parsed) && parsed >= 0 ? parsed : this.defaultFishThresholds()[field]
    }));
  }

  saveFishThresholds(): void {
    this.fishThresholdsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updateFishReportThresholds(this.fishThresholds()).subscribe({
      next: thresholds => {
        this.fishThresholds.set(thresholds);
        this.message.set('Fish report thresholds saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save Fish report thresholds.'),
      complete: () => this.fishThresholdsLoading.set(false)
    });
  }

  resetFishThresholds(): void {
    this.fishThresholds.set(this.defaultFishThresholds());
  }

  loadShoppingCategories(): void {
    this.shoppingCategoriesLoading.set(true);
    this.service.getShoppingCategories().subscribe({
      next: settings => this.shoppingCategoryText.set(settings.categories.join('\n')),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load shopping categories.'),
      complete: () => this.shoppingCategoriesLoading.set(false)
    });
  }

  saveShoppingCategories(): void {
    const categories = this.parseShoppingCategoryText();
    if (categories.length === 0) {
      this.error.set('Enter at least one shopping category.');
      return;
    }

    this.shoppingCategoriesLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updateShoppingCategories({ categories }).subscribe({
      next: settings => {
        this.shoppingCategoryText.set(settings.categories.join('\n'));
        this.message.set('Shopping categories saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save shopping categories.'),
      complete: () => this.shoppingCategoriesLoading.set(false)
    });
  }

  resetShoppingCategories(): void {
    this.shoppingCategoryText.set(this.defaultShoppingCategories().join('\n'));
  }

  loadRecipeLookups(): void {
    this.recipeLookupsLoading.set(true);
    this.service.getRecipeLookups().subscribe({
      next: settings => {
        this.recipeCategoryText.set(settings.categories.join('\n'));
        this.recipeCuisineText.set(settings.cuisines.join('\n'));
        this.recipeTagText.set(settings.tags.join('\n'));
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load recipe lookup settings.'),
      complete: () => this.recipeLookupsLoading.set(false)
    });
  }

  saveRecipeLookups(): void {
    const categories = this.parseLookupText(this.recipeCategoryText());
    const cuisines = this.parseLookupText(this.recipeCuisineText());
    const tags = this.parseLookupText(this.recipeTagText());

    if (categories.length === 0 || cuisines.length === 0 || tags.length === 0) {
      this.error.set('Recipe categories, cuisines, and tags each need at least one value.');
      return;
    }

    this.recipeLookupsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updateRecipeLookups({ categories, cuisines, tags }).subscribe({
      next: settings => {
        this.recipeCategoryText.set(settings.categories.join('\n'));
        this.recipeCuisineText.set(settings.cuisines.join('\n'));
        this.recipeTagText.set(settings.tags.join('\n'));
        this.message.set('Recipe lookup settings saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save recipe lookup settings.'),
      complete: () => this.recipeLookupsLoading.set(false)
    });
  }

  resetRecipeLookups(): void {
    this.recipeCategoryText.set(this.defaultRecipeCategories().join('\n'));
    this.recipeCuisineText.set(this.defaultRecipeCuisines().join('\n'));
    this.recipeTagText.set(this.defaultRecipeTags().join('\n'));
  }

  loadAlcoholLookups(): void {
    this.alcoholLookupsLoading.set(true);
    this.service.getAlcoholLookups().subscribe({
      next: settings => {
        this.alcoholCategoryText.set(settings.categories.join('\n'));
        this.alcoholLocationText.set(settings.locations.join('\n'));
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load alcohol lookup settings.'),
      complete: () => this.alcoholLookupsLoading.set(false)
    });
  }

  saveAlcoholLookups(): void {
    const categories = this.parseLookupText(this.alcoholCategoryText());
    const locations = this.parseLookupText(this.alcoholLocationText());

    if (categories.length === 0 || locations.length === 0) {
      this.error.set('Alcohol categories and locations each need at least one value.');
      return;
    }

    this.alcoholLookupsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updateAlcoholLookups({ categories, locations }).subscribe({
      next: settings => {
        this.alcoholCategoryText.set(settings.categories.join('\n'));
        this.alcoholLocationText.set(settings.locations.join('\n'));
        this.message.set('Alcohol lookup settings saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save alcohol lookup settings.'),
      complete: () => this.alcoholLookupsLoading.set(false)
    });
  }

  resetAlcoholLookups(): void {
    this.alcoholCategoryText.set(this.defaultAlcoholCategories().join('\n'));
    this.alcoholLocationText.set(this.defaultAlcoholLocations().join('\n'));
  }

  loadBarcodeLookups(): void {
    this.barcodeLookupsLoading.set(true);
    this.service.getBarcodeLookups().subscribe({
      next: settings => this.barcodeProviders.set(settings.providers),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load barcode lookup settings.'),
      complete: () => this.barcodeLookupsLoading.set(false)
    });
  }

  setBarcodeProviderEnabled(provider: string, enabled: boolean): void {
    this.barcodeProviders.update(providers => this.normalizeBarcodeProviderPriorities(providers.map(item =>
      item.provider === provider ? { ...item, enabled } : item)));
  }

  setBarcodeProviderPriority(provider: string, priority: string | number): void {
    const parsed = Number(priority);
    this.barcodeProviders.update(providers => this.normalizeBarcodeProviderPriorities(providers.map(item =>
      item.provider === provider
        ? { ...item, priority: Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : item.priority }
        : item)));
  }

  moveBarcodeProvider(provider: string, direction: -1 | 1): void {
    this.barcodeProviders.update(providers => {
      const ordered = this.normalizeBarcodeProviderPriorities(providers);
      const index = ordered.findIndex(item => item.provider === provider);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
        return ordered;
      }

      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return this.normalizeBarcodeProviderPriorities(next);
    });
  }

  saveBarcodeLookups(): void {
    this.barcodeLookupsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updateBarcodeLookups({ providers: this.normalizeBarcodeProviderPriorities(this.barcodeProviders()) }).subscribe({
      next: settings => {
        this.barcodeProviders.set(settings.providers);
        this.message.set('Barcode lookup settings saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save barcode lookup settings.'),
      complete: () => this.barcodeLookupsLoading.set(false)
    });
  }

  resetBarcodeLookups(): void {
    this.barcodeProviders.set(this.defaultBarcodeProviders());
  }

  loadMainAppearance(): void {
    this.loadAppearance(
      this.mainAppearance,
      this.mainAppearanceLoading,
      () => this.service.getMainAppearance(),
      'Failed to load main appearance settings.');
  }

  saveMainAppearance(): void {
    this.saveAppearance(
      this.mainAppearance,
      this.mainAppearanceLoading,
      settings => this.service.updateMainAppearance(settings),
      'Brand name is required before saving main appearance settings.',
      'Main appearance settings saved.',
      'Failed to save main appearance settings.');
  }

  resetMainAppearance(): void {
    this.mainAppearance.set(this.defaultMainAppearance());
  }

  loadCdSiteAppearance(): void {
    this.loadAppearance(
      this.cdSiteAppearance,
      this.cdSiteAppearanceLoading,
      () => this.service.getCdSiteAppearance(),
      'Failed to load CD site appearance settings.');
  }

  saveCdSiteAppearance(): void {
    this.saveAppearance(
      this.cdSiteAppearance,
      this.cdSiteAppearanceLoading,
      settings => this.service.updateCdSiteAppearance(settings),
      'Brand name is required before saving CD site appearance settings.',
      'CD site appearance settings saved.',
      'Failed to save CD site appearance settings.');
  }

  resetCdSiteAppearance(): void {
    this.cdSiteAppearance.set(this.defaultCdSiteAppearance());
  }

  loadDinoSiteAppearance(): void {
    this.loadAppearance(
      this.dinoSiteAppearance,
      this.dinoSiteAppearanceLoading,
      () => this.service.getDinoSiteAppearance(),
      'Failed to load Dino site appearance settings.');
  }

  saveDinoSiteAppearance(): void {
    this.saveAppearance(
      this.dinoSiteAppearance,
      this.dinoSiteAppearanceLoading,
      settings => this.service.updateDinoSiteAppearance(settings),
      'Brand name is required before saving Dino site appearance settings.',
      'Dino site appearance settings saved.',
      'Failed to save Dino site appearance settings.');
  }

  resetDinoSiteAppearance(): void {
    this.dinoSiteAppearance.set(this.defaultDinoSiteAppearance());
  }

  loadBlogAppearance(): void {
    this.loadAppearance(
      this.blogAppearance,
      this.blogAppearanceLoading,
      () => this.service.getBlogAppearance(),
      'Failed to load blog appearance settings.');
  }

  saveBlogAppearance(): void {
    this.saveAppearance(
      this.blogAppearance,
      this.blogAppearanceLoading,
      settings => this.service.updateBlogAppearance(settings),
      'Brand name is required before saving blog appearance settings.',
      'Blog appearance settings saved.',
      'Failed to save blog appearance settings.');
  }

  resetBlogAppearance(): void {
    this.blogAppearance.set(this.defaultBlogAppearance());
  }

  loadFilmReviewAppearance(): void {
    this.loadAppearance(
      this.filmReviewAppearance,
      this.filmReviewAppearanceLoading,
      () => this.service.getFilmReviewAppearance(),
      'Failed to load film review appearance settings.');
  }

  saveFilmReviewAppearance(): void {
    this.saveAppearance(
      this.filmReviewAppearance,
      this.filmReviewAppearanceLoading,
      settings => this.service.updateFilmReviewAppearance(settings),
      'Brand name is required before saving film review appearance settings.',
      'Film review appearance settings saved.',
      'Failed to save film review appearance settings.');
  }

  resetFilmReviewAppearance(): void {
    this.filmReviewAppearance.set(this.defaultFilmReviewAppearance());
  }

  loadImporterSettings(): void {
    this.importerSettingsLoading.set(true);
    forkJoin({
      steam: this.service.getSteamImporterSettings(),
      boardGameGeek: this.service.getBoardGameGeekImporterSettings(),
      musicFolders: this.service.getMusicFolderImporterSettings()
    }).subscribe({
      next: settings => {
        this.steamImporterSettings.set(settings.steam);
        this.boardGameGeekImporterSettings.set(settings.boardGameGeek);
        this.musicFolderImportRoot.set(settings.musicFolders.rootPath);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load importer settings.'),
      complete: () => this.importerSettingsLoading.set(false)
    });
  }

  setSteamImporterSetting<K extends keyof SteamImporterSettings>(field: K, value: SteamImporterSettings[K] | string): void {
    this.steamImporterSettings.update(settings => ({
      ...settings,
      [field]: typeof value === 'string' ? value.trim() || null : value
    }));
  }

  setBoardGameGeekImporterSetting<K extends keyof BoardGameGeekImporterSettings>(field: K, value: BoardGameGeekImporterSettings[K] | string): void {
    this.boardGameGeekImporterSettings.update(settings => ({
      ...settings,
      [field]: typeof value === 'string' ? value.trim() || null : value
    }));
  }

  saveImporterSettings(): void {
    this.importerSettingsLoading.set(true);
    this.error.set(null);
    this.message.set(null);

    forkJoin({
      steam: this.service.updateSteamImporterSettings(this.steamImporterSettings()),
      boardGameGeek: this.service.updateBoardGameGeekImporterSettings(this.boardGameGeekImporterSettings()),
      musicFolders: this.service.updateMusicFolderImporterSettings({
        rootPath: this.musicFolderImportRoot().trim() || 'Z:\\Rips'
      })
    }).subscribe({
      next: settings => {
        this.steamImporterSettings.set(settings.steam);
        this.boardGameGeekImporterSettings.set(settings.boardGameGeek);
        this.musicFolderImportRoot.set(settings.musicFolders.rootPath);
        this.message.set('Importer settings saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save importer settings.'),
      complete: () => this.importerSettingsLoading.set(false)
    });
  }

  resetImporterSettings(): void {
    this.steamImporterSettings.set(this.defaultSteamImporterSettings());
    this.boardGameGeekImporterSettings.set(this.defaultBoardGameGeekImporterSettings());
    this.musicFolderImportRoot.set('Z:\\Rips');
  }

  previewMusicFolderImport(): void {
    this.runMusicFolderImport(false);
  }

  applyMusicFolderImport(): void {
    const result = this.musicFolderImportResult();
    if (result && result.albumsCreated === 0 && result.artistsCreated === 0) {
      this.message.set('Music folder import has nothing new to add.');
      return;
    }

    const confirmed = window.confirm(`Import missing CDs from ${this.musicFolderImportRoot().trim() || 'Z:\\Rips'}?`);
    if (!confirmed) {
      return;
    }

    this.runMusicFolderImport(true);
  }

  exportMusicFolderImportCsv(): void {
    const result = this.musicFolderImportResult();
    if (!result) {
      this.error.set('Run a music folder preview before exporting.');
      return;
    }

    this.downloadCsv(`music-folder-import-${result.applied ? 'applied' : 'preview'}-${this.today()}.csv`, [
      ['Root path', result.rootPath],
      ['Applied', result.applied],
      ['Artist folders scanned', result.artistFoldersScanned],
      ['Album folders scanned', result.albumFoldersScanned],
      ['Artists created', result.artistsCreated],
      ['Albums created', result.albumsCreated],
      ['Existing albums', result.existingAlbums],
      ['Database-only albums', result.databaseOnlyAlbums],
      ['Skipped folders', result.skippedFolders],
      [],
      ['Artist', 'Album', 'Status', 'Relative path', 'Artist ID', 'Album ID'],
      ...this.filteredMusicFolderImportRows().map(row => [
        row.artist,
        row.album,
        this.musicFolderImportStatusLabel(row.status),
        row.relativePath,
        row.artistId,
        row.albumId
      ]),
      [],
      ['Messages'],
      ...result.messages.map(message => [message])
    ]);
  }

  musicFolderImportStatusLabel(status: string): string {
    switch (status) {
      case 'Existing':
        return 'Existing';
      case 'CreatedAlbum':
        return 'Added album';
      case 'CreatedArtistAndAlbum':
        return 'Added artist + album';
      case 'WouldCreateAlbum':
        return 'Would add album';
      case 'WouldCreateArtistAndAlbum':
        return 'Would add artist + album';
      case 'DuplicateFolder':
        return 'Duplicate folder';
      case 'DatabaseOnly':
        return 'DB only';
      default:
        return status;
    }
  }

  musicFolderImportStatusTone(status: string): string {
    if (status === 'Existing' || status === 'DatabaseOnly') {
      return 'bg-slate-100 text-slate-600';
    }

    if (status === 'DuplicateFolder') {
      return 'bg-amber-50 text-amber-700';
    }

    return 'bg-emerald-50 text-emerald-700';
  }

  private runMusicFolderImport(applyChanges: boolean): void {
    const rootPath = this.musicFolderImportRoot().trim() || 'Z:\\Rips';
    this.musicFolderImportLoading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.importMusicFolders({ rootPath, applyChanges }).subscribe({
      next: result => {
        this.musicFolderImportRoot.set(result.rootPath);
        this.musicFolderImportResult.set(result);
        this.musicFolderImportStatusFilter.set('All');
        this.message.set(applyChanges
          ? `Music folder import added ${result.albumsCreated} album(s) and ${result.artistsCreated} artist(s).`
          : `Music folder preview found ${result.albumsCreated} missing album(s).`);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to scan music folders.'),
      complete: () => this.musicFolderImportLoading.set(false)
    });
  }

  steamImporterStatus(): string {
    const settings = this.steamImporterSettings();
    if (!settings.apiKey?.trim() || !settings.steamId?.trim()) {
      return 'Missing required import credentials';
    }

    return [
      settings.includePlayedFreeGames ? 'Played free games included' : 'Played free games skipped',
      settings.includeAppInfo ? 'App details enabled' : 'App details skipped'
    ].join(' / ');
  }

  boardGameGeekImporterStatus(): string {
    const settings = this.boardGameGeekImporterSettings();
    if (!settings.username?.trim()) {
      return 'Missing username';
    }

    const scopes = [
      settings.includeOwned ? 'owned' : null,
      settings.includeWishlist ? 'wishlist' : null,
      settings.includeExpansions ? 'expansions' : null
    ].filter(Boolean);
    return scopes.length ? `Imports ${scopes.join(', ')}` : 'No collection scopes selected';
  }

  loadFinanceSettings(): void {
    this.financeSettingsLoading.set(true);
    this.service.getFinanceTrackerSettings().subscribe({
      next: settings => this.applyFinanceSettings(settings),
      error: err => {
        this.error.set(err.error ?? err.message ?? 'Failed to load finance settings.');
        this.financeSettingsLoading.set(false);
      },
      complete: () => this.financeSettingsLoading.set(false)
    });
  }

  saveFinanceSettings(): void {
    const accountCategories = this.parseLookupText(this.financeAccountCategoryText());
    const billCategories = this.parseLookupText(this.financeBillCategoryText());
    const donationMethods = this.parseLookupText(this.financeDonationMethodText());
    if (accountCategories.length === 0 || billCategories.length === 0 || donationMethods.length === 0) {
      this.error.set('Finance account categories, bill categories, and donation methods each need at least one value.');
      return;
    }

    this.financeSettingsLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.updateFinanceTrackerSettings({
      ...this.financeSettings(),
      accountCategories,
      billCategories,
      donationMethods
    }).subscribe({
      next: settings => {
        this.applyFinanceSettings(settings);
        this.message.set('Finance settings saved.');
      },
      error: err => {
        this.error.set(err.error ?? err.message ?? 'Failed to save finance settings.');
        this.financeSettingsLoading.set(false);
      },
      complete: () => this.financeSettingsLoading.set(false)
    });
  }

  resetFinanceSettings(): void {
    this.applyFinanceSettings(this.defaultFinanceSettings());
  }

  setFinanceSetting(field: FinanceNumericSetting, value: string | number): void {
    const parsed = Number(value);
    this.financeSettings.update(settings => ({
      ...settings,
      [field]: Number.isFinite(parsed) ? Math.trunc(parsed) : this.defaultFinanceSettings()[field]
    }));
  }

  private defaultFishThresholds(): FishReportThresholds {
    return {
      waterTestDueDays: 7,
      overdueCriticalDays: 7,
      waterTestCriticalDays: 14,
      lowProductPercent: 25,
      expiringSoonDays: 30
    };
  }

  private parseShoppingCategoryText(): string[] {
    return Array.from(new Set(this.shoppingCategoryRawRows()))
      .sort((left, right) => left.localeCompare(right));
  }

  private shoppingCategoryRawRows(): string[] {
    return this.shoppingCategoryText()
      .split(/\r?\n|,/)
      .map(category => category.trim())
      .filter(Boolean);
  }

  private duplicateLookupValues(values: string[]): string[] {
    const counts = values.reduce((map, value) => {
      const key = value.toLocaleLowerCase();
      const existing = map.get(key) ?? { label: value, count: 0 };
      map.set(key, { label: existing.label, count: existing.count + 1 });
      return map;
    }, new Map<string, { label: string; count: number }>());

    return [...counts.values()]
      .filter(item => item.count > 1)
      .map(item => item.label)
      .sort((left, right) => left.localeCompare(right));
  }

  private isHexColor(value: string | null | undefined): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value ?? '');
  }

  private looksLikeUrl(value: string): boolean {
    return /^(https?:\/\/|\/)/i.test(value.trim());
  }

  private defaultShoppingCategories(): string[] {
    return ['Grocery', 'Pet', 'Household', 'Garden', 'Canning', 'Medical', 'Other'];
  }

  private parseLookupText(value: string): string[] {
    return Array.from(new Set(this.lookupRawRows(value)))
      .sort((left, right) => left.localeCompare(right));
  }

  private lookupRawRows(value: string): string[] {
    return value
      .split(/\r?\n|,/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  private lookupSummaryCards(label: string, value: string): LookupSummaryCard[] {
    const rawRows = this.lookupRawRows(value);
    const parsed = this.parseLookupText(value);
    const duplicates = this.duplicateLookupValues(rawRows);
    return [
      { label, value: parsed.length, detail: 'Unique values saved' },
      { label: `${label} duplicates`, value: duplicates.length, detail: 'Ignored when saving' }
    ];
  }

  private lookupWarnings(label: string, value: string): string[] {
    const rawRows = this.lookupRawRows(value);
    const duplicates = this.duplicateLookupValues(rawRows);
    const warnings: string[] = [];
    if (duplicates.length) {
      warnings.push(`${label} duplicates ignored on save: ${duplicates.join(', ')}`);
    }
    if (rawRows.length > 0 && this.parseLookupText(value).length === 0) {
      warnings.push(`${label} has no valid values.`);
    }
    return warnings;
  }

  private loadAppearance(
    settingsSignal: WritableSignal<MainAppearanceSettings>,
    loadingSignal: WritableSignal<boolean>,
    getRequest: () => Observable<MainAppearanceSettings>,
    errorMessage: string
  ): void {
    loadingSignal.set(true);
    getRequest().subscribe({
      next: settings => settingsSignal.set(settings),
      error: err => this.error.set(err.error ?? err.message ?? errorMessage),
      complete: () => loadingSignal.set(false)
    });
  }

  private saveAppearance(
    settingsSignal: WritableSignal<MainAppearanceSettings>,
    loadingSignal: WritableSignal<boolean>,
    updateRequest: (settings: MainAppearanceSettings) => Observable<MainAppearanceSettings>,
    requiredMessage: string,
    savedMessage: string,
    errorMessage: string
  ): void {
    const settings = settingsSignal();
    if (!settings.brandName.trim()) {
      this.error.set(requiredMessage);
      return;
    }

    loadingSignal.set(true);
    this.error.set(null);
    this.message.set(null);
    updateRequest(settings).subscribe({
      next: saved => {
        settingsSignal.set(saved);
        this.message.set(savedMessage);
      },
      error: err => this.error.set(err.error ?? err.message ?? errorMessage),
      complete: () => loadingSignal.set(false)
    });
  }

  private defaultRecipeCategories(): string[] {
    return ['General', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Canning'];
  }

  private defaultRecipeCuisines(): string[] {
    return ['American', 'Italian', 'Mexican', 'Asian', 'Mediterranean'];
  }

  private defaultRecipeTags(): string[] {
    return ['Quick', 'Freezer', 'Favorite', 'Vegetarian', 'Spicy', 'Holiday'];
  }

  private defaultAlcoholCategories(): string[] {
    return ['Absinthe', 'Beer', 'Cider', 'Mead', 'Wine', 'Liquor', 'Mixes', 'Drinks'];
  }

  private defaultAlcoholLocations(): string[] {
    return ['Refrigerator', 'Wine Rack', 'Pantry', 'Basement', 'Turtle Room', 'Kitchen', 'Closet'];
  }

  private defaultBarcodeProviders(): BarcodeLookupProviderSetting[] {
    return [
      { provider: 'GoogleBooks', enabled: true, priority: 10 },
      { provider: 'OpenLibrary', enabled: true, priority: 20 },
      { provider: 'Crossref', enabled: true, priority: 30 },
      { provider: 'MusicBrainz', enabled: true, priority: 40 },
      { provider: 'UPCitemdb', enabled: true, priority: 50 },
      { provider: 'OpenFoodFacts', enabled: true, priority: 60 },
      { provider: 'Discogs', enabled: false, priority: 70 },
      { provider: 'Wikidata', enabled: true, priority: 80 }
    ];
  }

  private defaultMainAppearance(): MainAppearanceSettings {
    return {
      brandName: 'Verdelak',
      tagline: 'Collections, schedules, and household systems',
      primaryColor: '#2563eb',
      accentColor: '#0f766e',
      logoUrl: null,
      heroImageUrl: null,
      faviconUrl: null
    };
  }

  private defaultCdSiteAppearance(): MainAppearanceSettings {
    return {
      brandName: 'Verdelak CD Collection',
      tagline: 'Browse the collection by band and read CD reviews.',
      primaryColor: '#0d6efd',
      accentColor: '#6f42c1',
      logoUrl: null,
      heroImageUrl: null,
      faviconUrl: null
    };
  }

  private defaultDinoSiteAppearance(): MainAppearanceSettings {
    return {
      brandName: 'Verdelak Dino Archive',
      tagline: 'Browse published dinosaurs by name, taxonomy, and discovery notes.',
      primaryColor: '#198754',
      accentColor: '#0f766e',
      logoUrl: null,
      heroImageUrl: null,
      faviconUrl: null
    };
  }

  private defaultBlogAppearance(): MainAppearanceSettings {
    return {
      brandName: 'Verdelak Blog',
      tagline: 'Notes, updates, and personal writing.',
      primaryColor: '#4f46e5',
      accentColor: '#0f766e',
      logoUrl: null,
      heroImageUrl: null,
      faviconUrl: null
    };
  }

  private defaultFilmReviewAppearance(): MainAppearanceSettings {
    return {
      brandName: 'Verdelak Film Review',
      tagline: 'Movie notes, ratings, and review writing.',
      primaryColor: '#7c3aed',
      accentColor: '#be123c',
      logoUrl: null,
      heroImageUrl: null,
      faviconUrl: null
    };
  }

  private appearanceWarnings(settings: MainAppearanceSettings): string[] {
    const warnings: string[] = [];
    if (!settings.brandName.trim()) {
      warnings.push('Brand name is required before saving.');
    }
    if (!this.isHexColor(settings.primaryColor)) {
      warnings.push('Primary color should be a hex color like #2563eb.');
    }
    if (!this.isHexColor(settings.accentColor)) {
      warnings.push('Accent color should be a hex color like #0f766e.');
    }
    for (const [label, value] of [
      ['Logo URL', settings.logoUrl],
      ['Hero image URL', settings.heroImageUrl],
      ['Favicon URL', settings.faviconUrl]
    ] as const) {
      if (value && !this.looksLikeUrl(value)) {
        warnings.push(`${label} should start with http://, https://, or /.`);
      }
    }
    return warnings;
  }

  private defaultSteamImporterSettings(): SteamImporterSettings {
    return {
      apiKey: null,
      steamId: null,
      includePlayedFreeGames: true,
      includeAppInfo: true
    };
  }

  private defaultBoardGameGeekImporterSettings(): BoardGameGeekImporterSettings {
    return {
      username: null,
      includeOwned: true,
      includeWishlist: false,
      includeExpansions: false
    };
  }

  private normalizeBarcodeProviderPriorities(providers: BarcodeLookupProviderSetting[]): BarcodeLookupProviderSetting[] {
    return [...providers]
      .sort((left, right) => left.priority - right.priority || left.provider.localeCompare(right.provider))
      .map((provider, index) => ({ ...provider, priority: (index + 1) * 10 }));
  }

  private applyFinanceSettings(settings: FinanceTrackerSettings): void {
    this.financeSettings.set(settings);
    this.financeAccountCategoryText.set(settings.accountCategories.join('\n'));
    this.financeBillCategoryText.set(settings.billCategories.join('\n'));
    this.financeDonationMethodText.set(settings.donationMethods.join('\n'));
  }

  private downloadCsv(fileName: string, rows: (string | number | boolean | null | undefined)[][]): void {
    this.csvDownload.download(fileName, rows);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private defaultFinanceSettings(): FinanceTrackerSettings {
    const now = new Date();
    return {
      accountCategories: ['Checking', 'Credit Card', 'HSA', 'IRA', 'Retirement', 'Savings'],
      billCategories: ['Credit Card', 'Household', 'Insurance', 'Medical', 'Subscription', 'Utilities'],
      donationMethods: ['Cash', 'Check', 'Credit Card', 'Online', 'Payroll', 'Other'],
      yearCloseMonth: 5,
      yearCloseDay: 1,
      defaultReportYear: now.getFullYear(),
      defaultReportMonth: now.getMonth() + 1
    };
  }

  private defaultExternalSites(): ExternalSitesSettings {
    return {
      environmentName: 'local',
      sites: [
        { key: 'bartender', label: 'Bartender', localUrl: null, productionUrl: null, isActive: true, openInNewTab: true, sortOrder: 10 },
        { key: 'dino', label: 'Dino', localUrl: null, productionUrl: null, isActive: true, openInNewTab: true, sortOrder: 20 },
        { key: 'cd', label: 'CD', localUrl: 'http://localhost:5120', productionUrl: null, isActive: true, openInNewTab: true, sortOrder: 30 },
        { key: 'personal', label: 'Personal', localUrl: null, productionUrl: null, isActive: true, openInNewTab: true, sortOrder: 40 },
        { key: 'film-review', label: 'Film Review', localUrl: null, productionUrl: null, isActive: true, openInNewTab: true, sortOrder: 50 }
      ]
    };
  }
}


