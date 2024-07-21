import { Component } from '@angular/core';
import { ChartService, PopulationByRegion } from '../chart.service';
import { PercentPipe } from '@angular/common';

@Component({
  selector: 'app-donut',
  templateUrl: './donut.component.html',
  styleUrl: './donut.component.scss'
})
export class DonutComponent {
  pipe = new PercentPipe('en-US');

  populationByRegions: PopulationByRegion[];

  constructor(service: ChartService) {
    this.populationByRegions = service.getPopulationByRegions();
  }

  customizeTooltip = ({ valueText, percent }: { valueText: string, percent: number }) => ({
    text: `${valueText} - ${this.pipe.transform(percent, '1.2-2')}`,
  });
}
