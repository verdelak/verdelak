import { Component } from '@angular/core';

@Component({
  selector: 'app-bar',
  templateUrl: './gaugebar.component.html',
  styleUrl: './gaugebar.component.scss'
})
export class GaugeBarComponent {
  customizeText(arg: any) {
    return `${arg.valueText} %`;
  }
}
