import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RpgBrowser } from './rpg-browser';

describe('RpgBrowser', () => {
  let component: RpgBrowser;
  let fixture: ComponentFixture<RpgBrowser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpgBrowser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RpgBrowser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
