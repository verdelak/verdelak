import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-barcode-batch-history-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './barcode-batch-history-panel.html'
})
export class BarcodeBatchHistoryPanel {
  @Input({ required: true }) vm!: any;

  get loadingBatchReports(): any { return this.vm.loadingBatchReports; }
  get batchReports(): any { return this.vm.batchReports; }
  get batchReportHealthSummaries(): any { return this.vm.batchReportHealthSummaries; }
  get batchProviderHealthCards(): any { return this.vm.batchProviderHealthCards; }
  get loading(): any { return this.vm.loading; }
  get loadingImportHistory(): any { return this.vm.loadingImportHistory; }
  get importHistoryRows(): any { return this.vm.importHistoryRows; }
  get importHistoryBatchFilter(): any { return this.vm.importHistoryBatchFilter; }
  get importHistorySourceFilter(): any { return this.vm.importHistorySourceFilter; }
  get importHistoryTypeFilter(): any { return this.vm.importHistoryTypeFilter; }
  get importHistoryEntityFilter(): any { return this.vm.importHistoryEntityFilter; }
  get importHistoryFromDate(): any { return this.vm.importHistoryFromDate; }
  get importHistoryToDate(): any { return this.vm.importHistoryToDate; }
  get importHistoryTake(): any { return this.vm.importHistoryTake; }
  get importHistorySummaryCards(): any { return this.vm.importHistorySummaryCards; }
  get importHistoryTraceCards(): any { return this.vm.importHistoryTraceCards; }
  get cleanupDays(): any { return this.vm.cleanupDays; }
  get cleanupImported(): any { return this.vm.cleanupImported; }
  get cleanupRejected(): any { return this.vm.cleanupRejected; }
  get loadingCleanup(): any { return this.vm.loadingCleanup; }
  get cleanupPreview(): any { return this.vm.cleanupPreview; }
  get batches(): any { return this.vm.batches; }
  get sources(): any { return this.vm.sources; }
  get itemTypes(): any[] { return this.vm.itemTypes; }
  get importedEntityTypes(): any[] { return this.vm.importedEntityTypes; }

  loadBatchReports(): void { this.vm.loadBatchReports(); }
  downloadBatchReportsCsv(): void { this.vm.downloadBatchReportsCsv(); }
  previewReportBatch(report: any): void { this.vm.previewReportBatch(report); }
  retryReportMissing(report: any): void { this.vm.retryReportMissing(report); }
  retryReportFallback(report: any): void { this.vm.retryReportFallback(report); }
  showImportedReportBatch(report: any): void { this.vm.showImportedReportBatch(report); }
  showImportHistoryForReport(report: any): void { this.vm.showImportHistoryForReport(report); }
  downloadImportHistoryForReport(report: any): void { this.vm.downloadImportHistoryForReport(report); }
  loadImportHistory(): void { this.vm.loadImportHistory(); }
  clearImportHistoryFilters(): void { this.vm.clearImportHistoryFilters(); }
  downloadImportHistoryCsv(): void { this.vm.downloadImportHistoryCsv(); }
  downloadImportHistorySummaryCsv(): void { this.vm.downloadImportHistorySummaryCsv(); }
  setImportHistoryPreset(days: number): void { this.vm.setImportHistoryPreset(days); }
  previewCleanup(): void { this.vm.previewCleanup(); }
  runCleanup(): void { this.vm.runCleanup(); }

  reportHealthTone(report: any): string { return this.vm.reportHealthTone(report); }
  reportHealthLabel(report: any): string { return this.vm.reportHealthLabel(report); }
  reportTypeSummary(report: any): string { return this.vm.reportTypeSummary(report); }
  reportImportedSummary(report: any): string { return this.vm.reportImportedSummary(report); }
  reportLookupSummary(report: any): string { return this.vm.reportLookupSummary(report); }
  reportProviderMatchSummary(report: any): string { return this.vm.reportProviderMatchSummary(report); }
  reportSelectedProviderSummary(report: any): string { return this.vm.reportSelectedProviderSummary(report); }
  reportProviderFailureSummary(report: any): string { return this.vm.reportProviderFailureSummary(report); }
  reportRetryRecommendation(report: any): string { return this.vm.reportRetryRecommendation(report); }
  importHistoryTypeSummary(): string { return this.vm.importHistoryTypeSummary(); }
  importHistoryDestinationSummary(): string { return this.vm.importHistoryDestinationSummary(); }
  importHistoryProviderSummary(): string { return this.vm.importHistoryProviderSummary(); }
  importHistoryTopSummary(card: any): string { return this.vm.importHistoryTopSummary(card); }
  importHistoryDestinationKey(row: any): string { return this.vm.importHistoryDestinationKey(row); }
  importHistoryTraceTone(row: any): string { return this.vm.importHistoryTraceTone(row); }
  importHistoryTraceStatus(row: any): string { return this.vm.importHistoryTraceStatus(row); }
  importHistoryTraceSummary(row: any): string { return this.vm.importHistoryTraceSummary(row); }
}
