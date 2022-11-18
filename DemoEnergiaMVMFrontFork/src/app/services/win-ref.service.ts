import { Injectable } from '@angular/core';

const w = () => {
  return window;
}

@Injectable({
  providedIn: 'root'
})
export class WinRefService {
  prueba: string;

  constructor() {
    this.prueba = 'prueba';
  }
  get window(): any {
    return w();
  }

}
