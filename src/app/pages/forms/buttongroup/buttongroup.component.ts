import { Component } from '@angular/core';
import { FormsService, Alignment, FontStyle } from '../forms.service';

@Component({
  selector: 'app-buttongroup',
  templateUrl: './buttongroup.component.html',
  styleUrl: './buttongroup.component.scss',
  providers: [FormsService]
})
export class ButtongroupComponent {
  alignments: Alignment[];

  fontStyles: FontStyle[];

  constructor(service: FormsService) {
    this.alignments = service.getAlignments();
    this.fontStyles = service.getFontStyles();
  }

  itemClick(e:any) {
    alert(`The "${e.itemData.hint}" button was clicked`);
  }
}
