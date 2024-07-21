import { Component } from '@angular/core';
import { EditorService } from '../editor.service';
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  providers: [EditorService]
})
export class TextareaComponent {
  valueChangeEvents = [{
    title: 'On Change',
    name: 'change',
  }, {
    title: 'On Key Up',
    name: 'keyup',
  }];

  eventValue: string;

  maxLength: any = null;

  value: string;

  valueForEditableTextArea: string;

  height: any = 90;

  autoResizeEnabled: boolean;

  constructor(private service: EditorService) {
    this.valueForEditableTextArea = this.service.getContent();
    this.value = this.service.getContent();
    this.eventValue = this.valueChangeEvents[0].name;
    this.autoResizeEnabled = false;
  }

  onCheckboxValueChanged({ value }: DxCheckBoxTypes.ValueChangedEvent) {
    let str = this.service.getContent();
    this.value = value ? str.substring(0, 100) : str;
    this.maxLength = value ? 100 : null;
  }

  onAutoResizeChanged({ value }: DxCheckBoxTypes.ValueChangedEvent) {
    this.height = value ? undefined : 90;
  }

}