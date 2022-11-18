export enum EstadoPlanta {
    activa,
    inactiva
}

export interface ColsTablaGeoreferencia {
    dirPlanta?: string;
    nombre?: string;
    departamento?: string;
    ciudad?: string;
    coordenadas?: string;
    fechaInicio?: string;
    tasaEmision?: number;
    isRec?: boolean;
    capacidadNominal?: number;
    tecnologia?: string;
    cantidadEnergia?: number;
    estado?: EstadoPlanta;
    empresa?: string;
    cantidadSolar?: number;
    cantidadEolica?: number;
}