export interface CompraEnergiaRequest {
    dirContratoGenerador: string;
    dirPlantaGenerador: string;
    ownerCliente: string;
    cantidadEnergia: number;
    tipoEnergia: string;
    index:number;
}