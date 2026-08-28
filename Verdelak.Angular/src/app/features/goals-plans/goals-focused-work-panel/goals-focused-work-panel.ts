import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-goals-focused-work-panel',
  imports: [CommonModule],
  templateUrl: './goals-focused-work-panel.html'
})
export class GoalsFocusedWorkPanel {
  @Input({ required: true }) vm!: any;

  get workView(): any { return this.vm.workView; }
  get activeScope(): any { return this.vm.activeScope; }
  get focusedItemLimit(): number { return this.vm.focusedItemLimit; }
  get focusedSectionItemLimit(): number { return this.vm.focusedSectionItemLimit; }

  focusDescription(): string { return this.vm.focusDescription(); }
  focusedItems(): any[] { return this.vm.focusedItems(); }
  downloadFocusedTaskReport(): void { this.vm.downloadFocusedTaskReport(); }
  setActiveScope(scope: any): void { this.vm.setActiveScope(scope); }
  focusedReportGroups(): any[] { return this.vm.focusedReportGroups(); }
  jumpToOverdueGroup(section: string): void { this.vm.jumpToOverdueGroup(section); }
  hasTruncatedFocusedGroups(): boolean { return this.vm.hasTruncatedFocusedGroups(); }
  overdueGroupId(section: string): string { return this.vm.overdueGroupId(section); }
  outlinePathLabel(item: any): string { return this.vm.outlinePathLabel(item); }
  scheduleModeTitle(mode: string): string { return this.vm.scheduleModeTitle(mode); }
  scheduleModeLabel(mode: string): string { return this.vm.scheduleModeLabel(mode); }
  isSaving(item: any): boolean { return this.vm.isSaving(item); }
  selectedPlanArchived(): boolean { return this.vm.selectedPlanArchived(); }
  quickScheduleMode(item: any, mode: any): void { this.vm.quickScheduleMode(item, mode); }
  quickProgress(item: any, percent: number): void { this.vm.quickProgress(item, percent); }
  inspectFocusedItem(item: any): void { this.vm.inspectFocusedItem(item); }
  focusedReportItems(): any[] { return this.vm.focusedReportItems(); }
  loading(): boolean { return this.vm.loading(); }
}
