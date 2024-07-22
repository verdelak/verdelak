import { Component } from '@angular/core';
import { FormsService, PriorityEntity, Task} from '../forms.service';

@Component({
  selector: 'app-radiogroup',
  templateUrl: './radiogroup.component.html',
  styleUrl: './radiogroup.component.scss',
  providers: [FormsService]
})
export class RadiogroupComponent {
  priorityEntities: PriorityEntity[];

  selectionPriorityId: number;

  colorPriority: string;

  tasks: Task[];

  currentData: string[] = [];

  priorities = [
    'Low',
    'Normal',
    'Urgent',
    'High',
  ];

  constructor(service: FormsService) {
    this.tasks = service.getTasks();
    this.priorityEntities = service.getPriorityEntities();
    this.colorPriority = this.priorities[2];
    this.currentData[0] = this.tasks[1].subject;
    this.selectionPriorityId = this.priorityEntities[0].id;
  }

  onValueChanged( value: any) {
    this.currentData = [];

    this.tasks.forEach((item, index) => {
      if (item.priority == value) {
        this.currentData.push(this.tasks[index].subject);
      }
    });
  }
}
