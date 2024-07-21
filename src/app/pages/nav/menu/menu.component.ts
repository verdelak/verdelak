import { Component } from '@angular/core';
import { NavigationService, Product } from '../navigation.service';
import { DxMenuTypes } from 'devextreme-angular/ui/menu';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  providers: [NavigationService]
})
export class MenuComponent {
  products: Product[];
  showFirstSubmenuModes: any;

  showSubmenuModes = [{
    name: 'onHover',
    delay: { show: 0, hide: 500 },
  }, {
    name: 'onClick',
    delay: { show: 0, hide: 300 },
  }];

 

  currentProduct!: Product;

  constructor(service: NavigationService) {
    this.products = service.getProducts();
    this. showFirstSubmenuModes = this.showSubmenuModes[1];
  }

  itemClick(data: DxMenuTypes.ItemClickEvent) {
    const item = data.itemData as Product;

    if (item.price) {
      this.currentProduct = item;
    }
  }
}
