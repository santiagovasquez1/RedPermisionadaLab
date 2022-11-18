export interface InfoPlantaCompra {
    dirPlanta: string;
    nombre: string;
    tipoEneregia: string;
    cantidadEnergia: number;
}

export interface InfoGeneradorCompra {
    dirGenerador: string;
    nombre: string;
    plantasGenerador: InfoPlantaCompra[];
}