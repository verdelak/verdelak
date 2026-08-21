import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RpgEdit } from './rpg-edit';

describe('RpgEdit', () => {
  let component: RpgEdit;
  let fixture: ComponentFixture<RpgEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpgEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RpgEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
