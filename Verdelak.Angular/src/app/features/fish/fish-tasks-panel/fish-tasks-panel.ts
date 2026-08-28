import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-tasks-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-tasks-panel.html'
})
export class FishTasksPanel {
  @Input({ required: true }) vm!: any;

  get scheduleWindows(): number[] { return this.vm.scheduleWindows; }
  get schedulePreviewDays(): any { return this.vm.schedulePreviewDays; }
  get taskTankFilter(): any { return this.vm.taskTankFilter; }

  visibleTankTasks(): any[] { return this.vm.visibleTankTasks(); }
  generatingFishSchedule(): boolean { return this.vm.generatingFishSchedule(); }
  generateFishSchedule(): void { this.vm.generateFishSchedule(); }
  fishSchedulePreviewCount(): number { return this.vm.fishSchedulePreviewCount(); }
  tanks(): any[] { return this.vm.tanks(); }
  taskNextDueLabel(task: any): string { return this.vm.taskNextDueLabel(task); }
  hasCompletableOccurrence(task: any): boolean { return this.vm.hasCompletableOccurrence(task); }
  isCompletingTask(task: any): boolean { return this.vm.isCompletingTask(task); }
  completeNextTaskOccurrence(task: any): void { this.vm.completeNextTaskOccurrence(task); }
  editTankTask(task: any): void { this.vm.editTankTask(task); }
  deleteTankTask(task: any): void { this.vm.deleteTankTask(task); }
  tasksLoading(): boolean { return this.vm.tasksLoading(); }
}
