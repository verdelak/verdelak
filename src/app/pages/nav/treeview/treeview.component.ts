import { Component } from '@angular/core';
import { NavigationService, TreeProduct } from '../navigation.service';
import { DxTreeViewTypes } from 'devextreme-angular/ui/tree-view';
@Component({
  selector: 'app-treeview',
  templateUrl: './treeview.component.html',
  styleUrl: './treeview.component.scss',
  providers: [NavigationService],
})
export class TreeviewComponent {

  products: TreeProduct[];

  currentItem: TreeProduct;

  constructor(service: NavigationService) {
    this.products = service.getTreeProducts();
    this.currentItem = this.products[0];
  }

  selectItem(e: DxTreeViewTypes.ItemClickEvent) {
    this.currentItem = e.itemData as TreeProduct;
  }
}





