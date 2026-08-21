import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-goals-schedule-preview-panel',
  imports: [CommonModule],
  templateUrl: './goals-schedule-preview-panel.html'
})
export class GoalsSchedulePreviewPanel {
  @Input({ required: true }) vm!: any;
}
