import { Component, ViewChild, AfterViewInit, enableProdMode, NgModule
} from '@angular/core';

import { Options as DataSourceConfig } from 'devextreme/ui/pivot_grid/data_source';
import { GridService } from './pivot.service';
import { DxChartComponent, DxPivotGridComponent } from 'devextreme-angular';

if (!/localhost/.test(document.location.host)) {
  enableProdMode();
}

@Component({
  selector: 'app-pivot-grid',
  templateUrl: './pivot-grid.component.html',
  styleUrl: './pivot-grid.component.scss'
})
export class PivotGridComponent implements AfterViewInit {
  @ViewChild(DxPivotGridComponent, { static: false }) pivotGrid!: DxPivotGridComponent;

  @ViewChild(DxChartComponent, { static: false }) chart!: DxChartComponent;

  pivotGridDataSource: DataSourceConfig;

  constructor(service: GridService) {
    this.customizeTooltip = this.customizeTooltip.bind(this);

    this.pivotGridDataSource = {
      fields: [{
        caption: 'Region',
        width: 120,
        dataField: 'region',
        area: 'row',
        sortBySummaryField: 'Total',
      }, {
        caption: 'City',
        dataField: 'city',
        width: 150,
        area: 'row',
      }, {
        dataField: 'date',
        dataType: 'date',
        area: 'column',
      }, {
        groupName: 'date',
        groupInterval: 'month',
        visible: false,
      }, {
        caption: 'Total',
        dataField: 'amount',
        dataType: 'number',
        summaryType: 'sum',
        format: 'currency',
        area: 'data',
      }],
      store: service.getSales(),
    };
  }

  ngAfterViewInit() {
    this.pivotGrid.instance.bindChart(this.chart.instance, {
      dataFieldsDisplayMode: 'splitPanes',
      alternateDataFields: false,
    });

    setTimeout(() => {
      const dataSource = this.pivotGrid.instance.getDataSource();
      dataSource.expandHeaderItem('row', ['North America']);
      dataSource.expandHeaderItem('column', [2013]);
    }, 0);
  }

  customizeTooltip(args: { seriesName: any; valueText: any; }) {
    return {
      html: `${args.seriesName} | Total<div class='currency'>${args.valueText}</div>`,
    };
  }
}
