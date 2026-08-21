import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { SpookytownType } from '../spookytown/models/spookytown.models';

export interface SpookytownTypeUsage {
  id: string;
  itemCount: number;
}

export interface FishReportThresholds {
  waterTestDueDays: number;
  overdueCriticalDays: number;
  waterTestCriticalDays: number;
  lowProductPercent: number;
  expiringSoonDays: number;
}

export interface ShoppingCategories {
  categories: string[];
}

export interface RecipeLookupSettings {
  categories: string[];
  cuisines: string[];
  tags: string[];
}

export interface AlcoholLookupSettings {
  categories: string[];
  locations: string[];
}

export interface BarcodeLookupProviderSetting {
  provider: string;
  enabled: boolean;
  priority: number;
}

export interface BarcodeLookupSettings {
  providers: BarcodeLookupProviderSetting[];
}

export interface FinanceTrackerSettings {
  accountCategories: string[];
  billCategories: string[];
  donationMethods: string[];
  yearCloseMonth: number;
  yearCloseDay: number;
  defaultReportYear: number;
  defaultReportMonth: number;
}

export interface ExternalSiteSetting {
  key: string;
  label: string;
  localUrl: string | null;
  productionUrl: string | null;
  isActive: boolean;
  openInNewTab: boolean;
  sortOrder: number;
}

export interface ExternalSitesSettings {
  environmentName: 'local' | 'production';
  sites: ExternalSiteSetting[];
}

export interface SteamImporterSettings {
  apiKey: string | null;
  steamId: string | null;
  includePlayedFreeGames: boolean;
  includeAppInfo: boolean;
}

export interface BoardGameGeekImporterSettings {
  username: string | null;
  includeOwned: boolean;
  includeWishlist: boolean;
  includeExpansions: boolean;
}

export interface SoftwarePlatformSetting {
  id: number;
  name: string;
}

export interface SoftwarePlatformUsage {
  id: number;
  itemCount: number;
}

export interface SoftwareLocationSetting {
  id: number;
  name: string;
}

export interface SoftwareLocationUsage {
  id: number;
  itemCount: number;
}

export interface SoftwareDefaultsSeedResult {
  platformsCreated: number;
  locationsCreated: number;
}

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly http = inject(HttpClient);
  private readonly spookytownUrl = `${environment.apiUrl}/Spookytown`;
  private readonly settingsUrl = `${environment.apiUrl}/admin/settings`;

  getSpookytownTypes() {
    return this.http.get<SpookytownType[]>(`${this.spookytownUrl}/types`);
  }

  getSpookytownTypeUsage(id: string) {
    return this.http.get<SpookytownTypeUsage>(`${this.spookytownUrl}/types/${id}/usage`);
  }

  createSpookytownType(request: SpookytownType) {
    return this.http.post<SpookytownType>(`${this.spookytownUrl}/types`, request);
  }

  updateSpookytownType(id: string, request: SpookytownType) {
    return this.http.put<SpookytownType>(`${this.spookytownUrl}/types/${id}`, request);
  }

  deleteSpookytownType(id: string) {
    return this.http.delete<void>(`${this.spookytownUrl}/types/${id}`);
  }

  getFishReportThresholds() {
    return this.http.get<FishReportThresholds>(`${this.settingsUrl}/fish-report-thresholds`);
  }

  updateFishReportThresholds(request: FishReportThresholds) {
    return this.http.put<FishReportThresholds>(`${this.settingsUrl}/fish-report-thresholds`, request);
  }

  getShoppingCategories() {
    return this.http.get<ShoppingCategories>(`${this.settingsUrl}/shopping-categories`);
  }

  updateShoppingCategories(request: ShoppingCategories) {
    return this.http.put<ShoppingCategories>(`${this.settingsUrl}/shopping-categories`, request);
  }

  getRecipeLookups() {
    return this.http.get<RecipeLookupSettings>(`${this.settingsUrl}/recipe-lookups`);
  }

  updateRecipeLookups(request: RecipeLookupSettings) {
    return this.http.put<RecipeLookupSettings>(`${this.settingsUrl}/recipe-lookups`, request);
  }

  getAlcoholLookups() {
    return this.http.get<AlcoholLookupSettings>(`${this.settingsUrl}/alcohol-lookups`);
  }

  updateAlcoholLookups(request: AlcoholLookupSettings) {
    return this.http.put<AlcoholLookupSettings>(`${this.settingsUrl}/alcohol-lookups`, request);
  }

  getBarcodeLookups() {
    return this.http.get<BarcodeLookupSettings>(`${this.settingsUrl}/barcode-lookups`);
  }

  updateBarcodeLookups(request: BarcodeLookupSettings) {
    return this.http.put<BarcodeLookupSettings>(`${this.settingsUrl}/barcode-lookups`, request);
  }

  getFinanceTrackerSettings() {
    return this.http.get<FinanceTrackerSettings>(`${this.settingsUrl}/finance-tracker`);
  }

  updateFinanceTrackerSettings(request: FinanceTrackerSettings) {
    return this.http.put<FinanceTrackerSettings>(`${this.settingsUrl}/finance-tracker`, request);
  }

  getExternalSites() {
    return this.http.get<ExternalSitesSettings>(`${this.settingsUrl}/external-sites`);
  }

  updateExternalSites(request: ExternalSitesSettings) {
    return this.http.put<ExternalSitesSettings>(`${this.settingsUrl}/external-sites`, request);
  }

  getSteamImporterSettings() {
    return this.http.get<SteamImporterSettings>(`${this.settingsUrl}/steam-importer`);
  }

  updateSteamImporterSettings(request: SteamImporterSettings) {
    return this.http.put<SteamImporterSettings>(`${this.settingsUrl}/steam-importer`, request);
  }

  getBoardGameGeekImporterSettings() {
    return this.http.get<BoardGameGeekImporterSettings>(`${this.settingsUrl}/boardgamegeek-importer`);
  }

  updateBoardGameGeekImporterSettings(request: BoardGameGeekImporterSettings) {
    return this.http.put<BoardGameGeekImporterSettings>(`${this.settingsUrl}/boardgamegeek-importer`, request);
  }

  getSoftwarePlatforms() {
    return this.http.get<SoftwarePlatformSetting[]>(`${this.settingsUrl}/software-platforms`);
  }

  getSoftwarePlatformUsage(id: number) {
    return this.http.get<SoftwarePlatformUsage>(`${this.settingsUrl}/software-platforms/${id}/usage`);
  }

  createSoftwarePlatform(request: SoftwarePlatformSetting) {
    return this.http.post<SoftwarePlatformSetting>(`${this.settingsUrl}/software-platforms`, request);
  }

  updateSoftwarePlatform(id: number, request: SoftwarePlatformSetting) {
    return this.http.put<SoftwarePlatformSetting>(`${this.settingsUrl}/software-platforms/${id}`, request);
  }

  deleteSoftwarePlatform(id: number) {
    return this.http.delete<void>(`${this.settingsUrl}/software-platforms/${id}`);
  }

  seedSoftwareDefaults() {
    return this.http.post<SoftwareDefaultsSeedResult>(`${this.settingsUrl}/software/defaults`, {});
  }

  getSoftwareLocations() {
    return this.http.get<SoftwareLocationSetting[]>(`${this.settingsUrl}/software-locations`);
  }

  getSoftwareLocationUsage(id: number) {
    return this.http.get<SoftwareLocationUsage>(`${this.settingsUrl}/software-locations/${id}/usage`);
  }

  createSoftwareLocation(request: SoftwareLocationSetting) {
    return this.http.post<SoftwareLocationSetting>(`${this.settingsUrl}/software-locations`, request);
  }

  updateSoftwareLocation(id: number, request: SoftwareLocationSetting) {
    return this.http.put<SoftwareLocationSetting>(`${this.settingsUrl}/software-locations/${id}`, request);
  }

  deleteSoftwareLocation(id: number) {
    return this.http.delete<void>(`${this.settingsUrl}/software-locations/${id}`);
  }
}
