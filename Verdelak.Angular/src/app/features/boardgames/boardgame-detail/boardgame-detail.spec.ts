import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardgameDetailComponent } from './boardgame-detail';

describe('BoardgameDetail', () => {
  let component: BoardgameDetailComponent;
  let fixture: ComponentFixture<BoardgameDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardgameDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardgameDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
