import { Component } from '@angular/core';
import { EditorService, Product } from '../editor.service';
import { DxSelectBoxTypes } from 'devextreme-angular/ui/select-box';
import ArrayStore from 'devextreme/data/array_store';

@Component({
  selector: 'app-selectbox',
  templateUrl: './selectbox.component.html',
  styleUrl: './selectbox.component.scss',
  providers: [EditorService]
})
export class SelectboxComponent {
  simpleProducts: string[];

  products: Product[];

  data: ArrayStore;

  constructor(service: EditorService) {
    this.products = service.getProducts();
    this.simpleProducts = service.getSimpleProducts();
    this.data = new ArrayStore({
      data: this.products,
      key: 'ID',
    });
  }

  onValueChanged({ value }: DxSelectBoxTypes.ValueChangedEvent) {
    alert(`The value is changed to: "${value}"`);
  }

}