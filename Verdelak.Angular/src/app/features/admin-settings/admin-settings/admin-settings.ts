import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpookytownType } from '../../spookytown/models/spookytown.models';
import { AdminSettingsService, BarcodeLookupProviderSetting, ExternalSiteSetting, ExternalSitesSettings, FinanceTrackerSettings, FishReportThresholds, SoftwareLocationSetting, SoftwarePlatformSetting } from '../admin-settings.service';

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

type FinanceNumericSetting = 'yearCloseMonth' | 'yearCloseDay' | 'defaultReportYear' | 'defaultReportMonth';

@Component({
  selector: 'app-admin-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss'
})
export class AdminSettings implements OnInit {
  readonly spookytownTypes = signal<SpookytownType[]>([]);
  readonly selectedTypeId = signal<string | null>(null);
  readonly form = signal<SpookytownTypeForm>({ id: '', type: '', originalId: null });
  readonly fishThresholds = signal<FishReportThresholds>(this.defaultFishThresholds());
  readonly shoppingCategoryText = signal(this.defaultShoppingCategories().join('\n'));
  readonly recipeCategoryText = signal(this.defaultRecipeCategories().join('\n'));
  readonly recipeCuisineText = signal(this.defaultRecipeCuisines().join('\n'));
  readonly recipeTagText = signal(this.defaultRecipeTags().join('\n'));
  readonly alcoholCategoryText = signal(this.defaultAlcoholCategories().join('\n'));
  readonly alcoholLocationText = signal(this.defaultAlcoholLocations().join('\n'));
  readonly barcodeProviders = signal<BarcodeLookupProviderSetting[]>(this.defaultBarcodeProviders());
  readonly barcodeProviderOrderPreview = computed(() =>
    this.normalizeBarcodeProviderPriorities(this.barcodeProviders())
      .filter(provider => provider.enabled)
      .map(provider => provider.provider)
      .join(' > ') || 'No enabled providers');
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
    return Array.from(new Set(this.shoppingCategoryText()
      .split(/\r?\n|,/)
      .map(category => category.trim())
      .filter(Boolean)))
      .sort((left, right) => left.localeCompare(right));
  }

  private defaultShoppingCategories(): string[] {
    return ['Grocery', 'Pet', 'Household', 'Garden', 'Canning', 'Medical', 'Other'];
  }

  private parseLookupText(value: string): string[] {
    return Array.from(new Set(value
      .split(/\r?\n|,/)
      .map(item => item.trim())
      .filter(Boolean)))
      .sort((left, right) => left.localeCompare(right));
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
    const csv = rows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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


