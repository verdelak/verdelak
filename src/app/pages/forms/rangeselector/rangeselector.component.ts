import { Component } from '@angular/core';
import { FormsService, Product, MonthPeriod } from '../forms.service';

@Component({
  selector: 'app-rangeselector',
  templateUrl: './rangeselector.component.html',
  styleUrl: './rangeselector.component.scss',
  providers: [FormsService]
})
export class RangeselectorComponent {
  dataSource: Product[];
  dataSource2: MonthPeriod[];


    
  startValue: Date = new Date(2024, 1, 1);
  endValue: Date = new Date(2024, 12, 1);

  constructor(service: FormsService) {
    this.dataSource = service.getProducts();
    this.dataSource2 = service.getPeriods();
  }
}
