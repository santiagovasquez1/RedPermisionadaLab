import { TiposContratos } from './../../models/EnumTiposContratos';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.css']
})
export class AsideComponent implements OnInit {
  tipoContrato: TiposContratos
  showTableroPrincipal = false;
  @Output() onLinkClickEvent: EventEmitter<void>;
  constructor() {
    this.tipoContrato = parseInt(localStorage.getItem('tipoAgente')) as TiposContratos;
    this.onLinkClickEvent = new EventEmitter<void>();
  }

  ngOnInit(): void {
  }

  onLinkClick() {
    this.onLinkClickEvent.emit();
  }

}
