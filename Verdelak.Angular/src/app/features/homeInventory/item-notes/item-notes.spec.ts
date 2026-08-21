import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemNotes } from './item-notes';

describe('ItemNotes', () => {
  let component: ItemNotes;
  let fixture: ComponentFixture<ItemNotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemNotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemNotes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
