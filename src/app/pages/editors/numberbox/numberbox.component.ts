import { Component } from '@angular/core';
import { DxNumberBoxTypes } from 'devextreme-angular/ui/number-box';

@Component({
  selector: 'app-numberbox',
  templateUrl: './numberbox.component.html',
  styleUrl: './numberbox.component.scss'
})
export class NumberboxComponent {
  keyDown(e: DxNumberBoxTypes.KeyDownEvent) {
    const event = e.event;
    if (event){
      const str = event.key;
      if (/^[.,e]$/.test(str)) {
        event.preventDefault();
      }
    }
  }
}

