import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-goals-staging-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals-staging-panel.html'
})
export class GoalsStagingPanel {
  @Input({ required: true }) vm!: any;
}
