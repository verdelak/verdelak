import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { concatMap, finalize, forkJoin, from, map, of, toArray } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { MtgService } from '../mtg.service';
import { MtgCleanupBucket, MtgCollectionItem, MtgCollectionReport, MtgDuplicateCluster, MtgLookup, MtgReportBucket, UpsertMtgCollectionItem } from '../models/mtg.models';

type StatusFilter = 'H' | 'W' | 'all';
type SortKey = 'name' | 'set' | 'rarity' | 'qty' | 'value' | 'location' | 'condition' | 'review';
type MtgFilterKey = 'query' | 'setCode' | 'color' | 'rarity' | 'type' | 'location' | 'condition' | 'language' | 'finish' | 'cleanup' | 'status';

interface MtgSummaryCard {
  label: string;
  value: string;
  detail: string;
  action?: 'review';
}

interface MtgReportRow {
  name: string;
  rowCount: number;
  ownedCount: number;
  wantedCount: number;
  copies: number;
  foilCopies: number;
  estimatedValue: number;
  missingImageCount: number;
}

interface MtgForm {
  id: number | null;
  cardId: number | null;
  printingId: number | null;
  name: string;
  manaCost: string;
  colors: string;
  colorIdentity: string;
  typeLine: string;
  oracleText: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  artist: string;
  imageUrl: string;
  scryfallId: string;
  finishes: string;
  quantity: number | null;
  foilQuantity: number | null;
  wantStatusID: 'H' | 'W';
  condition: string;
  language: string;
  location: string;
  notes: string;
  estimatedValue: number | null;
}

interface MtgImportRow {
  rowNumber: number;
  selected: boolean;
  payload: UpsertMtgCollectionItem;
  warnings: string[];
  errors: string[];
}

interface MtgDetailChip {
  label: string;
  value: string;
  tone: 'slate' | 'green' | 'amber' | 'red' | 'blue';
}

interface MtgActiveFilterChip {
  key: MtgFilterKey;
  label: string;
  value: string;
}

interface MtgReviewRow {
  item: MtgCollectionItem;
  issues: string[];
}

@Component({
  selector: 'app-mtg-browser',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mtg-browser.html',
  styleUrl: './mtg-browser.scss'
})
export class MtgBrowser implements OnInit {
  readonly items = signal<MtgCollectionItem[]>([]);
  readonly report = signal<MtgCollectionReport | null>(null);
  readonly routeMode = signal<'browser' | 'want-list'>('browser');
  readonly sets = signal<MtgLookup[]>([]);
  readonly rarities = signal<MtgLookup[]>([]);
  readonly locations = signal<MtgLookup[]>([]);
  readonly conditions = signal<MtgLookup[]>([]);
  readonly languages = signal<MtgLookup[]>([]);
  readonly finishes = signal<MtgLookup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly setCode = signal('');
  readonly color = signal('');
  readonly rarity = signal('');
  readonly type = signal('');
  readonly location = signal('');
  readonly condition = signal('');
  readonly language = signal('');
  readonly finish = signal('');
  readonly cleanup = signal('');
  readonly status = signal<StatusFilter>('H');
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly form = signal<MtgForm>(this.emptyForm());
  readonly importText = signal('');
  readonly importRows = signal<MtgImportRow[]>([]);
  readonly importBusy = signal(false);
  readonly pageSizeOptions = [25, 50, 100, 200];

  readonly colors = [
    { id: '', name: 'All colors' },
    { id: 'W', name: 'White' },
    { id: 'U', name: 'Blue' },
    { id: 'B', name: 'Black' },
    { id: 'R', name: 'Red' },
    { id: 'G', name: 'Green' },
    { id: 'C', name: 'Colorless' }
  ];
  private readonly colorSortOrder = 'WUBRG';

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly statusLabel = computed(() => this.status() === 'W' ? 'wanted' : this.status() === 'all' ? 'total' : 'owned');
  readonly titleText = computed(() => this.routeMode() === 'want-list' ? 'Magic Want List' : 'Magic: The Gathering');
  readonly shownCopies = computed(() => this.items().reduce((sum, item) => sum + item.quantity + item.foilQuantity, 0));
  readonly shownFoils = computed(() => this.items().reduce((sum, item) => sum + item.foilQuantity, 0));
  readonly wantedShown = computed(() => this.items().filter(item => item.wantStatusID === 'W').length);
  readonly shownValue = computed(() => this.items().reduce((sum, item) => sum + (item.estimatedValue ?? 0), 0));
  readonly mtgSummaryCards = computed<MtgSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: (this.report()?.totalRows ?? this.items().length).toLocaleString(),
      detail: this.report() ? 'Filtered collection matches' : `${this.total().toLocaleString()} total matches`
    },
    {
      label: 'Copies',
      value: (this.report()?.totalCopies ?? this.shownCopies()).toLocaleString(),
      detail: `${(this.report()?.totalFoilCopies ?? this.shownFoils()).toLocaleString()} foil copies`
    },
    {
      label: 'Wanted',
      value: (this.report()?.wantedRows ?? this.wantedShown()).toLocaleString(),
      detail: this.report() ? 'Rows marked want in filtered collection' : 'Rows marked want in current view'
    },
    {
      label: 'Review issues',
      value: this.filteredReviewIssueCount().toLocaleString(),
      detail: this.report()
        ? `${this.filteredReviewRowCount().toLocaleString()} filtered rows need cleanup`
        : 'Current-page cleanup issue count',
      action: 'review'
    },
    {
      label: 'Estimated value',
      value: this.currency(this.report()?.estimatedValue ?? this.shownValue()),
      detail: this.report() ? 'Filtered collection' : 'Current page only'
    }
  ]);
  readonly setReportRows = computed<MtgReportBucket[]>(() => this.report()?.setBreakdown ?? this.buildReportRows(this.items(), item => item.setCode || 'Unknown set'));
  readonly colorReportRows = computed<MtgReportBucket[]>(() => this.report()?.colorBreakdown ?? this.buildReportRows(this.items(), item => this.colorLabel(item.colorIdentity)));
  readonly rarityReportRows = computed<MtgReportBucket[]>(() => this.report()?.rarityBreakdown ?? this.buildReportRows(this.items(), item => item.rarity || 'Unknown rarity'));
  readonly locationReportRows = computed<MtgReportBucket[]>(() => this.report()?.locationBreakdown ?? this.buildReportRows(this.items(), item => item.location || 'No location'));
  readonly activeFilterChips = computed<MtgActiveFilterChip[]>(() => {
    const chips: MtgActiveFilterChip[] = [];
    const add = (key: MtgFilterKey, label: string, value: string) => {
      if (value) {
        chips.push({ key, label, value });
      }
    };

    add('query', 'Search', this.query().trim());
    add('setCode', 'Set', this.lookupName(this.sets(), this.setCode()));
    add('color', 'Color', this.colorFilterLabel(this.color()));
    add('rarity', 'Rarity', this.lookupName(this.rarities(), this.rarity()));
    add('type', 'Type', this.type().trim());
    add('location', 'Location', this.location() === '__none' ? 'No location' : this.lookupName(this.locations(), this.location()));
    add('condition', 'Condition', this.condition() === '__none' ? 'No condition' : this.lookupName(this.conditions(), this.condition()));
    add('language', 'Language', this.language() === '__none' ? 'No language' : this.lookupName(this.languages(), this.language()));
    add('finish', 'Finish', this.lookupName(this.finishes(), this.finish()));
    add('cleanup', 'Cleanup', this.cleanupLabel(this.cleanup()));

    if (this.status() !== this.defaultStatus()) {
      add('status', 'Status', this.status() === 'all' ? 'All' : this.status() === 'W' ? 'Want' : 'Have');
    }

    return chips;
  });
  readonly cleanupRows = computed<MtgCleanupBucket[]>(() => {
    const report = this.report();
    if (report) {
      return report.cleanupBuckets;
    }

    const items = this.items();
    return [
      {
        key: 'missingImage',
        label: 'Missing images',
        count: items.filter(item => !item.imageUrl).length,
        detail: 'No image URL for visual card review',
        tone: 'amber'
      },
      {
        key: 'missingScryfall',
        label: 'Missing Scryfall IDs',
        count: items.filter(item => !item.scryfallId).length,
        detail: 'No external card identifier',
        tone: 'amber'
      },
      {
        key: 'missingPrinting',
        label: 'Weak printing data',
        count: items.filter(item => !item.setCode || item.setCode === 'UNK' || !item.collectorNumber || item.collectorNumber === 'UNK').length,
        detail: 'Set code or collector number needs review',
        tone: 'red'
      },
      {
        key: 'missingIdentity',
        label: 'Missing identity',
        count: items.filter(item => !item.colorIdentity || !item.typeLine).length,
        detail: 'Color identity or type line is blank',
        tone: 'amber'
      },
      {
        key: 'zeroCopies',
        label: 'Zero-copy owned rows',
        count: items.filter(item => item.wantStatusID === 'H' && item.quantity + item.foilQuantity <= 0).length,
        detail: 'Owned rows with no regular or foil copies',
        tone: 'red'
      },
      {
        key: 'missingLocation',
        label: 'Missing locations',
        count: items.filter(item => item.wantStatusID === 'H' && !item.location).length,
        detail: 'Owned rows without a binder/box/location',
        tone: 'slate'
      },
      {
        key: 'missingCondition',
        label: 'Missing conditions',
        count: items.filter(item => item.wantStatusID === 'H' && !item.condition).length,
        detail: 'Owned rows without trade condition',
        tone: 'slate'
      },
      {
        key: 'missingLanguage',
        label: 'Missing languages',
        count: items.filter(item => item.wantStatusID === 'H' && !item.language).length,
        detail: 'Owned rows without card language',
        tone: 'slate'
      }
    ];
  });
  readonly duplicateClusters = computed<MtgDuplicateCluster[]>(() => {
    const report = this.report();
    if (report) {
      return report.duplicateClusters;
    }

    return this.buildDuplicateClustersFromItems(this.items()).slice(0, 8);
  });
  readonly reviewRows = computed<MtgReviewRow[]>(() => this.items().map(item => ({
    item,
    issues: this.cleanupIssues(item)
  })));
  readonly filteredReviewIssueCount = computed(() => this.report()?.cleanupBuckets.reduce((sum, row) => sum + row.count, 0) ?? this.shownReviewIssueCount());
  readonly filteredReviewRowCount = computed(() => this.report()?.cleanupIssueRows ?? this.shownReviewRowCount());
  readonly filteredReadyRowCount = computed(() => this.report() ? Math.max(0, this.report()!.totalRows - this.report()!.cleanupIssueRows) : this.reviewRows().filter(row => row.issues.length === 0).length);
  readonly shownReviewIssueCount = computed(() => this.reviewRows().reduce((sum, row) => sum + row.issues.length, 0));
  readonly shownReviewRowCount = computed(() => this.reviewRows().filter(row => row.issues.length > 0).length);
  readonly attentionRows = computed(() => this.items()
    .filter(item => this.attentionIssues(item).length > 0)
    .slice(0, 10));
  readonly importSelectedCount = computed(() => this.importRows().filter(row => row.selected && row.errors.length === 0).length);
  readonly importValidCount = computed(() => this.importRows().filter(row => row.errors.length === 0).length);
  readonly importErrorCount = computed(() => this.importRows().reduce((sum, row) => sum + row.errors.length, 0));
  readonly importWarningCount = computed(() => this.importRows().reduce((sum, row) => sum + row.warnings.length, 0));
  readonly formCopyCount = computed(() => (this.form().quantity ?? 0) + (this.form().foilQuantity ?? 0));
  readonly formScryfallUrl = computed(() => {
    const id = this.form().scryfallId.trim();
    if (id) {
      return `https://scryfall.com/card/${encodeURIComponent(id)}`;
    }

    const name = this.form().name.trim();
    return name ? `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}` : null;
  });
  readonly formScryfallPrintingUrl = computed(() => {
    const form = this.form();
    const name = form.name.trim();
    const setCode = form.setCode.trim();
    const collectorNumber = form.collectorNumber.trim();

    if (!name || !setCode || !collectorNumber || setCode === 'UNK' || collectorNumber === 'UNK') {
      return null;
    }

    return `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}" set:${setCode} cn:${collectorNumber}`)}`;
  });
  readonly formRulesLines = computed(() => this.textLines(this.form().oracleText));
  readonly formNoteLines = computed(() => this.textLines(this.form().notes));
  readonly formCleanupIssues = computed(() => {
    const form = this.form();
    if (!form.id) {
      return [];
    }

    return this.cleanupIssues(this.formAsCollectionItem(form));
  });
  readonly detailChips = computed<MtgDetailChip[]>(() => {
    const form = this.form();
    return [
      {
        label: 'Status',
        value: form.wantStatusID === 'W' ? 'Want' : 'Have',
        tone: form.wantStatusID === 'W' ? 'amber' : 'green'
      },
      {
        label: 'Copies',
        value: `${this.formCopyCount().toLocaleString()} total`,
        tone: this.formCopyCount() <= 0 && form.wantStatusID === 'H' ? 'red' : 'slate'
      },
      {
        label: 'Printing',
        value: `${form.setCode || 'UNK'} #${form.collectorNumber || 'UNK'}`,
        tone: !form.setCode || form.setCode === 'UNK' || !form.collectorNumber || form.collectorNumber === 'UNK' ? 'red' : 'blue'
      },
      {
        label: 'Identity',
        value: form.colorIdentity ? this.colorLabel(form.colorIdentity) : 'Missing',
        tone: form.colorIdentity ? 'slate' : 'amber'
      },
      {
        label: 'Location',
        value: form.location || 'Missing',
        tone: form.location || form.wantStatusID === 'W' ? 'slate' : 'amber'
      },
      {
        label: 'External',
        value: form.scryfallId ? 'Scryfall linked' : 'No Scryfall ID',
        tone: form.scryfallId ? 'green' : 'amber'
      }
    ];
  });

  constructor(
    private readonly service: MtgService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly csvDownload: CsvDownloadService
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.data['status'] === 'W') {
      this.status.set('W');
      this.routeMode.set('want-list');
    }

    this.loadLookups();
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.service.list({
      q: this.query(),
      setCode: this.setCode(),
      color: this.color(),
      rarity: this.rarity(),
      type: this.type(),
      location: this.location(),
      condition: this.condition(),
      language: this.language(),
      finish: this.finish(),
      cleanup: this.cleanup(),
      status: this.status(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.items.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic cards.'),
      complete: () => this.loading.set(false)
    });
    this.loadReport();
  }

  applyFilters(): void {
    this.load(1);
  }

  changePageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.setCode.set('');
    this.color.set('');
    this.rarity.set('');
    this.type.set('');
    this.location.set('');
    this.condition.set('');
    this.language.set('');
    this.finish.set('');
    this.cleanup.set('');
    this.status.set(this.defaultStatus());
    this.load(1);
  }

  clearFilter(key: MtgFilterKey): void {
    switch (key) {
      case 'query':
        this.query.set('');
        break;
      case 'setCode':
        this.setCode.set('');
        break;
      case 'color':
        this.color.set('');
        break;
      case 'rarity':
        this.rarity.set('');
        break;
      case 'type':
        this.type.set('');
        break;
      case 'location':
        this.location.set('');
        break;
      case 'condition':
        this.condition.set('');
        break;
      case 'language':
        this.language.set('');
        break;
      case 'finish':
        this.finish.set('');
        break;
      case 'cleanup':
        this.cleanup.set('');
        break;
      case 'status':
        this.status.set(this.defaultStatus());
        break;
    }

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

  applySummaryCard(card: MtgSummaryCard): void {
    if (card.action !== 'review') {
      return;
    }

    this.filterToAnyCleanupIssues();
  }

  filterToAnyCleanupIssues(): void {
    this.cleanup.set('anyIssue');
    this.sortKey.set('review');
    this.sortDirection.set('asc');
    this.load(1);
  }

  trackByReviewRow(_: number, row: MtgReviewRow): number {
    return row.item.id;
  }

  trackByImportRow(_: number, row: MtgImportRow): number {
    return row.rowNumber;
  }

  trackByIssue(_: number, issue: string): string {
    return issue;
  }

  selectItem(item: MtgCollectionItem): void {
    this.form.set({
      id: item.id,
      cardId: item.cardId,
      printingId: item.printingId,
      name: item.name,
      manaCost: item.manaCost ?? '',
      colors: item.colors ?? '',
      colorIdentity: item.colorIdentity ?? '',
      typeLine: item.typeLine ?? '',
      oracleText: item.oracleText ?? '',
      setCode: item.setCode,
      setName: item.setName ?? '',
      collectorNumber: item.collectorNumber,
      rarity: item.rarity ?? '',
      artist: item.artist ?? '',
      imageUrl: item.imageUrl ?? '',
      scryfallId: item.scryfallId ?? '',
      finishes: item.finishes ?? '',
      quantity: item.quantity,
      foilQuantity: item.foilQuantity,
      wantStatusID: item.wantStatusID,
      condition: item.condition ?? '',
      language: item.language ?? '',
      location: item.location ?? '',
      notes: item.notes ?? '',
      estimatedValue: item.estimatedValue
    });
  }

  filterToFormName(): void {
    const name = this.form().name.trim();
    if (!name) {
      return;
    }

    this.query.set(name);
    this.load(1);
  }

  filterToFormPrinting(): void {
    const form = this.form();
    const name = form.name.trim();
    if (!name) {
      return;
    }

    this.query.set(name);
    this.setCode.set(form.setCode && form.setCode !== 'UNK' ? form.setCode : '');
    this.load(1);
  }

  filterToFormRarity(): void {
    const rarity = this.form().rarity.trim();
    if (!rarity) {
      return;
    }

    this.rarity.set(rarity);
    this.load(1);
  }

  filterToFormStatus(): void {
    this.status.set(this.form().wantStatusID);
    this.load(1);
  }

  filterToFormArtist(): void {
    const artist = this.form().artist.trim();
    if (!artist) {
      return;
    }

    this.query.set(artist);
    this.load(1);
  }

  filterToFormType(): void {
    const typeLine = this.form().typeLine.trim();
    if (!typeLine) {
      return;
    }

    this.type.set(typeLine);
    this.load(1);
  }

  filterToFormIdentity(): void {
    const identity = this.form().colorIdentity.trim();
    this.color.set(identity || 'C');
    this.load(1);
  }

  filterToFormLocation(): void {
    const location = this.form().location.trim();
    this.location.set(location || '__none');
    this.load(1);
  }

  filterToFormCondition(): void {
    const condition = this.form().condition.trim();
    this.condition.set(condition || '__none');
    this.load(1);
  }

  filterToFormLanguage(): void {
    const language = this.form().language.trim();
    this.language.set(language || '__none');
    this.load(1);
  }

  filterToFormFinish(): void {
    const finish = this.form().finishes.split(',')[0]?.trim();
    if (!finish) {
      return;
    }

    this.finish.set(finish);
    this.load(1);
  }

  applySetReport(row: MtgReportBucket): void {
    this.setCode.set(row.name === 'Unknown set' ? '' : row.name);
    this.load(1);
  }

  applyRarityReport(row: MtgReportBucket): void {
    this.rarity.set(row.name === 'Unknown rarity' ? '' : row.name);
    this.load(1);
  }

  applyColorReport(row: MtgReportBucket): void {
    const color = this.colors.find(item => row.name.includes(item.name));
    this.color.set(row.name === 'Colorless / unspecified' ? 'C' : color?.id ?? '');
    this.load(1);
  }

  applyLocationReport(row: MtgReportBucket): void {
    this.location.set(row.name === 'No location' ? '__none' : row.name);
    this.load(1);
  }

  focusCleanup(row: MtgCleanupBucket): void {
    this.cleanup.set(row.key);

    if (['zeroCopies', 'missingLocation', 'missingCondition', 'missingLanguage'].includes(row.key)) {
      this.status.set('H');
    }

    if (row.key === 'missingLocation') {
      this.location.set('__none');
      this.load(1);
      return;
    }

    if (row.key === 'missingCondition') {
      this.status.set('H');
      this.condition.set('__none');
      this.load(1);
      return;
    }

    if (row.key === 'missingLanguage') {
      this.status.set('H');
      this.language.set('__none');
      this.load(1);
      return;
    }

    this.load(1);
  }

  selectDuplicateCluster(cluster: MtgDuplicateCluster): void {
    const match = this.items().find(item =>
      item.name === cluster.name &&
      item.setCode === cluster.setCode &&
      item.collectorNumber === cluster.collectorNumber &&
      item.wantStatusID === cluster.wantStatusID &&
      (item.condition ?? '') === (cluster.condition ?? '') &&
      (item.language ?? '') === (cluster.language ?? '') &&
      (item.location ?? '') === (cluster.location ?? ''));
    if (match) {
      this.selectItem(match);
      return;
    }

    this.query.set(cluster.collectorNumber);
    this.setCode.set(cluster.setCode);
    this.status.set(cluster.wantStatusID);
    this.condition.set(cluster.condition?.trim() ? cluster.condition : '__none');
    this.language.set(cluster.language?.trim() ? cluster.language : '__none');
    this.location.set(cluster.location?.trim() ? cluster.location : '__none');
    this.sortKey.set('name');
    this.sortDirection.set('asc');
    this.load(1);
  }

  startNew(): void {
    this.error.set(null);
    this.message.set(null);
    this.form.set(this.emptyForm());
  }

  duplicateSelected(): void {
    const form = this.form();
    if (!form.id) {
      return;
    }

    this.error.set(null);
    this.message.set(`${form.name} copied into a new Magic row. Adjust storage, condition, or quantities and save.`);
    this.form.set({
      ...form,
      id: null,
      quantity: 1,
      foilQuantity: 0
    });
  }

  setFormField<K extends keyof MtgForm>(field: K, value: MtgForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  setFormNumberField(field: 'quantity' | 'foilQuantity' | 'estimatedValue', value: string): void {
    this.setFormField(field, value === '' ? null : Math.max(0, Number(value)) as MtgForm[typeof field]);
  }

  setFormUpperField(field: 'colors' | 'colorIdentity' | 'setCode' | 'language', value: string): void {
    this.setFormField(field, value.toUpperCase());
  }

  setFormLowerField(field: 'rarity', value: string): void {
    this.setFormField(field, value.toLowerCase());
  }

  adjustFormQuantity(field: 'quantity' | 'foilQuantity', delta: number): void {
    const form = this.form();
    const current = form[field] ?? 0;
    this.setFormField(field, Math.max(0, current + delta));
  }

  setFormStatus(status: 'H' | 'W'): void {
    this.setFormField('wantStatusID', status);
  }

  save(): void {
    const form = this.form();
    if (!form.name.trim()) {
      this.error.set('Name is required.');
      return;
    }

    const payload: UpsertMtgCollectionItem = {
      cardId: form.cardId,
      name: form.name.trim(),
      manaCost: this.optional(form.manaCost),
      colors: this.normalizeColorString(form.colors),
      colorIdentity: this.normalizeColorString(form.colorIdentity),
      typeLine: this.optional(form.typeLine),
      oracleText: this.optional(form.oracleText),
      printingId: form.printingId,
      setCode: this.optional(form.setCode),
      setName: this.optional(form.setName),
      collectorNumber: this.optional(form.collectorNumber),
      rarity: this.optionalLower(form.rarity),
      artist: this.optional(form.artist),
      imageUrl: this.optional(form.imageUrl),
      scryfallId: this.optional(form.scryfallId),
      finishes: this.optionalLower(form.finishes),
      quantity: form.quantity,
      foilQuantity: form.foilQuantity,
      wantStatusID: form.wantStatusID,
      condition: this.optional(form.condition),
      language: this.optionalUpper(form.language),
      location: this.optional(form.location),
      notes: this.optional(form.notes),
      estimatedValue: form.estimatedValue
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = (saved: MtgCollectionItem) => {
      this.message.set(`${saved.name} saved.`);
      this.startNew();
      this.loadLookups();
      this.load();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save Magic card.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.update(form.id, payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
      return;
    }

    this.service.create(payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
  }

  deleteSelected(): void {
    const form = this.form();
    if (!form.id || !window.confirm(`Delete ${form.name}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.delete(form.id).subscribe({
      next: () => {
        this.message.set(`${form.name} deleted.`);
        this.startNew();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete Magic card.'),
      complete: () => this.loading.set(false)
    });
  }

  previewImportPaste(): void {
    this.error.set(null);
    this.message.set(null);

    const parsed = this.parseDelimitedText(this.importText());
    if (parsed.length <= 1) {
      this.importRows.set([]);
      this.error.set('Paste a header row and at least one card row.');
      return;
    }

    const headers = parsed[0].map(header => this.normalizeImportHeader(header));
    if (!this.hasImportHeader(headers, 'name', 'cardname', 'title')) {
      this.importRows.set([]);
      this.error.set('Import header must include Name, Card Name, or Title.');
      return;
    }
    const headerWarnings = [
      this.hasImportHeader(headers, 'setcode', 'set', 'editioncode') ? '' : 'Set code header is missing; rows will import as UNK unless another mapped set column is present.',
      this.hasImportHeader(headers, 'collectornumber', 'collector', 'number', 'cardnumber') ? '' : 'Collector number header is missing; rows will import as UNK unless another mapped number column is present.'
    ].filter(Boolean);

    const rows = parsed.slice(1)
      .map((cells, index) => this.buildImportRow(headers, cells, index + 2))
      .filter(row => this.importHasContent(row.payload));

    this.importRows.set(rows);
    if (rows.length === 0) {
      this.error.set('No import rows contained mapped card data.');
      return;
    }

    this.message.set([
      `${rows.length.toLocaleString()} import rows staged.`,
      ...headerWarnings
    ].join(' '));
  }

  clearImportPreview(): void {
    this.importText.set('');
    this.importRows.set([]);
    this.error.set(null);
    this.message.set(null);
  }

  toggleImportRow(rowNumber: number): void {
    this.importRows.update(rows => rows.map(row =>
      row.rowNumber === rowNumber ? { ...row, selected: !row.selected } : row
    ));
  }

  selectValidImportRows(): void {
    this.importRows.update(rows => rows.map(row => ({ ...row, selected: row.errors.length === 0 })));
  }

  clearImportSelection(): void {
    this.importRows.update(rows => rows.map(row => ({ ...row, selected: false })));
  }

  commitImportRows(): void {
    const rows = this.importRows().filter(row => row.selected && row.errors.length === 0);
    if (rows.length === 0) {
      this.error.set('Select at least one valid import row.');
      return;
    }

    this.importBusy.set(true);
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    from(rows).pipe(
      concatMap(row => this.service.create(row.payload)),
      toArray(),
      finalize(() => {
        this.importBusy.set(false);
        this.loading.set(false);
      })
    ).subscribe({
      next: saved => {
        this.message.set(`${saved.length.toLocaleString()} Magic cards imported.`);
        this.importRows.set([]);
        this.importText.set('');
        this.loadLookups();
        this.load(1);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to import Magic cards.')
    });
  }

  downloadImportTemplate(): void {
    this.downloadCsv(`mtg-import-template-${this.today()}.csv`, [
      ['Name', 'Mana Cost', 'Colors', 'Color Identity', 'Type', 'Oracle Text', 'Set Code', 'Set Name', 'Collector Number', 'Rarity', 'Artist', 'Image URL', 'Scryfall ID', 'Finishes', 'Qty', 'Foil Qty', 'Status', 'Condition', 'Language', 'Location', 'Estimated Value', 'Notes']
    ]);
  }

  exportCurrentPageCsv(): void {
    this.downloadCsv(`mtg-current-page-${this.today()}.csv`, this.collectionCsvRows(this.items()));
  }

  exportFilteredCsv(): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.loadAllFilteredItems().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: items => {
        this.downloadCsv(`mtg-filtered-${this.today()}.csv`, this.collectionCsvRows(items));
        this.message.set(`${items.length.toLocaleString()} filtered Magic rows exported.`);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to export filtered Magic cards.')
    });
  }

  private collectionCsvRows(items: MtgCollectionItem[]): Array<Array<string | number>> {
    return [
      ['Name', 'Mana Cost', 'Colors', 'Color Identity', 'Type', 'Oracle Text', 'Set Code', 'Set Name', 'Collector Number', 'Rarity', 'Qty', 'Foil Qty', 'Status', 'Condition', 'Language', 'Location', 'Estimated Value', 'Scryfall ID', 'Image URL', 'Notes'],
      ...items.map(item => [
        item.name,
        item.manaCost ?? '',
        item.colors ?? '',
        item.colorIdentity ?? '',
        item.typeLine ?? '',
        item.oracleText ?? '',
        item.setCode,
        item.setName ?? '',
        item.collectorNumber,
        item.rarity ?? '',
        item.quantity,
        item.foilQuantity,
        item.wantStatusID === 'W' ? 'Want' : 'Have',
        item.condition ?? '',
        item.language ?? '',
        item.location ?? '',
        item.estimatedValue ?? '',
        item.scryfallId ?? '',
        item.imageUrl ?? '',
        item.notes ?? ''
      ])
    ];
  }

  exportReportCsv(): void {
    this.downloadCsv(`mtg-report-${this.today()}.csv`, [
      ['Report', 'Name', 'Rows', 'Copies', 'Foil Copies', 'Owned Rows', 'Wanted Rows', 'Estimated Value', 'Missing Images'],
      ...this.reportSummaryCsvRows(),
      ...this.setReportRows().map(row => this.reportCsvRow('Set', row)),
      ...this.colorReportRows().map(row => this.reportCsvRow('Color Identity', row)),
      ...this.rarityReportRows().map(row => this.reportCsvRow('Rarity', row)),
      ...this.locationReportRows().map(row => this.reportCsvRow('Location', row))
    ]);
  }

  exportCleanupCsv(): void {
    this.exportCleanupRows(this.items(), `mtg-cleanup-current-page-${this.today()}.csv`);
  }

  exportFilteredCleanupCsv(): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.loadAllFilteredItems().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: items => {
        this.exportCleanupRows(items, `mtg-cleanup-filtered-${this.today()}.csv`);
        this.message.set(`${items.length.toLocaleString()} filtered Magic rows reviewed for cleanup export.`);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to export filtered Magic cleanup.')
    });
  }

  private exportCleanupRows(items: MtgCollectionItem[], filename: string): void {
    const duplicateRows = this.buildDuplicateClustersFromItems(items).map(cluster => [
      'Possible duplicate',
      cluster.label,
      '',
      '',
      '',
      cluster.copies,
      '',
      cluster.wantStatusID === 'W' ? 'Want' : 'Have',
      cluster.condition ?? '',
      cluster.language ?? '',
      cluster.location ?? '',
      `${cluster.rowCount} rows share this printing/location/status signature`
    ]);

    this.downloadCsv(filename, [
      ['Section', 'Name', 'Set Code', 'Collector Number', 'Rarity', 'Qty', 'Foil Qty', 'Status', 'Condition', 'Language', 'Location', 'Issues'],
      ...items
        .map(item => [item, this.cleanupIssues(item)] as const)
        .filter(([, issues]) => issues.length > 0)
        .map(([item, issues]) => [
          'Quality',
          item.name,
          item.setCode,
          item.collectorNumber,
          item.rarity ?? '',
          item.quantity,
          item.foilQuantity,
          item.wantStatusID === 'W' ? 'Want' : 'Have',
          item.condition ?? '',
          item.language ?? '',
          item.location ?? '',
          issues.join('; ')
        ]),
      ...duplicateRows
    ]);
  }

  cleanupTone(row: MtgCleanupBucket): string {
    if (row.tone === 'red') {
      return 'border-red-200 bg-red-50 text-red-800';
    }

    if (row.tone === 'amber') {
      return 'border-amber-200 bg-amber-50 text-amber-800';
    }

    return 'border-slate-200 bg-slate-50 text-slate-800';
  }

  duplicateClusterDetail(cluster: MtgDuplicateCluster): string {
    return [
      cluster.wantStatusID === 'W' ? 'Want' : 'Have',
      cluster.condition?.trim() || 'No condition',
      cluster.language?.trim() || 'No language',
      cluster.location?.trim() || 'No location'
    ].join(' | ');
  }

  chipTone(chip: MtgDetailChip): string {
    switch (chip.tone) {
      case 'green':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'amber':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'red':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'blue':
        return 'app-token-soft-surface app-token-text-strong';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  }

  attentionIssues(item: MtgCollectionItem): string[] {
    const issues = item.wantStatusID === 'W' ? ['Wanted row'] : [];
    return [...issues, ...this.cleanupIssues(item)];
  }

  colorLabel(value: string | null): string {
    if (!value) {
      return 'Colorless / unspecified';
    }

    return value
      .split('')
      .map(color => this.colors.find(item => item.id === color)?.name ?? color)
      .join(' / ');
  }

  private colorFilterLabel(value: string): string {
    return this.colors.find(color => color.id === value)?.name ?? value;
  }

  private cleanupLabel(value: string): string {
    if (!value) {
      return '';
    }

    if (value === 'anyIssue') {
      return 'Any cleanup issue';
    }

    if (value === 'noIssue') {
      return 'No cleanup issues';
    }

    return this.cleanupRows().find(row => row.key === value)?.label ?? value;
  }

  private lookupName(values: MtgLookup[], id: string): string {
    if (!id) {
      return '';
    }

    return values.find(value => value.id === id)?.name ?? id;
  }

  currency(value: number): string {
    return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  private loadLookups(): void {
    this.service.getSets().subscribe({
      next: sets => this.sets.set(sets),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic sets.')
    });
    this.service.getRarities().subscribe({
      next: rarities => this.rarities.set(rarities),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic rarities.')
    });
    this.service.getLocations().subscribe({
      next: locations => this.locations.set(locations),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic locations.')
    });
    this.service.getConditions().subscribe({
      next: conditions => this.conditions.set(conditions),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic conditions.')
    });
    this.service.getLanguages().subscribe({
      next: languages => this.languages.set(languages),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic languages.')
    });
    this.service.getFinishes().subscribe({
      next: finishes => this.finishes.set(finishes),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic finishes.')
    });
  }

  private loadReport(): void {
    this.service.getReport({
      q: this.query(),
      setCode: this.setCode(),
      color: this.color(),
      rarity: this.rarity(),
      type: this.type(),
      location: this.location(),
      condition: this.condition(),
      language: this.language(),
      finish: this.finish(),
      cleanup: this.cleanup(),
      status: this.status()
    }).subscribe({
      next: report => this.report.set(report),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load Magic report.')
    });
  }

  private loadAllFilteredItems() {
    const opts = {
      q: this.query(),
      setCode: this.setCode(),
      color: this.color(),
      rarity: this.rarity(),
      type: this.type(),
      location: this.location(),
      condition: this.condition(),
      language: this.language(),
      finish: this.finish(),
      cleanup: this.cleanup(),
      status: this.status(),
      sort: this.sort(),
      page: 1,
      pageSize: 200
    };

    return this.service.list(opts).pipe(
      concatMap(firstPage => {
        const pageCount = Math.max(1, Math.ceil(firstPage.total / opts.pageSize));
        if (pageCount === 1) {
          return of(firstPage.items);
        }

        const rest = Array.from({ length: pageCount - 1 }, (_, index) =>
          this.service.list({ ...opts, page: index + 2 }).pipe(map(result => result.items))
        );

        return forkJoin(rest).pipe(map(pages => [firstPage.items, ...pages].flat()));
      })
    );
  }

  private sort(): string {
    return this.sortDirection() === 'desc' ? `-${this.sortKey()}` : this.sortKey();
  }

  private defaultStatus(): StatusFilter {
    return this.routeMode() === 'want-list' ? 'W' : 'H';
  }

  private emptyForm(): MtgForm {
    return {
      id: null,
      cardId: null,
      printingId: null,
      name: '',
      manaCost: '',
      colors: '',
      colorIdentity: '',
      typeLine: '',
      oracleText: '',
      setCode: '',
      setName: '',
      collectorNumber: '',
      rarity: '',
      artist: '',
      imageUrl: '',
      scryfallId: '',
      finishes: '',
      quantity: 1,
      foilQuantity: 0,
      wantStatusID: 'H',
      condition: '',
      language: '',
      location: '',
      notes: '',
      estimatedValue: null
    };
  }

  private buildReportRows(items: MtgCollectionItem[], nameSelector: (item: MtgCollectionItem) => string): MtgReportBucket[] {
    const rows = new Map<string, MtgReportBucket>();

    items.forEach(item => {
      const name = nameSelector(item);
      const row = rows.get(name) ?? {
        name,
        rowCount: 0,
        ownedCount: 0,
        wantedCount: 0,
        copies: 0,
        foilCopies: 0,
        estimatedValue: 0,
        missingImageCount: 0
      };

      row.rowCount += 1;
      row.ownedCount += item.wantStatusID === 'H' ? 1 : 0;
      row.wantedCount += item.wantStatusID === 'W' ? 1 : 0;
      row.copies += item.quantity + item.foilQuantity;
      row.foilCopies += item.foilQuantity;
      row.estimatedValue += item.estimatedValue ?? 0;
      row.missingImageCount += item.imageUrl ? 0 : 1;
      rows.set(name, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.rowCount - left.rowCount || left.name.localeCompare(right.name));
  }

  private buildDuplicateClustersFromItems(items: MtgCollectionItem[]): MtgDuplicateCluster[] {
    const clusters = new Map<string, MtgCollectionItem[]>();

    items.forEach(item => {
      const key = [
        item.name.toLowerCase(),
        item.setCode.toLowerCase(),
        item.collectorNumber.toLowerCase(),
        item.wantStatusID,
        item.condition?.toLowerCase() ?? '',
        item.language?.toLowerCase() ?? '',
        item.location?.toLowerCase() ?? ''
      ].join('|');
      clusters.set(key, [...(clusters.get(key) ?? []), item]);
    });

    return Array.from(clusters.entries())
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => ({
        key,
        label: `${rows[0].name} | ${rows[0].setCode} #${rows[0].collectorNumber}`,
        name: rows[0].name,
        setCode: rows[0].setCode,
        collectorNumber: rows[0].collectorNumber,
        wantStatusID: rows[0].wantStatusID,
        condition: rows[0].condition,
        language: rows[0].language,
        location: rows[0].location,
        rowCount: rows.length,
        copies: rows.reduce((sum, row) => sum + row.quantity + row.foilQuantity, 0),
        locations: Array.from(new Set(rows.map(row => row.location || 'No location'))).join(', ')
      }))
      .sort((left, right) => right.rowCount - left.rowCount || left.label.localeCompare(right.label));
  }

  private reportCsvRow(report: string, row: MtgReportRow): Array<string | number> {
    return [
      report,
      row.name,
      row.rowCount,
      row.copies,
      row.foilCopies,
      row.ownedCount,
      row.wantedCount,
      row.estimatedValue.toFixed(2),
      row.missingImageCount
    ];
  }

  private reportSummaryCsvRows(): Array<Array<string | number>> {
    const report = this.report();
    if (!report) {
      return [
        ['Summary', 'Current page rows', this.items().length, this.shownCopies(), this.shownFoils(), this.items().filter(item => item.wantStatusID === 'H').length, this.wantedShown(), this.shownValue().toFixed(2), this.items().filter(item => !item.imageUrl).length],
        ['Summary', 'Review issue instances', this.shownReviewIssueCount(), '', '', '', '', '', ''],
        ['Summary', 'Rows needing cleanup', this.shownReviewRowCount(), '', '', '', '', '', ''],
        ['Summary', 'Ready rows', this.filteredReadyRowCount(), '', '', '', '', '', '']
      ];
    }

    return [
      ['Summary', 'Filtered rows', report.totalRows, report.totalCopies, report.totalFoilCopies, report.totalRows - report.wantedRows, report.wantedRows, report.estimatedValue.toFixed(2), report.missingImageRows],
      ['Summary', 'Review issue instances', this.filteredReviewIssueCount(), '', '', '', '', '', ''],
      ['Summary', 'Rows needing cleanup', report.cleanupIssueRows, '', '', '', '', '', ''],
      ['Summary', 'Ready rows', this.filteredReadyRowCount(), '', '', '', '', '', ''],
      ['Summary', 'Duplicate clusters', report.duplicateClusterCount, '', '', '', '', '', '']
    ];
  }

  private formAsCollectionItem(form: MtgForm): MtgCollectionItem {
    return {
      id: form.id ?? 0,
      cardId: form.cardId ?? 0,
      printingId: form.printingId ?? 0,
      name: form.name,
      manaCost: form.manaCost,
      colors: form.colors,
      colorIdentity: form.colorIdentity,
      typeLine: form.typeLine,
      oracleText: form.oracleText,
      setCode: form.setCode,
      setName: form.setName,
      collectorNumber: form.collectorNumber,
      rarity: form.rarity,
      artist: form.artist,
      imageUrl: form.imageUrl,
      scryfallId: form.scryfallId,
      finishes: form.finishes,
      quantity: form.quantity ?? 0,
      foilQuantity: form.foilQuantity ?? 0,
      wantStatusID: form.wantStatusID,
      condition: form.condition,
      language: form.language,
      location: form.location,
      notes: form.notes,
      estimatedValue: form.estimatedValue
    };
  }

  cleanupIssues(item: MtgCollectionItem): string[] {
    const issues: string[] = [];
    if (!item.imageUrl) {
      issues.push('Missing image URL');
    }
    if (!item.scryfallId) {
      issues.push('Missing Scryfall ID');
    }
    if (!item.setCode || item.setCode === 'UNK') {
      issues.push('Missing set code');
    }
    if (!item.collectorNumber || item.collectorNumber === 'UNK') {
      issues.push('Missing collector number');
    }
    if (!item.colorIdentity) {
      issues.push('Missing color identity');
    }
    if (this.hasUnknownColorSymbols(item.colors ?? '')) {
      issues.push('Invalid color symbols');
    }
    if (this.hasUnknownColorSymbols(item.colorIdentity ?? '')) {
      issues.push('Invalid color identity');
    }
    if (!item.typeLine) {
      issues.push('Missing type line');
    }
    if (item.wantStatusID === 'H' && item.quantity + item.foilQuantity <= 0) {
      issues.push('Owned row has zero copies');
    }
    if (item.wantStatusID === 'H' && !item.location) {
      issues.push('Missing location');
    }
    if (item.wantStatusID === 'H' && !item.condition) {
      issues.push('Missing condition');
    }
    if (item.wantStatusID === 'H' && !item.language) {
      issues.push('Missing language');
    }

    return issues;
  }

  filterToCleanupIssue(issue: string): void {
    const key = this.cleanupKeyForIssue(issue);
    if (!key) {
      return;
    }

    this.cleanup.set(key);
    if (['zeroCopies', 'missingLocation', 'missingCondition', 'missingLanguage'].includes(key)) {
      this.status.set('H');
    }

    this.load(1);
  }

  filterToReadyRows(): void {
    this.cleanup.set('noIssue');
    this.sortKey.set('review');
    this.sortDirection.set('desc');
    this.load(1);
  }

  private cleanupKeyForIssue(issue: string): string {
    switch (issue) {
      case 'Missing image URL':
        return 'missingImage';
      case 'Missing Scryfall ID':
        return 'missingScryfall';
      case 'Missing set code':
      case 'Missing collector number':
        return 'missingPrinting';
      case 'Missing color identity':
      case 'Invalid color symbols':
      case 'Invalid color identity':
      case 'Missing type line':
        return 'missingIdentity';
      case 'Owned row has zero copies':
        return 'zeroCopies';
      case 'Missing location':
        return 'missingLocation';
      case 'Missing condition':
        return 'missingCondition';
      case 'Missing language':
        return 'missingLanguage';
      default:
        return '';
    }
  }

  private buildImportRow(headers: string[], cells: string[], rowNumber: number): MtgImportRow {
    const value = (...names: string[]) => {
      const indexes = names.map(name => headers.indexOf(name)).filter(index => index >= 0);
      const index = indexes[0];
      return index === undefined ? '' : (cells[index] ?? '').trim();
    };

    const rawQuantity = value('qty', 'quantity', 'count');
    const rawFoilQuantity = value('foilqty', 'foilquantity', 'foils');
    const rawEstimatedValue = value('estimatedvalue', 'value', 'price');
    const rawColors = value('colors', 'color');
    const rawColorIdentity = value('coloridentity', 'identity', 'commanderidentity');
    const quantity = this.importNumber(rawQuantity, 1);
    const foilQuantity = this.importNumber(rawFoilQuantity, 0);
    const estimatedValue = this.importNumber(rawEstimatedValue, null);
    const rawStatus = value('status', 'wantstatus', 'wantstatusid');
    const status = rawStatus.toLowerCase();
    const payload: UpsertMtgCollectionItem = {
      cardId: null,
      name: value('name', 'cardname', 'title'),
      manaCost: this.optional(value('manacost', 'mana')),
      colors: this.normalizeColorString(rawColors),
      colorIdentity: this.normalizeColorString(rawColorIdentity),
      typeLine: this.optional(value('type', 'typeline', 'cardtype')),
      oracleText: this.optional(value('oracletext', 'text', 'rules')),
      printingId: null,
      setCode: this.optionalUpper(value('setcode', 'set', 'editioncode')),
      setName: this.optional(value('setname', 'edition')),
      collectorNumber: this.optional(value('collectornumber', 'collector', 'number', 'cardnumber')),
      rarity: this.optionalLower(value('rarity')),
      artist: this.optional(value('artist')),
      imageUrl: this.optional(value('imageurl', 'image', 'imageuri')),
      scryfallId: this.optional(value('scryfallid', 'scryfall')),
      finishes: this.optionalLower(value('finishes', 'finish')),
      quantity,
      foilQuantity,
      wantStatusID: this.isWantedImportStatus(status) ? 'W' : 'H',
      condition: this.optional(value('condition')),
      language: this.optionalUpper(value('language', 'lang')),
      location: this.optional(value('location', 'box', 'binder')),
      notes: this.optional(value('notes', 'note')),
      estimatedValue
    };

    const errors: string[] = [];
    const warnings: string[] = [];
    if (!payload.name) {
      errors.push('Name is required.');
    }
    if (rawStatus && !this.isKnownImportStatus(status)) {
      warnings.push('Status is not recognized and will import as Have.');
    }
    if (rawQuantity && !this.isImportNumber(rawQuantity)) {
      warnings.push('Quantity is not numeric and will import as 1.');
    }
    if (this.isNegativeImportNumber(rawQuantity)) {
      warnings.push('Quantity is negative and will import as 0.');
    }
    if (rawFoilQuantity && !this.isImportNumber(rawFoilQuantity)) {
      warnings.push('Foil quantity is not numeric and will import as 0.');
    }
    if (this.isNegativeImportNumber(rawFoilQuantity)) {
      warnings.push('Foil quantity is negative and will import as 0.');
    }
    if (rawEstimatedValue && !this.isImportNumber(rawEstimatedValue)) {
      warnings.push('Estimated value is not numeric and will import blank.');
    }
    if (this.isNegativeImportNumber(rawEstimatedValue)) {
      warnings.push('Estimated value is negative and will import as 0.');
    }
    if (this.hasUnknownColorSymbols(rawColors)) {
      warnings.push('Colors include symbols outside WUBRG.');
    }
    if (this.hasUnknownColorSymbols(rawColorIdentity)) {
      warnings.push('Color identity includes symbols outside WUBRG.');
    }
    if (!payload.setCode) {
      warnings.push('Set code will import as UNK.');
    }
    if (!payload.collectorNumber) {
      warnings.push('Collector number will import as UNK.');
    }
    if ((payload.quantity ?? 0) + (payload.foilQuantity ?? 0) <= 0 && payload.wantStatusID === 'H') {
      warnings.push('Owned row has zero copies.');
    }
    if (payload.wantStatusID === 'H' && !payload.location) {
      warnings.push('Owned row has no location.');
    }
    if (payload.wantStatusID === 'H' && !payload.condition) {
      warnings.push('Owned row has no condition.');
    }
    if (payload.wantStatusID === 'H' && !payload.language) {
      warnings.push('Owned row has no language.');
    }
    if (!payload.colorIdentity) {
      warnings.push('Color identity is blank.');
    }

    return {
      rowNumber,
      selected: errors.length === 0,
      payload,
      warnings,
      errors
    };
  }

  private parseDelimitedText(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];

      if (char === '"' && quoted && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if ((char === ',' || char === '\t') && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') {
          index += 1;
        }
        row.push(cell);
        if (row.some(value => value.trim())) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell);
    if (row.some(value => value.trim())) {
      rows.push(row);
    }

    return rows;
  }

  private normalizeImportHeader(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private hasImportHeader(headers: string[], ...names: string[]): boolean {
    return names.some(name => headers.includes(name));
  }

  private importNumber(value: string, fallback: number | null): number | null {
    if (!value.trim()) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }

  private isImportNumber(value: string): boolean {
    return Number.isFinite(Number(value));
  }

  private isNegativeImportNumber(value: string): boolean {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed < 0;
  }

  private isKnownImportStatus(value: string): boolean {
    return this.isWantedImportStatus(value) || ['h', 'have', 'owned', 'own'].includes(value);
  }

  private isWantedImportStatus(value: string): boolean {
    return ['w', 'want', 'wanted'].includes(value);
  }

  private importHasContent(payload: UpsertMtgCollectionItem): boolean {
    return Boolean(
      payload.name ||
      payload.setCode ||
      payload.collectorNumber ||
      payload.typeLine ||
      payload.scryfallId ||
      payload.location ||
      payload.condition ||
      payload.language ||
      payload.notes);
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    this.csvDownload.download(filename, rows);
  }

  private optional(value: string): string | null {
    return value.trim() || null;
  }

  private optionalUpper(value: string): string | null {
    return this.optional(value)?.toUpperCase() ?? null;
  }

  private normalizeColorString(value: string): string | null {
    const normalized = this.optionalUpper(value)?.replace(/[, ]/g, '');
    if (!normalized) {
      return null;
    }

    return [...new Set(normalized.split(''))]
      .sort((left, right) => this.colorSortIndex(left) - this.colorSortIndex(right) || left.localeCompare(right))
      .join('');
  }

  private hasUnknownColorSymbols(value: string): boolean {
    return (this.optionalUpper(value)?.replace(/[, ]/g, '') ?? '')
      .split('')
      .some(color => !this.colorSortOrder.includes(color));
  }

  private colorSortIndex(color: string): number {
    const index = this.colorSortOrder.indexOf(color);
    return index < 0 ? this.colorSortOrder.length : index;
  }

  private optionalLower(value: string): string | null {
    return this.optional(value)?.toLowerCase() ?? null;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private textLines(value: string | null): string[] {
    return (value ?? '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  }
}
