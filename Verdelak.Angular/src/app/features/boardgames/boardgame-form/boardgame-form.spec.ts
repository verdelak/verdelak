import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardgameFormComponent } from './boardgame-form';

describe('BoardgameForm', () => {
  let component: BoardgameFormComponent;
  let fixture: ComponentFixture<BoardgameFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardgameFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardgameFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
