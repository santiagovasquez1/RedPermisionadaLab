// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct InfoContrato {
    address dirContrato;
    address owner;
    string nit;
    string empresa;
    string contacto;
    string telefono;
    string correo;
    string departamento;
    string ciudad;
    string direccion;
    address comercializador;
    TiposContratos tipoContrato;
}

struct InfoRegulador {
    address owner;
    address dirContrato;
    uint256 cantidadTokens;
    string nombreToken;
    string simboloToken;
    uint256 valorToken;
}

enum TiposContratos {
    Cliente,
    Comercializador,
    Generador,
    ReguladorMercado,
    Certificador,
    NullContract
}

enum Operacion {
    adicionar,
    restar
}

enum EstadoSolicitud {
    aprobada,
    rechazada,
    pendiente
}

struct SolicitudContrato {
    InfoContrato infoContrato;
    TiposContratos tipoContrato;
    EstadoSolicitud estadoSolicitud;
    uint256 fechaSolicitud;
    uint256 fechaAprobacion;
}

enum TipoComercio {
    Cliente,
    Generador
}

struct InfoEnergia {
    string nombre;
    uint256 cantidadEnergia;
}

enum EstadoCompra {
    pendiente,
    aprobada,
    rechazada
}

struct InfoEmisionCompra {
    address ownerCliente;
    address dirContratoCliente;
    string empresaCliente;
    string tipoEnergia;
    uint256 cantidadEnergia;
    EstadoCompra estado;
    uint256 fechaEmision;
    uint256 fechaAprobacion;
    uint256 index;
}

enum EstadoPlanta {
    activa,
    inactiva
}

struct InfoPlanta {
    address dirPlanta;
    string nombre;
    string departamento;
    string ciudad;
    string coordenadas;
    uint256 fechaInicio;
    uint256 tasaEmision;
    bool isRec;
    uint256 capacidadNominal;
    string tecnologia;
    uint256 cantidadEnergia;
    EstadoPlanta estado;
}

struct InfoInyeccionEnergia {
    InfoEnergia infoEnergia;
    InfoPlanta infoPlanta;
    address dirContratoGenerador;
    address ownerGenerador;
    uint256 precioEnergia;
    uint256 fechaInyeccion;
}

struct InfoConsumoEnergia {
    InfoEnergia infoEnergia;
    InfoContrato infoContrato;
    uint256 fechaConsumo;
}

struct InfoCertificadoAgente {
    address dirContratoAgente;
    string nombreEmpresa;
    address dirContratoCertificador;
    string nombreCertificador;
    bytes32 hashCertificado;
    uint256 fechaCertificado;
}

struct InfoCompraEnergia {
    address ownerCliente;
    address dirContratoCliente;
    string empresaCliente;
    address dirContratoGenerador;
    string empresaGenerador;
    address dirPlanta;
    string nombrePlanta;
    address dirComercializador;
    string empresaComercializador;
    string tipoEnergia;
    uint256 cantidadEnergia;
    uint256 fechaAprobacion;
}

struct InfoCertificadoVentaEnergia {
    address ownerCliente;
    address dirContratoCliente;
    string empresaCliente;
    address dirContratoGenerador;
    string empresaGenerador;
    address dirPlanta;
    string nombrePlanta;
    address dirComercializador;
    string empresaComercializador;
    address dirContratoCertificador;
    string nombreCertificador;
    string tipoEnergia;
    uint256 cantidadEnergia;
    bytes32 hashCertificado;
    uint256 fechaCertificado;
}

enum TipoTx {
    inyeccion,
    consumo,
    solicitud,
    venta
}

struct InfoTx {
    TipoTx tipoTx;
    uint256 fechaTx;
    string tipoEnergia;
    uint256 cantidadEnergia;
    address agenteOrigen;
    string nombreAgenteOrigen;
    address agenteDestino;
    string nombreAgenteDestino;
    uint256 index;
}

struct RequestCompraEnergia {
    address _dirContrato;
    address _dirPlanta;
    address _ownerCliente;
    uint256 _cantidadEnergia;
    string _nombreTipoEnergia;
    uint256 _index;
}

struct OrdenDespacho {
    address dirGenerador;
    string nombreGenerador;
    uint256 cantidadEnergia;
    uint256 cantidadProducida;
    uint256 fechaDespacho;
    uint256 index;
}

enum EstadoAcuerdo {
    pendiente,
    activo,
    cancelado,
    cerrado
}

struct DataAgenteAcuerdo {
    address dirContrato;
    string nombreAgente;
}

struct AcuerdoEnergia {
    DataAgenteAcuerdo dataCliente;
    DataAgenteAcuerdo dataGenerador;
    DataAgenteAcuerdo dataComercializador;
    string tipoEnergia;
    uint256 cantidadEnergiaTotal;
    uint256 cantidadEnergiaInyectada;
    uint256 fechaSolicitud;
    uint256 fechaInicio;
    uint256 fechaFin;
    EstadoAcuerdo estadoAcuerdo;
    uint256 indexGlobal;
    uint256 valorContrato;
}
