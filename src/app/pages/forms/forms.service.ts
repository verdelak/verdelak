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
}



