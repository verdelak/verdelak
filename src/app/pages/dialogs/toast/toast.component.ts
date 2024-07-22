import { Component } from '@angular/core';
import { DialogService, Product } from '../dialog.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  providers: [DialogService]
})
export class ToastComponent {
  products: Product[];

  isVisible = false;

  type:any = 'info';

  message = '';

  constructor(service: DialogService) {
    this.products = service.getProducts();
  }

  checkAvailable( value:any, product: Product) {
    this.type = value ? 'success' : 'error';
    this.message = product.Name + (value ? ' is available' : ' is not available');
    this.isVisible = true;
  }
}
