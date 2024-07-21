import { Component } from '@angular/core';
import { NavigationService, Company } from '../navigation.service';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.scss',
  providers: [NavigationService],
})
export class AccordionComponent {
  companies: Company[];

  constructor(service: NavigationService) {
    this.companies = service.getCompanies();
  }
}
