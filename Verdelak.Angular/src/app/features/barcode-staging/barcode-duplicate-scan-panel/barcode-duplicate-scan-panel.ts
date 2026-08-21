import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-barcode-duplicate-scan-panel',
  imports: [CommonModule],
  templateUrl: './barcode-duplicate-scan-panel.html'
})
export class BarcodeDuplicateScanPanel {
  @Input({ required: true }) vm!: any;
}
