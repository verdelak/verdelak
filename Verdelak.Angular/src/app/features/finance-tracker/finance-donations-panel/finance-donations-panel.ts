import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-finance-donations-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-donations-panel.html'
})
export class FinanceDonationsPanel {
  @Input({ required: true }) vm!: any;

  get selectedYear(): any { return this.vm.selectedYear; }
  get donationTotal(): any { return this.vm.donationTotal; }
  get donationCount(): any { return this.vm.donationCount; }
  get donationReceiptCount(): any { return this.vm.donationReceiptCount; }
  get missingReceiptTotal(): any { return this.vm.missingReceiptTotal; }
  get averageDonation(): any { return this.vm.averageDonation; }
  get largestDonation(): any { return this.vm.largestDonation; }
  get donationSearch(): any { return this.vm.donationSearch; }
  get donationReceiptFilter(): any { return this.vm.donationReceiptFilter; }
  get receiptReportTaxYear(): any { return this.vm.receiptReportTaxYear; }
  get filteredDonations(): any { return this.vm.filteredDonations; }
  get donationOrganizationSummaries(): any { return this.vm.donationOrganizationSummaries; }

  money(value: number | null | undefined): string { return this.vm.money(value); }
  printDonationReport(): void { this.vm.printDonationReport(); }
  printReceiptNeededReport(): void { this.vm.printReceiptNeededReport(); }
  exportDonationsCsv(): void { this.vm.exportDonationsCsv(); }
  exportDonationOrganizationCsv(): void { this.vm.exportDonationOrganizationCsv(); }
  clearDonationFilters(): void { this.vm.clearDonationFilters(); }
  setDonationReceiptFilter(filter: 'all' | 'withReceipt' | 'missingReceipt'): void { this.vm.setDonationReceiptFilter(filter); }
  setReceiptReportTaxYear(value: string | number): void { this.vm.setReceiptReportTaxYear(value); }
  selectDonation(donation: any): void { this.vm.selectDonation(donation); }
}
