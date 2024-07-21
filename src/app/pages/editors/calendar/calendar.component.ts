import { Component } from '@angular/core';
import { DxCalendarTypes } from 'devextreme-angular/ui/calendar';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  now = new Date();

  currentValue = new Date();

  zoomLevels: DxCalendarTypes.CalendarZoomLevel[] = [
    'month', 'year', 'decade', 'century',
  ];

  weekDays: { id: number; text: string }[] = [
    { id: 0, text: 'Sunday' },
    { id: 1, text: 'Monday' },
    { id: 2, text: 'Tuesday' },
    { id: 3, text: 'Wednesday' },
    { id: 4, text: 'Thursday' },
    { id: 5, text: 'Friday' },
    { id: 6, text: 'Saturday' },
  ];

  weekNumberRules: DxCalendarTypes.WeekNumberRule[] = [
    'auto', 'firstDay', 'firstFourDays', 'fullWeek',
  ];

  cellTemplate = 'cell';

  holidays = [[1, 0], [4, 6], [25, 11]];

  isWeekend(date: Date) {
    const day = date.getDay();

    return day === 0 || day === 6;
  }

  useCellTemplate(value: any) {
    this.cellTemplate = value ? 'custom' : 'cell';
  }

  getCellCssClass(stat: any) {
    let cssClass = '';

    if (stat.view === 'month') {
      if (!stat.date) {
        cssClass = 'week-number';
      } else {
        if (this.isWeekend(stat.date)) { cssClass = 'weekend'; }

        this.holidays.forEach((item) => {
          if (stat.date.getDate() === item[0] && stat.date.getMonth() === item[1]) {
            cssClass = 'holiday';
            return false;
          } else {
            return false;
          }
        });
      }
    }

    return cssClass;
  }
}