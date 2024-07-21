import { Injectable } from '@angular/core';

  let content = ''

  export class Home {
    ID!: string;
  
    Address!: string;
  
    City!: string;
  
    State!: string;
  
    Price!: number;
  
    ImageSrc!: string;
  
    heightRatio?: number;
  
    widthRatio?: number;
  }
  
  const homes: Home[] = [{
    ID: '1',
    Address: '652 Avonwick Gate',
    City: 'Toronto',
    State: 'ON',
    Price: 780000,
    ImageSrc: '/assets/images/gallery/1.jpg',
  }, {
    ID: '2',
    Address: '328 S Kerema Ave',
    City: 'Milford',
    State: 'CT',
    Price: 350000,
    ImageSrc: '/assets/images/gallery/3.jpg',
  }, {
    ID: '3',
    Address: '8512 Tanglewood Cir',
    City: 'Reform',
    State: 'AL',
    Price: 250000,
    ImageSrc: '/assets/images/gallery/6.jpg',
    widthRatio: 2,
  }, {
    ID: '4',
    Address: '6351 Forrest St',
    City: 'Jersey City',
    State: 'NJ',
    Price: 320000,
    ImageSrc: '/assets/images/gallery/14.jpg',
  }, {
    ID: '5',
    Address: '61207 16th St N',
    City: 'Moorhead',
    State: 'MN',
    Price: 1700000,
    ImageSrc: '/assets/images/gallery/5.jpg',
    heightRatio: 2,
    widthRatio: 2,
  }, {
    ID: '6',
    Address: '5119 Beryl Dr',
    City: 'San Antonio',
    State: 'TX',
    Price: 455000,
    ImageSrc: '/assets/images/gallery/4.jpg',
  }, {
    ID: '7',
    Address: '7121 Bailey St',
    City: 'Worcester',
    State: 'MA',
    Price: 555000,
    ImageSrc: '/assets/images/gallery/7.jpg',
  }, {
    ID: '8',
    Address: '82649 Topeka St',
    City: 'Riverbank',
    State: 'CA',
    Price: 1750000,
    ImageSrc: '/assets/images/gallery/2.jpg',
    heightRatio: 2,
  }, {
    ID: '9',
    Address: '7700 Elmwood Dr',
    City: 'Cleveland',
    State: 'OK',
    Price: 470000,
    ImageSrc: '/assets/images/gallery/17.jpg',
    heightRatio: 2,
    widthRatio: 2,
  }, {
    ID: '10',
    Address: '620201 Plymouth Rd',
    City: 'Detroit',
    State: 'MI',
    Price: 610000,
    ImageSrc: '/assets/images/gallery/8.jpg',
  }, {
    ID: '11',
    Address: '1198 Theresa Cir',
    City: 'Whitinsville',
    State: 'MA',
    Price: 320000,
    ImageSrc: '/assets/images/gallery/9.jpg',
  }, {
    ID: '12',
    Address: '4815 Warbler Ln',
    City: 'Rockport',
    State: 'TX',
    Price: 700000,
    ImageSrc: '/assets/images/gallery/12.jpg',
  }, {
    ID: '13',
    Address: '420234 Rogge St',
    City: 'Detroit',
    State: 'MI',
    Price: 320000,
    ImageSrc: '/assets/images/gallery/23.jpg',
  }, {
    ID: '14',
    Address: '114840 Interlake Ave N',
    City: 'Seattle',
    State: 'WA',
    Price: 400000,
    ImageSrc: '/assets/images/gallery/22.jpg',
  }, {
    ID: '15',
    Address: '13673 Pearl Dr #7',
    City: 'Monroe',
    State: 'MI',
    Price: 399000,
    ImageSrc: '/assets/images/gallery/20.jpg',
  }, {
    ID: '16',
    Address: '15447 Via Viento',
    City: 'Atascadero',
    State: 'CA',
    Price: 1100000,
    ImageSrc: '/assets/images/gallery/21.jpg',
  }];

  export interface Image {
    imageAlt: string,
    imageSrc: string,
  }
  
  const images: Image[] = [
    {
      imageAlt: 'Image 1',
      imageSrc: '/assets/images/gallery/1.jpg',
    },
    {
      imageAlt: 'Image 2',
      imageSrc: '/assets/images/gallery/2.jpg',
    },
    {
      imageAlt: 'Image 3',
      imageSrc: '/assets/images/gallery/3.jpg',
    },
    {
      imageAlt: 'Image 4',
      imageSrc: '/assets/images/gallery/4.jpg',
    },
    {
      imageAlt: 'Image 5',
      imageSrc: '/assets/images/gallery/5.jpg',
    },
    {
      imageAlt: 'Image 6',
      imageSrc: '/assets/images/gallery/6.jpg',
    },
    {
      imageAlt: 'Image 7',
      imageSrc: '/assets/images/gallery/7.jpg',
    },
    {
      imageAlt: 'Image 8',
      imageSrc: '/assets/images/gallery/8.jpg',
    },
    {
      imageAlt: 'Image 9',
      imageSrc: '/assets/images/gallery/9.jpg',
    },
  ];

  export class Order {
    ID!: number;
  
    OrderNumber!: number;
  
    OrderDate!: string;
  
    SaleAmount!: number;
  
    Terms!: string;
  
    CustomerStoreState!: string;
  
    CustomerStoreCity!: string;
  
    Employee!: string;
  }
  
  const orders: Order[] = [{
    ID: 1,
    OrderNumber: 35703,
    OrderDate: '2014/04/10',
    SaleAmount: 11800,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'Los Angeles',
    Employee: 'Harv Mudd',
  }, {
    ID: 4,
    OrderNumber: 35711,
    OrderDate: '2014/01/12',
    SaleAmount: 16050,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'San Jose',
    Employee: 'Jim Packard',
  }, {
    ID: 5,
    OrderNumber: 35714,
    OrderDate: '2014/01/22',
    SaleAmount: 14750,
    Terms: '15 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Las Vegas',
    Employee: 'Harv Mudd',
  }, {
    ID: 7,
    OrderNumber: 35983,
    OrderDate: '2014/02/07',
    SaleAmount: 3725,
    Terms: '15 Days',
    CustomerStoreState: 'Colorado',
    CustomerStoreCity: 'Denver',
    Employee: 'Todd Hoffman',
  }, {
    ID: 9,
    OrderNumber: 36987,
    OrderDate: '2014/03/11',
    SaleAmount: 14200,
    Terms: '15 Days',
    CustomerStoreState: 'Utah',
    CustomerStoreCity: 'Salt Lake City',
    Employee: 'Clark Morgan',
  }, {
    ID: 11,
    OrderNumber: 38466,
    OrderDate: '2014/03/01',
    SaleAmount: 7800,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'Los Angeles',
    Employee: 'Harv Mudd',
  }, {
    ID: 14,
    OrderNumber: 39420,
    OrderDate: '2014/02/15',
    SaleAmount: 20500,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'San Jose',
    Employee: 'Jim Packard',
  }, {
    ID: 15,
    OrderNumber: 39874,
    OrderDate: '2014/02/04',
    SaleAmount: 9050,
    Terms: '30 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Las Vegas',
    Employee: 'Harv Mudd',
  }, {
    ID: 18,
    OrderNumber: 42847,
    OrderDate: '2014/02/15',
    SaleAmount: 20400,
    Terms: '30 Days',
    CustomerStoreState: 'Wyoming',
    CustomerStoreCity: 'Casper',
    Employee: 'Todd Hoffman',
  }, {
    ID: 19,
    OrderNumber: 43982,
    OrderDate: '2014/05/29',
    SaleAmount: 6050,
    Terms: '30 Days',
    CustomerStoreState: 'Utah',
    CustomerStoreCity: 'Salt Lake City',
    Employee: 'Clark Morgan',
  }, {
    ID: 29,
    OrderNumber: 56272,
    OrderDate: '2014/02/06',
    SaleAmount: 15850,
    Terms: '30 Days',
    CustomerStoreState: 'Utah',
    CustomerStoreCity: 'Salt Lake City',
    Employee: 'Clark Morgan',
  }, {
    ID: 30,
    OrderNumber: 57429,
    OrderDate: '2014/05/16',
    SaleAmount: 11050,
    Terms: '30 Days',
    CustomerStoreState: 'Arizona',
    CustomerStoreCity: 'Phoenix',
    Employee: 'Clark Morgan',
  }, {
    ID: 32,
    OrderNumber: 58292,
    OrderDate: '2014/05/13',
    SaleAmount: 13500,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'Los Angeles',
    Employee: 'Harv Mudd',
  }, {
    ID: 36,
    OrderNumber: 62427,
    OrderDate: '2014/01/27',
    SaleAmount: 23500,
    Terms: '15 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Las Vegas',
    Employee: 'Harv Mudd',
  }, {
    ID: 39,
    OrderNumber: 65977,
    OrderDate: '2014/02/05',
    SaleAmount: 2550,
    Terms: '15 Days',
    CustomerStoreState: 'Wyoming',
    CustomerStoreCity: 'Casper',
    Employee: 'Todd Hoffman',
  }, {
    ID: 40,
    OrderNumber: 66947,
    OrderDate: '2014/03/23',
    SaleAmount: 3500,
    Terms: '15 Days',
    CustomerStoreState: 'Utah',
    CustomerStoreCity: 'Salt Lake City',
    Employee: 'Clark Morgan',
  }, {
    ID: 42,
    OrderNumber: 68428,
    OrderDate: '2014/04/10',
    SaleAmount: 10500,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'Los Angeles',
    Employee: 'Harv Mudd',
  }, {
    ID: 43,
    OrderNumber: 69477,
    OrderDate: '2014/03/09',
    SaleAmount: 14200,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'Anaheim',
    Employee: 'Harv Mudd',
  }, {
    ID: 46,
    OrderNumber: 72947,
    OrderDate: '2014/01/14',
    SaleAmount: 13350,
    Terms: '30 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Las Vegas',
    Employee: 'Harv Mudd',
  }, {
    ID: 47,
    OrderNumber: 73088,
    OrderDate: '2014/03/25',
    SaleAmount: 8600,
    Terms: '30 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Reno',
    Employee: 'Clark Morgan',
  }, {
    ID: 50,
    OrderNumber: 76927,
    OrderDate: '2014/04/27',
    SaleAmount: 9800,
    Terms: '30 Days',
    CustomerStoreState: 'Utah',
    CustomerStoreCity: 'Salt Lake City',
    Employee: 'Clark Morgan',
  }, {
    ID: 51,
    OrderNumber: 77297,
    OrderDate: '2014/04/30',
    SaleAmount: 10850,
    Terms: '30 Days',
    CustomerStoreState: 'Arizona',
    CustomerStoreCity: 'Phoenix',
    Employee: 'Clark Morgan',
  }, {
    ID: 56,
    OrderNumber: 84744,
    OrderDate: '2014/02/10',
    SaleAmount: 4650,
    Terms: '30 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Las Vegas',
    Employee: 'Harv Mudd',
  }, {
    ID: 57,
    OrderNumber: 85028,
    OrderDate: '2014/05/17',
    SaleAmount: 2575,
    Terms: '30 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Reno',
    Employee: 'Clark Morgan',
  }, {
    ID: 59,
    OrderNumber: 87297,
    OrderDate: '2014/04/21',
    SaleAmount: 14200,
    Terms: '30 Days',
    CustomerStoreState: 'Wyoming',
    CustomerStoreCity: 'Casper',
    Employee: 'Todd Hoffman',
  }, {
    ID: 60,
    OrderNumber: 88027,
    OrderDate: '2014/02/14',
    SaleAmount: 13650,
    Terms: '30 Days',
    CustomerStoreState: 'Utah',
    CustomerStoreCity: 'Salt Lake City',
    Employee: 'Clark Morgan',
  }, {
    ID: 65,
    OrderNumber: 94726,
    OrderDate: '2014/05/22',
    SaleAmount: 20500,
    Terms: '15 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'San Jose',
    Employee: 'Jim Packard',
  }, {
    ID: 66,
    OrderNumber: 95266,
    OrderDate: '2014/03/10',
    SaleAmount: 9050,
    Terms: '15 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Las Vegas',
    Employee: 'Harv Mudd',
  }, {
    ID: 69,
    OrderNumber: 98477,
    OrderDate: '2014/01/01',
    SaleAmount: 23500,
    Terms: '15 Days',
    CustomerStoreState: 'Wyoming',
    CustomerStoreCity: 'Casper',
    Employee: 'Todd Hoffman',
  }, {
    ID: 70,
    OrderNumber: 99247,
    OrderDate: '2014/02/08',
    SaleAmount: 2100,
    Terms: '15 Days',
    CustomerStoreState: 'Utah',
    CustomerStoreCity: 'Salt Lake City',
    Employee: 'Clark Morgan',
  }, {
    ID: 78,
    OrderNumber: 174884,
    OrderDate: '2014/04/10',
    SaleAmount: 7200,
    Terms: '30 Days',
    CustomerStoreState: 'Colorado',
    CustomerStoreCity: 'Denver',
    Employee: 'Todd Hoffman',
  }, {
    ID: 81,
    OrderNumber: 188877,
    OrderDate: '2014/02/11',
    SaleAmount: 8750,
    Terms: '30 Days',
    CustomerStoreState: 'Arizona',
    CustomerStoreCity: 'Phoenix',
    Employee: 'Clark Morgan',
  }, {
    ID: 82,
    OrderNumber: 191883,
    OrderDate: '2014/02/05',
    SaleAmount: 9900,
    Terms: '30 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'Los Angeles',
    Employee: 'Harv Mudd',
  }, {
    ID: 83,
    OrderNumber: 192474,
    OrderDate: '2014/01/21',
    SaleAmount: 12800,
    Terms: '30 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'Anaheim',
    Employee: 'Harv Mudd',
  }, {
    ID: 84,
    OrderNumber: 193847,
    OrderDate: '2014/03/21',
    SaleAmount: 14100,
    Terms: '30 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'San Diego',
    Employee: 'Harv Mudd',
  }, {
    ID: 85,
    OrderNumber: 194877,
    OrderDate: '2014/03/06',
    SaleAmount: 4750,
    Terms: '30 Days',
    CustomerStoreState: 'California',
    CustomerStoreCity: 'San Jose',
    Employee: 'Jim Packard',
  }, {
    ID: 86,
    OrderNumber: 195746,
    OrderDate: '2014/05/26',
    SaleAmount: 9050,
    Terms: '30 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Las Vegas',
    Employee: 'Harv Mudd',
  }, {
    ID: 87,
    OrderNumber: 197474,
    OrderDate: '2014/03/02',
    SaleAmount: 6400,
    Terms: '30 Days',
    CustomerStoreState: 'Nevada',
    CustomerStoreCity: 'Reno',
    Employee: 'Clark Morgan',
  }, {
    ID: 88,
    OrderNumber: 198746,
    OrderDate: '2014/05/09',
    SaleAmount: 15700,
    Terms: '30 Days',
    CustomerStoreState: 'Colorado',
    CustomerStoreCity: 'Denver',
    Employee: 'Todd Hoffman',
  }, {
    ID: 91,
    OrderNumber: 214222,
    OrderDate: '2014/02/08',
    SaleAmount: 11050,
    Terms: '30 Days',
    CustomerStoreState: 'Arizona',
    CustomerStoreCity: 'Phoenix',
    Employee: 'Clark Morgan',
  }];
  
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
;

  constructor() { }

  getContent() {
    for (let i = 0; i < 10; i++) {
      content += 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n';
    }
    content += '<br />';

    return content;
  }

  getHomes(): Home[] {
    return homes;
  }

  getImages() {
    return images;
  }

  getOrders() {
    return orders;
  }
}








