import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-finance-bill-reports-panel',
  imports: [CommonModule],
  templateUrl: './finance-bill-reports-panel.html'
})
export class FinanceBillReportsPanel {
  @Input({ required: true }) vm!: any;

  get selectedYear(): any { return this.vm.selectedYear; }
  get selectedMonthName(): any { return this.vm.selectedMonthName; }
  get activeBills(): any { return this.vm.activeBills; }
  get billInsightCards(): any { return this.vm.billInsightCards; }
  get monthlyPaidTotal(): any { return this.vm.monthlyPaidTotal; }
  get monthlyRemainingTotal(): any { return this.vm.monthlyRemainingTotal; }
  get billBurnDownRows(): any { return this.vm.billBurnDownRows; }
  get billReport(): any { return this.vm.billReport; }
  get topAnnualBillSummaries(): any { return this.vm.topAnnualBillSummaries; }
  get topOverdueRisks(): any { return this.vm.topOverdueRisks; }
  get topPaymentVariances(): any { return this.vm.topPaymentVariances; }
  get recentBillPaymentHistory(): any { return this.vm.recentBillPaymentHistory; }

  printBillAnalyticsReport(): void { this.vm.printBillAnalyticsReport(); }
  exportBillPaymentHistoryCsv(): void { this.vm.exportBillPaymentHistoryCsv(); }
  exportBillAnalyticsCsv(): void { this.vm.exportBillAnalyticsCsv(); }
  money(value: number | null | undefined): string { return this.vm.money(value); }
  signedMoney(value: number | null | undefined): string { return this.vm.signedMoney(value); }
  maxUnpaidBills(): number { return this.vm.maxUnpaidBills(); }
  maxPaidCategoryTotal(): number { return this.vm.maxPaidCategoryTotal(); }
  maxMonthlyPaidTotal(): number { return this.vm.maxMonthlyPaidTotal(); }
  maxFrequencyExpectedTotal(): number { return this.vm.maxFrequencyExpectedTotal(); }
  maxOverdueRiskTotal(): number { return this.vm.maxOverdueRiskTotal(); }
}
