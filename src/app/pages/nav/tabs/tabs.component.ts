import { Component, ViewChild } from '@angular/core';
import { NavigationService, Tab } from '../navigation.service';
import { DxTabsComponent } from 'devextreme-angular';
import { DxSelectBoxTypes } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';
import { DxTabsTypes } from 'devextreme-angular/ui/tabs';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  providers: [NavigationService]
})
export class TabsComponent {

  
  @ViewChild('withText') withText!: DxTabsComponent;

  @ViewChild('withIconAndText') withIconAndText!: DxTabsComponent;

  @ViewChild('withIcon') withIcon!: DxTabsComponent;

  tabsWithText: Tab[];

  tabsWithIconAndText: Tab[];

  tabsWithIcon: Tab[];

  showNavButtons = false;

  scrollByContent = false;

  rtlEnabled = false;

  orientations: DxTabsTypes.Orientation[] = ['horizontal', 'vertical'];

  stylingModes: DxTabsTypes.TabsStyle[] = ['primary', 'secondary'];

  iconPositions: DxTabsTypes.TabsIconPosition[] = ['top', 'start', 'end', 'bottom'];

  width = 'auto';

  orientation = this.orientations[0];

  stylingMode = this.stylingModes[1];

  iconPosition = this.iconPositions[0];

  widgetWrapperClasses = {
    'widget-wrapper': true,
    'widget-wrapper-horizontal': true,
    'widget-wrapper-vertical': false,
    'strict-width': false,
  };
  
  constructor(service: NavigationService) {
    this.tabsWithText = service.getTabsWithText();
    this.tabsWithIconAndText = service.getTabsWithIconAndText();
    this.tabsWithIcon = service.getTabsWithIcon();
  }

  onOrientationChanged(e: DxSelectBoxTypes.ValueChangedEvent) {
    if (e.value === 'vertical') {
      this.widgetWrapperClasses['widget-wrapper-vertical'] = true;
      this.widgetWrapperClasses['widget-wrapper-horizontal'] = false;
    } else {
      this.widgetWrapperClasses['widget-wrapper-horizontal'] = true;
      this.widgetWrapperClasses['widget-wrapper-vertical'] = false;
    }
  }

  toggleStrictWidthClass() {
    this.widgetWrapperClasses['strict-width'] = this.scrollByContent || this.showNavButtons;
  }

  onFullWidthChanged(e: DxCheckBoxTypes.ValueChangedEvent) {
    this.width = e.value ? '100%' : 'auto';
  }

}

