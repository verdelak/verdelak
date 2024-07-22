import { Component } from '@angular/core';
import { EditorService } from '../editor.service';

@Component({
  selector: 'app-datebox',
  templateUrl: './datebox.component.html',
  styleUrl: './datebox.component.scss',
  providers: [EditorService]
})
export class DateboxComponent {
  value: Date = new Date(1981, 3, 27);

  now: Date = new Date();

  firstWorkDay2017: Date = new Date(2017, 0, 3);

  min: Date = new Date(1900, 0, 1);

  dateClear = new Date(2015, 11, 1, 6);

  disabledDates: Date[];

  constructor(private service: EditorService) {
    this.disabledDates = service.getFederalHolidays();
  }

  get diffInDay() {
    return `${Math.floor(Math.abs(((new Date()).getTime() - this.value.getTime()) / (24 * 60 * 60 * 1000)))} days`;
  }
}
