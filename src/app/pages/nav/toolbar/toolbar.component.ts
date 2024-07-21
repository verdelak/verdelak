import { Component } from '@angular/core';
import { NavigationService, TabProductType } from '../navigation.service';
import DataSource from 'devextreme/data/data_source';
import { DxSelectBoxTypes } from 'devextreme-angular/ui/select-box';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  providers: [NavigationService]
})
export class ToolbarComponent {
  items!: TabProductType[];

  productTypes: TabProductType[];

  productsStore: DataSource;

  selectBoxOptions: DxSelectBoxTypes.Properties;

  backButtonOptions: DxButtonTypes.Properties = {
    icon: 'back',
    onClick: () => {
      alert('Back button has been clicked!');
    },
  };

  refreshButtonOptions: DxButtonTypes.Properties = {
    icon: 'refresh',
    onClick: () => {
      alert('Refresh button has been clicked!');
    },
  };

  addButtonOptions: DxButtonTypes.Properties = {
    icon: 'plus',
    onClick: () => {
      alert('Add button has been clicked!');
    },
  };

  saveButtonOptions: DxButtonTypes.Properties = {
    text: 'Save',
    onClick: () => {
      alert('Save option has been clicked!');
    },
  };

  printButtonOptions: DxButtonTypes.Properties = {
    text: 'Print',
    onClick: () => {
      alert('Print option has been clicked!');
    },
  };

  settingsButtonOptions: DxButtonTypes.Properties = {
    text: 'Settings',
    onClick: () => {
      alert('Settings option has been clicked!');
    },
  };

  constructor(service: NavigationService) {
    this.productTypes = service.getTabProductTypes();
    this.productsStore = new DataSource(service.getTabProducts());

    this.selectBoxOptions = {
      width: 140,
      items: this.productTypes,
      valueExpr: 'id',
      displayExpr: 'text',
      value: this.productTypes[0].id,
      inputAttr: { 'aria-label': 'Categories' },
      onValueChanged: ({ value }) => {
        this.productsStore.filter(
          (value > 1)
            ? ['type', '=', value]
            : null,
        );

        this.productsStore.load();
      },
    };
  }
}
