import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-water-trend-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-water-trend-panel.html'
})
export class FishWaterTrendPanel {
  @Input({ required: true }) vm!: any;
}
