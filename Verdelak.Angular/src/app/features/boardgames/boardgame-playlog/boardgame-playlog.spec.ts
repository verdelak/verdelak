import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardgamePlaylogComponent } from './boardgame-playlog';

describe('BoardgamePlaylog', () => {
  let component: BoardgamePlaylogComponent;
  let fixture: ComponentFixture<BoardgamePlaylogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardgamePlaylogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardgamePlaylogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
