import { Component } from '@angular/core';
import { DialogService, Employee } from '../dialog.service';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
  providers: [DialogService]
})
export class PopupComponent {
  currentEmployee: Employee = new Employee();

  employees: Employee[];

  popupVisible = false;

  moreInfoButtonOptions: Record<string, unknown>;

  emailButtonOptions: Record<string, unknown>;

  closeButtonOptions: Record<string, unknown>;

  positionOf!: string;

  constructor(service: DialogService) {
    this.employees = service.getEmployees();
    this.moreInfoButtonOptions = {
      text: 'More info',
      onClick: () => {
        const message = `More info about ${this.currentEmployee.FirstName} ${this.currentEmployee.LastName}`;
        alert(message);
      },
    };
    this.emailButtonOptions = {
      icon: 'email',
      stylingMode: 'contained',
      text: 'Send',
      onClick: () => {
        const message = `Email is sent to ${this.currentEmployee.FirstName} ${this.currentEmployee.LastName}`;
        alert(message);
      },
    };
    this.closeButtonOptions = {
      text: 'Close',
      stylingMode: 'outlined',
      type: 'normal',
      onClick: () => {
        this.popupVisible = false;
      },
    };
  }

  detailsButtonMouseEnter(id: number) {
    this.positionOf = `#image${id}`;
  }

  showInfo(employee: Employee) {
    this.currentEmployee = employee;
    this.popupVisible = true;
  }
}
