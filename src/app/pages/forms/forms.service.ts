import { Injectable } from '@angular/core';

export class Alignment {
  icon!: string;

  alignment!: string;

  hint!: string;
}

export class FontStyle {
  icon!: string;

  style!: string;

  hint!: string;
}

const alignments: Alignment[] = [
  {
    icon: 'alignleft',
    alignment: 'left',
    hint: 'Align left',
  },
  {
    icon: 'aligncenter',
    alignment: 'center',
    hint: 'Center',
  },
  {
    icon: 'alignright',
    alignment: 'right',
    hint: 'Align right',
  },
  {
    icon: 'alignjustify',
    alignment: 'justify',
    hint: 'Justify',
  },
];

const fontStyle: FontStyle[] = [
  {
    icon: 'bold',
    style: 'bold',
    hint: 'Bold',
  },
  {
    icon: 'italic',
    style: 'italic',
    hint: 'Italic',
  },
  {
    icon: 'underline',
    style: 'underline',
    hint: 'Underlined',
  },
  {
    icon: 'strike',
    style: 'strike',
    hint: 'Strikethrough',
  },
];


export class Task {
  subject!: string;

  priority!: number;
}

export class PriorityEntity {
  id!: number;

  text!: string;
}

const priorityEntities: PriorityEntity[] = [
  { id: 0, text: 'Low' },
  { id: 1, text: 'Normal' },
  { id: 2, text: 'Urgent' },
  { id: 3, text: 'High' },
];

const tasks: Task[] = [{
  subject: 'Choose between PPO and HMO Health Plan',
  priority: 3,
}, {
  subject: 'Non-Compete Agreements',
  priority: 0,
}, {
  subject: 'Comment on Revenue Projections',
  priority: 1,
}, {
  subject: 'Sign Updated NDA',
  priority: 2,
}, {
  subject: 'Submit Questions Regarding New NDA',
  priority: 3,
}, {
  subject: 'Rollout of New Website and Marketing Brochures',
  priority: 3,
}];



@Injectable({
  providedIn: 'root'
})
export class FormsService {

  constructor() { }

  getAlignments() : Alignment[] {
    return alignments;
  }

  getFontStyles() : FontStyle[] {
    return fontStyle;
  }

  getTasks(): Task[] {
    return tasks;
  }

  getPriorityEntities(): PriorityEntity[] {
    return priorityEntities;
  }

  getProducts(): Product[] {
    return products;
  }

  getPeriods(): MonthPeriod[] {
    return periods;
  }
}



export class Product {
  weight!: string;

  appleCost!: number;

  orangeCost!: number;
}

const products: Product[] = [
  { weight: '1', appleCost: 3, orangeCost: 7 },
  { weight: '2', appleCost: 20, orangeCost: 14 },
  { weight: '3', appleCost: 21, orangeCost: 21 },
  { weight: '4', appleCost: 22, orangeCost: 28 },
  { weight: '5', appleCost: 25, orangeCost: 35 },
  { weight: '6', appleCost: 30, orangeCost: 42 },
  { weight: '7', appleCost: 35, orangeCost: 44 },
  { weight: '8', appleCost: 42, orangeCost: 45 },
  { weight: '9', appleCost: 49, orangeCost: 46 },
  { weight: '10', appleCost: 60, orangeCost: 47 },
];


export class MonthPeriod {
  date!: string;

  dayT!: number;

  nightT!: number;
}

const periods: MonthPeriod[] = [{ date: '2013/03/01', dayT: 7, nightT: 2 },
  { date: '2013/03/02', dayT: 4, nightT: -1 },
  { date: '2013/03/03', dayT: 4, nightT: -2 },
  { date: '2013/03/04', dayT: 6, nightT: -3 },
  { date: '2013/03/05', dayT: 9, nightT: -1 },
  { date: '2013/03/06', dayT: 6, nightT: 3 },
  { date: '2013/03/07', dayT: 3, nightT: 1 },
  { date: '2013/03/08', dayT: 6, nightT: -1 },
  { date: '2013/03/09', dayT: 13, nightT: 2 },
  { date: '2013/03/10', dayT: 10, nightT: 2 },
  { date: '2013/03/11', dayT: 12, nightT: 4 },
  { date: '2013/03/12', dayT: 14, nightT: 6 },
  { date: '2013/03/13', dayT: 11, nightT: 3 },
  { date: '2013/03/14', dayT: 5, nightT: -2 },
  { date: '2013/03/15', dayT: 8, nightT: -1 },
  { date: '2013/03/16', dayT: 5, nightT: 0 },
  { date: '2013/03/17', dayT: 3, nightT: -2 },
  { date: '2013/03/18', dayT: 2, nightT: -2 },
  { date: '2013/03/19', dayT: 6, nightT: 1 },
  { date: '2013/03/20', dayT: 7, nightT: 0 },
  { date: '2013/03/21', dayT: 4, nightT: -1 },
  { date: '2013/03/22', dayT: 5, nightT: -2 },
  { date: '2013/03/23', dayT: 8, nightT: 0 },
  { date: '2013/03/24', dayT: 8, nightT: 1 },
  { date: '2013/03/25', dayT: 4, nightT: 2 },
  { date: '2013/03/26', dayT: 12, nightT: 3 },
  { date: '2013/03/27', dayT: 12, nightT: 2 },
  { date: '2013/03/28', dayT: 11, nightT: 3 },
  { date: '2013/03/29', dayT: 13, nightT: 4 },
  { date: '2013/03/30', dayT: 15, nightT: 4 },
  { date: '2013/03/31', dayT: 12, nightT: 7 },
];

