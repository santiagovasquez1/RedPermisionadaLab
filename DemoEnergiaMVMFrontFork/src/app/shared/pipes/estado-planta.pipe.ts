import { EstadoPlanta } from './../../models/InfoPlantaEnergia';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoPlanta'
})
export class EstadoPlantaPipe implements PipeTransform {

  transform(value: string | EstadoPlanta): string {
    let estado: EstadoPlanta;
    if(typeof value === 'string'){
      estado = parseInt(value) as EstadoPlanta
    }else{
      estado = value as EstadoPlanta;
    }

    switch (estado){
      case EstadoPlanta.activa:
        return 'Activa';
      case EstadoPlanta.inactiva:
        return 'Inactiva'
      default:
        return 'Desconocido'
    }
  }

}
