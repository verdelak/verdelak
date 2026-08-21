import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-barcode-import-validation-panel',
  imports: [CommonModule],
  templateUrl: './barcode-import-validation-panel.html'
})
export class BarcodeImportValidationPanel {
  @Input({ required: true }) vm!: any;

  get importPreview(): any {
    return this.vm.importPreview;
  }

  get loadingImportPreview(): any {
    return this.vm.loadingImportPreview;
  }

  get selectedCount(): any {
    return this.vm.selectedCount;
  }

  get batchFilter(): any {
    return this.vm.batchFilter;
  }

  get loadingImportCommit(): any {
    return this.vm.loadingImportCommit;
  }

  get readyImportRows(): any {
    return this.vm.readyImportRows;
  }

  get importCommitResult(): any {
    return this.vm.importCommitResult;
  }

  get duplicateDetailRows(): any {
    return this.vm.duplicateDetailRows;
  }

  get importValidationGroups(): any {
    return this.vm.importValidationGroups;
  }

  get importTypePanels(): any {
    return this.vm.importTypePanels;
  }

  previewSelectedImport(): void {
    this.vm.previewSelectedImport();
  }

  previewCurrentBatchImport(): void {
    this.vm.previewCurrentBatchImport();
  }

  commitSelectedImport(): void {
    this.vm.commitSelectedImport();
  }

  commitCurrentBatchImport(): void {
    this.vm.commitCurrentBatchImport();
  }

  commitPreviewReadyRows(): void {
    this.vm.commitPreviewReadyRows();
  }

  downloadImportPreviewCsv(): void {
    this.vm.downloadImportPreviewCsv();
  }

  downloadImportResultCsv(): void {
    this.vm.downloadImportResultCsv();
  }

  selectValidationRow(row: any): void {
    this.vm.selectValidationRow(row);
  }

  validationGroupSummary(group: any): string {
    return this.vm.validationGroupSummary(group);
  }

  validationMessages(row: any): any[] {
    return this.vm.validationMessages(row);
  }

  importPanelTone(panel: any): string {
    return this.vm.importPanelTone(panel);
  }

  importRowCommitTitle(row: any): string {
    return this.vm.importRowCommitTitle(row);
  }

  importRowCommitSummary(row: any): string {
    return this.vm.importRowCommitSummary(row);
  }

  importRowCommitFields(row: any): string[] {
    return this.vm.importRowCommitFields(row);
  }

  importFieldTone(value: string): string {
    return this.vm.importFieldTone(value);
  }

  importFieldValue(item: any, field: string): string {
    return this.vm.importFieldValue(item, field);
  }
}
