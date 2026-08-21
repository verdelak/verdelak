import { TestBed } from '@angular/core/testing';

import { RpgService } from './rpg-service';

describe('RpgService', () => {
  let service: RpgService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RpgService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
