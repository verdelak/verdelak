import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GardenYearAreaComparison, GardenYearComparison, GardenYearCropComparison } from '../models/gardening.models';

@Component({
  selector: 'app-gardening-year-comparison-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gardening-year-comparison-panel.html'
})
export class GardeningYearComparisonPanel {
  @Input() comparison: GardenYearComparison | null = null;
  @Input() comparisonYear = new Date().getFullYear() - 1;
  @Input() loading = false;
  @Input() topCropComparisons: GardenYearCropComparison[] = [];
  @Input() topAreaComparisons: GardenYearAreaComparison[] = [];

  @Output() comparisonYearChange = new EventEmitter<number | string>();
  @Output() refresh = new EventEmitter<void>();

  deltaTone(value: number): string {
    return value > 0
      ? 'text-emerald-700'
      : value < 0
        ? 'text-rose-700'
        : 'text-slate-500';
  }

  formatDelta(value: number): string {
    if (value > 0) {
      return `+${value}`;
    }

    return `${value}`;
  }
}
