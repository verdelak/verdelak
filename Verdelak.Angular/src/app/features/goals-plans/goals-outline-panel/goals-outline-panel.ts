import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-goals-outline-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './goals-outline-panel.html'
})
export class GoalsOutlinePanel {
  @Input({ required: true }) vm!: any;

  get quickProgressValues(): number[] { return this.vm.quickProgressValues; }
  get scheduleSurfaceModes(): string[] { return this.vm.scheduleSurfaceModes; }
  get dependencyTypes(): string[] { return this.vm.dependencyTypes; }
  get editableItemTypes(): string[] { return this.vm.editableItemTypes; }
  get planningWindowTypes(): string[] { return this.vm.planningWindowTypes; }
  get rolloverPolicies(): string[] { return this.vm.rolloverPolicies; }
  get dependencySearch(): any { return this.vm.dependencySearch; }
  get dependencyCandidateId(): any { return this.vm.dependencyCandidateId; }
  get dependencyCreateType(): any { return this.vm.dependencyCreateType; }
  get dependencyCreateLagMinutes(): any { return this.vm.dependencyCreateLagMinutes; }
  get outlineMoveSearch(): any { return this.vm.outlineMoveSearch; }
  get outlineMoveParentId(): any { return this.vm.outlineMoveParentId; }

  visibleItems(): any[] { return this.vm.visibleItems(); }
  isSelectedOutlineItem(item: any): boolean { return this.vm.isSelectedOutlineItem(item); }
  hasChildren(item: any): boolean { return this.vm.hasChildren(item); }
  isCollapsed(item: any): boolean { return this.vm.isCollapsed(item); }
  toggleBranch(item: any): void { this.vm.toggleBranch(item); }
  selectOutlineItem(item: any): void { this.vm.selectOutlineItem(item); }
  loading(): boolean { return this.vm.loading(); }
  selectedOutlineItem(): any { return this.vm.selectedOutlineItem(); }
  outlinePathLabel(item: any): string { return this.vm.outlinePathLabel(item); }
  descendantCount(item: any): number { return this.vm.descendantCount(item); }
  outlineParent(item: any): any { return this.vm.outlineParent(item); }
  canQuickProgress(item: any): boolean { return this.vm.canQuickProgress(item); }
  isSaving(item: any): boolean { return this.vm.isSaving(item); }
  quickProgress(item: any, percent: number): void { this.vm.quickProgress(item, percent); }
  rowError(item: any): string | null { return this.vm.rowError(item); }
  scheduleModeTitle(mode: string): string { return this.vm.scheduleModeTitle(mode); }
  scheduleModeLabel(mode: string): string { return this.vm.scheduleModeLabel(mode); }
  quickScheduleMode(item: any, mode: any): void { this.vm.quickScheduleMode(item, mode); }
  selectedPlanArchived(): boolean { return this.vm.selectedPlanArchived(); }
  previousSibling(item: any): any { return this.vm.previousSibling(item); }
  nextSibling(item: any): any { return this.vm.nextSibling(item); }
  outlineMoving(): boolean { return this.vm.outlineMoving(); }
  moveOutlineUp(item: any): void { this.vm.moveOutlineUp(item); }
  moveOutlineDown(item: any): void { this.vm.moveOutlineDown(item); }
  openOutlineMove(item: any): void { this.vm.openOutlineMove(item); }
  openOutlineCreate(item: any): void { this.vm.openOutlineCreate(item); }
  openOutlineEdit(item: any): void { this.vm.openOutlineEdit(item); }
  deleteOutlineItem(item: any): void { this.vm.deleteOutlineItem(item); }
  dependencyLoading(): boolean { return this.vm.dependencyLoading(); }
  addDependency(item: any): void { this.vm.addDependency(item); }
  setDependencyCandidate(candidateId: number | null): void { this.vm.setDependencyCandidate(candidateId); }
  dependencyCandidates(): any[] { return this.vm.dependencyCandidates(); }
  updateDependencyCreateLag(value: any): void { this.vm.updateDependencyCreateLag(value); }
  dependencySaving(): boolean { return this.vm.dependencySaving(); }
  dependencies(): any { return this.vm.dependencies(); }
  dependencyLabel(dependency: any): string { return this.vm.dependencyLabel(dependency); }
  deleteDependency(item: any, dependency: any): void { this.vm.deleteDependency(item, dependency); }
  dependencyEditFor(dependency: any): any { return this.vm.dependencyEditFor(dependency); }
  updateDependencyEdit(dependency: any, patch: any): void { this.vm.updateDependencyEdit(dependency, patch); }
  updateDependencyLag(dependency: any, value: any): void { this.vm.updateDependencyLag(dependency, value); }
  isDependencyDirty(dependency: any): boolean { return this.vm.isDependencyDirty(dependency); }
  saveDependency(item: any, dependency: any): void { this.vm.saveDependency(item, dependency); }
  successorLabel(dependency: any): string { return this.vm.successorLabel(dependency); }
  deleteSuccessorDependency(dependency: any): void { this.vm.deleteSuccessorDependency(dependency); }
  movingOutlineItem(): any { return this.vm.movingOutlineItem(); }
  moveOutlineUnder(): void { this.vm.moveOutlineUnder(); }
  closeOutlineMove(): void { this.vm.closeOutlineMove(); }
  moveParentsFor(item: any): any[] { return this.vm.moveParentsFor(item); }
  outlineEditorId(): number | null { return this.vm.outlineEditorId(); }
  editingOutlineItem(): any { return this.vm.editingOutlineItem(); }
  closeOutlineEdit(): void { this.vm.closeOutlineEdit(); }
  editFor(item: any): any { return this.vm.editFor(item); }
  updateEdit(item: any, patch: any): void { this.vm.updateEdit(item, patch); }
  updatePercent(item: any, value: any): void { this.vm.updatePercent(item, value); }
  nudgeEditWindow(item: any, days: number): void { this.vm.nudgeEditWindow(item, days); }
  isDirty(item: any): boolean { return this.vm.isDirty(item); }
  saveItem(item: any): void { this.vm.saveItem(item); }
  discardEdit(item: any): void { this.vm.discardEdit(item); }
}
