import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gardening-seed-start-report-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gardening-seed-start-report-panel.html'
})
export class GardeningSeedStartReportPanel {
  @Input({ required: true }) vm!: any;

  get monthOptions(): any { return this.vm.monthOptions; }
  get selectedReportMonth(): any { return this.vm.selectedReportMonth; }
  get selectedYear(): any { return this.vm.selectedYear; }
  get seedStartReportScope(): any { return this.vm.seedStartReportScope; }

  monthName(month: number): string { return this.vm.monthName(month); }
  downloadSeedStartReportCsv(): void { this.vm.downloadSeedStartReportCsv(); }
  downloadSeedStartSummaryCsv(): void { this.vm.downloadSeedStartSummaryCsv(); }
  setReportMonth(value: string | number): void { this.vm.setReportMonth(value); }
  monthlySeedStartRows(): any[] { return this.vm.monthlySeedStartRows(); }
  monthlyIndoorStartCount(): number { return this.vm.monthlyIndoorStartCount(); }
  monthlyOutdoorStartCount(): number { return this.vm.monthlyOutdoorStartCount(); }
  monthlyTraySummaries(): any[] { return this.vm.monthlyTraySummaries(); }
  monthlyAreaSummaries(): any[] { return this.vm.monthlyAreaSummaries(); }
  monthlyPlanningWarningCount(): number { return this.vm.monthlyPlanningWarningCount(); }
  setSeedStartReportScope(value: any): void { this.vm.setSeedStartReportScope(value); }
  monthlyTrayAssignmentCount(): number { return this.vm.monthlyTrayAssignmentCount(); }
  monthlySeedInventoryWarningCount(): number { return this.vm.monthlySeedInventoryWarningCount(); }
  monthlyUnassignedSeedStartCount(): number { return this.vm.monthlyUnassignedSeedStartCount(); }
  formatDate(value: string | null | undefined): string { return this.vm.formatDate(value); }
  monthlyAreaQtyTotal(): number { return this.vm.monthlyAreaQtyTotal(); }
  scopedMonthlySeedStartRows(): any[] { return this.vm.scopedMonthlySeedStartRows(); }
  planningInventoryTone(row: any): string { return this.vm.planningInventoryTone(row); }
}
