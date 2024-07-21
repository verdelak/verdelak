import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { LayoutService } from '../../layout.service';
import { DxScrollViewComponent } from 'devextreme-angular';
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';
import { DxScrollViewTypes } from 'devextreme-angular/ui/scroll-view';
import { ScrollbarMode } from 'devextreme/common';

@Component({
  selector: 'app-scroll-view',
  templateUrl: './scroll-view.component.html',
  styleUrl: './scroll-view.component.scss',
  providers: [LayoutService]
})
export class ScrollViewComponent implements AfterViewInit {
  @ViewChild(DxScrollViewComponent, { static: false }) scrollView!: DxScrollViewComponent;

  showScrollbarModes: { text: string, value: ScrollbarMode }[] = [
    {
      text: 'On Scroll',
      value: 'onScroll',
    }, {
      text: 'On Hover',
      value: 'onHover',
    }, {
      text: 'Always',
      value: 'always',
    }, {
      text: 'Never',
      value: 'never',
    },
  ];

  content: string;

  updateContentTimer: unknown;

  scrollByContent = true;

  scrollByThumb = true;

  scrollbarMode: ScrollbarMode = this.showScrollbarModes[0].value;

  pullDown = false;

  constructor(service: LayoutService) {
    this.content = service.getContent();
  }

  ngAfterViewInit() {
    this.scrollView.instance.option('onReachBottom', this.updateBottomContent);
  }

  valueChanged = (data: DxCheckBoxTypes.ValueChangedEvent) => {
    this.scrollView.instance.option('onReachBottom', data.value ? this.updateBottomContent : undefined);
  };

  updateContent = (args: DxScrollViewTypes.PullDownEvent | DxScrollViewTypes.ReachBottomEvent, eventName: string) => {
    const updateContentText = `<br /><div>Content has been updated on the ${eventName} event.</div><br />`;
    if (this.updateContentTimer) { clearTimeout(this.updateContentTimer as number); }
    this.updateContentTimer = setTimeout(() => {
      this.content = (eventName == 'PullDown' ? updateContentText + this.content : this.content + updateContentText);
      args.component.release(false);
    }, 500);
  };

  updateTopContent = (e: DxScrollViewTypes.PullDownEvent) => {
    this.updateContent(e, 'PullDown');
  };

  updateBottomContent = (e: DxScrollViewTypes.ReachBottomEvent) => {
    this.updateContent(e, 'ReachBottom');
  };
}