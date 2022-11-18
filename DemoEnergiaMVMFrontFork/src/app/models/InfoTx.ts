export enum TipoTx {
    inyeccion,
    consumo,
    emision,
    venta,
}

export interface InfoTx {
    tipoTx: TipoTx;
    fechaTx:string;
    fechaTxNum:number;
    tipoEnergia:string;
    cantidadEnergia: number;
    agenteOrigen:string;
    nombreAgenteOrigen:string;
    agenteDestino:string;
    nombreAgenteDestino:string;
    index:number;
}