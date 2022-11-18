import { TiposContratos } from "./EnumTiposContratos";


export interface InfoContrato {
    dirContrato: string;
    owner: string;
    nit: string;
    empresa: string;
    contacto: string;
    telefono: string;
    correo: string;
    departamento: string;
    ciudad: string;
    direccion: string;
    comercializador: string;
    tipoContrato: TiposContratos;
}

