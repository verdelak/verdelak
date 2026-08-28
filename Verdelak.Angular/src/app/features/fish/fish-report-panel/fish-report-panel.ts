import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-report-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-report-panel.html'
})
export class FishReportPanel {
  @Input({ required: true }) vm!: any;

  get taskCategories(): string[] { return this.vm.taskCategories; }
  get productCategories(): string[] { return this.vm.productCategories; }
  get reportTankFilter(): any { return this.vm.reportTankFilter; }
  get reportTaskCategoryFilter(): any { return this.vm.reportTaskCategoryFilter; }
  get reportProductCategoryFilter(): any { return this.vm.reportProductCategoryFilter; }
  get speciesGapFilter(): any { return this.vm.speciesGapFilter; }
  get reportCriticalOnly(): any { return this.vm.reportCriticalOnly; }
  get completingOccurrenceId(): any { return this.vm.completingOccurrenceId; }
  get addingShoppingProductId(): any { return this.vm.addingShoppingProductId; }

  filteredOverdueFishTasks(): any[] { return this.vm.filteredOverdueFishTasks(); }
  filteredTanksNeedingTests(): any[] { return this.vm.filteredTanksNeedingTests(); }
  filteredProductsNeedingReplacement(): any[] { return this.vm.filteredProductsNeedingReplacement(); }
  filteredSpeciesProfileGaps(): any[] { return this.vm.filteredSpeciesProfileGaps(); }
  speciesFoodProductGaps(): any[] { return this.vm.speciesFoodProductGaps(); }
  quarantineAttention(): any[] { return this.vm.quarantineAttention(); }
  tanks(): any[] { return this.vm.tanks(); }
  speciesGapTypes(): string[] { return this.vm.speciesGapTypes(); }
  thresholdsLoading(): boolean { return this.vm.thresholdsLoading(); }
  reportWaterTestDueDays(): number { return this.vm.reportWaterTestDueDays(); }
  reportOverdueCriticalDays(): number { return this.vm.reportOverdueCriticalDays(); }
  reportWaterTestCriticalDays(): number { return this.vm.reportWaterTestCriticalDays(); }
  reportLowProductPercent(): number { return this.vm.reportLowProductPercent(); }
  reportExpiringSoonDays(): number { return this.vm.reportExpiringSoonDays(); }

  resetReportFilters(): void { this.vm.resetReportFilters(); }
  exportOverdueFishTasks(): void { this.vm.exportOverdueFishTasks(); }
  exportTanksNeedingTests(): void { this.vm.exportTanksNeedingTests(); }
  exportProductsNeedingReplacement(): void { this.vm.exportProductsNeedingReplacement(); }
  exportSpeciesProfileGaps(): void { this.vm.exportSpeciesProfileGaps(); }
  exportSpeciesFoodProductGaps(): void { this.vm.exportSpeciesFoodProductGaps(); }
  exportQuarantineAttention(): void { this.vm.exportQuarantineAttention(); }
  overdueDaysLabel(value: number): string { return this.vm.overdueDaysLabel(value); }
  completeOverdueTask(item: any): void { this.vm.completeOverdueTask(item); }
  latestTestLabel(item: any): string { return this.vm.latestTestLabel(item); }
  prepareWaterTest(item: any): void { this.vm.prepareWaterTest(item); }
  productStatusTone(product: any): string { return this.vm.productStatusTone(product); }
  replacementReason(product: any): string { return this.vm.replacementReason(product); }
  addProductReplacementToShoppingList(product: any): void { this.vm.addProductReplacementToShoppingList(product); }
  prepareProductReplacement(product: any): void { this.vm.prepareProductReplacement(product); }
  createProfileFromGap(gap: any): void { this.vm.createProfileFromGap(gap); }
  quarantineDuration(event: any): string { return this.vm.quarantineDuration(event); }
}
