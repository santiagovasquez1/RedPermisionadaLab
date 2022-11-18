import { TestBed } from '@angular/core/testing';

import { AutenticacionInterceptor } from './autenticacion.interceptor';

describe('AutenticacionInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      AutenticacionInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: AutenticacionInterceptor = TestBed.inject(AutenticacionInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
