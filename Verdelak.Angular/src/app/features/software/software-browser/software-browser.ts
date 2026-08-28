import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import {
  SoftwareBulkImportPreview,
  SoftwareBulkImportRequest,
  SoftwareBulkImportRowDecision,
  SoftwareItem,
  SoftwareLookup,
  SoftwareReportSummary,
  UpsertSoftwareItem
} from '../models/software.models';
import { SoftwareService } from '../software.service';

type StatusFilter = 'H' | 'W' | 'unknown' | 'all';
type SortKey = 'title' | 'platform' | 'location' | 'publisher';
type FilterKey = 'query' | 'platform' | 'location' | 'mediaType' | 'status';

interface ActiveFilterChip {
  key: FilterKey;
  label: string;
  value: string;
}

interface SoftwareDetailFact {
  label: string;
  value: string;
  tone: string;
}

interface SoftwareDetailCheck {
  label: string;
  value: string;
  complete: boolean;
}

interface SoftwareRelatedItem {
  item: SoftwareItem;
  context: string;
}

interface SoftwareForm {
  id: number | null;
  title: string;
  statusID: 'H' | 'W';
  platformId: number | null;
  locationId: number | null;
  publisher: string;
  developer: string;
  versionEdition: string;
  mediaType: string;
  serialLicenseKeyNotes: string;
  hasBox: boolean;
  hasManual: boolean;
  hasDisc: boolean;
  notes: string;
}

@Component({
  selector: 'app-software-browser',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './software-browser.html',
  styleUrl: './software-browser.scss'
})
export class SoftwareBrowser implements OnInit {
  readonly items = signal<SoftwareItem[]>([]);
  readonly platforms = signal<SoftwareLookup[]>([]);
  readonly locations = signal<SoftwareLookup[]>([]);
  readonly allMediaTypes = signal<string[]>([]);
  readonly report = signal<SoftwareReportSummary | null>(null);
  readonly wantedReportItems = signal<SoftwareItem[]>([]);
  readonly loadingWantedReport = signal(false);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly platformId = signal<number | null>(null);
  readonly locationId = signal<number | null>(null);
  readonly mediaType = signal('');
  readonly status = signal<StatusFilter>('H');
  readonly sortKey = signal<SortKey>('title');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly selectedItem = signal<SoftwareItem | null>(null);
  readonly isEditing = signal(false);
  readonly form = signal<SoftwareForm>(this.emptyForm());
  readonly routeMode = signal<'browser' | 'want-list'>('browser');
  readonly importPanelOpen = signal(false);
  readonly importText = signal('');
  readonly importDefaultPlatformId = signal<number | null>(null);
  readonly importDefaultLocationId = signal<number | null>(null);
  readonly importDefaultStatus = signal<'H' | 'W'>('H');
  readonly importHasHeader = signal(false);
  readonly importPreview = signal<SoftwareBulkImportPreview | null>(null);
  readonly importRowDecisions = signal<Record<number, SoftwareBulkImportRowDecision>>({});
  readonly importLoading = signal(false);

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly canManageSettings = computed(() => this.auth.user()?.role === 'Admin');
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly statusLabel = computed(() =>
    this.status() === 'W'
      ? 'wanted'
      : this.status() === 'unknown'
        ? 'unknown-status'
        : this.status() === 'all'
          ? 'total'
          : 'owned');
  readonly ownedOnPage = computed(() => this.items().filter(item => item.statusID === 'H').length);
  readonly wantedOnPage = computed(() => this.items().filter(item => item.statusID === 'W').length);
  readonly titleText = computed(() => this.routeMode() === 'want-list' ? 'Software Want List' : 'Software');
  readonly topPlatformBuckets = computed(() => (this.report()?.byPlatform ?? [])
    .filter(bucket => this.status() === 'W' ? bucket.wantedCount > 0 : bucket.ownedCount + bucket.wantedCount + bucket.unknownStatusCount > 0)
    .slice(0, 5));
  readonly topLocationBuckets = computed(() => (this.report()?.byLocation ?? [])
    .filter(bucket => this.status() === 'W' ? bucket.wantedCount > 0 : bucket.ownedCount + bucket.wantedCount + bucket.unknownStatusCount > 0)
    .slice(0, 5));
  readonly wantedReportByPlatform = computed(() => this.groupWantedReport('platform'));
  readonly wantedReportByLocation = computed(() => this.groupWantedReport('location'));
  readonly wantedReportByMedia = computed(() => this.groupWantedReport('mediaType'));
  readonly wantedReportRows = computed(() => this.routeMode() === 'want-list'
    ? this.wantedReportItems()
    : this.wantedReportItems().slice(0, 25));
  readonly wantedReportHiddenCount = computed(() => Math.max(0, this.wantedReportItems().length - this.wantedReportRows().length));
  readonly wantedReportEmptyText = computed(() => this.hasActiveFilters()
    ? 'No wanted software matches the current filters.'
    : 'No wanted software is currently listed.');
  readonly activeFilterChips = computed<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const query = this.query().trim();
    const mediaType = this.mediaType().trim();
    const platformId = this.platformId();
    const locationId = this.locationId();

    if (query) {
      chips.push({ key: 'query', label: 'Search', value: query });
    }

    if (platformId !== null) {
      chips.push({ key: 'platform', label: 'Platform', value: this.platformName(platformId) });
    }

    if (locationId !== null) {
      chips.push({ key: 'location', label: 'Location', value: this.locationName(locationId) });
    }

    if (mediaType) {
      chips.push({ key: 'mediaType', label: 'Media', value: mediaType });
    }

    if (this.status() !== this.defaultStatus()) {
      chips.push({ key: 'status', label: 'Status', value: this.statusFilterLabel(this.status()) });
    }

    return chips;
  });
  readonly hasActiveFilters = computed(() => this.activeFilterChips().length > 0);
  readonly selectedDetailFacts = computed<SoftwareDetailFact[]>(() => {
    const item = this.selectedItem();
    if (!item) {
      return [];
    }

    return [
      {
        label: 'Status',
        value: this.statusText(item),
        tone: this.statusTone(item)
      },
      {
        label: 'Storage',
        value: item.location || 'No location',
        tone: item.location ? 'app-token-soft-surface app-token-text-strong' : 'bg-slate-100 text-slate-700'
      },
      {
        label: 'Physical pieces',
        value: this.piecesText(item),
        tone: item.hasBox || item.hasManual || item.hasDisc ? 'app-token-soft-surface app-token-text-primary' : 'bg-slate-100 text-slate-700'
      },
      {
        label: 'Catalog notes',
        value: item.notes?.trim() || item.serialLicenseKeyNotes?.trim() ? 'Has notes' : 'No notes',
        tone: item.notes?.trim() || item.serialLicenseKeyNotes?.trim() ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
      }
    ];
  });
  readonly selectedDetailChecks = computed<SoftwareDetailCheck[]>(() => {
    const item = this.selectedItem();
    if (!item) {
      return [];
    }

    return [
      { label: 'Platform', value: item.platform || 'Missing platform', complete: Boolean(item.platform?.trim()) },
      { label: 'Location', value: item.location || 'No location', complete: Boolean(item.location?.trim()) },
      { label: 'Publisher', value: item.publisher || 'Unknown publisher', complete: Boolean(item.publisher?.trim()) },
      { label: 'Developer', value: item.developer || 'Unknown developer', complete: Boolean(item.developer?.trim()) },
      { label: 'Media', value: item.mediaType || 'Unknown media', complete: Boolean(item.mediaType?.trim()) },
      { label: 'Edition', value: item.versionEdition || 'No edition listed', complete: Boolean(item.versionEdition?.trim()) }
    ];
  });
  readonly selectedRelatedItems = computed<SoftwareRelatedItem[]>(() => {
    const selected = this.selectedItem();
    if (!selected) {
      return [];
    }

    const byId = new Map<number, SoftwareRelatedItem>();
    const sameTitle = (item: SoftwareItem) => item.id !== selected.id && item.title.localeCompare(selected.title, undefined, { sensitivity: 'accent' }) === 0;
    const sourceRows = [...this.items(), ...this.wantedReportItems()];
    for (const item of sourceRows.filter(sameTitle)) {
      byId.set(item.id, {
        item,
        context: item.platformId === selected.platformId && item.locationId === selected.locationId
          ? 'Same title and destination'
          : 'Same title elsewhere'
      });
    }

    return [...byId.values()]
      .sort((left, right) => left.item.platform.localeCompare(right.item.platform) || (left.item.location || '').localeCompare(right.item.location || ''))
      .slice(0, 6);
  });

  constructor(
    private readonly service: SoftwareService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.data['status'] === 'W') {
      this.status.set('W');
      this.routeMode.set('want-list');
    }

    this.loadLookups();
    this.loadReport();
    this.loadWantedReport();
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.service.list({
      q: this.query(),
      platformId: this.platformId() ?? undefined,
      locationId: this.locationId() ?? undefined,
      mediaType: this.mediaType(),
      status: this.status(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
        const selected = this.selectedItem();
        if (selected && !result.items.some(item => item.id === selected.id)) {
          this.selectedItem.set(null);
          this.isEditing.set(false);
          this.form.set(this.emptyForm());
        }
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software.'),
      complete: () => this.loading.set(false)
    });
  }

  loadReport(): void {
    this.service.getReportSummary().subscribe({
      next: report => this.report.set(report),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software report summary.')
    });
  }

  applyFilters(): void {
    this.loadWantedReport();
    this.load(1);
  }

  setStatusFilter(status: StatusFilter): void {
    this.status.set(status);
    this.applyFilters();
  }

  applyPlatformFilter(platformId: number | null, status: StatusFilter | null = null): void {
    this.platformId.set(platformId);
    if (status) {
      this.status.set(status);
    }
    this.applyFilters();
  }

  applyLocationFilter(locationId: number | null, status: StatusFilter | null = null): void {
    this.locationId.set(locationId);
    if (status) {
      this.status.set(status);
    }
    this.applyFilters();
  }

  applyMediaFilter(mediaType: string, status: StatusFilter | null = null): void {
    this.mediaType.set(mediaType === 'Unknown' ? '' : mediaType);
    if (status) {
      this.status.set(status);
    }
    this.applyFilters();
  }

  removeFilter(key: FilterKey): void {
    switch (key) {
      case 'query':
        this.query.set('');
        break;
      case 'platform':
        this.platformId.set(null);
        break;
      case 'location':
        this.locationId.set(null);
        break;
      case 'mediaType':
        this.mediaType.set('');
        break;
      case 'status':
        this.status.set(this.defaultStatus());
        break;
    }

    this.applyFilters();
  }

  clearFilters(): void {
    this.query.set('');
    this.platformId.set(null);
    this.locationId.set(null);
    this.mediaType.set('');
    this.status.set(this.defaultStatus());
    this.applyFilters();
  }

  setPageSize(value: string | number): void {
    this.pageSize.set(Math.max(10, Number(value) || 50));
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

  sortLabel(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  selectItem(item: SoftwareItem): void {
    this.detailLoading.set(true);
    this.error.set(null);
    this.service.get(item.id).subscribe({
      next: detail => {
        this.selectedItem.set(detail);
        if (this.isEditing()) {
          this.loadForm(detail);
        }
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software details.'),
      complete: () => this.detailLoading.set(false)
    });
  }

  editSelected(): void {
    const item = this.selectedItem();
    if (!item) {
      return;
    }

    this.isEditing.set(true);
    this.loadForm(item);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.form.set(this.emptyForm());
  }
  duplicateSelected(): void {
    const item = this.selectedItem();
    if (!item) {
      return;
    }

    this.isEditing.set(true);
    this.form.set({
      id: null,
      title: `${item.title} Copy`,
      statusID: item.statusID === 'W' ? 'W' : 'H',
      platformId: item.platformId,
      locationId: item.locationId,
      publisher: item.publisher ?? '',
      developer: item.developer ?? '',
      versionEdition: item.versionEdition ?? '',
      mediaType: item.mediaType ?? '',
      serialLicenseKeyNotes: '',
      hasBox: item.hasBox,
      hasManual: item.hasManual,
      hasDisc: item.hasDisc,
      notes: item.notes ?? ''
    });
  }

  private loadForm(item: SoftwareItem): void {
    this.form.set({
      id: item.id,
      title: item.title,
      statusID: item.statusID === 'W' ? 'W' : 'H',
      platformId: item.platformId,
      locationId: item.locationId,
      publisher: item.publisher ?? '',
      developer: item.developer ?? '',
      versionEdition: item.versionEdition ?? '',
      mediaType: item.mediaType ?? '',
      serialLicenseKeyNotes: item.serialLicenseKeyNotes ?? '',
      hasBox: item.hasBox,
      hasManual: item.hasManual,
      hasDisc: item.hasDisc,
      notes: item.notes ?? ''
    });
  }

  startNew(): void {
    this.error.set(null);
    this.message.set(null);
    this.selectedItem.set(null);
    this.isEditing.set(true);
    this.form.set(this.emptyForm());
  }

  openImportPanel(): void {
    this.importPanelOpen.set(true);
    if (!this.importDefaultPlatformId()) {
      this.importDefaultPlatformId.set(this.platformId() ?? this.platformIdForName('PC'));
    }
    if (this.importDefaultLocationId() === null) {
      this.importDefaultLocationId.set(this.locationId());
    }
    this.importDefaultStatus.set(this.status() === 'W' ? 'W' : 'H');
  }

  closeImportPanel(): void {
    this.importPanelOpen.set(false);
  }

  setImportText(value: string): void {
    this.importText.set(value);
    this.importPreview.set(null);
    this.importRowDecisions.set({});
  }

  previewImport(): void {
    const payload = this.importPayload();
    if (!payload.text.trim()) {
      this.error.set('Paste software rows before previewing.');
      return;
    }

    this.importLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.previewBulkImport(payload).subscribe({
      next: preview => this.importPreview.set(preview),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to preview software import.'),
      complete: () => this.importLoading.set(false)
    });
  }

  commitImport(): void {
    const payload = this.importPayload();
    const readyCount = this.importPreview()?.readyCount ?? 0;
    if (readyCount === 0) {
      this.error.set('There are no ready rows to import.');
      return;
    }

    this.importLoading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.commitBulkImport(payload).subscribe({
      next: result => {
        this.message.set(`Created ${result.createdCount} and updated ${result.updatedCount} software item${result.createdCount + result.updatedCount === 1 ? '' : 's'}. Skipped ${result.skippedCount}.`);
        this.importPreview.set({
          totalRows: result.rows.length,
          readyCount: 0,
          skipCount: result.skippedCount,
          errorCount: result.errorCount,
          rows: result.rows
        });
        this.loadLookups();
        this.loadReport();
        this.loadWantedReport();
        this.load(1);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to import software rows.'),
      complete: () => this.importLoading.set(false)
    });
  }

  clearImport(): void {
    this.importText.set('');
    this.importPreview.set(null);
    this.importRowDecisions.set({});
  }

  setImportRowAction(rowNumber: number, action: 'Create' | 'Skip' | 'Update'): void {
    const row = this.importPreview()?.rows.find(row => row.rowNumber === rowNumber);
    const existingId = action === 'Update'
      ? row?.existingId ?? row?.matches[0]?.id ?? null
      : null;
    this.importRowDecisions.set({
      ...this.importRowDecisions(),
      [rowNumber]: { rowNumber, action, existingId }
    });
    this.previewImport();
  }

  setImportRowExistingId(rowNumber: number, existingId: number | string | null): void {
    const numericId = existingId === null || existingId === '' ? null : Number(existingId);
    const current = this.importRowDecisions()[rowNumber];
    this.importRowDecisions.set({
      ...this.importRowDecisions(),
      [rowNumber]: { rowNumber, action: current?.action ?? 'Update', existingId: numericId }
    });
    this.previewImport();
  }

  importActionTone(action: string): string {
    switch (action) {
      case 'Create':
        return 'bg-emerald-100 text-emerald-800';
      case 'Skip':
        return 'bg-amber-100 text-amber-800';
      case 'Update':
        return 'app-token-soft-surface app-token-text-strong';
      default:
        return 'bg-red-100 text-red-800';
    }
  }

  private importPayload(): SoftwareBulkImportRequest {
    return {
      text: this.importText(),
      defaultPlatformId: this.importDefaultPlatformId(),
      defaultLocationId: this.importDefaultLocationId(),
      defaultStatusID: this.importDefaultStatus(),
      hasHeader: this.importHasHeader(),
      rowDecisions: Object.values(this.importRowDecisions())
    };
  }

  setFormField<K extends keyof SoftwareForm>(field: K, value: SoftwareForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();
    if (!form.title.trim()) {
      this.error.set('Title is required.');
      return;
    }

    if (!form.platformId) {
      this.error.set('Choose a platform. Platforms are managed in Admin Settings.');
      return;
    }

    const payload: UpsertSoftwareItem = {
      title: form.title.trim(),
      statusID: form.statusID,
      platformId: form.platformId,
      locationId: form.locationId,
      publisher: form.publisher.trim() || null,
      developer: form.developer.trim() || null,
      versionEdition: form.versionEdition.trim() || null,
      mediaType: form.mediaType.trim() || null,
      serialLicenseKeyNotes: form.serialLicenseKeyNotes.trim() || null,
      hasBox: form.hasBox,
      hasManual: form.hasManual,
      hasDisc: form.hasDisc,
      notes: form.notes.trim() || null
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = (saved: SoftwareItem) => {
      this.message.set(`${saved.title} saved.`);
      this.selectedItem.set(saved);
      this.isEditing.set(false);
      this.form.set(this.emptyForm());
      this.loadLookups();
      this.loadReport();
      this.loadWantedReport();
      this.load();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save software.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.update(form.id, payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
    } else {
      this.service.create(payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
    }
  }

  deleteSelected(): void {
    const form = this.form();
    if (!form.id) {
      return;
    }

    this.deleteItem(form.id, form.title);
  }

  deleteItem(id: number, title: string): void {
    if (!window.confirm(`Delete ${title}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.delete(id).subscribe({
      next: () => {
        this.message.set(`${title} deleted.`);
        this.selectedItem.set(null);
        this.isEditing.set(false);
        this.form.set(this.emptyForm());
        this.loadReport();
        this.loadWantedReport();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete software.'),
      complete: () => this.loading.set(false)
    });
  }

  private loadLookups(): void {
    this.service.getPlatforms().subscribe({
      next: platforms => this.platforms.set(platforms),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software platforms.')
    });
    this.service.getLocations().subscribe({
      next: locations => this.locations.set(locations),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software locations.')
    });
    this.loadMediaTypes();
  }

  private loadMediaTypes(): void {
    this.service.getMediaTypes().subscribe({
      next: mediaTypes => this.allMediaTypes.set(mediaTypes),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software media types.')
    });
  }

  private sort(): string {
    return `${this.sortDirection() === 'desc' ? '-' : ''}${this.sortKey()}`;
  }

  markSelectedStatus(statusID: 'H' | 'W'): void {
    const item = this.selectedItem();
    if (!item) {
      return;
    }

    this.markItemStatus(item, statusID);
  }

  markItemStatus(item: SoftwareItem, statusID: 'H' | 'W'): void {
    const payload = this.payloadFromItem(item, statusID);
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.update(item.id, payload).subscribe({
      next: saved => {
        if (this.selectedItem()?.id === saved.id) {
          this.selectedItem.set(saved);
        }
        this.message.set(`${saved.title} marked ${statusID === 'W' ? 'wanted' : 'owned'}.`);
        this.loadReport();
        this.loadWantedReport();
        this.load(this.page());
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to update software status.'),
      complete: () => this.loading.set(false)
    });
  }

  loadWantedReport(): void {
    this.loadingWantedReport.set(true);
    this.service.getWantListReport({
      q: this.query(),
      platformId: this.platformId() ?? undefined,
      locationId: this.locationId() ?? undefined,
      mediaType: this.mediaType(),
      sort: this.sort()
    }).subscribe({
      next: items => this.wantedReportItems.set(items),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load software want-list report.'),
      complete: () => this.loadingWantedReport.set(false)
    });
  }

  statusText(item: SoftwareItem): string {
    return item.statusID === 'W'
      ? 'Wanted'
      : item.statusID === 'Unknown'
        ? 'Unknown'
        : 'Owned';
  }

  statusTone(item: SoftwareItem): string {
    return item.statusID === 'W'
      ? 'bg-amber-100 text-amber-800'
      : item.statusID === 'Unknown'
        ? 'bg-slate-200 text-slate-700'
        : 'bg-emerald-100 text-emerald-800';
  }

  detailCheckTone(check: SoftwareDetailCheck): string {
    return check.complete
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-amber-200 bg-amber-50 text-amber-900';
  }

  filterToSelectedPlatform(item: SoftwareItem): void {
    this.applyPlatformFilter(item.platformId, null);
  }

  filterToSelectedLocation(item: SoftwareItem): void {
    this.applyLocationFilter(item.locationId, null);
  }

  filterToSelectedMedia(item: SoftwareItem): void {
    this.applyMediaFilter(item.mediaType || 'Unknown', null);
  }

  searchSelectedTitle(item: SoftwareItem): void {
    this.query.set(item.title);
    this.applyFilters();
  }

  selectRelatedItem(related: SoftwareRelatedItem): void {
    this.selectItem(related.item);
  }

  piecesText(item: SoftwareItem): string {
    const pieces = [
      item.hasBox ? 'Box' : null,
      item.hasManual ? 'Manual' : null,
      item.hasDisc ? 'Disc' : null
    ].filter(Boolean);

    return pieces.length ? pieces.join(', ') : 'None listed';
  }

  itemIdentity(item: SoftwareItem): string {
    return [item.platform, item.versionEdition, item.mediaType]
      .filter(value => Boolean(value && value.trim()))
      .join(' / ');
  }

  statusFilterLabel(status: StatusFilter): string {
    switch (status) {
      case 'W':
        return 'Wanted';
      case 'unknown':
        return 'Unknown status';
      case 'all':
        return 'All';
      default:
        return 'Owned';
    }
  }

  statusFilterTone(status: StatusFilter): string {
    return this.status() === status
      ? 'app-token-border-accent app-token-selected-row app-token-ring'
      : 'border-slate-200 bg-white app-token-selectable-row';
  }

  platformName(id: number): string {
    return this.platforms().find(platform => platform.id === id)?.name ?? `Platform #${id}`;
  }

  locationName(id: number): string {
    return this.locations().find(location => location.id === id)?.name ?? `Location #${id}`;
  }

  private defaultStatus(): StatusFilter {
    return this.routeMode() === 'want-list' ? 'W' : 'H';
  }
  platformIdForName(name: string): number | null {
    return this.platforms().find(platform => platform.name === name)?.id ?? null;
  }

  locationIdForName(name: string): number | null {
    return this.locations().find(location => location.name === name)?.id ?? null;
  }

  bucketCount(bucket: { ownedCount: number; wantedCount: number; unknownStatusCount: number }): number {
    return this.status() === 'W'
      ? bucket.wantedCount
      : this.status() === 'H'
        ? bucket.ownedCount
        : bucket.ownedCount + bucket.wantedCount + bucket.unknownStatusCount;
  }

  exportWantedCsv(): void {
    const items = this.wantedReportItems();
    if (items.length > 0) {
      this.downloadWantedItemsCsv(items);
      return;
    }

    this.service.getWantListReport({
      q: this.query(),
      platformId: this.platformId() ?? undefined,
      locationId: this.locationId() ?? undefined,
      mediaType: this.mediaType(),
      sort: this.sort()
    }).subscribe({
      next: rows => this.downloadWantedItemsCsv(rows),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to export software want list.')
    });
  }

  printWantedReport(): void {
    window.print();
  }

  private downloadWantedItemsCsv(items: SoftwareItem[]): void {
    this.downloadCsv('software-want-list.csv', [
      ['Title', 'Platform', 'Location', 'Publisher', 'Developer', 'Version/Edition', 'Media', 'Notes'],
      ...items.map(item => [
        item.title,
        item.platform,
        item.location ?? '',
        item.publisher ?? '',
        item.developer ?? '',
        item.versionEdition ?? '',
        item.mediaType ?? '',
        item.notes ?? ''
      ])
    ]);
  }

  private groupWantedReport(key: 'platform' | 'location' | 'mediaType'): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();
    for (const item of this.wantedReportItems()) {
      const name = key === 'platform'
        ? item.platform || 'Unknown'
        : key === 'location'
          ? item.location || 'None'
          : item.mediaType || 'Unknown';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }

  private payloadFromItem(item: SoftwareItem, statusID: 'H' | 'W'): UpsertSoftwareItem {
    return {
      title: item.title,
      statusID,
      platformId: item.platformId,
      locationId: item.locationId,
      publisher: item.publisher,
      developer: item.developer,
      versionEdition: item.versionEdition,
      mediaType: item.mediaType,
      serialLicenseKeyNotes: item.serialLicenseKeyNotes,
      hasBox: item.hasBox,
      hasManual: item.hasManual,
      hasDisc: item.hasDisc,
      notes: item.notes
    };
  }

  private downloadCsv(fileName: string, rows: Array<Array<string | number | boolean | null>>): void {
    const csv = rows
      .map(row => row.map(cell => this.csvCell(cell)).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string | number | boolean | null): string {
    const text = value === null ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private emptyForm(): SoftwareForm {
    return {
      id: null,
      title: '',
      statusID: 'H',
      platformId: null,
      locationId: null,
      publisher: '',
      developer: '',
      versionEdition: '',
      mediaType: '',
      serialLicenseKeyNotes: '',
      hasBox: false,
      hasManual: false,
      hasDisc: false,
      notes: ''
    };
  }
}








