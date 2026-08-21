import { TestBed } from '@angular/core/testing';

import { SpookytownService } from './spookytown-service';

describe('SpookytownService', () => {
  let service: SpookytownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpookytownService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
