import { Component } from '@angular/core';
import { ChartService, BarData } from '../chart.service';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrl: './bar.component.scss',
  providers: [ChartService],
})
export class BarComponent {
  dataSource: BarData[];

  constructor(service: ChartService) {
    this.dataSource = service.getBarData();
  }
}
