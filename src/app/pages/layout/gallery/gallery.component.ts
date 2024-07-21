import { Component } from '@angular/core';
import { LayoutService, Image } from '../../layout.service';
import { DxCheckBoxTypes } from 'devextreme-angular/ui/check-box';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  providers: [LayoutService]
})
export class GalleryComponent {
  dataSource: Image[];

  slideshowDelay = 2000;

  constructor(service: LayoutService) {
    this.dataSource = service.getImages();
  }

  valueChanged(e: DxCheckBoxTypes.ValueChangedEvent) {
    this.slideshowDelay = e.value ? 2000 : 0;
  }
}