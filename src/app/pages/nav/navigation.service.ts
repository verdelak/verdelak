import { Injectable } from '@angular/core';

export class Company {
  ID!: number;

  CompanyName!: string;

  Address!: string;

  City!: string;

  State!: string;

  Zipcode!: number;

  Phone!: string;

  Fax!: string;

  Website!: string;
}

const companies: Company[] = [{
  ID: 1,
  CompanyName: 'Super Mart of the West',
  Address: '702 SW 8th Street',
  City: 'Bentonville',
  State: 'Arkansas',
  Zipcode: 72716,
  Phone: '(800) 555-2797',
  Fax: '(800) 555-2171',
  Website: 'http://www.nowebsitesupermart.dx',
}, {
  ID: 2,
  CompanyName: 'Electronics Depot',
  Address: '2455 Paces Ferry Road NW',
  City: 'Atlanta',
  State: 'Georgia',
  Zipcode: 30339,
  Phone: '(800) 595-3232',
  Fax: '(800) 595-3231',
  Website: 'http://www.nowebsitedepot.dx',
}, {
  ID: 3,
  CompanyName: 'K&S Music',
  Address: '1000 Nicllet Mall',
  City: 'Minneapolis',
  State: 'Minnesota',
  Zipcode: 55403,
  Phone: '(612) 304-6073',
  Fax: '(612) 304-6074',
  Website: 'http://www.nowebsitemusic.dx',
}, {
  ID: 4,
  CompanyName: "Tom's Club",
  Address: '999 Lake Drive',
  City: 'Issaquah',
  State: 'Washington',
  Zipcode: 98027,
  Phone: '(800) 955-2292',
  Fax: '(800) 955-2293',
  Website: 'http://www.nowebsitetomsclub.dx',
}];


export class Product {
  id!: string;

  name!: string;

  icon?: string;

  price?: number;

  disabled?: boolean;

  items?: Product[];
}

const products: Product[] = [{
  id: '1',
  name: 'Video Players',
  items: [{
    id: '1_1',
    name: 'HD Video Player',
    price: 220,
    icon: '/assets/images/products/1.png',
  }, {
    id: '1_2',
    name: 'SuperHD Video Player',
    icon: '/assets/images/products/2.png',
    price: 270,
  }],
}, {
  id: '2',
  name: 'Televisions',
  items: [{
    id: '2_1',
    name: 'SuperLCD 42',
    icon: '/assets/images/products/7.png',
    price: 1200,
  }, {
    id: '2_2',
    name: 'SuperLED 42',
    icon: '/assets/images/products/5.png',
    price: 1450,
  }, {
    id: '2_3',
    name: 'SuperLED 50',
    icon: '/assets/images/products/4.png',
    price: 1600,
  }, {
    id: '2_4',
    name: 'SuperLCD 55 (Not available)',
    icon: '/assets/images/products/6.png',
    price: 1350,
    disabled: true,
  }, {
    id: '2_5',
    name: 'SuperLCD 70',
    icon: '/assets/images/products/9.png',
    price: 4000,
  }],
}, {
  id: '3',
  name: 'Monitors',
  items: [{
    id: '3_1',
    name: '19"',
    items: [{
      id: '3_1_1',
      name: 'DesktopLCD 19',
      icon: '/assets/images/products/10.png',
      price: 160,
    }],
  }, {
    id: '3_2',
    name: '21"',
    items: [{
      id: '3_2_1',
      name: 'DesktopLCD 21',
      icon: '/assets/images/products/12.png',
      price: 170,
    }, {
      id: '3_2_2',
      name: 'DesktopLED 21',
      icon: '/assets/images/products/13.png',
      price: 175,
    }],
  }],
}, {
  id: '4',
  name: 'Projectors',
  items: [{
    id: '4_1',
    name: 'Projector Plus',
    icon: '/assets/images/products/14.png',
    price: 550,
  }, {
    id: '4_2',
    name: 'Projector PlusHD',
    icon: '/assets/images/products/15.png',
    price: 750,
  }],
}];

export class Tab {
  id!: number;

  text?: string;

  icon?: string;
}

const tabsWithText: Tab[] = [
  {
    id: 0,
    text: 'User',
  },
  {
    id: 1,
    text: 'Analytics',
  },
  {
    id: 2,
    text: 'Clients',
  },
  {
    id: 3,
    text: 'Orders',
  },
  {
    id: 4,
    text: 'Favorites',
  },
  {
    id: 5,
    text: 'Search',
  },
];

const tabsWithIcon: Tab[] = [
  {
    id: 0,
    icon: 'user',
  },
  {
    id: 1,
    icon: 'chart',
  },
  {
    id: 2,
    icon: 'accountbox',
  },
  {
    id: 3,
    icon: 'ordersbox',
  },
  {
    id: 4,
    icon: 'bookmark',
  },
  {
    id: 5,
    icon: 'search',
  },
];

const tabsWithIconAndText: Tab[] = [
  {
    id: 0,
    text: 'User',
    icon: 'user',
  },
  {
    id: 1,
    text: 'Analytics',
    icon: 'chart',
  },
  {
    id: 2,
    text: 'Clients',
    icon: 'accountbox',
  },
  {
    id: 3,
    text: 'Orders',
    icon: 'ordersbox',
  },
  {
    id: 4,
    text: 'Favorites',
    icon: 'bookmark',
  },
  {
    id: 5,
    text: 'Search',
    icon: 'search',
  },
];


export class Task {
  status!: string;

  priority!: string;

  text!: string;

  date!: string;

  assignedBy!: string;
}

export class TabPanelItem {
  icon!: string;

  title!: string;

  tasks!: Task[];
}

const tasks: Task[] = [
  {
    status: 'Not Started',
    priority: 'high',
    text: 'Revenue Projections',
    date: '2023/09/16',
    assignedBy: 'John Heart',
  },
  {
    status: 'Not Started',
    priority: 'high',
    text: 'New Brochures',
    date: '2023/09/16',
    assignedBy: 'Samantha Bright',
  },
  {
    status: 'Not Started',
    priority: 'medium',
    text: 'Training',
    date: '2023/09/16',
    assignedBy: 'Arthur Miller',
  },
  {
    status: 'Not Started',
    priority: 'medium',
    text: 'NDA',
    date: '2023/09/16',
    assignedBy: 'Robert Reagan',
  },
  {
    status: 'Not Started',
    priority: 'low',
    text: 'Health Insurance',
    date: '2023/09/16',
    assignedBy: 'Greta Sims',
  },

  {
    status: 'Help Needed',
    priority: 'low',
    text: 'TV Recall',
    date: '2023/09/16',
    assignedBy: 'Brett Wade',
  },
  {
    status: 'Help Needed',
    priority: 'low',
    text: 'Recall and Refund Forms',
    date: '2023/09/16',
    assignedBy: 'Sandra Johnson',
  },
  {
    status: 'Help Needed',
    priority: 'high',
    text: 'Shippers',
    date: '2023/09/16',
    assignedBy: 'Ed Holmes',
  },
  {
    status: 'Help Needed',
    priority: 'medium',
    text: 'Hardware Upgrade',
    date: '2023/09/16',
    assignedBy: 'Barb Banks',
  },

  {
    status: 'In Progress',
    priority: 'medium',
    text: 'Online Sales',
    date: '2023/09/16',
    assignedBy: 'Cindy Stanwick',
  },
  {
    status: 'In Progress',
    priority: 'medium',
    text: 'New Website Design',
    date: '2023/09/16',
    assignedBy: 'Sammy Hill',
  },
  {
    status: 'In Progress',
    priority: 'low',
    text: 'Bandwidth Increase',
    date: '2023/09/16',
    assignedBy: 'Davey Jones',
  },
  {
    status: 'In Progress',
    priority: 'medium',
    text: 'Support',
    date: '2023/09/16',
    assignedBy: 'Victor Norris',
  },
  {
    status: 'In Progress',
    priority: 'low',
    text: 'Training Material',
    date: '2023/09/16',
    assignedBy: 'John Heart',
  },

  {
    status: 'Deferred',
    priority: 'medium',
    text: 'New Database',
    date: '2023/09/16',
    assignedBy: 'Samantha Bright',
  },
  {
    status: 'Deferred',
    priority: 'high',
    text: 'Automation Server',
    date: '2023/09/16',
    assignedBy: 'Arthur Miller',
  },
  {
    status: 'Deferred',
    priority: 'medium',
    text: 'Retail Sales',
    date: '2023/09/16',
    assignedBy: 'Robert Reagan',
  },
  {
    status: 'Deferred',
    priority: 'medium',
    text: 'Shipping Labels',
    date: '2023/09/16',
    assignedBy: 'Greta Sims',
  },

  {
    status: 'Rejected',
    priority: 'high',
    text: 'Schedule Meeting with Sales Team',
    date: '2023/09/16',
    assignedBy: 'Sandra Johnson',
  },
  {
    status: 'Rejected',
    priority: 'medium',
    text: 'Confirm Availability for Sales Meeting',
    date: '2023/09/16',
    assignedBy: 'Ed Holmes',
  },
  {
    status: 'Rejected',
    priority: 'medium',
    text: 'Reschedule Sales Team Meeting',
    date: '2023/09/16',
    assignedBy: 'Barb Banks',
  },
  {
    status: 'Rejected',
    priority: 'high',
    text: 'Update Database with New Leads',
    date: '2023/09/16',
    assignedBy: 'Kevin Carter',
  },
  {
    status: 'Rejected',
    priority: 'low',
    text: 'Send Territory Sales Breakdown',
    date: '2023/09/16',
    assignedBy: 'Cindy Stanwick',
  },

  {
    status: 'Completed',
    priority: 'medium',
    text: 'Territory Sales Breakdown Report',
    date: '2023/09/16',
    assignedBy: 'Sammy Hill',
  },
  {
    status: 'Completed',
    priority: 'low',
    text: 'Return Merchandise Report',
    date: '2023/09/16',
    assignedBy: 'Davey Jones',
  },
  {
    status: 'Completed',
    priority: 'high',
    text: 'Staff Productivity Report',
    date: '2023/09/16',
    assignedBy: 'Victor Norris',
  },
  {
    status: 'Completed',
    priority: 'medium',
    text: 'Review HR Budget Company Wide',
    date: '2023/09/16',
    assignedBy: 'Mary Stern',
  },
];

export const dataSource: TabPanelItem[] = [
  {
    icon: 'description',
    title: 'Not Started',
    tasks: tasks.filter((item) => item.status === 'Not Started'),
  },
  {
    icon: 'taskhelpneeded',
    title: 'Help Needed',
    tasks: tasks.filter((item) => item.status === 'Help Needed'),
  },
  {
    icon: 'taskinprogress',
    title: 'In Progress',
    tasks: tasks.filter((item) => item.status === 'In Progress'),
  },
  {
    icon: 'taskstop',
    title: 'Deferred',
    tasks: tasks.filter((item) => item.status === 'Deferred'),
  },
  {
    icon: 'taskrejected',
    title: 'Rejected',
    tasks: tasks.filter((item) => item.status === 'Rejected'),
  },
  {
    icon: 'taskcomplete',
    title: 'Completed',
    tasks: tasks.filter((item) => item.status === 'Completed'),
  },
];

export class TabProductType {
  id!: number;

  text!: string;
}

export class TabProduct {
  text!: string;

  type!: number;
}

const tabProductTypes: TabProductType[] = [{
  id: 1,
  text: 'All',
}, {
  id: 2,
  text: 'Video Players',
}, {
  id: 3,
  text: 'Televisions',
}, {
  id: 4,
  text: 'Monitors',
}, {
  id: 5,
  text: 'Projectors',
}];

const tabProducts: TabProduct[] = [{
  text: 'HD Video Player',
  type: 2,
}, {
  text: 'SuperHD Video Player',
  type: 2,
}, {
  text: 'SuperLCD 42',
  type: 3,
}, {
  text: 'SuperLED 42',
  type: 3,
}, {
  text: 'SuperLED 50',
  type: 3,
}, {
  text: 'SuperLCD 55',
  type: 3,
}, {
  text: 'DesktopLCD 19',
  type: 4,
}, {
  text: 'DesktopLCD 21',
  type: 4,
}, {
  text: 'DesktopLED 21',
  type: 4,
}, {
  text: 'Projector Plus',
  type: 5,
}, {
  text: 'Projector PlusHD',
  type: 5,
}];

export class TreeProduct {
  id!: string;

  text?: string;

  expanded?: boolean;

  items?: TreeProduct[];

  price?: number;

  image?: string;
}

const TreeProducts: TreeProduct[] = [{
  id: '1',
  text: 'Stores',
  expanded: true,
  items: [{
    id: '1_1',
    text: 'Super Mart of the West',
    expanded: true,
    items: [{
      id: '1_1_1',
      text: 'Video Players',
      items: [{
        id: '1_1_1_1',
        text: 'HD Video Player',
        price: 220,
        image: '/assets/images/products/1.png',
      }, {
        id: '1_1_1_2',
        text: 'SuperHD Video Player',
        image: '/assets/images/products/2.png',
        price: 270,
      }],
    }, {
      id: '1_1_2',
      text: 'Televisions',
      expanded: true,
      items: [{
        id: '1_1_2_1',
        text: 'SuperLCD 42',
        image: '/assets/images/products/7.png',
        price: 1200,
      }, {
        id: '1_1_2_2',
        text: 'SuperLED 42',
        image: '/assets/images/products/5.png',
        price: 1450,
      }, {
        id: '1_1_2_3',
        text: 'SuperLED 50',
        image: '/assets/images/products/4.png',
        price: 1600,
      }, {
        id: '1_1_2_4',
        text: 'SuperLCD 55',
        image: '/assets/images/products/6.png',
        price: 1350,
      }, {
        id: '1_1_2_5',
        text: 'SuperLCD 70',
        image: '/assets/images/products/9.png',
        price: 4000,
      }],
    }, {
      id: '1_1_3',
      text: 'Monitors',
      expanded: true,
      items: [{
        id: '1_1_3_1',
        text: '19"',
        expanded: true,
        items: [{
          id: '1_1_3_1_1',
          text: 'DesktopLCD 19',
          image: '/assets/images/products/10.png',
          price: 160,
        }],
      }, {
        id: '1_1_3_2',
        text: '21"',
        items: [{
          id: '1_1_3_2_1',
          text: 'DesktopLCD 21',
          image: '/assets/images/products/12.png',
          price: 170,
        }, {
          id: '1_1_3_2_2',
          text: 'DesktopLED 21',
          image: '/assets/images/products/13.png',
          price: 175,
        }],
      }],
    }, {
      id: '1_1_4',
      text: 'Projectors',
      items: [{
        id: '1_1_4_1',
        text: 'Projector Plus',
        image: '/assets/images/products/14.png',
        price: 550,
      }, {
        id: '1_1_4_2',
        text: 'Projector PlusHD',
        image: '/assets/images/products/15.png',
        price: 750,
      }],
    }],

  }, {
    id: '1_2',
    text: 'Braeburn',
    items: [{
      id: '1_2_1',
      text: 'Video Players',
      items: [{
        id: '1_2_1_1',
        text: 'HD Video Player',
        image: '/assets/images/products/1.png',
        price: 240,
      }, {
        id: '1_2_1_2',
        text: 'SuperHD Video Player',
        image: '/assets/images/products/2.png',
        price: 300,
      }],
    }, {
      id: '1_2_2',
      text: 'Televisions',
      items: [{
        id: '1_2_2_1',
        text: 'SuperPlasma 50',
        image: '/assets/images/products/3.png',
        price: 1800,
      }, {
        id: '1_2_2_2',
        text: 'SuperPlasma 65',
        image: '/assets/images/products/8.png',
        price: 3500,
      }],
    }, {
      id: '1_2_3',
      text: 'Monitors',
      items: [{
        id: '1_2_3_1',
        text: '19"',
        items: [{
          id: '1_2_3_1_1',
          text: 'DesktopLCD 19',
          image: '/assets/images/products/10.png',
          price: 170,
        }],
      }, {
        id: '1_2_3_2',
        text: '21"',
        items: [{
          id: '1_2_3_2_1',
          text: 'DesktopLCD 21',
          image: '/assets/images/products/12.png',
          price: 180,
        }, {
          id: '1_2_3_2_2',
          text: 'DesktopLED 21',
          image: '/assets/images/products/13.png',
          price: 190,
        }],
      }],
    }],

  }, {
    id: '1_3',
    text: 'E-Mart',
    items: [{
      id: '1_3_1',
      text: 'Video Players',
      items: [{
        id: '1_3_1_1',
        text: 'HD Video Player',
        image: '/assets/images/products/1.png',
        price: 220,
      }, {
        id: '1_3_1_2',
        text: 'SuperHD Video Player',
        image: '/assets/images/products/2.png',
        price: 275,
      }],
    }, {
      id: '1_3_3',
      text: 'Monitors',
      items: [{
        id: '1_3_3_1',
        text: '19"',
        items: [{
          id: '1_3_3_1_1',
          text: 'DesktopLCD 19',
          image: '/assets/images/products/10.png',
          price: 165,
        }],
      }, {
        id: '1_3_3_2',
        text: '21"',
        items: [{
          id: '1_3_3_2_1',
          text: 'DesktopLCD 21',
          image: '/assets/images/products/12.png',
          price: 175,
        }],
      }],
    }],
  }, {
    id: '1_4',
    text: 'Walters',
    items: [{
      id: '1_4_1',
      text: 'Video Players',
      items: [{
        id: '1_4_1_1',
        text: 'HD Video Player',
        image: '/assets/images/products/1.png',
        price: 210,
      }, {
        id: '1_4_1_2',
        text: 'SuperHD Video Player',
        image: '/assets/images/products/2.png',
        price: 250,
      }],
    }, {
      id: '1_4_2',
      text: 'Televisions',
      items: [{
        id: '1_4_2_1',
        text: 'SuperLCD 42',
        image: '/assets/images/products/7.png',
        price: 1100,
      }, {
        id: '1_4_2_2',
        text: 'SuperLED 42',
        image: '/assets/images/products/5.png',
        price: 1400,
      }, {
        id: '1_4_2_3',
        text: 'SuperLED 50',
        image: '/assets/images/products/4.png',
        price: 1500,
      }, {
        id: '1_4_2_4',
        text: 'SuperLCD 55',
        image: '/assets/images/products/6.png',
        price: 1300,
      }, {
        id: '1_4_2_5',
        text: 'SuperLCD 70',
        image: '/assets/images/products/9.png',
        price: 4000,
      }, {
        id: '1_4_2_6',
        text: 'SuperPlasma 50',
        image: '/assets/images/products/3.png',
        price: 1700,
      }],
    }, {
      id: '1_4_3',
      text: 'Monitors',
      items: [{
        id: '1_4_3_1',
        text: '19"',
        items: [{
          id: '1_4_3_1_1',
          text: 'DesktopLCD 19',
          image: '/assets/images/products/10.png',
          price: 160,
        }],
      }, {
        id: '1_4_3_2',
        text: '21"',
        items: [{
          id: '1_4_3_2_1',
          text: 'DesktopLCD 21',
          image: '/assets/images/products/12.png',
          price: 170,
        }, {
          id: '1_4_3_2_2',
          text: 'DesktopLED 21',
          image: '/assets/images/products/13.png',
          price: 180,
        }],
      }],
    }, {
      id: '1_4_4',
      text: 'Projectors',
      items: [{
        id: '1_4_4_1',
        text: 'Projector Plus',
        image: '/assets/images/products/14.png',
        price: 550,
      }, {
        id: '1_4_4_2',
        text: 'Projector PlusHD',
        image: '/assets/images/products/15.png',
        price: 750,
      }],
    }],

  }],
}];

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor() { }
  getTreeProducts(): TreeProduct[] {
    return TreeProducts;
  }

  getTabProductTypes(): TabProductType[] {
    return tabProductTypes;
  }

  getTabProducts(): TabProduct[] {
    return tabProducts;
  }

  getCompanies(): Company[] {
    return companies;
  }

  getProducts(): Product[] {
    return products;
  }

  getTabsWithText(): Tab[] {
    return tabsWithText;
  }

  getTabsWithIconAndText(): Tab[] {
    return tabsWithIconAndText;
  }

  getTabsWithIcon(): Tab[] {
    return tabsWithIcon;
  }

  getItems(): TabPanelItem[] {
    return dataSource;
  }

}




