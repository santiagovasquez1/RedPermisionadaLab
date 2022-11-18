export interface InfoCertificadoAgente {
    dirContratoAgente: string;
    nombreEmpresa: string;
    dirContratoCertificador: string;
    nombreCertificador: string;
    hashCertificado: string;
    fechaCertificado: string;  
}

export interface InfoCertificadoVentaEnergia{
    ownerCliente: string;
    dirContratoCliente: string;
    empresaCliente: string;
    dirContratoGenerador: string;
    empresaGenerador: string;
    dirPlanta: string;
    nombrePlanta: string;
    dirComercializador: string;
    empresaComercializador: string;
    dirContratoCertificador: string;
    nombreCertificador: string;
    tipoEnergia: string;
    cantidadEnergia: number;
    hashCertificado: string;
    fechaCertificado: string;
}

export interface InfoMappingCertificado {
    dirContratoCliente: string;
    dirContratoGenerador: string;
    dirContratoComercializador: string;
    tipoEnergia: string;
    cantidadEnergia: number;
    fechaCompra:number;
}