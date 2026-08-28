import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-goals-grid-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './goals-grid-panel.html'
})
export class GoalsGridPanel {
  @Input({ required: true }) vm!: any;

  get gridItemLimit(): number { return this.vm.gridItemLimit; }
  get planningWindowTypes(): string[] { return this.vm.planningWindowTypes; }
  get scheduleSurfaceModes(): string[] { return this.vm.scheduleSurfaceModes; }
  get rolloverPolicies(): string[] { return this.vm.rolloverPolicies; }
  get editableItemTypes(): string[] { return this.vm.editableItemTypes; }
  get massPercent(): any { return this.vm.massPercent; }
  get massPlanningWindow(): any { return this.vm.massPlanningWindow; }
  get massStartDate(): any { return this.vm.massStartDate; }
  get massEndDate(): any { return this.vm.massEndDate; }
  get massScheduleMode(): any { return this.vm.massScheduleMode; }
  get massRolloverPolicy(): any { return this.vm.massRolloverPolicy; }

  filteredItems(): any[] { return this.vm.filteredItems(); }
  massSelectionLabel(): string { return this.vm.massSelectionLabel(); }
  massVisibleQueueItems(): any[] { return this.vm.massVisibleQueueItems(); }
  massEditableQueueItems(): any[] { return this.vm.massEditableQueueItems(); }
  massEditing(): boolean { return this.vm.massEditing(); }
  selectedPlanArchived(): boolean { return this.vm.selectedPlanArchived(); }
  massSelectedCount(): number { return this.vm.massSelectedCount(); }
  selectVisibleQueueRows(): void { this.vm.selectVisibleQueueRows(); }
  selectFilteredQueueRows(): void { this.vm.selectFilteredQueueRows(); }
  clearMassSelection(): void { this.vm.clearMassSelection(); }
  scheduleModeLabel(mode: string): string { return this.vm.scheduleModeLabel(mode); }
  applyMassEdit(): void { this.vm.applyMassEdit(); }
  markSelectedQueueDone(): void { this.vm.markSelectedQueueDone(); }
  applySelectedQueueDefaults(): void { this.vm.applySelectedQueueDefaults(); }
  clearSelectedQueueDates(): void { this.vm.clearSelectedQueueDates(); }
  gridItems(): any[] { return this.vm.gridItems(); }
  isSaving(item: any): boolean { return this.vm.isSaving(item); }
  isMassSelected(item: any): boolean { return this.vm.isMassSelected(item); }
  toggleMassSelection(item: any, checked: boolean): void { this.vm.toggleMassSelection(item, checked); }
  rowError(item: any): string | null { return this.vm.rowError(item); }
  editFor(item: any): any { return this.vm.editFor(item); }
  updateEdit(item: any, patch: any): void { this.vm.updateEdit(item, patch); }
  updatePercent(item: any, value: any): void { this.vm.updatePercent(item, value); }
  isDirty(item: any): boolean { return this.vm.isDirty(item); }
  saveItem(item: any): void { this.vm.saveItem(item); }
  discardEdit(item: any): void { this.vm.discardEdit(item); }
  loading(): boolean { return this.vm.loading(); }
}
