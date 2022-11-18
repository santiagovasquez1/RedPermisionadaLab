import { Component, OnInit,Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-mapa-colombia',
  templateUrl: './mapa-colombia.component.html',
  styleUrls: ['./mapa-colombia.component.css'] 
})
export class MapaColombiaComponent implements OnInit {

  @Output() departamento = new EventEmitter<string>();
  constructor() { }

  ngOnInit(): void {
  }

  dptoSeleccionado(dpto: string): void{
    console.log("Seleccionado el departamento: ",dpto);
    this.departamento.emit(dpto);
  }

}
