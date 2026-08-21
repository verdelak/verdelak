import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemImageGallery } from './item-image-gallery';

describe('ItemImageGallery', () => {
  let component: ItemImageGallery;
  let fixture: ComponentFixture<ItemImageGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemImageGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemImageGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
