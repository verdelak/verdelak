import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-products-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-products-panel.html'
})
export class FishProductsPanel {
  @Input({ required: true }) vm!: any;

  get productCategories(): string[] { return this.vm.productCategories; }
  get productStatusFilter(): any { return this.vm.productStatusFilter; }
  get productCategoryFilter(): any { return this.vm.productCategoryFilter; }
  get productTankFilter(): any { return this.vm.productTankFilter; }
  get showInactiveProducts(): any { return this.vm.showInactiveProducts; }
  get productImportText(): any { return this.vm.productImportText; }

  visibleProducts(): any[] { return this.vm.visibleProducts(); }
  expiredProductCount(): number { return this.vm.expiredProductCount(); }
  expiringProductCount(): number { return this.vm.expiringProductCount(); }
  emptyProductCount(): number { return this.vm.emptyProductCount(); }
  lowProductCount(): number { return this.vm.lowProductCount(); }
  tanks(): any[] { return this.vm.tanks(); }
  productImportPreview(): any[] { return this.vm.productImportPreview(); }
  validProductImportRows(): any[] { return this.vm.validProductImportRows(); }
  productImportFileName(): string | null { return this.vm.productImportFileName(); }
  productImporting(): boolean { return this.vm.productImporting(); }
  productsLoading(): boolean { return this.vm.productsLoading(); }
  uploadProductImport(event: Event): void { this.vm.uploadProductImport(event); }
  importProductRows(): void { this.vm.importProductRows(); }
  clearProductImport(): void { this.vm.clearProductImport(); }
  productStatusTone(product: any): string { return this.vm.productStatusTone(product); }
  productStatus(product: any): string { return this.vm.productStatus(product); }
  editProduct(product: any): void { this.vm.editProduct(product); }
  deleteProduct(product: any): void { this.vm.deleteProduct(product); }
}
