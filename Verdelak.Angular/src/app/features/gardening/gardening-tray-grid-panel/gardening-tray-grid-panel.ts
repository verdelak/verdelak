import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gardening-tray-grid-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gardening-tray-grid-panel.html'
})
export class GardeningTrayGridPanel {
  @Input({ required: true }) vm!: any;
}
