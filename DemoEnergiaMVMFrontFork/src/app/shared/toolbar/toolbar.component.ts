import { Component, OnInit } from '@angular/core';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {
  tipoContrato: TiposContratos
  constructor() {
    this.tipoContrato = parseInt(localStorage.getItem('tipoAgente')) as TiposContratos;
  }

  ngOnInit(): void {
  }

}
