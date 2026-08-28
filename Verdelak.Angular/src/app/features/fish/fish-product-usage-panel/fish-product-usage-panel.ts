import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-product-usage-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-product-usage-panel.html'
})
export class FishProductUsagePanel {
  @Input({ required: true }) vm!: any;

  get productUsageFilter(): any { return this.vm.productUsageFilter; }
  get shoppingOnlyUsage(): any { return this.vm.shoppingOnlyUsage; }

  products(): any[] { return this.vm.products(); }
  visibleProductUsage(): any[] { return this.vm.visibleProductUsage(); }
  shoppingCandidateCount(): number { return this.vm.shoppingCandidateCount(); }
  productUsageLoading(): boolean { return this.vm.productUsageLoading(); }
  formatDate(value: string | Date | null | undefined): string { return this.vm.formatDate(value); }
  editProductUsage(usage: any): void { this.vm.editProductUsage(usage); }
  deleteProductUsage(usage: any): void { this.vm.deleteProductUsage(usage); }
}
