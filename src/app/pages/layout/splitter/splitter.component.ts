import { Component } from '@angular/core';

@Component({
  selector: 'app-splitter',
  templateUrl: './splitter.component.html',
  styleUrl: './splitter.component.scss'
})
export class SplitterComponent {
  dimensionOptions = new Set(['size', 'minSize', 'maxSize', 'collapsedSize']);

  paneContentTemplates: PaneContentTemplate[] = [
    { name: 'Left Pane' },
    { name: 'Central Pane' },
    { name: 'Right Pane' },
    { name: 'Nested Left Pane' },
    { name: 'Nested Central Pane' },
    { name: 'Nested Right Pane' },
  ];

  getPaneState(data: any): string {
    if (data.resizable !== false && !data.collapsible) {
      return 'Resizable only';
    }
    const resizableText = data.resizable ? 'Resizable' : 'Non-resizable';
    const collapsibleText = data.collapsible ? 'collapsible' : 'non-collapsible';

    return `${resizableText} and ${collapsibleText}`;
  }

  filterDimensionOptions(data: any): { key: string; value: any }[] {
    return Object.entries(data)
      .reverse()
      .filter(([key]) => this.dimensionOptions.has(key))
      .map(([key, value]) => ({ key, value }));
  }
}


interface PaneContentTemplate {
  name: string;
  data?: any;
}

