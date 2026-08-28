import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-timeline-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-timeline-panel.html'
})
export class FishTimelinePanel {
  @Input({ required: true }) vm!: any;

  get historyTankFilter(): any { return this.vm.historyTankFilter; }

  tanks(): any[] { return this.vm.tanks(); }
  visibleHistory(): any[] { return this.vm.visibleHistory(); }
  historyGroups(): any[] { return this.vm.historyGroups(); }
  historyLoading(): boolean { return this.vm.historyLoading(); }
  historyTone(item: any): string { return this.vm.historyTone(item); }
  historySummary(item: any): string { return this.vm.historySummary(item); }
  formatDate(value: string | Date | null | undefined): string { return this.vm.formatDate(value); }
}
