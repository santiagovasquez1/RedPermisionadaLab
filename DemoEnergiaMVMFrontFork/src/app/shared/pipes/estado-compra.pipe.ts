import { EstadoAcuerdo } from 'src/app/models/AcuerdoEnergia';
import { Pipe, PipeTransform } from '@angular/core';
import { EstadoCompra } from 'src/app/models/InfoEmisionCompra';

@Pipe({
  name: 'estadoCompra'
})
export class EstadoCompraPipe implements PipeTransform {

  transform(value: string | EstadoAcuerdo): string {
    let estadoCompra: EstadoAcuerdo;
    if (typeof value == 'string') {
      estadoCompra = parseInt(value) as EstadoAcuerdo;
    } else {
      estadoCompra = value as EstadoAcuerdo;
    }

    switch (estadoCompra) {
      case EstadoAcuerdo.activo:
        return 'Activo';
      case EstadoAcuerdo.pendiente:
        return 'Pendiente';
      case EstadoAcuerdo.cerrado:
        return 'Cerrado';
      default:
        return 'Desconocido';
    }
  }

}
