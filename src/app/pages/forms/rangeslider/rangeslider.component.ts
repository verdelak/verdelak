import { Component } from '@angular/core';

@Component({
  selector: 'app-rangeslider',
  templateUrl: './rangeslider.component.html',
  styleUrl: './rangeslider.component.scss'
})
export class RangesliderComponent {
  start = 10;

  end = 90;

  format = (value: unknown) => `${value}%`;

  label:  any = {
    visible: true,
    format: (value: unknown) => this.format(value),
    position: 'top',
  };

  tooltip: any = {
    enabled: true,
    format: (value: unknown) => this.format(value),
    showMode: 'always',
    position: 'bottom',
  };

  tooltipEnabled = {
    enabled: true,
  };
}
