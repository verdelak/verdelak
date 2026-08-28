import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ScheduleActionCapabilities {
  canComplete: boolean;
  canMove: boolean;
  canSkip: boolean;
  canReopen: boolean;
}

@Component({
  selector: 'app-schedule-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-actions.html'
})
export class ScheduleActionsComponent {
  @Input({ required: true }) capabilities!: ScheduleActionCapabilities;
  @Input() actionDisabled = false;
  @Input() moving = false;
  @Input() moveDate = '';
  @Input() showActionNotes = false;
  @Input() actionNote = '';
  @Input() moveButtonClass = 'app-primary-action rounded px-3 py-1.5 text-xs font-bold disabled:opacity-50';

  @Output() complete = new EventEmitter<string | null>();
  @Output() startMove = new EventEmitter<void>();
  @Output() skip = new EventEmitter<string | null>();
  @Output() reopen = new EventEmitter<string | null>();
  @Output() move = new EventEmitter<string | null>();
  @Output() cancelMove = new EventEmitter<void>();
  @Output() moveDateChange = new EventEmitter<string>();
  @Output() actionNoteChange = new EventEmitter<string>();

  noteValue(): string | null {
    const note = this.actionNote.trim();
    return note.length > 0 ? note : null;
  }
}
