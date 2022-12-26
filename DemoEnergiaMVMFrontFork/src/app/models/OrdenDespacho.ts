export interface OrdenDespacho {
    dirGenerador: string;
    nombreGenerador: string;
    capacidadNominal: number;
    cantidadEnergia: number;
    cantidadProducida: number;
    fechaDespacho: string;
    index: number | null;
}