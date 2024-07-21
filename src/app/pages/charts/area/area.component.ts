import { Component } from '@angular/core';
import { ChartService, Population } from '../chart.service';

@Component({
  selector: 'app-area',
  templateUrl: './area.component.html',
  styleUrl: './area.component.scss'
})
export class AreaComponent {
  populationData: Population[];

  types: string[] = ['area', 'stackedarea', 'fullstackedarea'];

  constructor(service: ChartService) {
    this.populationData = service.getPopulationData();
  }
}




