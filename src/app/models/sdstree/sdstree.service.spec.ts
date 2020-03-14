import { TestBed } from '@angular/core/testing';

import { SdstreeService } from './sdstree.service';

describe('SdstreeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SdstreeService = TestBed.get(SdstreeService);
    expect(service).toBeTruthy();
  });
});
