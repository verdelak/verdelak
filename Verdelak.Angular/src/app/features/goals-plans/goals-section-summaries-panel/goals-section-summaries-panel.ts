import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-goals-section-summaries-panel',
  imports: [CommonModule],
  templateUrl: './goals-section-summaries-panel.html'
})
export class GoalsSectionSummariesPanel {
  @Input({ required: true }) vm!: any;

  get sectionSummaries(): any { return this.vm.sectionSummaries; }
  get gridItemLimit(): number { return this.vm.gridItemLimit; }

  focusSection(summary: any): void { this.vm.focusSection(summary); }
  focusQueueSection(summary: any): void { this.vm.focusQueueSection(summary); }
  sectionProgressTrack(summary: any): string { return this.vm.sectionProgressTrack(summary); }
}
