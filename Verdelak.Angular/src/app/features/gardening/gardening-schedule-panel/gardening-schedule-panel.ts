import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ScheduleActionsComponent } from '../../../shared/schedule-actions/schedule-actions';
import { MasterScheduleItem, ScheduledTask, TaskOccurrenceActivity } from '../../tasks/models/scheduled-task.model';

export interface GardeningTaskFormModel {
  id: number | null;
  title: string;
  description: string;
  isActive: boolean;
  scheduleType: string;
  recurrencePattern: string;
  startDate: string;
  endDate: string;
}

export type GardeningTaskTemplate = 'daily' | 'weekly' | 'monthly' | 'seasonal';

@Component({
  selector: 'app-gardening-schedule-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ScheduleActionsComponent],
  templateUrl: './gardening-schedule-panel.html'
})
export class GardeningSchedulePanel {
  @Input() activeTaskCount = 0;
  @Input() taskCount = 0;
  @Input() openActivityCount = 0;
  @Input() openScheduleCount = 0;
  @Input() completedScheduleCount = 0;
  @Input() skippedScheduleCount = 0;
  @Input() generateDays = 30;
  @Input() generatingTasks = false;
  @Input() scheduleLoading = false;
  @Input() schedule: MasterScheduleItem[] = [];
  @Input() activity: TaskOccurrenceActivity[] = [];
  @Input() tasks: ScheduledTask[] = [];
  @Input() taskForm!: GardeningTaskFormModel;
  @Input() savingTask = false;
  @Input() taskMessage: string | null = null;
  @Input() scheduleActionId: string | null = null;
  @Input() scheduleMoveId: string | null = null;
  @Input() scheduleMoveDate = '';
  @Input() scheduleActionNote = '';

  @Output() generateDaysChange = new EventEmitter<number | string>();
  @Output() generateSchedule = new EventEmitter<void>();
  @Output() loadSchedule = new EventEmitter<void>();
  @Output() loadActivity = new EventEmitter<void>();
  @Output() completeOccurrence = new EventEmitter<{ item: MasterScheduleItem; note: string | null }>();
  @Output() startMoveOccurrence = new EventEmitter<MasterScheduleItem>();
  @Output() skipOccurrence = new EventEmitter<{ item: MasterScheduleItem; note: string | null }>();
  @Output() reopenOccurrence = new EventEmitter<{ item: MasterScheduleItem; note: string | null }>();
  @Output() moveDateChange = new EventEmitter<string>();
  @Output() actionNoteChange = new EventEmitter<string>();
  @Output() moveOccurrence = new EventEmitter<{ item: MasterScheduleItem; note: string | null }>();
  @Output() cancelMoveOccurrence = new EventEmitter<void>();
  @Output() editTask = new EventEmitter<ScheduledTask>();
  @Output() deleteTask = new EventEmitter<ScheduledTask>();
  @Output() newTask = new EventEmitter<void>();
  @Output() patchTaskForm = new EventEmitter<Partial<GardeningTaskFormModel>>();
  @Output() applyTaskTemplate = new EventEmitter<GardeningTaskTemplate>();
  @Output() saveTask = new EventEmitter<void>();

  scheduleCapabilities(item: MasterScheduleItem) {
    return {
      canComplete: item.canComplete,
      canMove: item.canMove,
      canSkip: item.canSkip,
      canReopen: item.canReopen
    };
  }

  isScheduleAction(item: MasterScheduleItem): boolean {
    return this.scheduleActionId === item.id;
  }

  isMovingOccurrence(item: MasterScheduleItem): boolean {
    return this.scheduleMoveId === item.id;
  }

  activityStatusTone(status: string): string {
    return status === 'Completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'Skipped'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : status === 'Missed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-slate-200 bg-slate-50 text-slate-700';
  }

  activityWhen(item: TaskOccurrenceActivity): string {
    return item.completedDate || item.scheduledDate;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  }
}
