import { Component } from '@angular/core';
import { SchedulerServiceService, Appointment } from './scheduler-service.service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.scss'
})
export class SchedulerComponent {
  appointmentsData: Appointment[];

  currentDate: Date = new Date(2021, 2, 28);

  constructor(service: SchedulerServiceService) {
    this.appointmentsData = service.getAppointments();
  }

  markWeekEnd = (cellData:any) => {
    function isWeekEnd(date:any) {
      const day = date.getDay();
      return day === 0 || day === 6;
    }
    const classObject = {};
    //classObject[`employee-${cellData.groups.employeeID}`] = true;
    //classObject[`employee-weekend-${cellData.groups.employeeID}`] = isWeekEnd(cellData.startDate);
    return classObject;
  };
  
  markTraining = (cellData:any) => {
    const classObject = {
      'day-cell': true,
    };
    return classObject;
  };
}