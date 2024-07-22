import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor() { }

  getProducts() : Product[] {
    return products;
  }

  getEmployees(): Employee[] {
    return employees;
  }
}


export class Product {
  ID!: number;

  Name!: string;

  Price!: number;

  Current_Inventory!: number;

  Backorder!: number;

  Manufacturing!: number;

  Category!: string;

  ImageSrc!: string;
}

const products: Product[] = [{
  ID: 4,
  Name: 'SuperLED 50',
  Price: 1600,
  Current_Inventory: 77,
  Backorder: 0,
  Manufacturing: 55,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/4.png',
}, {
  ID: 5,
  Name: 'SuperLED 42',
  Price: 1450,
  Current_Inventory: 445,
  Backorder: 0,
  Manufacturing: 0,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/5.png',
}, {
  ID: 6,
  Name: 'SuperLCD 55',
  Price: 1350,
  Current_Inventory: 345,
  Backorder: 0,
  Manufacturing: 5,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/6.png',
}, {
  ID: 7,
  Name: 'SuperLCD 42',
  Price: 1200,
  Current_Inventory: 210,
  Backorder: 0,
  Manufacturing: 20,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/7.png',
}];


export class Employee {
  ID!: number;

  FirstName!: string;

  LastName!: string;

  Prefix!: string;

  Position!: string;

  Picture!: string;

  BirthDate!: string;

  HireDate!: string;

  Notes!: string;

  Address!: string;
}

const employees: Employee[] = [{
  ID: 7,
  FirstName: 'Sandra',
  LastName: 'Johnson',
  Prefix: 'Mrs.',
  Position: 'Controller',
  Picture: '/assets/images/photos/06.png',
  BirthDate: '1974/11/15',
  HireDate: '2005/05/11',
  Notes: "Sandra is a CPA and has been our controller since 2008. She loves to interact with staff so if you've not met her, be certain to say hi.\r\n\r\nSandra has 2 daughters both of whom are accomplished gymnasts.",
  Address: '4600 N Virginia Rd.',
}, {
  ID: 10,
  FirstName: 'Kevin',
  LastName: 'Carter',
  Prefix: 'Mr.',
  Position: 'Shipping Manager',
  Picture: '/assets/images/photos/07.png',
  BirthDate: '1978/01/09',
  HireDate: '2009/08/11',
  Notes: 'Kevin is our hard-working shipping manager and has been helping that department work like clockwork for 18 months.\r\n\r\nWhen not in the office, he is usually on the basketball court playing pick-up games.',
  Address: '424 N Main St.',
}, {
  ID: 11,
  FirstName: 'Cynthia',
  LastName: 'Stanwick',
  Prefix: 'Ms.',
  Position: 'HR Assistant',
  Picture: '/assets/images/photos/08.png',
  BirthDate: '1985/06/05',
  HireDate: '2008/03/24',
  Notes: 'Cindy joined us in 2008 and has been in the HR department for 2 years. \r\n\r\nShe was recently awarded employee of the month. Way to go Cindy!',
  Address: '2211 Bonita Dr.',
}, {
  ID: 30,
  FirstName: 'Kent',
  LastName: 'Samuelson',
  Prefix: 'Dr.',
  Position: 'Ombudsman',
  Picture: '/assets/images/photos/02.png',
  BirthDate: '1972/09/11',
  HireDate: '2009/04/22',
  Notes: 'As our ombudsman, Kent is on the front-lines solving customer problems and helping our partners address issues out in the field.    He is a classically trained musician and is a member of the Chamber Orchestra.',
  Address: '12100 Mora Dr',
}];

