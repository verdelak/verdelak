import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gardening-plot-grid-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gardening-plot-grid-panel.html'
})
export class GardeningPlotGridPanel {
  @Input({ required: true }) vm!: any;
}
