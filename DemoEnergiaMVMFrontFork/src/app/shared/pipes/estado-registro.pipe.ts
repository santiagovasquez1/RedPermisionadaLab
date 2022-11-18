import { EstadoSolicitud } from './../../models/solicitudContrato';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoRegistro'
})
export class EstadoRegistroPipe implements PipeTransform {

  transform(value: string | EstadoSolicitud): string {
    let estado: EstadoSolicitud;
    if (typeof (value) === 'string') {
      estado = parseInt(value) as EstadoSolicitud;
    } else {
      estado = value;
    }

    switch (estado) {
      case EstadoSolicitud.aprobada:
        return 'Aprobada';
      case EstadoSolicitud.pendiente:
        return 'Pendiente';
      case EstadoSolicitud.rechazada:
        return 'Rechazada';
      default:
        return 'Desconocido';
    }
  }

}
