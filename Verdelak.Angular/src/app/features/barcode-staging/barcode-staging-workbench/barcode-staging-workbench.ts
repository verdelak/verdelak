import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BarcodeBatchHistoryPanel } from '../barcode-batch-history-panel/barcode-batch-history-panel';
import { BarcodeDuplicateScanPanel } from '../barcode-duplicate-scan-panel/barcode-duplicate-scan-panel';
import { BarcodeImportValidationPanel } from '../barcode-import-validation-panel/barcode-import-validation-panel';
import { BarcodeStagingService } from '../barcode-staging.service';
import {
  BarcodeBatchReport,
  BarcodeImportCommitResult,
  BarcodeImportHistoryRow,
  BarcodeImportValidationRow,
  BarcodeImportValidationPreview,
  BarcodeLookupCandidate,
  BarcodeItemType,
  BarcodeStageStatus,
  BarcodeStagingBatchLookupRequest,
  BarcodeStagingCleanupRequest,
  BarcodeStagingCleanupResult,
  BarcodeStagingDuplicateGroup,
  BarcodeStagingItem,
  BarcodeStagingUpdateRequest
} from '../models/barcode-staging.models';

interface ParsedBarcodeCode {
  raw: string;
  normalized: string;
  codeType: string;
  warning: string | null;
}

interface CandidateComparisonRow {
  candidate: BarcodeLookupCandidate;
  quality: number;
  completeness: number;
  agreementCount: number;
  issueCount: number;
  hasTitle: boolean;
  hasCreator: boolean;
  hasPublisher: boolean;
  hasDate: boolean;
  hasFormat: boolean;
  hasExternalId: boolean;
  hasCover: boolean;
}

interface CandidateCurrentField {
  label: string;
  value: string;
  tone: string;
}

interface ProviderHealthSummary {
  provider: string;
  total: number;
  selected: number;
  averageConfidence: number;
  bestQuality: number;
  completeCount: number;
  issueCount: number;
}

interface SelectedCommitPanelField {
  label: string;
  value: string;
  hint: string;
  backendField: string;
  tone: string;
  category: 'Destination' | 'Audit' | 'NotMapped' | 'Review';
}

interface SelectedCommitPanelGroup {
  label: string;
  description: string;
  fields: SelectedCommitPanelField[];
  tone: string;
}

interface CommitChecklistItem {
  label: string;
  value: string;
  status: 'Ready' | 'Review' | 'Missing';
  tone: string;
}

interface BatchReportHealthSummary {
  label: string;
  value: number;
  tone: string;
}

interface BatchProviderHealthCard {
  report: BarcodeBatchReport;
  title: string;
  subtitle: string;
  matchParts: string[];
  selectedParts: string[];
  failureParts: string[];
  retryLabel: string;
  tone: string;
}

interface ImportHistorySummaryCard {
  label: string;
  rows: Array<{ key: string; count: number }>;
  tone: string;
}

interface ImportHistoryTraceCard {
  label: string;
  count: number;
  helper: string;
  tone: string;
}

interface ImportTypePanel {
  itemType: string;
  destination: string;
  destinationEntity: string;
  rows: BarcodeImportValidationRow[];
  readyCount: number;
  warningCount: number;
  blockedCount: number;
  requiredFields: string[];
  commitFields: string[];
  destinationFields: string[];
  traceFields: string[];
  traceBehavior: string[];
  readinessChecklist: CommitChecklistItem[];
  warningMessages: string[];
}

interface ImportValidationGroup {
  label: string;
  severity: string;
  rows: BarcodeImportValidationRow[];
  tone: string;
  helper: string;
}

interface ValidationMessageView {
  label: string;
  message: string;
  tone: string;
}

interface DuplicateDetailRow {
  row: BarcodeImportValidationRow;
  messages: ValidationMessageView[];
}

interface BarcodeWorkflowCard {
  key: 'lookup' | 'review' | 'approve' | 'import' | 'history';
  title: string;
  count: number;
  helper: string;
  actionLabel: string;
  tone: string;
  disabled: boolean;
}

@Component({
  selector: 'app-barcode-staging-workbench',
  imports: [CommonModule, FormsModule, BarcodeBatchHistoryPanel, BarcodeDuplicateScanPanel, BarcodeImportValidationPanel],
  templateUrl: './barcode-staging-workbench.html',
  styleUrl: './barcode-staging-workbench.scss'
})
export class BarcodeStagingWorkbench implements OnInit {
  readonly viewModel = this;

  readonly batchName = signal('');
  readonly scanInput = signal('');
  readonly bulkInput = signal('');
  readonly selectedFileName = signal<string | null>(null);
  readonly statusFilter = signal('');
  readonly typeFilter = signal('');
  readonly sourceFilter = signal('');
  readonly batchFilter = signal('');
  readonly selectedItem = signal<BarcodeStagingItem | null>(null);
  readonly selectedIds = signal<Set<number>>(new Set<number>());
  readonly batchProvider = signal<BarcodeStagingBatchLookupRequest['provider']>('Auto');
  readonly batchItemType = signal('');
  readonly batchStatus = signal('');
  readonly batchNotes = signal('');
  readonly lookupCandidates = signal<BarcodeLookupCandidate[]>([]);
  readonly duplicateGroups = signal<BarcodeStagingDuplicateGroup[]>([]);
  readonly importPreview = signal<BarcodeImportValidationPreview | null>(null);
  readonly importCommitResult = signal<BarcodeImportCommitResult | null>(null);
  readonly cleanupPreview = signal<BarcodeStagingCleanupResult | null>(null);
  readonly cleanupDays = signal(30);
  readonly cleanupImported = signal(true);
  readonly cleanupRejected = signal(true);
  readonly batchReports = signal<BarcodeBatchReport[]>([]);
  readonly importHistoryRows = signal<BarcodeImportHistoryRow[]>([]);
  readonly importHistoryBatchFilter = signal('');
  readonly importHistorySourceFilter = signal('');
  readonly importHistoryTypeFilter = signal('');
  readonly importHistoryEntityFilter = signal('');
  readonly importHistoryFromDate = signal('');
  readonly importHistoryToDate = signal('');
  readonly importHistoryTake = signal(250);
  readonly loadingDuplicates = signal(false);
  readonly loadingImportPreview = signal(false);
  readonly loadingImportCommit = signal(false);
  readonly loadingBatchReports = signal(false);
  readonly loadingImportHistory = signal(false);
  readonly loadingCleanup = signal(false);
  readonly items = signal<BarcodeStagingItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly itemTypes: BarcodeItemType[] = ['Unknown', 'CD', 'Book', 'DVD', 'Other'];
  readonly statuses: BarcodeStageStatus[] = ['New', 'Duplicate', 'LookupPending', 'Matched', 'NeedsReview', 'Approved', 'Rejected', 'Imported'];
  readonly lookupProviders = ['Auto', 'OpenLibrary', 'GoogleBooks', 'Crossref', 'MusicBrainz', 'UPCitemdb', 'OpenFoodFacts', 'Discogs', 'Wikidata'];
  readonly lookupProviderHints: Record<string, string> = {
    Auto: 'Enabled providers by type and Admin Settings priority',
    OpenLibrary: 'ISBN books',
    GoogleBooks: 'ISBN books',
    Crossref: 'ISBN books and scholarly works fallback',
    MusicBrainz: 'UPC/EAN music',
    UPCitemdb: 'General UPC/EAN fallback',
    OpenFoodFacts: 'Food and grocery UPC/EAN',
    Discogs: 'Music UPC/EAN, requires token if enabled',
    Wikidata: 'General ISBN/UPC/EAN fallback'
  };
  readonly importedEntityTypes = ['Book', 'MusicAlbum', 'MovieInventoryItem'];

  readonly newCount = computed(() => this.items().filter(item => item.status === 'New').length);
  readonly matchedCount = computed(() => this.items().filter(item => item.status === 'Matched').length);
  readonly needsReviewCount = computed(() => this.items().filter(item => item.status === 'NeedsReview' || item.status === 'Duplicate').length);
  readonly approvedCount = computed(() => this.items().filter(item => item.status === 'Approved').length);
  readonly rejectedCount = computed(() => this.items().filter(item => item.status === 'Rejected').length);
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly parsedBulkCodes = computed(() => this.parseInputCodes(this.bulkInput()));
  readonly validParsedBulkCodes = computed(() => this.parsedBulkCodes().filter(code => !code.warning));
  readonly selectedItems = computed(() => this.items().filter(item => this.selectedIds().has(item.id)));
  readonly sources = computed(() => this.uniqueValues(this.items().map(item => item.source)));
  readonly batches = computed(() => this.uniqueValues(this.items().map(item => item.batchName || '')));
  readonly readyToImportCount = computed(() => this.items().filter(item => this.isReadyToImport(item)).length);
  readonly lookupRecommendedItems = computed(() => this.items().filter(item => this.needsLookup(item)));
  readonly reviewRecommendedItems = computed(() => this.items().filter(item => this.needsHumanReview(item)));
  readonly approvalRecommendedItems = computed(() => this.items().filter(item => this.readyForApproval(item)));
  readonly workflowCards = computed<BarcodeWorkflowCard[]>(() => [
    {
      key: 'lookup',
      title: 'Lookup',
      count: this.lookupRecommendedItems().length,
      helper: 'Rows with no usable candidate data yet.',
      actionLabel: 'Select lookup rows',
      tone: 'app-token-soft-surface app-token-text-primary',
      disabled: this.lookupRecommendedItems().length === 0
    },
    {
      key: 'review',
      title: 'Review',
      count: this.reviewRecommendedItems().length,
      helper: 'Duplicates, low confidence, missing fields, or unknown type.',
      actionLabel: 'Select review rows',
      tone: 'border-amber-200 bg-amber-50 text-amber-900',
      disabled: this.reviewRecommendedItems().length === 0
    },
    {
      key: 'approve',
      title: 'Approve',
      count: this.approvalRecommendedItems().length,
      helper: 'Matched rows that look complete enough to approve.',
      actionLabel: 'Select approval rows',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      disabled: this.approvalRecommendedItems().length === 0
    },
    {
      key: 'import',
      title: 'Import',
      count: this.readyToImportCount(),
      helper: 'Approved Book/CD/DVD rows with enough data to create records.',
      actionLabel: 'Preview import',
      tone: 'app-token-soft-surface app-token-text-strong',
      disabled: this.readyToImportCount() === 0
    },
    {
      key: 'history',
      title: 'History',
      count: this.importHistoryRows().length,
      helper: 'Recently imported rows, filtered by the history controls.',
      actionLabel: 'Refresh history',
      tone: 'border-slate-200 bg-slate-50 text-slate-900',
      disabled: false
    }
  ]);
  readonly sortedCandidates = computed(() => [...this.lookupCandidates()].sort((left, right) =>
    Number(right.selected) - Number(left.selected)
      || (right.confidence ?? -1) - (left.confidence ?? -1)
      || this.candidateCompleteness(right) - this.candidateCompleteness(left)
      || left.provider.localeCompare(right.provider)
  ));
  readonly candidateComparisonRows = computed<CandidateComparisonRow[]>(() => {
    const item = this.selectedItem();
    return this.sortedCandidates().map(candidate => ({
      candidate,
      quality: this.candidateQuality(candidate),
      completeness: this.candidateCompleteness(candidate),
      agreementCount: item ? this.candidateAgreementCount(candidate, item) : 0,
      issueCount: item ? this.candidateIssueCount(candidate, item) : this.candidateIssueCount(candidate),
      hasTitle: Boolean(candidate.title?.trim()),
      hasCreator: Boolean(candidate.creator?.trim()),
      hasPublisher: Boolean(candidate.publisher?.trim()),
      hasDate: Boolean(candidate.publishDate?.trim()),
      hasFormat: Boolean(candidate.format?.trim()),
      hasExternalId: Boolean(candidate.externalId?.trim()),
      hasCover: Boolean(candidate.coverImageUrl?.trim())
    }));
  });
  readonly topCandidateComparisonRows = computed<CandidateComparisonRow[]>(() => this.candidateComparisonRows().slice(0, 3));
  readonly selectedCandidateRow = computed<CandidateComparisonRow | null>(() =>
    this.candidateComparisonRows().find(row => row.candidate.selected) ?? null);
  readonly bestCandidateRow = computed<CandidateComparisonRow | null>(() => this.candidateComparisonRows()[0] ?? null);
  readonly currentCandidateFields = computed<CandidateCurrentField[]>(() => {
    const item = this.selectedItem();
    if (!item) {
      return [];
    }

    return [
      this.currentCandidateField('Title', item.suggestedTitle),
      this.currentCandidateField('Creator', item.suggestedCreator),
      this.currentCandidateField('Format', item.suggestedFormat),
      this.currentCandidateField('Year/date', item.suggestedYear),
      this.currentCandidateField('Provider', item.lookupProvider),
      this.currentCandidateField('Confidence', item.confidence === null || item.confidence === undefined ? null : `${item.confidence}%`)
    ];
  });

  readonly providerHealthSummaries = computed<ProviderHealthSummary[]>(() => {
    const rows = this.candidateComparisonRows();
    const providers = new Map<string, CandidateComparisonRow[]>();
    for (const row of rows) {
      providers.set(row.candidate.provider, [...(providers.get(row.candidate.provider) ?? []), row]);
    }

    return [...providers.entries()]
      .map(([provider, providerRows]) => ({
        provider,
        total: providerRows.length,
        selected: providerRows.filter(row => row.candidate.selected).length,
        averageConfidence: Math.round(providerRows.reduce((sum, row) => sum + (row.candidate.confidence ?? 0), 0) / providerRows.length),
        bestQuality: Math.max(...providerRows.map(row => row.quality)),
        completeCount: providerRows.filter(row => row.issueCount === 0).length,
        issueCount: providerRows.reduce((sum, row) => sum + row.issueCount, 0)
      }))
      .sort((left, right) => right.selected - left.selected || right.bestQuality - left.bestQuality || left.provider.localeCompare(right.provider));
  });
  readonly batchReportHealthSummaries = computed<BatchReportHealthSummary[]>(() => {
    const reports = this.batchReports();
    return [
      {
        label: 'Batches',
        value: reports.length,
        tone: 'bg-slate-50 text-slate-700 ring-slate-200'
      },
      {
        label: 'Ready rows',
        value: reports.reduce((sum, report) => sum + report.readyToImportCount, 0),
        tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      },
      {
        label: 'No candidates',
        value: reports.reduce((sum, report) => sum + report.noCandidateCount, 0),
        tone: 'bg-amber-50 text-amber-800 ring-amber-200'
      },
      {
        label: 'Low confidence',
        value: reports.reduce((sum, report) => sum + report.lowConfidenceCount, 0),
        tone: 'bg-orange-50 text-orange-800 ring-orange-200'
      },
      {
        label: 'Provider failures',
        value: reports.filter(report => Boolean(report.providerFailureSummary?.trim())).length,
        tone: 'bg-rose-50 text-rose-800 ring-rose-200'
      }
    ];
  });
  readonly batchProviderHealthCards = computed<BatchProviderHealthCard[]>(() =>
    this.batchReports()
      .filter(report => report.candidateCount > 0 || report.noCandidateCount > 0 || Boolean(report.providerFailureSummary?.trim()))
      .map(report => {
        const failureParts = this.providerSummaryParts(report.providerFailureSummary);
        const matchParts = this.providerSummaryParts(report.providerMatchSummary);
        const selectedParts = this.providerSummaryParts(report.selectedProviderSummary);
        const retryLabel = report.providerFailureSummary?.trim()
          ? 'Retry fallback providers'
          : report.noCandidateCount > 0
            ? 'Retry missing only'
            : report.lowConfidenceCount > 0
              ? 'Review low confidence'
              : 'Provider health OK';

        return {
          report,
          title: report.batchName || 'No batch',
          subtitle: `${report.source || 'Unknown source'} / ${report.totalCount} staged`,
          matchParts,
          selectedParts,
          failureParts,
          retryLabel,
          tone: failureParts.length
            ? 'border-rose-200 bg-rose-50'
          : report.noCandidateCount > 0 || report.lowConfidenceCount > 0
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        };
      })
  );
  readonly importHistorySummaryCards = computed<ImportHistorySummaryCard[]>(() => {
    const rows = this.importHistoryRows();
    if (rows.length === 0) {
      return [];
    }

    return [
      {
        label: 'Types',
        rows: this.groupImportHistory(rows, row => row.itemType || 'Unknown'),
        tone: 'app-token-soft-surface app-token-text-primary app-token-ring'
      },
      {
        label: 'Destinations',
        rows: this.groupImportHistory(rows, row => row.importedEntityType || 'Unknown'),
        tone: 'bg-emerald-50 text-emerald-900 ring-emerald-200'
      },
      {
        label: 'Providers',
        rows: this.groupImportHistory(rows, row => row.lookupProvider || 'Manual/Unknown', true),
        tone: 'app-token-soft-surface app-token-text-primary app-token-ring'
      },
      {
        label: 'Sources',
        rows: this.groupImportHistory(rows, row => row.source || 'Unknown'),
        tone: 'bg-slate-50 text-slate-900 ring-slate-200'
      },
      {
        label: 'Batches',
        rows: this.groupImportHistory(rows, row => row.batchName || 'No batch'),
        tone: 'bg-amber-50 text-amber-900 ring-amber-200'
      }
    ];
  });
  readonly importHistoryTraceCards = computed<ImportHistoryTraceCard[]>(() => {
    const rows = this.importHistoryRows();
    if (rows.length === 0) {
      return [];
    }

    const completeTraceCount = rows.filter(row => this.importHistoryTraceStatus(row) === 'Complete trace').length;
    const partialTraceCount = rows.filter(row => this.importHistoryTraceStatus(row) === 'Partial trace').length;
    const bookBarcodeLimitedCount = rows.filter(row => row.itemType === 'Book').length;
    const directBarcodeCount = rows.filter(row => row.itemType === 'DVD' || row.itemType === 'CD').length;

    return [
      {
        label: 'Complete trace',
        count: completeTraceCount,
        helper: 'Imported entity id, source, batch/code, and provider are present.',
        tone: 'bg-emerald-50 text-emerald-900 ring-emerald-200'
      },
      {
        label: 'Partial trace',
        count: partialTraceCount,
        helper: 'Imported successfully, but provider, entity, or batch/source trace is incomplete.',
        tone: partialTraceCount ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-slate-50 text-slate-700 ring-slate-200'
      },
      {
        label: 'Book ISBN trace',
        count: bookBarcodeLimitedCount,
        helper: 'Book ISBN/barcode remains in staging history because Books has no barcode field yet.',
        tone: 'app-token-soft-surface app-token-text-primary app-token-ring'
      },
      {
        label: 'Barcode carried forward',
        count: directBarcodeCount,
        helper: 'CD keeps barcode in album info text; DVD stores it directly on movie inventory.',
        tone: 'app-token-soft-surface app-token-text-primary app-token-ring'
      }
    ];
  });

  readonly importTypePanels = computed<ImportTypePanel[]>(() => {
    const preview = this.importPreview();
    if (!preview) {
      return [];
    }

    const order = ['Book', 'CD', 'DVD', 'Other', 'Unknown'];
    const grouped = new Map<string, BarcodeImportValidationRow[]>();
    for (const row of preview.rows) {
      const itemType = row.item.itemType || 'Unknown';
      grouped.set(itemType, [...(grouped.get(itemType) ?? []), row]);
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => (order.indexOf(left) < 0 ? 99 : order.indexOf(left)) - (order.indexOf(right) < 0 ? 99 : order.indexOf(right)) || left.localeCompare(right))
      .map(([itemType, rows]) => ({
        itemType,
        destination: this.importDestinationLabel(itemType),
        destinationEntity: this.importDestinationName(itemType),
        rows,
        readyCount: rows.filter(row => row.severity === 'Ready').length,
        warningCount: rows.filter(row => row.severity === 'Warning').length,
        blockedCount: rows.filter(row => row.severity === 'Blocked').length,
        requiredFields: this.importRequiredFields(itemType),
        commitFields: this.importCommitFields(itemType),
        destinationFields: this.importDestinationFields(itemType),
        traceFields: this.importTraceFields(itemType),
        traceBehavior: this.importTraceBehavior(itemType),
        readinessChecklist: this.importPanelChecklist(itemType, rows),
        warningMessages: this.importPanelMessages(rows)
      }));
  });
  readonly importValidationGroups = computed<ImportValidationGroup[]>(() => {
    const preview = this.importPreview();
    if (!preview) {
      return [];
    }

    return [
      {
        label: 'Ready',
        severity: 'Ready',
        rows: preview.rows.filter(row => row.severity === 'Ready'),
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        helper: 'These rows can be imported now.'
      },
      {
        label: 'Warnings',
        severity: 'Warning',
        rows: preview.rows.filter(row => row.severity === 'Warning'),
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        helper: 'These rows can import, but should be reviewed first.'
      },
      {
        label: 'Blocked',
        severity: 'Blocked',
        rows: preview.rows.filter(row => row.severity === 'Blocked'),
        tone: 'border-rose-200 bg-rose-50 text-rose-900',
        helper: 'These rows will stay staged until fixed.'
      }
    ].filter(group => group.rows.length > 0);
  });
  readonly readyImportRows = computed(() => this.importPreview()?.rows.filter(row => row.canImport) ?? []);
  readonly duplicateDetailRows = computed<DuplicateDetailRow[]>(() =>
    this.importPreview()?.rows
      .map(row => ({ row, messages: this.duplicateValidationMessages(row) }))
      .filter(detail => detail.messages.length > 0) ?? []
  );
  readonly selectedImportValidationRow = computed(() => {
    const selectedItem = this.selectedItem();
    if (!selectedItem) {
      return null;
    }

    return this.importPreview()?.rows.find(row => row.item.id === selectedItem.id) ?? null;
  });
  readonly selectedDuplicateDetails = computed(() => {
    const row = this.selectedImportValidationRow();
    return row ? this.duplicateValidationMessages(row) : [];
  });

  readonly canLookupOpenLibrary = computed(() => {
    const item = this.selectedItem();
    return item?.codeType === 'ISBN10' || item?.codeType === 'ISBN13';
  });
  readonly canLookupMusicBrainz = computed(() => {
    const item = this.selectedItem();
    return item?.codeType === 'UPC' || item?.codeType === 'EAN8' || item?.codeType === 'EAN13';
  });

  constructor(private readonly service: BarcodeStagingService) {}

  ngOnInit(): void {
    this.loadItems();
    this.loadBatchReports();
    this.loadImportHistory();
  }

  loadItems(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getItems(this.statusFilter(), this.typeFilter(), this.sourceFilter(), this.batchFilter()).subscribe({
      next: items => {
        this.items.set(items);
        this.selectedIds.update(ids => new Set([...ids].filter(id => items.some(item => item.id === id))));
      },
      error: err => this.error.set(err.message ?? 'Failed to load staged UPCs.'),
      complete: () => this.loading.set(false)
    });
  }

  stageScan(): void {
    const upc = this.scanInput().trim();

    if (!upc) {
      return;
    }

    this.stageUpcs([upc], 'Scanner');
    this.scanInput.set('');
  }

  stageBulk(): void {
    const upcs = this.validParsedBulkCodes().map(code => code.normalized);

    if (upcs.length === 0) {
      this.error.set('Paste or enter at least one UPC, EAN, or ISBN.');
      return;
    }

    this.stageUpcs(upcs, 'Paste');
    this.bulkInput.set('');
  }

  stageFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedFileName.set(file.name);
    const reader = new FileReader();

    reader.onload = () => {
      const content = String(reader.result ?? '');
      const parsed = this.parseInputCodes(content);
      const upcs = parsed.filter(code => !code.warning).map(code => code.normalized);

      if (upcs.length === 0) {
        this.error.set('No UPC, EAN, or ISBN values were found in that file.');
        return;
      }

      this.stageUpcs(upcs, 'Upload');
      input.value = '';
    };

    reader.onerror = () => {
      this.error.set('The file could not be read.');
      input.value = '';
    };

    reader.readAsText(file);
  }

  selectItem(item: BarcodeStagingItem): void {
    this.selectedItem.set({ ...item });
    this.loadCandidates(item.id);
  }

  toggleSelected(item: BarcodeStagingItem, checked: boolean): void {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      if (checked) {
        next.add(item.id);
      } else {
        next.delete(item.id);
      }

      return next;
    });
  }

  toggleAllShown(checked: boolean): void {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      for (const item of this.items()) {
        if (checked) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }
      }

      return next;
    });
  }

  isSelected(item: BarcodeStagingItem): boolean {
    return this.selectedIds().has(item.id);
  }

  areAllShownSelected(): boolean {
    return this.items().length > 0 && this.items().every(item => this.selectedIds().has(item.id));
  }

  selectWorkflowRows(key: BarcodeWorkflowCard['key']): void {
    if (key === 'history') {
      this.loadImportHistory();
      return;
    }

    if (key === 'import') {
      const readyRows = this.items().filter(item => this.isReadyToImport(item));
      this.selectedIds.set(new Set(readyRows.map(item => item.id)));
      this.previewSelectedImport();
      return;
    }

    const rows = key === 'lookup'
      ? this.lookupRecommendedItems()
      : key === 'review'
        ? this.reviewRecommendedItems()
        : this.approvalRecommendedItems();

    this.selectedIds.set(new Set(rows.map(item => item.id)));
    if (rows[0]) {
      this.selectItem(rows[0]);
    }
  }

  workflowRowTone(item: BarcodeStagingItem): string {
    if (item.status === 'Imported') {
      return 'border-l-4 border-l-slate-300 bg-slate-50/60';
    }

    if (this.isReadyToImport(item)) {
      return 'border-l-4 app-token-border-left-accent';
    }

    if (this.readyForApproval(item)) {
      return 'border-l-4 border-l-emerald-400';
    }

    if (this.needsHumanReview(item)) {
      return 'border-l-4 border-l-amber-400';
    }

    if (this.needsLookup(item)) {
      return 'border-l-4 app-token-border-left-accent';
    }

    return 'border-l-4 border-l-transparent';
  }

  workflowRowLabel(item: BarcodeStagingItem): string {
    if (item.status === 'Imported') {
      return 'Imported';
    }

    if (this.isReadyToImport(item)) {
      return 'Ready to import';
    }

    if (this.readyForApproval(item)) {
      return 'Ready to approve';
    }

    if (this.needsHumanReview(item)) {
      return 'Review';
    }

    if (this.needsLookup(item)) {
      return 'Lookup';
    }

    return 'Queued';
  }

  workflowRowLabelTone(item: BarcodeStagingItem): string {
    if (item.status === 'Imported') {
      return 'bg-slate-100 text-slate-700';
    }

    if (this.isReadyToImport(item)) {
      return 'app-token-soft-surface app-token-text-primary';
    }

    if (this.readyForApproval(item)) {
      return 'bg-emerald-50 text-emerald-800';
    }

    if (this.needsHumanReview(item)) {
      return 'bg-amber-50 text-amber-800';
    }

    if (this.needsLookup(item)) {
      return 'app-token-soft-surface app-token-text-strong';
    }

    return 'bg-slate-100 text-slate-700';
  }

  saveSelected(): void {
    const item = this.selectedItem();

    if (!item) {
      return;
    }

    this.saveReviewItem(item, 'Staged item saved.');
  }

  saveSelectedAs(status: BarcodeStageStatus): void {
    const item = this.selectedItem();

    if (!item) {
      return;
    }

    this.saveReviewItem({ ...item, status }, `Staged item ${status.toLowerCase()}.`);
  }

  reviewCompletenessLabel(item: BarcodeStagingItem): string {
    const checks = this.reviewChecks(item);
    return `${checks.filter(check => check.complete).length}/${checks.length} ready`;
  }

  reviewChecks(item: BarcodeStagingItem): Array<{ label: string; complete: boolean }> {
    const commonChecks = [
      { label: 'Title', complete: Boolean(item.suggestedTitle?.trim()) },
      { label: 'Format', complete: Boolean(item.suggestedFormat?.trim()) }
    ];

    if (item.itemType === 'Book') {
      return [
        ...commonChecks,
        { label: 'Author', complete: Boolean(item.suggestedCreator?.trim()) }
      ];
    }

    if (item.itemType === 'CD') {
      return [
        ...commonChecks,
        { label: 'Artist', complete: Boolean(item.suggestedCreator?.trim()) }
      ];
    }

    if (item.itemType === 'DVD') {
      return [
        ...commonChecks,
        { label: 'Creator', complete: Boolean(item.suggestedCreator?.trim()) }
      ];
    }

    return commonChecks;
  }

  reviewCheckTone(complete: boolean): string {
    return complete ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800';
  }

  private saveReviewItem(item: BarcodeStagingItem, successMessage: string): void {
    const request: BarcodeStagingUpdateRequest = {
      itemType: item.itemType,
      status: item.status,
      suggestedTitle: item.suggestedTitle,
      suggestedCreator: item.suggestedCreator,
      suggestedFormat: item.suggestedFormat,
      suggestedYear: item.suggestedYear,
      lookupProvider: item.lookupProvider,
      confidence: item.confidence,
      notes: item.notes
    };

    this.loading.set(true);
    this.error.set(null);

    this.service.updateItem(item.id, request).subscribe({
      next: () => {
        this.message.set(successMessage);
        this.selectedItem.set(null);
        this.loadItems();
      },
      error: err => this.error.set(err.message ?? 'Failed to save staged item.'),
      complete: () => this.loading.set(false)
    });
  }

  setSelectedField<K extends keyof BarcodeStagingItem>(field: K, value: BarcodeStagingItem[K]): void {
    const item = this.selectedItem();

    if (!item) {
      return;
    }

    this.selectedItem.set({ ...item, [field]: value });
  }

  setSelectedItemType(value: BarcodeItemType | string): void {
    const item = this.selectedItem();
    if (!item) {
      return;
    }

    const format = value === 'Book'
      ? item.suggestedFormat || 'Hardcover'
      : value === 'CD'
        ? item.suggestedFormat || 'CD'
        : value === 'DVD'
          ? item.suggestedFormat || 'DVD'
          : item.suggestedFormat;

    this.selectedItem.set({ ...item, itemType: value, suggestedFormat: format });
  }

  loadDuplicates(): void {
    this.loadingDuplicates.set(true);
    this.error.set(null);
    this.service.getDuplicates().subscribe({
      next: groups => this.duplicateGroups.set(groups),
      error: err => this.error.set(err.message ?? 'Failed to scan staged barcode duplicates.'),
      complete: () => this.loadingDuplicates.set(false)
    });
  }

  selectDuplicateGroup(group: BarcodeStagingDuplicateGroup): void {
    this.selectedIds.set(new Set(group.items.map(item => item.id)));
    const first = group.items[0];
    if (first) {
      this.selectItem(first);
    }
  }

  previewSelectedImport(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) {
      this.error.set('Select at least one staged item to preview import validation.');
      return;
    }

    this.runImportPreview({ ids, batchName: null });
  }

  previewCurrentBatchImport(): void {
    if (!this.batchFilter()) {
      this.error.set('Choose a batch filter before previewing a whole batch.');
      return;
    }

    this.runImportPreview({ ids: [], batchName: this.batchFilter() });
  }

  loadBatchReports(): void {
    this.loadingBatchReports.set(true);
    this.error.set(null);
    this.service.getBatchReports().subscribe({
      next: reports => this.batchReports.set(reports),
      error: err => this.error.set(err.message ?? 'Failed to load barcode batch reports.'),
      complete: () => this.loadingBatchReports.set(false)
    });
  }

  downloadBatchReportsCsv(): void {
    const rows = this.batchReports().map(report => [
      report.batchName,
      report.source,
      report.totalCount,
      this.reportHealthLabel(report),
      this.reportTypeSummary(report),
      report.readyToImportCount,
      report.needsReviewCount,
      report.importedCount,
      this.reportImportedSummary(report),
      this.reportLookupSummary(report),
      this.reportProviderMatchSummary(report),
      this.reportSelectedProviderSummary(report),
      this.reportProviderFailureSummary(report),
      report.lastImportedAtUtc ?? '',
      report.duplicateCodeCount,
      report.firstStagedAtUtc,
      report.lastUpdatedAtUtc
    ]);

    this.downloadCsv('barcode-batch-reports.csv', [
      ['Batch', 'Source', 'Total', 'Health', 'Types', 'Ready', 'Needs Review', 'Imported', 'Imported Types', 'Lookup Health', 'Provider Matches', 'Selected Provider', 'Provider Failures', 'Last Imported', 'Duplicates', 'First Staged', 'Last Updated'],
      ...rows
    ]);
  }

  loadImportHistory(): void {
    this.loadingImportHistory.set(true);
    this.error.set(null);
    this.service.getImportHistory({
      batchName: this.importHistoryBatchFilter() || null,
      source: this.importHistorySourceFilter() || null,
      itemType: this.importHistoryTypeFilter() || null,
      importedEntityType: this.importHistoryEntityFilter() || null,
      fromUtc: this.dateStartUtc(this.importHistoryFromDate()),
      toUtc: this.dateEndUtc(this.importHistoryToDate()),
      take: Math.max(1, Math.min(1000, Number(this.importHistoryTake()) || 250))
    }).subscribe({
      next: rows => this.importHistoryRows.set(rows),
      error: err => this.error.set(err.message ?? 'Failed to load barcode import history.'),
      complete: () => this.loadingImportHistory.set(false)
    });
  }

  downloadImportHistoryCsv(): void {
    this.downloadImportHistoryRowsCsv('barcode-import-history.csv', this.importHistoryRows());
  }

  downloadImportHistorySummaryCsv(): void {
    const rows = this.importHistorySummaryCards()
      .flatMap(card => card.rows.map(row => [card.label, row.key, row.count]));

    this.downloadCsv('barcode-import-history-summary.csv', [
      ['Group', 'Value', 'Imported Count'],
      ...rows
    ]);
  }

  showImportHistoryForReport(report: BarcodeBatchReport): void {
    this.importHistoryBatchFilter.set(report.batchName);
    this.importHistorySourceFilter.set(report.source);
    this.importHistoryTypeFilter.set('');
    this.importHistoryEntityFilter.set('');
    this.loadImportHistory();
  }

  downloadImportHistoryForReport(report: BarcodeBatchReport): void {
    this.loadingImportHistory.set(true);
    this.error.set(null);
    this.service.getImportHistory({
      batchName: report.batchName,
      source: report.source,
      take: 1000
    }).subscribe({
      next: rows => this.downloadImportHistoryRowsCsv(
        `barcode-import-history-${this.safeFilePart(report.batchName)}-${this.safeFilePart(report.source)}.csv`,
        rows),
      error: err => this.error.set(err.message ?? 'Failed to download filtered barcode import history.'),
      complete: () => this.loadingImportHistory.set(false)
    });
  }

  setImportHistoryPreset(days: number): void {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - Math.max(0, days - 1));
    this.importHistoryFromDate.set(this.dateInputValue(from));
    this.importHistoryToDate.set(this.dateInputValue(today));
    this.loadImportHistory();
  }

  clearImportHistoryFilters(): void {
    this.importHistoryBatchFilter.set('');
    this.importHistorySourceFilter.set('');
    this.importHistoryTypeFilter.set('');
    this.importHistoryEntityFilter.set('');
    this.importHistoryFromDate.set('');
    this.importHistoryToDate.set('');
    this.importHistoryTake.set(250);
    this.loadImportHistory();
  }

  importHistoryTypeSummary(): string {
    const counts = new Map<string, number>();
    for (const row of this.importHistoryRows()) {
      const key = row.itemType || 'Unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([type, count]) => `${count} ${type}`)
      .join(' / ') || '-';
  }

  importHistoryDestinationSummary(): string {
    const counts = new Map<string, number>();
    for (const row of this.importHistoryRows()) {
      const key = row.importedEntityType || 'Unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([type, count]) => `${count} ${type}`)
      .join(' / ') || '-';
  }

  importHistoryProviderSummary(): string {
    const counts = new Map<string, number>();
    for (const row of this.importHistoryRows()) {
      for (const provider of this.splitProviderSummary(row.lookupProvider)) {
        counts.set(provider, (counts.get(provider) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([provider, count]) => `${provider}: ${count}`)
      .join(' / ') || '-';
  }

  importHistoryTopSummary(card: ImportHistorySummaryCard): string {
    return card.rows
      .slice(0, 3)
      .map(row => `${row.key}: ${row.count}`)
      .join(' / ') || '-';
  }

  importHistoryTraceStatus(row: BarcodeImportHistoryRow): 'Complete trace' | 'Partial trace' {
    const hasEntity = Boolean(row.importedEntityType?.trim()) && row.importedEntityId !== null && row.importedEntityId !== undefined;
    const hasSource = Boolean(row.source?.trim());
    const hasCode = Boolean(row.normalizedCode?.trim() || row.upc?.trim());
    const hasProvider = Boolean(row.lookupProvider?.trim());

    return hasEntity && hasSource && hasCode && hasProvider ? 'Complete trace' : 'Partial trace';
  }

  importHistoryTraceTone(row: BarcodeImportHistoryRow): string {
    return this.importHistoryTraceStatus(row) === 'Complete trace'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : 'bg-amber-50 text-amber-900 ring-amber-200';
  }

  importHistoryDestinationKey(row: BarcodeImportHistoryRow): string {
    return row.importedEntityType?.trim() && row.importedEntityId !== null && row.importedEntityId !== undefined
      ? `${row.importedEntityType} #${row.importedEntityId}`
      : '-';
  }

  importHistoryTraceSummary(row: BarcodeImportHistoryRow): string {
    switch (row.itemType) {
      case 'Book':
        return 'Book linked by staging import entity id; ISBN/barcode remains in staging trace.';
      case 'CD':
        return 'MusicAlbum linked by staging import entity id; barcode/provider trace is carried in album info text.';
      case 'DVD':
        return 'MovieInventoryItem linked by staging import entity id; barcode and source are written to movie inventory.';
      default:
        return 'Imported staging row has entity trace when destination type/id are present.';
    }
  }

  previewCleanup(): void {
    const request = this.cleanupRequest();
    if (request.statuses.length === 0) {
      this.error.set('Choose Imported, Rejected, or both before previewing cleanup.');
      return;
    }

    this.loadingCleanup.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.previewCleanup(request).subscribe({
      next: result => {
        this.cleanupPreview.set(result);
        this.message.set(`Cleanup preview found ${result.matchedCount} row${result.matchedCount === 1 ? '' : 's'} older than ${request.olderThanDays} day${request.olderThanDays === 1 ? '' : 's'}.`);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to preview staging cleanup.'),
      complete: () => this.loadingCleanup.set(false)
    });
  }

  runCleanup(): void {
    const request = this.cleanupRequest();
    const preview = this.cleanupPreview();
    const count = preview?.matchedCount ?? 0;
    if (count === 0) {
      this.error.set('Preview cleanup before deleting staged rows.');
      return;
    }

    if (!window.confirm(`Delete ${count} staged row${count === 1 ? '' : 's'} from the barcode queue?`)) {
      return;
    }

    this.loadingCleanup.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.cleanup(request).subscribe({
      next: result => {
        this.cleanupPreview.set(result);
        this.message.set(`Deleted ${result.deletedCount} staged row${result.deletedCount === 1 ? '' : 's'} from the barcode queue.`);
        this.selectedIds.set(new Set());
        this.selectedItem.set(null);
        this.lookupCandidates.set([]);
        this.loadItems();
        this.loadBatchReports();
        this.loadImportHistory();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to clean up staged rows.'),
      complete: () => this.loadingCleanup.set(false)
    });
  }

  previewReportBatch(report: BarcodeBatchReport): void {
    this.batchFilter.set(report.batchName);
    this.sourceFilter.set(report.source);
    this.statusFilter.set('');
    this.loadItems();
    this.runImportPreview({ ids: [], batchName: report.batchName });
  }

  showImportedReportBatch(report: BarcodeBatchReport): void {
    this.batchFilter.set(report.batchName);
    this.sourceFilter.set(report.source);
    this.statusFilter.set('Imported');
    this.typeFilter.set('');
    this.loadItems();
  }

  reportTypeSummary(report: BarcodeBatchReport): string {
    const parts = [
      report.bookCount ? `${report.bookCount} Book` : null,
      report.cdCount ? `${report.cdCount} CD` : null,
      report.dvdCount ? `${report.dvdCount} DVD` : null,
      report.otherTypeCount ? `${report.otherTypeCount} Other` : null
    ].filter(Boolean);

    return parts.length ? parts.join(' / ') : '-';
  }

  reportImportedSummary(report: BarcodeBatchReport): string {
    const parts = [
      report.importedBookCount ? `${report.importedBookCount} Book` : null,
      report.importedCdCount ? `${report.importedCdCount} CD` : null,
      report.importedDvdCount ? `${report.importedDvdCount} DVD` : null,
      report.importedOtherTypeCount ? `${report.importedOtherTypeCount} Other` : null
    ].filter(Boolean);

    return parts.length ? parts.join(' / ') : '-';
  }

  reportProviderMatchSummary(report: BarcodeBatchReport): string {
    return report.providerMatchSummary?.trim() || '-';
  }

  reportSelectedProviderSummary(report: BarcodeBatchReport): string {
    return report.selectedProviderSummary?.trim() || '-';
  }

  reportProviderFailureSummary(report: BarcodeBatchReport): string {
    return report.providerFailureSummary?.trim() || '-';
  }

  providerSummaryParts(summary?: string | null): string[] {
    return (summary ?? '')
      .split(/[;,|]/)
      .map(part => part.trim())
      .filter(Boolean);
  }

  reportRetryRecommendation(report: BarcodeBatchReport): string {
    if (report.providerFailureSummary?.trim()) {
      return 'Fallback retry recommended';
    }

    if (report.noCandidateCount > 0) {
      return 'Missing-only retry available';
    }

    if (report.lowConfidenceCount > 0) {
      return 'Review low confidence';
    }

    return 'No retry needed';
  }

  reportHealthLabel(report: BarcodeBatchReport): string {
    if (report.providerFailureSummary?.trim()) {
      return 'Provider failures';
    }

    if (report.noCandidateCount > 0) {
      return 'Missing candidates';
    }

    if (report.lowConfidenceCount > 0) {
      return 'Low confidence';
    }

    if (report.duplicateCodeCount > 0) {
      return 'Duplicate review';
    }

    return 'Healthy';
  }

  reportHealthTone(report: BarcodeBatchReport): string {
    const label = this.reportHealthLabel(report);
    if (label === 'Healthy') {
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
    }

    if (label === 'Provider failures') {
      return 'bg-rose-50 text-rose-800 ring-rose-200';
    }

    if (label === 'Low confidence') {
      return 'bg-orange-50 text-orange-800 ring-orange-200';
    }

    return 'bg-amber-50 text-amber-800 ring-amber-200';
  }

  reportLookupSummary(report: BarcodeBatchReport): string {
    const parts = [
      `${report.candidateCount} candidate${report.candidateCount === 1 ? '' : 's'}`,
      report.selectedCandidateCount ? `${report.selectedCandidateCount} selected` : null,
      report.noCandidateCount ? `${report.noCandidateCount} no match` : null,
      report.lowConfidenceCount ? `${report.lowConfidenceCount} low confidence` : null
    ].filter(Boolean);

    return parts.join(' / ');
  }

  commitSelectedImport(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) {
      this.error.set('Select at least one staged item to import.');
      return;
    }

    if (!window.confirm(`Import ${ids.length} selected staged row${ids.length === 1 ? '' : 's'} into inventory?`)) {
      return;
    }

    this.runImportCommit({ ids, batchName: null });
  }

  commitCurrentBatchImport(): void {
    const batchName = this.batchFilter();
    if (!batchName) {
      this.error.set('Choose a batch filter before importing a whole batch.');
      return;
    }

    if (!window.confirm(`Import ready rows from batch "${batchName}" into inventory?`)) {
      return;
    }

    this.runImportCommit({ ids: [], batchName });
  }

  commitPreviewReadyRows(): void {
    const rows = this.readyImportRows();
    if (rows.length === 0) {
      this.error.set('No previewed rows are ready to import.');
      return;
    }

    if (!window.confirm(`Import ${rows.length} previewed ready row${rows.length === 1 ? '' : 's'} and leave blocked rows staged?`)) {
      return;
    }

    this.runImportCommit({ ids: rows.map(row => row.item.id), batchName: null });
  }

  selectValidationRow(row: BarcodeImportValidationRow): void {
    this.selectItem(row.item);
    this.message.set(`Selected ${row.item.normalizedCode} for review.`);
  }

  validationGroupSummary(group: ImportValidationGroup): string {
    const typeParts = ['Book', 'CD', 'DVD', 'Other', 'Unknown']
      .map(type => {
        const count = group.rows.filter(row => row.item.itemType === type).length;
        return count ? `${count} ${type}` : null;
      })
      .filter(Boolean);

    return typeParts.length ? typeParts.join(' / ') : `${group.rows.length} row${group.rows.length === 1 ? '' : 's'}`;
  }

  validationMessages(row: BarcodeImportValidationRow): ValidationMessageView[] {
    return row.messages.map(message => ({
      label: this.validationMessageLabel(message, row.severity),
      message,
      tone: this.validationMessageTone(message, row.severity)
    }));
  }

  duplicateValidationMessages(row: BarcodeImportValidationRow): ValidationMessageView[] {
    return this.validationMessages(row).filter(message => this.isDuplicateDetailMessage(message.message));
  }

  validationMessageSummary(row: BarcodeImportValidationRow): string {
    return this.validationMessages(row)
      .map(message => `${message.label}: ${message.message}`)
      .join(' ') || 'Ready to import.';
  }

  duplicateDetailSummary(row: BarcodeImportValidationRow): string {
    return this.duplicateValidationMessages(row)
      .map(message => `${message.label}: ${message.message}`)
      .join(' ') || 'No duplicate details.';
  }

  private isDuplicateDetailMessage(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('already exists')
      || normalized.includes('already appears')
      || normalized.includes('possible duplicate')
      || normalized.includes('similar')
      || normalized.includes('staging duplicate normalized code')
      || normalized.includes('normalized book title/author match')
      || normalized.includes('normalized cd title/artist match')
      || normalized.includes('normalized dvd title/format match')
      || normalized.includes('normalized dvd/movie similar-title review')
      || normalized.includes('normalized book similar-title review')
      || normalized.includes('normalized cd similar-title review')
      || normalized.includes('barcode blocker')
      || normalized.includes('isbn/barcode duplicate checks are limited')
      || normalized.includes('isbn/barcode storage limitation')
      || normalized.includes('not currently store isbn/barcode');
  }

  private validationMessageLabel(message: string, rowSeverity: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes('barcode blocker')
      || normalized.includes('already exists in movieinventoryitems')
      || normalized.includes('already appears on an imported cd')) {
      return 'Blocker';
    }

    if (normalized.includes('possible duplicate')
      || normalized.includes('similar')
      || normalized.includes('staging duplicate normalized code')
      || normalized.includes('normalized book title/author match')
      || normalized.includes('normalized cd title/artist match')
      || normalized.includes('normalized dvd title/format match')) {
      return 'Duplicate review';
    }

    if (normalized.includes('limited')
      || normalized.includes('storage limitation')
      || normalized.includes('not currently store')) {
      return 'Info';
    }

    return rowSeverity === 'Blocked' ? 'Blocker' : 'Review';
  }

  private validationMessageTone(message: string, rowSeverity: string): string {
    const label = this.validationMessageLabel(message, rowSeverity);
    switch (label) {
      case 'Blocker':
        return 'bg-rose-100 text-rose-800 ring-rose-200';
      case 'Duplicate review':
        return 'bg-amber-100 text-amber-900 ring-amber-200';
      case 'Info':
        return 'app-token-bg-accent app-token-text-strong app-token-ring';
      default:
        return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  }

  downloadImportPreviewCsv(): void {
    const preview = this.importPreview();
    if (!preview) {
      return;
    }

    const rows = preview.rows.map(row => [
      row.severity,
      row.canImport ? 'Yes' : 'No',
      row.item.normalizedCode,
      row.item.codeType,
      row.item.itemType,
      row.item.status,
      row.item.suggestedTitle ?? '',
      row.item.suggestedCreator ?? '',
      row.item.suggestedFormat ?? '',
      this.validationMessageSummary(row)
    ]);

    this.downloadCsv('barcode-import-preview.csv', [
      ['Severity', 'Can Import', 'Code', 'Code Type', 'Item Type', 'Status', 'Title', 'Creator', 'Format', 'Messages'],
      ...rows
    ]);
  }

  downloadImportResultCsv(): void {
    const result = this.importCommitResult();
    if (!result) {
      return;
    }

    this.downloadCsv('barcode-import-result.csv', [
      ['Requested', 'Imported', 'Skipped'],
      [result.requestedCount, result.importedCount, result.skippedCount],
      [],
      ['Message'],
      ...result.messages.map(message => [message])
    ]);
  }

  lookupSelectedAuto(): void {
    this.runCandidateLookup('Auto', item => this.service.lookupAuto(item.id));
  }

  lookupSelectedIsbn(): void {
    this.runCandidateLookup('Open Library', item => this.service.lookupOpenLibrary(item.id));
  }

  lookupSelectedGoogleBooks(): void {
    this.runCandidateLookup('Google Books', item => this.service.lookupGoogleBooks(item.id));
  }

  lookupSelectedCrossref(): void {
    this.runCandidateLookup('Crossref', item => this.service.lookupCrossref(item.id));
  }

  lookupSelectedMusicBrainz(): void {
    this.runCandidateLookup('MusicBrainz', item => this.service.lookupMusicBrainz(item.id));
  }

  lookupSelectedUpcItemDb(): void {
    this.runCandidateLookup('UPCitemdb', item => this.service.lookupUpcItemDb(item.id));
  }

  lookupSelectedOpenFoodFacts(): void {
    this.runCandidateLookup('Open Food Facts', item => this.service.lookupOpenFoodFacts(item.id));
  }
  lookupSelectedDiscogs(): void {
    this.runCandidateLookup('Discogs', item => this.service.lookupDiscogs(item.id));
  }

  lookupSelectedWikidata(): void {
    this.runCandidateLookup('Wikidata', item => this.service.lookupWikidata(item.id));
  }

  runBatchLookup(retryMissingOnly = false, fallbackProvidersOnly = false): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) {
      this.error.set('Select at least one staged item to lookup.');
      return;
    }

    this.runBatchLookupRequest({
      ids,
      provider: fallbackProvidersOnly ? 'Auto' : this.batchProvider(),
      retryMissingOnly,
      fallbackProvidersOnly
    }, 'selected rows');
  }

  retryReportMissing(report: BarcodeBatchReport): void {
    this.runBatchLookupRequest({
      ids: [],
      batchName: report.batchName,
      source: report.source,
      provider: 'Auto',
      retryMissingOnly: true
    }, `batch ${report.batchName}`);
  }

  retryReportFallback(report: BarcodeBatchReport): void {
    this.runBatchLookupRequest({
      ids: [],
      batchName: report.batchName,
      source: report.source,
      provider: 'Auto',
      retryMissingOnly: true,
      fallbackProvidersOnly: true
    }, `batch ${report.batchName}`);
  }

  private runBatchLookupRequest(request: BarcodeStagingBatchLookupRequest, targetLabel: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.batchLookup(request).subscribe({
      next: result => {
        const retryLabel = request.fallbackProvidersOnly
          ? 'Fallback retry'
          : request.retryMissingOnly
            ? 'Missing-only retry'
            : 'Lookup';
        this.message.set(`${retryLabel} attempted ${result.lookupAttemptedCount} lookup${result.lookupAttemptedCount === 1 ? '' : 's'} for ${targetLabel}: ${result.matchedCount} matched, ${result.needsReviewCount} need review.`);
        this.loadItems();
        if (this.batchReports().length > 0) {
          this.loadBatchReports();
        }
        const item = this.selectedItem();
        if (item) {
          this.refreshSelectedItem(item.id);
          this.loadCandidates(item.id);
        }
      },
      error: err => this.error.set(err.error?.detail ?? err.error ?? err.message ?? 'Batch lookup failed.'),
      complete: () => this.loading.set(false)
    });
  }
  applyBatchUpdate(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) {
      this.error.set('Select at least one staged item to update.');
      return;
    }

    if (!this.batchItemType() && !this.batchStatus() && !this.batchNotes().trim()) {
      this.error.set('Choose a type/status or enter a note before applying a batch update.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.batchUpdate({
      ids,
      itemType: this.batchItemType() || null,
      status: this.batchStatus() || null,
      notes: this.batchNotes().trim() || null
    }).subscribe({
      next: result => {
        this.message.set(result.messages[0] ?? `Updated ${result.updatedCount} staged items.`);
        this.batchNotes.set('');
        this.loadItems();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Batch update failed.'),
      complete: () => this.loading.set(false)
    });
  }

  quickSetSelectedStatus(status: BarcodeStageStatus): void {
    this.batchStatus.set(status);
    this.applyBatchUpdate();
  }

  private runCandidateLookup(
    providerLabel: string,
    lookup: (item: BarcodeStagingItem) => ReturnType<BarcodeStagingService['lookupOpenLibrary']>
  ): void {
    const item = this.selectedItem();

    if (!item) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    lookup(item).subscribe({
      next: candidates => {
        this.lookupCandidates.set(candidates);
        this.message.set(candidates.length === 0 ? `No ${providerLabel} match was found.` : `${providerLabel} lookup completed.`);
        this.refreshSelectedItem(item.id);
      },
      error: err => this.error.set(err.error?.detail ?? err.message ?? `${providerLabel} lookup failed.`),
      complete: () => this.loading.set(false)
    });
  }

  selectCandidate(candidate: BarcodeLookupCandidate): void {
    const item = this.selectedItem();

    if (!item) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.selectCandidate(item.id, candidate.id).subscribe({
      next: updatedItem => {
        this.selectedItem.set(updatedItem);
        this.message.set('Lookup candidate applied.');
        this.loadCandidates(item.id);
        this.loadItems();
      },
      error: err => this.error.set(err.message ?? 'Failed to apply lookup candidate.'),
      complete: () => this.loading.set(false)
    });
  }


  applyCandidateField(candidate: BarcodeLookupCandidate, field: 'title' | 'creator' | 'year' | 'format' | 'provider'): void {
    const item = this.selectedItem();
    if (!item) {
      return;
    }

    const updated = { ...item };
    switch (field) {
      case 'title':
        if (!candidate.title?.trim()) {
          return;
        }
        updated.suggestedTitle = candidate.title;
        break;
      case 'creator':
        if (!candidate.creator?.trim()) {
          return;
        }
        updated.suggestedCreator = candidate.creator;
        break;
      case 'year':
        if (!candidate.publishDate?.trim()) {
          return;
        }
        updated.suggestedYear = candidate.publishDate;
        break;
      case 'format':
        if (!candidate.format?.trim()) {
          return;
        }
        updated.suggestedFormat = candidate.format;
        break;
      case 'provider':
        updated.lookupProvider = candidate.provider;
        updated.confidence = candidate.confidence ?? updated.confidence;
        break;
    }

    this.persistMergedCandidateFields(updated, `${this.candidateFieldLabel(field)} applied from ${candidate.provider}.`);
  }

  fillBlankFieldsFromCandidate(candidate: BarcodeLookupCandidate): void {
    const item = this.selectedItem();
    if (!item) {
      return;
    }

    const updated = { ...item };
    let changed = false;

    if (!updated.suggestedTitle?.trim() && candidate.title?.trim()) {
      updated.suggestedTitle = candidate.title;
      changed = true;
    }

    if (!updated.suggestedCreator?.trim() && candidate.creator?.trim()) {
      updated.suggestedCreator = candidate.creator;
      changed = true;
    }

    if (!updated.suggestedYear?.trim() && candidate.publishDate?.trim()) {
      updated.suggestedYear = candidate.publishDate;
      changed = true;
    }

    if (!updated.suggestedFormat?.trim() && candidate.format?.trim()) {
      updated.suggestedFormat = candidate.format;
      changed = true;
    }

    if (!updated.lookupProvider?.trim()) {
      updated.lookupProvider = candidate.provider;
      updated.confidence = candidate.confidence ?? updated.confidence;
      changed = true;
    }

    if (!changed) {
      this.message.set(`No blank fields to fill from ${candidate.provider}.`);
      return;
    }

    this.persistMergedCandidateFields(updated, `Blank fields filled from ${candidate.provider}.`);
  }
  candidateRankLabel(row: CandidateComparisonRow, index: number): string {
    if (row.candidate.selected) {
      return 'Selected';
    }

    return index === 0 ? 'Best fit' : `Option ${index + 1}`;
  }

  candidateRankTone(row: CandidateComparisonRow, index: number): string {
    if (row.candidate.selected) {
      return 'app-token-soft-surface app-token-text-strong';
    }

    if (index === 0) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }

    return 'border-slate-200 bg-white text-slate-700';
  }

  candidateConfidenceLabel(candidate: BarcodeLookupCandidate): string {
    return candidate.confidence === null || candidate.confidence === undefined ? '-' : `${candidate.confidence}%`;
  }

  candidateExternalLabel(candidate: BarcodeLookupCandidate): string {
    return candidate.externalId?.trim() || '-';
  }

  candidateComparisonSummary(row: CandidateComparisonRow): string {
    const parts = [
      `${row.agreementCount} matching`,
      `${row.issueCount} flag${row.issueCount === 1 ? '' : 's'}`,
      `${row.completeness}/7 fields`
    ];

    return parts.join(' | ');
  }

  candidateQualityTone(value: number): string {
    if (value >= 80) {
      return 'bg-emerald-50 text-emerald-800';
    }

    if (value >= 50) {
      return 'bg-amber-50 text-amber-800';
    }

    return 'bg-rose-50 text-rose-800';
  }

  fieldCheck(value: boolean): string {
    return value ? 'Yes' : 'No';
  }

  candidateMissingFields(row: CandidateComparisonRow): string {
    const missing = [
      row.hasTitle ? null : 'title',
      row.hasCreator ? null : 'creator',
      row.hasPublisher ? null : 'publisher',
      row.hasDate ? null : 'date',
      row.hasFormat ? null : 'format',
      row.hasExternalId ? null : 'external id',
      row.hasCover ? null : 'cover'
    ].filter(Boolean);

    return missing.length ? `Missing ${missing.join(', ')}` : 'Complete candidate';
  }

  providerHealthTone(summary: ProviderHealthSummary): string {
    if (summary.selected || summary.bestQuality >= 80) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }

    if (summary.bestQuality >= 50) {
      return 'border-amber-200 bg-amber-50 text-amber-800';
    }

    return 'border-rose-200 bg-rose-50 text-rose-800';
  }

  candidateIssueSummary(row: CandidateComparisonRow): string {
    if (row.issueCount === 0) {
      return `${row.agreementCount} matching field${row.agreementCount === 1 ? '' : 's'}`;
    }

    return `${row.issueCount} review flag${row.issueCount === 1 ? '' : 's'}; ${row.agreementCount} match${row.agreementCount === 1 ? '' : 'es'}`;
  }

  candidateFieldState(candidateValue?: string | null, currentValue?: string | null): string {
    const candidate = this.normalizedCandidateText(candidateValue);
    const current = this.normalizedCandidateText(currentValue);
    if (!candidate) {
      return 'Missing';
    }

    if (!current) {
      return 'Adds value';
    }

    return candidate === current ? 'Matches current' : 'Differs current';
  }

  candidateFieldStateTone(candidateValue?: string | null, currentValue?: string | null): string {
    const state = this.candidateFieldState(candidateValue, currentValue);
    if (state === 'Matches current') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (state === 'Differs current') {
      return 'border-amber-200 bg-amber-50 text-amber-800';
    }

    if (state === 'Adds value') {
      return 'app-token-soft-surface app-token-text-strong';
    }

    return 'border-slate-200 bg-slate-50 text-slate-500';
  }
  candidateValueTone(candidateValue?: string | null, currentValue?: string | null): string {
    const candidate = candidateValue?.trim();
    const current = currentValue?.trim();
    if (!candidate) {
      return 'text-slate-400';
    }

    return current && candidate.localeCompare(current, undefined, { sensitivity: 'accent' }) === 0
      ? 'font-semibold text-emerald-700'
      : 'text-slate-700';
  }

  typePanelTitle(itemType: string): string {
    switch (itemType) {
      case 'Book':
        return 'Book Review Fields';
      case 'CD':
        return 'CD Review Fields';
      case 'DVD':
        return 'DVD Review Fields';
      default:
        return 'General Review Fields';
    }
  }

  importDestinationName(itemType: string): string {
    switch (itemType) {
      case 'Book':
        return 'Books';
      case 'CD':
        return 'Music albums';
      case 'DVD':
        return 'Movie inventory';
      case 'Other':
        return 'Not implemented';
      default:
        return 'Needs type';
    }
  }

  importRequiredFields(itemType: string): string[] {
    switch (itemType) {
      case 'Book':
        return ['Title', 'Author', 'Format'];
      case 'CD':
        return ['Album title', 'Band / artist', 'Music format'];
      case 'DVD':
        return ['Film title', 'Video format'];
      default:
        return ['Supported item type', 'Title', 'Format'];
    }
  }

  importCommitFields(itemType: string): string[] {
    switch (itemType) {
      case 'Book':
        return ['Books.Title', 'BookAuthors.First/Middle/Last', 'BookStatuses.WantStatusID = H', 'BookStatuses.Format'];
      case 'CD':
        return ['MusicAlbums.Title', 'MusicArtists.Band', 'MusicAlbumInfo.Format', 'MusicAlbumInfo.ReleaseDate', 'MusicAlbumInfo.InfoText', 'MusicAlbumStatus.FormatID', 'MusicAlbumStatus.WantStatusID = H'];
      case 'DVD':
        return ['MovieInventoryItems.Title', 'Creator', 'Format', 'ReleaseYear', 'Barcode', 'Source', 'Notes', 'WantStatusID = H', 'CreatedAtUtc'];
      default:
        return ['No inventory destination until type is Book, CD, or DVD'];
    }
  }

  importDestinationFields(itemType: string): string[] {
    switch (itemType) {
      case 'Book':
        return ['Title', 'Author', 'Format', 'Owned status'];
      case 'CD':
        return ['Album title', 'Band / artist', 'Music format', 'Release year', 'Owned status'];
      case 'DVD':
        return ['Film title', 'Creator / studio', 'Video format', 'Release year', 'Owned status', 'Barcode', 'Source'];
      default:
        return ['Supported item type', 'Title', 'Format'];
    }
  }

  importTraceFields(itemType: string): string[] {
    switch (itemType) {
      case 'Book':
        return ['Barcode remains in staging', 'ImportedEntityType/Id', 'ImportedAtUtc', 'Notes append'];
      case 'CD':
        return ['Barcode/source in InfoText', 'ImportedEntityType/Id', 'ImportedAtUtc', 'Notes append'];
      case 'DVD':
        return ['Barcode on movie item', 'Source from provider', 'ImportedEntityType/Id', 'ImportedAtUtc'];
      default:
        return ['Staging row only until supported type is selected'];
    }
  }

  importTraceBehavior(itemType: string): string[] {
    switch (itemType) {
      case 'Book':
        return [
          'The Book row is linked back through BarcodeStagingItems.ImportedEntityType/ImportedEntityId.',
          'ISBN/barcode stays on the staging row because Books has no barcode field yet.',
          'Commit appends an import note with the created Book id.'
        ];
      case 'CD':
        return [
          'The MusicAlbum row is linked back through BarcodeStagingItems.ImportedEntityType/ImportedEntityId.',
          'Barcode, provider, and published year are copied into MusicAlbumInfo.InfoText.',
          'Commit appends an import note with the created MusicAlbum id.'
        ];
      case 'DVD':
        return [
          'The MovieInventoryItem stores Barcode and provider Source directly.',
          'Lookup and original staging notes are copied into MovieInventoryItem.Notes.',
          'The staging row records ImportedEntityType/ImportedEntityId and ImportedAtUtc.'
        ];
      default:
        return [
          'Rows remain staged until the item type is Book, CD, or DVD.',
          'No inventory entity is created for unsupported types.'
        ];
    }
  }

  importPanelChecklist(itemType: string, rows: BarcodeImportValidationRow[]): CommitChecklistItem[] {
    const supported = this.isSupportedCommitType(itemType);
    const missingRequiredCount = rows.filter(row => this.missingRequiredFields(row.item).length > 0).length;
    const duplicateReviewCount = rows.filter(row => this.duplicateValidationMessages(row).length > 0).length;
    const lowConfidenceCount = rows.filter(row => row.item.confidence !== null && row.item.confidence !== undefined && Number(row.item.confidence) < 50).length;
    const providerMissingCount = rows.filter(row => !row.item.lookupProvider?.trim()).length;

    if (!supported) {
      return [
        this.commitChecklistItem('Destination type', 'Needs Book, CD, or DVD', 'Missing'),
        this.commitChecklistItem('Inventory writes', 'No commit target yet', 'Missing'),
        this.commitChecklistItem('Rows in review', `${rows.length} staged`, 'Review')
      ];
    }

    return [
      this.commitChecklistItem('Required fields', missingRequiredCount ? `${missingRequiredCount} need attention` : 'Complete for this type', missingRequiredCount ? 'Missing' : 'Ready'),
      this.commitChecklistItem('Ready rows', `${rows.filter(row => row.canImport).length} can import`, rows.some(row => row.canImport) ? 'Ready' : 'Missing'),
      this.commitChecklistItem('Duplicate review', duplicateReviewCount ? `${duplicateReviewCount} with duplicate notes` : 'No duplicate notes', duplicateReviewCount ? 'Review' : 'Ready'),
      this.commitChecklistItem('Lookup trace', providerMissingCount ? `${providerMissingCount} missing provider` : 'Provider recorded', providerMissingCount ? 'Review' : 'Ready'),
      this.commitChecklistItem('Confidence', lowConfidenceCount ? `${lowConfidenceCount} below 50%` : 'No low-confidence rows', lowConfidenceCount ? 'Review' : 'Ready')
    ];
  }

  selectedCommitPanelFields(item: BarcodeStagingItem): SelectedCommitPanelField[] {
    const ownedStatus = 'Owned (H)';
    const provider = item.lookupProvider?.trim()
      ? `${item.lookupProvider}${item.confidence === null || item.confidence === undefined ? '' : ` / ${item.confidence}%`}`
      : '-';

    switch (item.itemType) {
      case 'Book':
        return [
          this.commitPanelField('Title', item.suggestedTitle, 'Creates the inventory title.', 'Destination', 'Books.Title'),
          this.commitPanelField('Author', item.suggestedCreator, 'Resolves or creates an author, splitting first/middle/last name.', 'Destination', 'BookAuthors.*'),
          this.commitPanelField('Format', item.suggestedFormat, 'Resolves or creates a book format and writes the status format.', 'Destination', 'BookStatuses.Format'),
          this.commitPanelField('Owned / wanted', ownedStatus, 'Imports the book as owned.', 'Destination', 'BookStatuses.WantStatusID'),
          this.commitPanelField('Import link', 'Book / created id / timestamp', 'Staging row records the imported entity type, id, and import time.', 'Audit', 'BarcodeStagingItems.ImportedEntityType/Id/ImportedAtUtc'),
          this.commitPanelField('Commit note', 'Imported as Book #...', 'Commit appends the created entity reference to staging notes.', 'Audit', 'BarcodeStagingItems.Notes'),
          this.commitPanelField('ISBN / barcode', item.normalizedCode, 'Books does not currently store ISBN/barcode, so this stays in staging history only.', 'NotMapped', 'Books barcode field'),
          this.commitPanelField('Lookup source', provider, 'Provider and confidence remain on the staged row rather than Book tables.', 'NotMapped', 'Books lookup trace fields'),
          this.commitPanelField('Publisher', null, 'Candidate data only; not mapped to Book tables yet.', 'NotMapped', 'Book publisher field')
        ];
      case 'CD':
        return [
          this.commitPanelField('Album title', item.suggestedTitle, 'Creates the music album title.', 'Destination', 'MusicAlbums.Title'),
          this.commitPanelField('Band / artist', item.suggestedCreator, 'Resolves or creates the music artist.', 'Destination', 'MusicArtists.Band'),
          this.commitPanelField('Format', item.suggestedFormat, 'Writes album info format and status format id.', 'Destination', 'MusicAlbumInfo.Format / MusicAlbumStatus.FormatID'),
          this.commitPanelField('Release date', item.suggestedYear, 'Parsed into a release date when possible.', 'Destination', 'MusicAlbumInfo.ReleaseDate'),
          this.commitPanelField('Owned / wanted', ownedStatus, 'Imports the album as owned.', 'Destination', 'MusicAlbumStatus.WantStatusID'),
          this.commitPanelField('UPC / EAN', item.normalizedCode, 'Stored with lookup trace text.', 'Audit', 'MusicAlbumInfo.InfoText'),
          this.commitPanelField('Lookup source', provider, 'Stored with barcode/source notes in album info text.', 'Audit', 'MusicAlbumInfo.InfoText'),
          this.commitPanelField('Import link', 'MusicAlbum / created id / timestamp', 'Staging row records the imported entity type, id, and import time.', 'Audit', 'BarcodeStagingItems.ImportedEntityType/Id/ImportedAtUtc'),
          this.commitPanelField('External id / cover', null, 'Candidate metadata only; not written to MusicAlbum during commit.', 'NotMapped', 'Music external metadata fields')
        ];
      case 'DVD':
        return [
          this.commitPanelField('Film title', item.suggestedTitle, 'Creates the movie inventory title.', 'Destination', 'MovieInventoryItems.Title'),
          this.commitPanelField('Creator / studio', item.suggestedCreator, 'Creates the movie creator/studio value.', 'Destination', 'MovieInventoryItems.Creator'),
          this.commitPanelField('Format', item.suggestedFormat, 'Creates the movie format.', 'Destination', 'MovieInventoryItems.Format'),
          this.commitPanelField('Release year', item.suggestedYear, 'Creates the movie release year.', 'Destination', 'MovieInventoryItems.ReleaseYear'),
          this.commitPanelField('UPC / EAN', item.normalizedCode, 'Creates the movie barcode.', 'Destination', 'MovieInventoryItems.Barcode'),
          this.commitPanelField('Owned / wanted', ownedStatus, 'Imports the movie item as owned.', 'Destination', 'MovieInventoryItems.WantStatusID'),
          this.commitPanelField('Lookup source', provider, 'Creates the movie source/provider value.', 'Destination', 'MovieInventoryItems.Source'),
          this.commitPanelField('Original staging notes', item.notes, 'Copied into movie notes with barcode/source lookup trace.', 'Audit', 'MovieInventoryItems.Notes'),
          this.commitPanelField('Import link', 'MovieInventoryItem / created id / timestamp', 'Staging row records the imported entity type, id, and import time.', 'Audit', 'BarcodeStagingItems.ImportedEntityType/Id/ImportedAtUtc'),
          this.commitPanelField('External candidates', null, 'Candidate ids, cover links, and confidence are not separate movie fields yet.', 'NotMapped', 'Movie lookup metadata fields')
        ];
      default:
        return [
          this.commitPanelField('Barcode', item.normalizedCode, 'Stays in staging until a supported type is selected.', 'Review', 'BarcodeStagingItems.NormalizedCode'),
          this.commitPanelField('Supported type', this.isSupportedCommitType(item.itemType) ? item.itemType : null, 'Choose Book, CD, or DVD to commit.', 'Review', 'BarcodeStagingItems.ItemType'),
          this.commitPanelField('Title', item.suggestedTitle, 'Useful for later review.', 'Review', 'BarcodeStagingItems.SuggestedTitle'),
          this.commitPanelField('Format', item.suggestedFormat, 'Useful for later review.', 'Review', 'BarcodeStagingItems.SuggestedFormat'),
          this.commitPanelField('Lookup source', provider, 'Stored on the staged row.', 'Review', 'BarcodeStagingItems.LookupProvider/Confidence')
        ];
    }
  }

  selectedCommitPanelGroups(item: BarcodeStagingItem): SelectedCommitPanelGroup[] {
    const fields = this.selectedCommitPanelFields(item);
    const groups: Array<Omit<SelectedCommitPanelGroup, 'fields'>> = [
      {
        label: 'Will write',
        description: `Fields that will be written to ${this.importDestinationName(item.itemType)} or its related tables.`,
        tone: 'border-emerald-200 bg-emerald-50'
      },
      {
        label: 'Audit / trace',
        description: 'Fields preserved as lookup trace, notes, or staging import history.',
        tone: 'app-token-soft-surface'
      },
      {
        label: 'Not mapped yet',
        description: 'Useful candidate data that is not currently written during import.',
        tone: 'border-slate-200 bg-slate-50'
      },
      {
        label: 'Review only',
        description: 'Fields kept on the staged row until a supported destination type is selected.',
        tone: 'border-amber-200 bg-amber-50'
      }
    ];

    return groups
      .map(group => ({
        ...group,
        fields: fields.filter(field => this.commitPanelGroupLabel(field.category) === group.label)
      }))
      .filter(group => group.fields.length > 0);
  }

  selectedCommitChecklist(item: BarcodeStagingItem): CommitChecklistItem[] {
    if (!this.isSupportedCommitType(item.itemType)) {
      return [
        this.commitChecklistItem('Destination type', 'Choose Book, CD, or DVD', 'Missing'),
        this.commitChecklistItem('Title', item.suggestedTitle?.trim() || 'Missing', item.suggestedTitle?.trim() ? 'Ready' : 'Missing'),
        this.commitChecklistItem('Lookup trace', item.lookupProvider?.trim() || 'No provider recorded', item.lookupProvider?.trim() ? 'Ready' : 'Review')
      ];
    }

    return [
      this.commitChecklistItem('Required fields', this.requiredFieldSummary(item), this.missingRequiredFields(item).length === 0 ? 'Ready' : 'Missing'),
      this.commitChecklistItem('Format behavior', this.formatCommitSummary(item), this.formatCommitStatus(item)),
      this.commitChecklistItem('Owned status', 'Will import as owned (H)', 'Ready'),
      this.commitChecklistItem('Lookup trace', item.lookupProvider?.trim() ? `${item.lookupProvider}${item.confidence === null || item.confidence === undefined ? '' : ` / ${item.confidence}%`}` : 'No provider recorded', item.lookupProvider?.trim() ? 'Ready' : 'Review'),
      this.commitChecklistItem('Duplicate review', this.selectedDuplicateDetails().length ? `${this.selectedDuplicateDetails().length} warning${this.selectedDuplicateDetails().length === 1 ? '' : 's'} from preview` : 'No duplicate preview warnings', this.selectedDuplicateDetails().length ? 'Review' : 'Ready')
    ];
  }

  commitPanelStatus(item: BarcodeStagingItem): string {
    if (!this.isSupportedCommitType(item.itemType)) {
      return 'Review only - choose Book, CD, or DVD before commit.';
    }

    const missing = this.missingRequiredFields(item);

    return missing.length
      ? `Needs ${missing.join(', ')} before import.`
      : `Ready to create ${this.importDestinationName(item.itemType)} as owned.`;
  }

  private commitChecklistItem(label: string, value: string, status: CommitChecklistItem['status']): CommitChecklistItem {
    return {
      label,
      value,
      status,
      tone: status === 'Ready'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : status === 'Missing'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-amber-200 bg-amber-50 text-amber-900'
    };
  }

  private missingRequiredFields(item: BarcodeStagingItem): string[] {
    return this.selectedCommitPanelFields(item)
      .filter(field => field.category === 'Destination' && field.value === '-')
      .map(field => field.label);
  }

  private requiredFieldSummary(item: BarcodeStagingItem): string {
    const missing = this.missingRequiredFields(item);
    return missing.length ? `Missing ${missing.join(', ')}` : 'All required destination fields present';
  }

  private formatCommitSummary(item: BarcodeStagingItem): string {
    const format = item.suggestedFormat?.trim();
    if (!format) {
      return item.itemType === 'Book'
        ? 'Blank; defaults to Hardcover'
        : item.itemType === 'CD'
          ? 'Blank; defaults to CD'
          : 'Blank; defaults to DVD';
    }

    if (item.itemType === 'Book') {
      return this.isKnownBookFormat(format) ? `Uses ${format}` : `${format} is non-standard`;
    }

    if (item.itemType === 'CD') {
      return this.isKnownMusicFormat(format) ? `Uses ${format}` : `${format} will normalize to CD`;
    }

    if (item.itemType === 'DVD') {
      return this.isKnownMovieFormat(format) ? `Uses ${format}` : `${format} will normalize to DVD`;
    }

    return format;
  }

  private formatCommitStatus(item: BarcodeStagingItem): CommitChecklistItem['status'] {
    const format = item.suggestedFormat?.trim();
    if (!format) {
      return 'Review';
    }

    if (item.itemType === 'Book') {
      return this.isKnownBookFormat(format) ? 'Ready' : 'Review';
    }

    if (item.itemType === 'CD') {
      return this.isKnownMusicFormat(format) ? 'Ready' : 'Review';
    }

    if (item.itemType === 'DVD') {
      return this.isKnownMovieFormat(format) ? 'Ready' : 'Review';
    }

    return 'Review';
  }

  commitWarnings(item: BarcodeStagingItem): string[] {
    const warnings: string[] = [];
    const format = item.suggestedFormat?.trim() ?? '';

    if (item.itemType === 'Book') {
      if (!item.suggestedCreator?.trim()) {
        warnings.push('Book has no author; import will create/use an Unknown author.');
      }

      if (!format) {
        warnings.push('Book format is blank; import will default to Hardcover.');
      } else if (!this.isKnownBookFormat(format)) {
        warnings.push(`Book format "${format}" is not one of the standard formats.`);
      }
    } else if (item.itemType === 'CD') {
      if (!item.suggestedCreator?.trim()) {
        warnings.push('CD has no artist; import will create/use (Unknown).');
      }

      if (!format) {
        warnings.push('Music format is blank; import will default to CD.');
      } else if (!this.isKnownMusicFormat(format)) {
        warnings.push(`Music format "${format}" will normalize to CD.`);
      }
    } else if (item.itemType === 'DVD') {
      if (!item.suggestedCreator?.trim()) {
        warnings.push('DVD has no creator/studio.');
      }

      if (!format) {
        warnings.push('Video format is blank; import will default to DVD.');
      } else if (!this.isKnownMovieFormat(format)) {
        warnings.push(`Video format "${format}" will normalize to DVD.`);
      }
    }

    if (!item.suggestedTitle?.trim()) {
      warnings.push('Title is required before import.');
    }

    if (item.confidence !== null && item.confidence !== undefined && Number(item.confidence) < 50) {
      warnings.push('Lookup confidence is below 50.');
    }

    if (!item.lookupProvider?.trim()) {
      warnings.push('No lookup provider is recorded for this staged row.');
    }

    return warnings;
  }

  importFieldValue(item: BarcodeStagingItem, field: string): string {
    switch (field) {
      case 'Title':
      case 'Album title':
      case 'Film title':
        return item.suggestedTitle?.trim() || '-';
      case 'Author':
      case 'Band / artist':
      case 'Creator / studio':
        return item.suggestedCreator?.trim() || '-';
      case 'Format':
      case 'Music format':
      case 'Video format':
        return item.suggestedFormat?.trim() || '-';
      case 'Release year':
        return item.suggestedYear?.trim() || '-';
      case 'Owned status':
        return 'Owned';
      case 'Barcode':
        return item.normalizedCode?.trim() || '-';
      case 'Source note':
        return [item.source, item.batchName].filter(Boolean).join(' / ') || '-';
      case 'Supported item type':
        return this.isSupportedCommitType(item.itemType) ? item.itemType : '-';
      default:
        return '-';
    }
  }

  importRowCommitTitle(row: BarcodeImportValidationRow): string {
    const item = row.item;
    switch (item.itemType) {
      case 'Book':
        return `Book: ${item.suggestedTitle || item.normalizedCode}`;
      case 'CD':
        return `Music album: ${item.suggestedCreator || '(Unknown artist)'} - ${item.suggestedTitle || item.normalizedCode}`;
      case 'DVD':
        return `Movie item: ${item.suggestedTitle || item.normalizedCode}`;
      default:
        return `Staging only: ${item.suggestedTitle || item.normalizedCode}`;
    }
  }

  importRowCommitSummary(row: BarcodeImportValidationRow): string {
    const item = row.item;
    const readiness = row.canImport
      ? row.severity === 'Warning'
        ? 'Can import after review'
        : 'Ready to import'
      : 'Blocked from import';

    switch (item.itemType) {
      case 'Book':
        return `${readiness}: creates Book with author, format, owned status; ISBN stays in staging trace.`;
      case 'CD':
        return `${readiness}: creates MusicAlbum with artist, format/status, release date, and barcode trace in InfoText.`;
      case 'DVD':
        return `${readiness}: creates MovieInventoryItem with format, barcode, source, notes, and owned status.`;
      default:
        return `${readiness}: no inventory row is created until this is typed as Book, CD, or DVD.`;
    }
  }

  importRowCommitFields(row: BarcodeImportValidationRow): string[] {
    const item = row.item;
    switch (item.itemType) {
      case 'Book':
        return [
          `Title: ${this.importFieldValue(item, 'Title')}`,
          `Author: ${this.importFieldValue(item, 'Author')}`,
          `Format: ${this.importFieldValue(item, 'Format')}`,
          'Status: Owned'
        ];
      case 'CD':
        return [
          `Album: ${this.importFieldValue(item, 'Album title')}`,
          `Artist: ${this.importFieldValue(item, 'Band / artist')}`,
          `Format: ${this.importFieldValue(item, 'Music format')}`,
          `Release: ${this.importFieldValue(item, 'Release year')}`,
          'Status: Owned'
        ];
      case 'DVD':
        return [
          `Title: ${this.importFieldValue(item, 'Film title')}`,
          `Creator: ${this.importFieldValue(item, 'Creator / studio')}`,
          `Format: ${this.importFieldValue(item, 'Video format')}`,
          `Year: ${this.importFieldValue(item, 'Release year')}`,
          `Barcode: ${this.importFieldValue(item, 'Barcode')}`,
          'Status: Owned'
        ];
      default:
        return [
          `Type: ${this.importFieldValue(item, 'Supported item type')}`,
          `Title: ${this.importFieldValue(item, 'Title')}`,
          `Format: ${this.importFieldValue(item, 'Format')}`
        ];
    }
  }

  importPanelMessages(rows: BarcodeImportValidationRow[]): string[] {
    const messages = rows
      .flatMap(row => row.messages.length ? row.messages : row.canImport ? [] : ['Not ready to import.'])
      .map(message => message.trim())
      .filter(Boolean);

    return [...new Set(messages)].slice(0, 5);
  }

  importPanelTone(panel: ImportTypePanel): string {
    if (panel.blockedCount > 0) {
      return 'border-rose-200 bg-rose-50';
    }

    if (panel.warningCount > 0) {
      return 'border-amber-200 bg-amber-50';
    }

    return 'border-emerald-200 bg-emerald-50';
  }

  importFieldTone(value: string): string {
    return value && value !== '-'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';
  }

  private commitPanelField(
    label: string,
    value: string | null | undefined,
    hint: string,
    category: SelectedCommitPanelField['category'],
    backendField: string): SelectedCommitPanelField {
    const normalized = value?.trim() || '-';
    return {
      label,
      value: normalized,
      hint,
      backendField,
      category,
      tone: this.commitPanelFieldTone(normalized, category)
    };
  }

  private commitPanelFieldTone(value: string, category: SelectedCommitPanelField['category']): string {
    if (category === 'NotMapped') {
      return 'border-slate-200 bg-slate-50 text-slate-700';
    }

    if (category === 'Audit') {
      return value !== '-'
        ? 'app-token-soft-surface app-token-text-strong'
        : 'border-slate-200 bg-slate-50 text-slate-600';
    }

    if (category === 'Review') {
      return value !== '-'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-600';
    }

    return value !== '-'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';
  }

  private commitPanelGroupLabel(category: SelectedCommitPanelField['category']): string {
    switch (category) {
      case 'Destination':
        return 'Will write';
      case 'Audit':
        return 'Audit / trace';
      case 'NotMapped':
        return 'Not mapped yet';
      default:
        return 'Review only';
    }
  }

  private isKnownBookFormat(format: string): boolean {
    return ['BOOK', 'BOOKS', 'PB', 'PAPERBACK', 'SOFTCOVER', 'SOFT COVER', 'AUDIO', 'AUDIOBOOK', 'AUDIO BOOK', 'HC', 'HARDCOVER', 'HARD COVER']
      .includes(format.trim().toUpperCase());
  }

  private isKnownMusicFormat(format: string): boolean {
    return ['CD', 'COMPACT DISC', 'TA', 'T', 'TAPE', 'TAPES', 'VI', 'V', 'LP', 'VINYL', 'RECORD', 'RECORDS', 'MP', 'MP3', 'MP3S', 'DIGITAL']
      .includes(format.trim().toUpperCase());
  }

  private isKnownMovieFormat(format: string): boolean {
    return ['DVD', 'BLU', 'BLURAY', 'BLU-RAY', 'BD', 'DIGITAL', 'DIGITAL COPY', 'STREAMING', 'DUB', 'DUBS', 'VHS']
      .includes(format.trim().toUpperCase());
  }

  importDestinationLabel(itemType: string): string {
    switch (itemType) {
      case 'Book':
        return 'Creates a Book, resolves/creates the author and format, and marks the book owned.';
      case 'CD':
        return 'Creates a MusicAlbum, resolves/creates the artist, writes album info/status, and marks the album owned.';
      case 'DVD':
        return 'Creates a MovieInventoryItem with barcode, provider source, release year, format, notes, and owned status.';
      case 'Other':
        return 'Other can be staged and reviewed, but commit is not implemented yet.';
      default:
        return 'Choose Book, CD, or DVD before committing this staged row.';
    }
  }


  private persistMergedCandidateFields(item: BarcodeStagingItem, successMessage: string): void {
    const request: BarcodeStagingUpdateRequest = {
      itemType: item.itemType,
      status: item.status === 'New' || item.status === 'LookupPending' ? 'Matched' : item.status,
      suggestedTitle: item.suggestedTitle,
      suggestedCreator: item.suggestedCreator,
      suggestedFormat: item.suggestedFormat,
      suggestedYear: item.suggestedYear,
      lookupProvider: item.lookupProvider,
      confidence: item.confidence,
      notes: item.notes
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.updateItem(item.id, request).subscribe({
      next: () => {
        const updatedItem = { ...item, status: request.status };
        this.selectedItem.set(updatedItem);
        this.items.update(items => items.map(existing => existing.id === item.id ? updatedItem : existing));
        this.message.set(successMessage);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to apply candidate field.'),
      complete: () => this.loading.set(false)
    });
  }

  private candidateFieldLabel(field: 'title' | 'creator' | 'year' | 'format' | 'provider'): string {
    switch (field) {
      case 'title':
        return 'Title';
      case 'creator':
        return 'Creator';
      case 'year':
        return 'Date';
      case 'format':
        return 'Format';
      case 'provider':
        return 'Provider/confidence';
    }
  }
  private stageUpcs(upcs: string[], source: 'Scanner' | 'Paste' | 'Upload' | 'Manual'): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.stageItems({
      batchName: this.batchName().trim() || null,
      source,
      upcs
    }).subscribe({
      next: staged => {
        this.message.set(`Staged ${staged.length} UPC${staged.length === 1 ? '' : 's'}.`);
        this.loadItems();
      },
      error: err => this.error.set(err.message ?? 'Failed to stage UPCs.'),
      complete: () => this.loading.set(false)
    });
  }

  private loadCandidates(itemId: number): void {
    this.lookupCandidates.set([]);

    this.service.getCandidates(itemId).subscribe({
      next: candidates => this.lookupCandidates.set(candidates),
      error: err => this.error.set(err.message ?? 'Failed to load lookup candidates.')
    });
  }

  private refreshSelectedItem(itemId: number): void {
    this.service.getItems(this.statusFilter(), this.typeFilter(), this.sourceFilter(), this.batchFilter()).subscribe({
      next: items => {
        this.items.set(items);
        const refreshed = items.find(item => item.id === itemId);

        if (refreshed) {
          this.selectedItem.set({ ...refreshed });
        }
      },
      error: err => this.error.set(err.message ?? 'Failed to refresh staged item.')
    });
  }

  private currentCandidateField(label: string, value?: string | number | null): CandidateCurrentField {
    const displayValue = value === null || value === undefined || String(value).trim() === '' ? '-' : String(value);
    return {
      label,
      value: displayValue,
      tone: displayValue === '-' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'app-token-soft-surface app-token-text-strong'
    };
  }

  private parseBulkInput(value: string): string[] {
    return this.parseInputCodes(value).map(code => code.normalized);
  }

  private candidateAgreementCount(candidate: BarcodeLookupCandidate, item: BarcodeStagingItem): number {
    return [
      [candidate.title, item.suggestedTitle],
      [candidate.creator, item.suggestedCreator],
      [candidate.publishDate, item.suggestedYear],
      [candidate.format, item.suggestedFormat]
    ].filter(([candidateValue, currentValue]) => {
      const candidateText = this.normalizedCandidateText(candidateValue);
      const currentText = this.normalizedCandidateText(currentValue);
      return candidateText && currentText && candidateText === currentText;
    }).length;
  }

  private candidateIssueCount(candidate: BarcodeLookupCandidate, item?: BarcodeStagingItem): number {
    const missingTitle = candidate.title?.trim() ? 0 : 1;
    const lowConfidence = (candidate.confidence ?? 0) < 50 ? 1 : 0;
    const missingFormat = candidate.format?.trim() ? 0 : 1;
    const conflicts = item
      ? [
          [candidate.title, item.suggestedTitle],
          [candidate.creator, item.suggestedCreator],
          [candidate.publishDate, item.suggestedYear],
          [candidate.format, item.suggestedFormat]
        ].filter(([candidateValue, currentValue]) => {
          const candidateText = this.normalizedCandidateText(candidateValue);
          const currentText = this.normalizedCandidateText(currentValue);
          return candidateText && currentText && candidateText !== currentText;
        }).length
      : 0;

    return missingTitle + lowConfidence + missingFormat + conflicts;
  }

  private normalizedCandidateText(value?: string | null): string {
    return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  }
  private candidateCompleteness(candidate: BarcodeLookupCandidate): number {
    return [
      candidate.title,
      candidate.creator,
      candidate.publisher,
      candidate.publishDate,
      candidate.format,
      candidate.externalId,
      candidate.coverImageUrl
    ].filter(value => Boolean(value?.trim())).length;
  }

  private candidateQuality(candidate: BarcodeLookupCandidate): number {
    const confidence = candidate.confidence ?? 0;
    const completenessBonus = this.candidateCompleteness(candidate) * 8;
    const selectedBonus = candidate.selected ? 10 : 0;
    return Math.min(100, Math.round(confidence + completenessBonus + selectedBonus));
  }

  private runImportPreview(request: { ids: number[]; batchName: string | null }): void {
    this.loadingImportPreview.set(true);
    this.error.set(null);
    this.message.set(null);
    this.importCommitResult.set(null);
    this.service.previewImport(request).subscribe({
      next: preview => {
        this.importPreview.set(preview);
        this.message.set(`Preview checked ${preview.totalCount} staged row${preview.totalCount === 1 ? '' : 's'}: ${preview.readyCount} ready, ${preview.warningCount} warning, ${preview.blockedCount} blocked.`);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to run import validation preview.'),
      complete: () => this.loadingImportPreview.set(false)
    });
  }

  private runImportCommit(request: { ids: number[]; batchName: string | null }): void {
    this.loadingImportCommit.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.commitImport(request).subscribe({
      next: result => {
        this.importCommitResult.set(result);
        this.message.set(`Imported ${result.importedCount} staged row${result.importedCount === 1 ? '' : 's'}; ${result.skippedCount} skipped.`);
        this.selectedIds.set(new Set());
        this.selectedItem.set(null);
        this.lookupCandidates.set([]);
        this.importPreview.set(null);
        this.loadItems();
        this.loadBatchReports();
        this.loadImportHistory();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to import staged rows.'),
      complete: () => this.loadingImportCommit.set(false)
    });
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
  }

  private isSupportedCommitType(itemType: string): boolean {
    return itemType === 'Book' || itemType === 'CD' || itemType === 'DVD';
  }

  private needsLookup(item: BarcodeStagingItem): boolean {
    return item.status !== 'Imported'
      && item.status !== 'Rejected'
      && (!item.suggestedTitle?.trim() || item.status === 'New' || item.status === 'LookupPending');
  }

  private needsHumanReview(item: BarcodeStagingItem): boolean {
    if (item.status === 'Imported' || item.status === 'Rejected') {
      return false;
    }

    return item.status === 'NeedsReview'
      || item.status === 'Duplicate'
      || item.itemType === 'Unknown'
      || !item.suggestedTitle?.trim()
      || !item.suggestedFormat?.trim()
      || (item.confidence !== null && item.confidence !== undefined && item.confidence < 50);
  }

  private readyForApproval(item: BarcodeStagingItem): boolean {
    return item.status === 'Matched'
      && this.isSupportedCommitType(item.itemType)
      && Boolean(item.suggestedTitle?.trim())
      && Boolean(item.suggestedFormat?.trim())
      && !this.needsHumanReview(item);
  }

  private isReadyToImport(item: BarcodeStagingItem): boolean {
    return item.status === 'Approved'
      && item.itemType !== 'Unknown'
      && Boolean(item.suggestedTitle?.trim());
  }

  private parseInputCodes(value: string): ParsedBarcodeCode[] {
    const seen = new Set<string>();
    return value
      .split(/[\r\n,;\t|]+/)
      .flatMap(token => token.split(/\s{2,}/))
      .map(raw => raw.trim().replace(/^"|"$/g, ''))
      .filter(Boolean)
      .map(raw => {
        const normalized = this.normalizeCode(raw);
        const codeType = this.detectCodeType(normalized);
        let warning: string | null = null;
        if (!normalized) {
          warning = 'Empty code.';
        } else if (seen.has(normalized)) {
          warning = 'Duplicate in this input.';
        } else if (codeType === 'Unknown') {
          warning = 'Unknown code type.';
        }

        seen.add(normalized);
        return { raw, normalized, codeType, warning };
      });
  }

  private normalizeCode(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private detectCodeType(code: string): string {
    if (code.length === 10 && /^\d{9}[\dX]$/.test(code)) {
      return 'ISBN10';
    }

    if (code.length === 13 && /^\d+$/.test(code) && (code.startsWith('978') || code.startsWith('979'))) {
      return 'ISBN13';
    }

    if (code.length === 12 && /^\d+$/.test(code)) {
      return 'UPC';
    }

    if (code.length === 13 && /^\d+$/.test(code)) {
      return 'EAN13';
    }

    if (code.length === 8 && /^\d+$/.test(code)) {
      return 'EAN8';
    }

    return 'Unknown';
  }


  private splitProviderSummary(value?: string | null): string[] {
    return (value ?? '')
      .split(',')
      .map(provider => provider.trim())
      .filter(Boolean);
  }

  private groupImportHistory(
    rows: BarcodeImportHistoryRow[],
    keySelector: (row: BarcodeImportHistoryRow) => string,
    splitValues = false): Array<{ key: string; count: number }> {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const keys = splitValues ? this.splitProviderSummary(keySelector(row)) : [keySelector(row)];
      for (const key of keys.length ? keys : ['Unknown']) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
  }

  private downloadImportHistoryRowsCsv(fileName: string, historyRows: BarcodeImportHistoryRow[]): void {
    const rows = historyRows.map(row => [
      row.importedAtUtc,
      row.createdAtUtc,
      row.batchName || 'No batch',
      row.source,
      row.normalizedCode,
      row.upc,
      row.codeType,
      row.itemType,
      row.status,
      row.suggestedTitle ?? '',
      row.suggestedCreator ?? '',
      row.suggestedFormat ?? '',
      row.suggestedYear ?? '',
      row.lookupProvider ?? '',
      row.confidence ?? '',
      row.importedEntityType ?? '',
      row.importedEntityId ?? '',
      this.importHistoryDestinationKey(row),
      this.importHistoryTraceStatus(row),
      this.importHistoryTraceSummary(row)
    ]);

    this.downloadCsv(fileName, [
      ['Imported At', 'Staged At', 'Batch', 'Source', 'Normalized Code', 'Original Code', 'Code Type', 'Item Type', 'Status', 'Title', 'Creator', 'Format', 'Year', 'Provider', 'Confidence', 'Entity Type', 'Entity Id', 'Destination Key', 'Trace Status', 'Trace Behavior'],
      ...rows
    ]);
  }

  private dateInputValue(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private safeFilePart(value: string): string {
    return (value || 'none')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'none';
  }

  private dateStartUtc(value: string): string | null {
    return value ? new Date(`${value}T00:00:00`).toISOString() : null;
  }

  private dateEndUtc(value: string): string | null {
    return value ? new Date(`${value}T23:59:59.999`).toISOString() : null;
  }
  private downloadCsv(fileName: string, rows: Array<Array<string | number | null | undefined>>): void {
    const csv = rows.map(row => row.map(value => this.csvCell(value)).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string | number | null | undefined): string {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private cleanupRequest(): BarcodeStagingCleanupRequest {
    return {
      olderThanDays: Math.max(1, Math.floor(Number(this.cleanupDays()) || 30)),
      statuses: [
        this.cleanupImported() ? 'Imported' : null,
        this.cleanupRejected() ? 'Rejected' : null
      ].filter((status): status is string => Boolean(status)),
      batchName: this.batchFilter() || null,
      source: this.sourceFilter() || null
    };
  }
}


























