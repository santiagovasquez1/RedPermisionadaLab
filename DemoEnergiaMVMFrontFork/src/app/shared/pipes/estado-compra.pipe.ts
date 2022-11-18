import { Pipe, PipeTransform } from '@angular/core';
import { EstadoCompra } from 'src/app/models/InfoEmisionCompra';

@Pipe({
  name: 'estadoCompra'
})
export class EstadoCompraPipe implements PipeTransform {

  transform(value: string | EstadoCompra): string {
    let estadoCompra: EstadoCompra;
    if (typeof value == 'string') {
      estadoCompra = parseInt(value) as EstadoCompra;
    } else {
      estadoCompra = value as EstadoCompra;
    }

    switch (estadoCompra) {
      case EstadoCompra.aprobada:
        return 'Aprobada';
      case EstadoCompra.pendiente:
        return 'Pendiente';
      case EstadoCompra.rechazada:
        return 'Rechazada';
      default:
        return 'Desconocido';
    }
  }

}
