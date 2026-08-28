import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoalsArchiveComparisonPanel } from '../goals-archive-comparison-panel/goals-archive-comparison-panel';

@Component({
  selector: 'app-goals-archive-rollover-panel',
  imports: [CommonModule, FormsModule, GoalsArchiveComparisonPanel],
  templateUrl: './goals-archive-rollover-panel.html'
})
export class GoalsArchiveRolloverPanel {
  @Input({ required: true }) vm!: any;

  get archivedPlans(): any { return this.vm.archivedPlans; }
  get selectedPlanId(): any { return this.vm.selectedPlanId; }
  get selectedPlan(): any { return this.vm.selectedPlan; }
  get rolloverPreviewing(): any { return this.vm.rolloverPreviewing; }
  get rolloverYear(): any { return this.vm.rolloverYear; }
  get rolloverTitle(): any { return this.vm.rolloverTitle; }
  get rolloverSaving(): any { return this.vm.rolloverSaving; }
  get rolloverPreview(): any { return this.vm.rolloverPreview; }

  selectPlan(id: number): void { this.vm.selectPlan(id); }
  createRollover(): void { this.vm.createRollover(); }
  setRolloverYear(value: string | number): void { this.vm.setRolloverYear(value); }
  setRolloverTitle(value: string): void { this.vm.setRolloverTitle(value); }
  rolloverYearExists(): boolean { return this.vm.rolloverYearExists(); }
  previewRollover(): void { this.vm.previewRollover(); }
  rolloverPreviewCurrent(): boolean { return this.vm.rolloverPreviewCurrent(); }
  rolloverPolicyReport(): any[] { return this.vm.rolloverPolicyReport(); }
}
