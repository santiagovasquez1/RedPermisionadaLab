import { TipoTx } from './../../models/InfoTx';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tipoTransaccion'
})
export class TipoTransaccionPipe implements PipeTransform {

  transform(value: string | TipoTx): string {

    let tipoTx: TipoTx;

    if (typeof (value) === 'string') {
      tipoTx = parseInt(value) as TipoTx;
    } else {
      tipoTx = value;
    }

    switch (tipoTx) {
      case TipoTx.inyeccion:
        return 'Inyección';
      case TipoTx.consumo:
        return 'Consumo';
      case TipoTx.emision:
        return 'Emisión';
      case TipoTx.venta:
        return 'Venta';
    }
  }

}
