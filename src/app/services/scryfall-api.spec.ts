import { TestBed } from '@angular/core/testing';

import { ScryfallApi } from './scryfall-api';

describe('ScryfallApi', () => {
  let service: ScryfallApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScryfallApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
