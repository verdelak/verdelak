import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ScheduleActionsComponent } from '../../../shared/schedule-actions/schedule-actions';

@Component({
  selector: 'app-fish-occurrences-panel',
  standalone: true,
  imports: [CommonModule, ScheduleActionsComponent],
  templateUrl: './fish-occurrences-panel.html'
})
export class FishOccurrencesPanel {
  @Input({ required: true }) vm!: any;

  get occurrenceMoveDate(): any { return this.vm.occurrenceMoveDate; }
  get occurrenceActionNote(): any { return this.vm.occurrenceActionNote; }

  occurrencesLoading(): boolean { return this.vm.occurrencesLoading(); }
  fishOccurrences(): any[] { return this.vm.fishOccurrences(); }
  loadOccurrences(): void { this.vm.loadOccurrences(); }
  occurrenceTaskTitle(occurrence: any): string { return this.vm.occurrenceTaskTitle(occurrence); }
  occurrenceTaskTank(occurrence: any): string { return this.vm.occurrenceTaskTank(occurrence); }
  occurrenceStatusTone(status: string): string { return this.vm.occurrenceStatusTone(status); }
  fishOccurrenceCapabilities(occurrence: any): any { return this.vm.fishOccurrenceCapabilities(occurrence); }
  isFishOccurrenceAction(occurrence: any): boolean { return this.vm.isFishOccurrenceAction(occurrence); }
  isMovingFishOccurrence(occurrence: any): boolean { return this.vm.isMovingFishOccurrence(occurrence); }
  completeFishOccurrence(occurrence: any, note?: string | null): void { this.vm.completeFishOccurrence(occurrence, note); }
  startMoveFishOccurrence(occurrence: any): void { this.vm.startMoveFishOccurrence(occurrence); }
  skipFishOccurrence(occurrence: any, note?: string | null): void { this.vm.skipFishOccurrence(occurrence, note); }
  reopenFishOccurrence(occurrence: any, note?: string | null): void { this.vm.reopenFishOccurrence(occurrence, note); }
  moveFishOccurrence(occurrence: any, note?: string | null): void { this.vm.moveFishOccurrence(occurrence, note); }
  cancelMoveFishOccurrence(): void { this.vm.cancelMoveFishOccurrence(); }
}
