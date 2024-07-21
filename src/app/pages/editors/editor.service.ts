import { Injectable } from '@angular/core';

export class AutoData {
  names!: string[];

  surnames!: string[];

  positions!: string[];
}

const autoData: AutoData = {
  names: [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian', 'Ronald', 'Anthony', 'Kevin', 'Jason', 'Jeff', 'Mary', 'Patricia', 'Linda', 'Barbara', 'Elizabeth', 'Jennifer', 'Maria', 'Susan', 'Margaret', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah',
  ],
  surnames: [
    'Anderson', 'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins'],
  positions: [
    'CEO', 'COO', 'CTO', 'CMO', 'HR Manager', 'IT Manager', 'Controller', 'Sales Manager', 'Support Manager'],
};

const federalHolidays: Date[] = [
  new Date(2017, 0, 1),
  new Date(2017, 0, 2),
  new Date(2017, 0, 16),
  new Date(2017, 1, 20),
  new Date(2017, 4, 29),
  new Date(2017, 6, 4),
  new Date(2017, 8, 4),
  new Date(2017, 9, 9),
  new Date(2017, 10, 11),
  new Date(2017, 10, 23),
  new Date(2017, 11, 25),
];


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

const simpleProducts: string[] = [
  'HD Video Player',
  'SuperHD Video Player',
  'SuperPlasma 50',
  'SuperLED 50',
  'SuperLED 42',
  'SuperLCD 55',
  'SuperLCD 42',
  'SuperPlasma 65',
  'SuperLCD 70',
  'Projector Plus',
  'Projector PlusHT',
  'ExcelRemote IR',
  'ExcelRemote BT',
  'ExcelRemote IP',
];

const products: Product[] = [{
  ID: 1,
  Name: 'HD Video Player',
  Price: 330,
  Current_Inventory: 225,
  Backorder: 0,
  Manufacturing: 10,
  Category: 'Video Players',
  ImageSrc: '/assets/images/products/1-small.png',
}, {
  ID: 2,
  Name: 'SuperHD Player',
  Price: 400,
  Current_Inventory: 150,
  Backorder: 0,
  Manufacturing: 25,
  Category: 'Video Players',
  ImageSrc: '/assets/images/products/2-small.png',
}, {
  ID: 3,
  Name: 'SuperPlasma 50',
  Price: 2400,
  Current_Inventory: 0,
  Backorder: 0,
  Manufacturing: 0,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/3-small.png',
}, {
  ID: 4,
  Name: 'SuperLED 50',
  Price: 1600,
  Current_Inventory: 77,
  Backorder: 0,
  Manufacturing: 55,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/4-small.png',
}, {
  ID: 5,
  Name: 'SuperLED 42',
  Price: 1450,
  Current_Inventory: 445,
  Backorder: 0,
  Manufacturing: 0,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/5-small.png',
}, {
  ID: 6,
  Name: 'SuperLCD 55',
  Price: 1350,
  Current_Inventory: 345,
  Backorder: 0,
  Manufacturing: 5,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/6-small.png',
}, {
  ID: 7,
  Name: 'SuperLCD 42',
  Price: 1200,
  Current_Inventory: 210,
  Backorder: 0,
  Manufacturing: 20,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/7-small.png',
}, {
  ID: 8,
  Name: 'SuperPlasma 65',
  Price: 3500,
  Current_Inventory: 0,
  Backorder: 0,
  Manufacturing: 0,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/8-small.png',
}, {
  ID: 9,
  Name: 'SuperLCD 70',
  Price: 4000,
  Current_Inventory: 95,
  Backorder: 0,
  Manufacturing: 5,
  Category: 'Televisions',
  ImageSrc: '/assets/images/products/9-small.png',
}, {
  ID: 10,
  Name: 'DesktopLED 21',
  Price: 175,
  Current_Inventory: 0,
  Backorder: 425,
  Manufacturing: 75,
  Category: 'Monitors',
  ImageSrc: '/assets/images/products/10-small.png',
}, {
  ID: 11,
  Name: 'DesktopLED 19',
  Price: 165,
  Current_Inventory: 425,
  Backorder: 0,
  Manufacturing: 110,
  Category: 'Monitors',
  ImageSrc: '/assets/images/products/11-small.png',
}, {
  ID: 12,
  Name: 'DesktopLCD 21',
  Price: 170,
  Current_Inventory: 210,
  Backorder: 0,
  Manufacturing: 60,
  Category: 'Monitors',
  ImageSrc: '/assets/images/products/12-small.png',
}, {
  ID: 13,
  Name: 'DesktopLCD 19',
  Price: 160,
  Current_Inventory: 150,
  Backorder: 0,
  Manufacturing: 210,
  Category: 'Monitors',
  ImageSrc: '/assets/images/products/13-small.png',
}, {
  ID: 14,
  Name: 'Projector Plus',
  Price: 550,
  Current_Inventory: 0,
  Backorder: 55,
  Manufacturing: 10,
  Category: 'Projectors',
  ImageSrc: '/assets/images/products/14-small.png',
}, {
  ID: 15,
  Name: 'Projector PlusHD',
  Price: 750,
  Current_Inventory: 110,
  Backorder: 0,
  Manufacturing: 90,
  Category: 'Projectors',
  ImageSrc: '/assets/images/products/15-small.png',
}, {
  ID: 16,
  Name: 'Projector PlusHT',
  Price: 1050,
  Current_Inventory: 0,
  Backorder: 75,
  Manufacturing: 57,
  Category: 'Projectors',
  ImageSrc: '/assets/images/products/16-small.png',
}, {
  ID: 17,
  Name: 'ExcelRemote IR',
  Price: 150,
  Current_Inventory: 650,
  Backorder: 0,
  Manufacturing: 190,
  Category: 'Automation',
  ImageSrc: '/assets/images/products/17-small.png',
}, {
  ID: 18,
  Name: 'ExcelRemote BT',
  Price: 180,
  Current_Inventory: 310,
  Backorder: 0,
  Manufacturing: 0,
  Category: 'Automation',
  ImageSrc: '/assets/images/products/18-small.png',
}, {
  ID: 19,
  Name: 'ExcelRemote IP',
  Price: 200,
  Current_Inventory: 0,
  Backorder: 325,
  Manufacturing: 225,
  Category: 'Automation',
  ImageSrc: '/assets/images/products/19-small.png',
}];

const content = 'Prepare 2013 Marketing Plan: We need to double revenues in 2013 and our marketing strategy is going to be key here. R&D is improving existing products and creating new products so we can deliver great AV equipment to our customers.Robert, please make certain to create a PowerPoint presentation for the members of the executive team.';


@Injectable({
  providedIn: 'root'
})
export class EditorService {

  constructor() { }

  getContent() {
    return content;
  }

  getNames() {
    return autoData.names;
  }

  getSurnames() {
    return autoData.surnames;
  }

  getPositions() {
    return autoData.positions;
  }

  getFederalHolidays() : Date[] {
    return federalHolidays;
  }

  getSimpleProducts(): string[] {
    return simpleProducts;
  }

  getProducts(): Product[] {
    return products;
  }

}