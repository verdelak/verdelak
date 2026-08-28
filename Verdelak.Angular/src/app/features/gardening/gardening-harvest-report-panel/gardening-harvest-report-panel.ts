import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-gardening-harvest-report-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gardening-harvest-report-panel.html'
})
export class GardeningHarvestReportPanel {
  @Input({ required: true }) vm!: any;

  get selectedYear(): any { return this.vm.selectedYear; }
  get loadingHarvestReport(): any { return this.vm.loadingHarvestReport; }
  get harvestReport(): any { return this.vm.harvestReport; }

  refreshHarvestReport(): void { this.vm.refreshHarvestReport(); }
  downloadFilteredHarvestsCsv(): void { this.vm.downloadFilteredHarvestsCsv(); }
  downloadHarvestReportCsv(): void { this.vm.downloadHarvestReportCsv(); }
  formatDate(value: string | null | undefined): string { return this.vm.formatDate(value); }
}
