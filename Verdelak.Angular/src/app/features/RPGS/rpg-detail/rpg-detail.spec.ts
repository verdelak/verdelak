import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RpgDetail } from './rpg-detail';

describe('RpgDetail', () => {
  let component: RpgDetail;
  let fixture: ComponentFixture<RpgDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpgDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RpgDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
