import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-finance-reports-export-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-reports-export-panel.html'
})
export class FinanceReportsExportPanel {
  @Input({ required: true }) vm!: any;
}
