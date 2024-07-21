import { Component } from '@angular/core';
import { NavigationService, TabPanelItem } from '../navigation.service';
import { DxTabPanelTypes } from 'devextreme-angular/ui/tab-panel';

@Component({
  selector: 'app-tab-panel',
  templateUrl: './tab-panel.component.html',
  styleUrl: './tab-panel.component.scss',
  providers: [NavigationService],
})
export class TabPanelComponent {
  dataSource: TabPanelItem[];

  tabsPositions: DxTabPanelTypes.Position[] = [
    'left', 'top', 'right', 'bottom',
  ];

  tabsPosition: DxTabPanelTypes.Position = this.tabsPositions[0];

  stylingModes: DxTabPanelTypes.TabsStyle[] = ['secondary', 'primary'];

  stylingMode: DxTabPanelTypes.TabsStyle = this.stylingModes[0];

  iconPositions: DxTabPanelTypes.TabsIconPosition[] = [
    'top', 'start', 'end', 'bottom',
  ];

  iconPosition: DxTabPanelTypes.TabsIconPosition = this.iconPositions[0];

  constructor(service: NavigationService) {
    this.dataSource = service.getItems();
  }

  getTaskItemClasses(priority: string) {
    return `task-item task-item-priority-${priority}`;
  }
}
