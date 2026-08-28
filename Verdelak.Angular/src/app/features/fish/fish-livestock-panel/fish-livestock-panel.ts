import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-livestock-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-livestock-panel.html'
})
export class FishLivestockPanel {
  @Input({ required: true }) vm!: any;

  get livestockTankFilter(): any { return this.vm.livestockTankFilter; }

  tanks(): any[] { return this.vm.tanks(); }
  visibleLivestockEvents(): any[] { return this.vm.visibleLivestockEvents(); }
  quarantineEvents(): any[] { return this.vm.quarantineEvents(); }
  livestockLoading(): boolean { return this.vm.livestockLoading(); }
  exportQuarantineEvents(): void { this.vm.exportQuarantineEvents(); }
  quarantineDuration(event: any): string { return this.vm.quarantineDuration(event); }
  livestockRoute(event: any): string { return this.vm.livestockRoute(event); }
  formatDate(value: string | Date | null | undefined): string { return this.vm.formatDate(value); }
  editLivestockEvent(event: any): void { this.vm.editLivestockEvent(event); }
  deleteLivestockEvent(event: any): void { this.vm.deleteLivestockEvent(event); }
}
