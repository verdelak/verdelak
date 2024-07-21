import { Component } from '@angular/core';
import { LayoutService, Order } from '../../layout.service';

@Component({
  selector: 'app-resizable',
  templateUrl: './resizable.component.html',
  styleUrl: './resizable.component.scss',
  providers: [LayoutService],
})
export class ResizableComponent {
  handleValues: string[] = ['left', 'top', 'right', 'bottom'];

  keepAspectRatio = true;

  handles: string[] = ['left', 'top', 'right', 'bottom'];

  orders: Order[];

  resizableClasses = '';

  constructor(service: LayoutService) {
    this.orders = service.getOrders();
  }

  handlesValueChange(value: any) {
    this.resizableClasses = this.handleValues.reduce((acc, handle) => {
      const newClass = value.includes(handle) ? '' : ` no-${handle}-handle`;
      return acc + newClass;
    }, 'dx-resizable');
  }
}
