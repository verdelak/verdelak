import { Component } from '@angular/core';
import { ChartService, Week } from '../chart.service';

@Component({
  selector: 'app-bullet',
  templateUrl: './bullet.component.html',
  styleUrl: './bullet.component.scss',
  providers: [ChartService],
})
export class BulletComponent {
  weeksData: Week[];

  constructor(service: ChartService) {
    this.weeksData = service.getWeeksData();
  }

  customizeTooltip(arg: { value: any; target: any; }) {
    return {
      text: `Current t&#176: ${arg.value}&#176C<br>` + `Average t&#176: ${arg.target}&#176C`,
    };
  }
}
