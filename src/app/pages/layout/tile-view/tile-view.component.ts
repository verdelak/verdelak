import { Component } from '@angular/core';
import { LayoutService, Home } from '../../layout.service';

@Component({
  selector: 'app-tile-view',
  templateUrl: './tile-view.component.html',
  styleUrl: './tile-view.component.scss',
  providers: [LayoutService]
})
export class TileViewComponent {
  homes: Home[];

  constructor(service: LayoutService) {
    this.homes = service.getHomes();
  }
}



