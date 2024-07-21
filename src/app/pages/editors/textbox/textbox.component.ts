import { Component } from '@angular/core';
import { DxTextBoxTypes } from 'devextreme-angular/ui/text-box';

@Component({
  selector: 'app-textbox',
  templateUrl: './textbox.component.html',
  styleUrl: './textbox.component.scss'
})
export class TextboxComponent {
  emailValue = 'smith@corp.com';

  rules = { X: /[02-9]/ };

  valueChanged(data: DxTextBoxTypes.ValueChangedEvent) {
    this.emailValue = `${data.value.replace(/\s/g, '').toLowerCase()}@corp.com`;
  }
}