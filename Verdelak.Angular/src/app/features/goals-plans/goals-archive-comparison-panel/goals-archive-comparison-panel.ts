import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-goals-archive-comparison-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './goals-archive-comparison-panel.html'
})
export class GoalsArchiveComparisonPanel {
  @Input({ required: true }) vm!: any;
}
