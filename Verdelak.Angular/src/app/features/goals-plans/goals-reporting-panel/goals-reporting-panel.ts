import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-goals-reporting-panel',
  imports: [CommonModule],
  templateUrl: './goals-reporting-panel.html'
})
export class GoalsReportingPanel {
  @Input({ required: true }) vm!: any;

  get yearProgressReport(): any { return this.vm.yearProgressReport; }
  get sectionSummaries(): any { return this.vm.sectionSummaries; }

  downloadYearProgressReport(): void { this.vm.downloadYearProgressReport(); }
  downloadSectionProgressReport(): void { this.vm.downloadSectionProgressReport(); }
  downloadRolloverPolicyReport(): void { this.vm.downloadRolloverPolicyReport(); }
  yearReportEntries(report: any): any[] { return this.vm.yearReportEntries(report); }
  jumpToSectionReport(section: string): void { this.vm.jumpToSectionReport(section); }
  sectionReportId(section: string): string { return this.vm.sectionReportId(section); }
  focusSection(summary: any): void { this.vm.focusSection(summary); }
  sectionProgressTrack(summary: any): string { return this.vm.sectionProgressTrack(summary); }
}
