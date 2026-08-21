import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardgameListComponent } from './boardgame-list';

describe('BoardgameList', () => {
  let component: BoardgameListComponent;
  let fixture: ComponentFixture<BoardgameListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardgameListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardgameListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
