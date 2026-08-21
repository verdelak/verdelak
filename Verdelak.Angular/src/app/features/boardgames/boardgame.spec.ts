import { TestBed } from '@angular/core/testing';

import { BoardgameService } from './boardgame';

describe('Boardgame', () => {
  let service: BoardgameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardgameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
