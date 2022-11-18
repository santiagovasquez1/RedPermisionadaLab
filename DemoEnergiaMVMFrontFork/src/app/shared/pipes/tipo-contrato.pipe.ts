import { Pipe, PipeTransform } from '@angular/core';
import { TiposContratos } from 'src/app/models/EnumTiposContratos';

@Pipe({
  name: 'tipoContrato'
})
export class TipoContratoPipe implements PipeTransform {

  transform(value: number): string {
    const tipoContrato = value as TiposContratos;
    switch (tipoContrato) {
      case TiposContratos.Cliente:
        return 'Cliente';
      case TiposContratos.Comercializador:
        return 'Comercializador';
      case TiposContratos.Generador:
        return 'Generador';
      case TiposContratos.ReguladorMercado:
        return 'Regulador de Mercado';
      default:
        return 'Desconocido';
    }
  }

}
