import { Component } from '@angular/core';
import { TreeService, Task, Employee, Priority } from '../tree-service.service';


@Component({
  selector: 'app-tree-list',
  templateUrl: './tree-list.component.html',
  providers: [TreeService],
  styleUrl: './tree-list.component.scss'
})
export class TreeListComponent {
  tasks: Task[];

  employees: Employee[];

  priorities: Priority[];

  statuses: string[];

  constructor(service: TreeService) {
    this.tasks = service.getTasks();
    this.employees = service.getEmployees();
    this.priorities = service.getPriorities();

    this.statuses = [
      'Not Started',
      'Need Assistance',
      'In Progress',
      'Deferred',
      'Completed',
    ];
  }

  getCompletionText(cellInfo: { valueText: any; }) {
    return `${cellInfo.valueText}%`;
  }
}







