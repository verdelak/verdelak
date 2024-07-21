import { Component } from '@angular/core';
import { EditorService, Product } from '../editor.service';
import ArrayStore from 'devextreme/data/array_store';
import { DxTagBoxTypes } from 'devextreme-angular/ui/tag-box';

@Component({
  selector: 'app-tagbox',
  templateUrl: './tagbox.component.html',
  styleUrl: './tagbox.component.scss',
  providers: [EditorService]
})
export class TagboxComponent {

  simpleProducts: string[];

  editableProducts: string[];

  dataSource: ArrayStore;

  product!: Product;

  value: number[];

  target!: any;

  visible = false;

  constructor(service: EditorService) {
    this.dataSource = new ArrayStore({
      data: service.getProducts(),
      key: 'Id',
    });
    this.simpleProducts = service.getSimpleProducts();
    this.editableProducts = this.simpleProducts.slice();
    this.value = [1, 2];
  }

  onCustomItemCreating(args: any) {
    const newValue = args.text;
    const isItemInDataSource = this.editableProducts.some((item) => item === newValue);
    if (!isItemInDataSource) {
      this.editableProducts.unshift(newValue);
    }
    args.customItem = newValue;
  }

  onMouseEnter({ target }: MouseEvent, product: Product) {
    this.target = target;
    this.product = product;
    this.visible = true;
  }

  onMouseLeave() {
    this.target = null;
    this.visible = false;
  }

  isDisabled(product: Product) {
    return product.Name === 'SuperHD Video Player';
  }

  getAltText(text: String) {
    return `${text}. Picture`;
  }

}






