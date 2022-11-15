// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./models/Agente.sol";
import "./models/InfoContrato.sol";
import "./libraries/StringLibrary.sol";
import "./Comercializador.sol";
import "./BancoEnergia.sol";
import "./libraries/Validations.sol";
import "./models/TipoEnergia.sol";
import "./helpers/ClienteTransactionsHelper.sol";

contract Cliente is Agente {
    uint256 public contadorAcuerdos = 0;
    using StringLibrary for string;
    address private bancoEnergia;
    address private clienteTransactionHelper;
    AcuerdoEnergia[] private acuerdosDeCompra;

    constructor(
        InfoContrato memory _infoContrato,
        address _reguladorMercado,
        address _bancoEnergia,
        address _clienteTransactionHelper
    ) {
        reguladorMercado = _reguladorMercado;
        bancoEnergia = _bancoEnergia;
        clienteTransactionHelper = _clienteTransactionHelper;
        infoContrato = InfoContrato(
            address(this),
            _infoContrato.owner,
            _infoContrato.nit,
            _infoContrato.empresa,
            _infoContrato.contacto,
            _infoContrato.telefono,
            _infoContrato.correo,
            _infoContrato.departamento,
            _infoContrato.ciudad,
            _infoContrato.direccion,
            nullAddress,
            _infoContrato.tipoContrato
        );
    }

    function contratarComercializador(address _contratoComercializador)
        public
        authorize(msg.sender)
    {
        TiposContratos tipoContrato = Comercializador(_contratoComercializador)
            .getInfoContrato()
            .tipoContrato;
        require(
            tipoContrato == TiposContratos.Comercializador,
            "No es un agente comercializador"
        );

        infoContrato.comercializador = _contratoComercializador;
        Comercializador(_contratoComercializador).setClientesComercializador(
            infoContrato
        );
    }

    function getAcuerdosDeCompra()
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        return acuerdosDeCompra;
    }

    function setAcuerdosDeCompra(AcuerdoEnergia memory _acuerdoCompra)
        public
        onlyHelper(clienteTransactionHelper)
    {
        _acuerdoCompra.indexGlobal = contadorAcuerdos;
        acuerdosDeCompra.push(_acuerdoCompra);
        contadorAcuerdos++;
    }

    function updateAcuerdoDeCompra(
        AcuerdoEnergia memory _acuerdoCompra,
        uint256 _index
    ) public onlyComercializador(msg.sender) {
        acuerdosDeCompra[_index] = _acuerdoCompra;
    }

    function comprarEnergia(
        string memory _tipoEnergia,
        uint256 _cantidadEnergia,
        uint256 _fechaFin
    ) public authorize(msg.sender) {
        ClienteTransactionsHelper(clienteTransactionHelper).comprarEnergia(
            infoContrato.dirContrato,
            _tipoEnergia,
            _cantidadEnergia,
            _fechaFin
        );
    }

    // function gastoEnergia(string memory _tipoEnergia, uint256 _cantidadEnergia)
    //     public
    //     authorize(msg.sender)
    // {
    //     InfoEnergia[] memory infoEnergias = BancoEnergia(bancoEnergia)
    //         .getTiposEnergiasDisponibles();
    //     require(
    //         Validations.validarEnergiasDisponibles(_tipoEnergia, infoEnergias),
    //         "El tipo de energia no esta disponible"
    //     );
    //     uint256 cantidadDisponible = mappingEnergiasCliente[_tipoEnergia]
    //         .getCantidadEnergia();
    //     require(
    //         cantidadDisponible - _cantidadEnergia >= 0,
    //         "No hay suficiente energia"
    //     );
    //     mappingEnergiasCliente[_tipoEnergia].restarCantidadEnergia(
    //         _cantidadEnergia
    //     );

    //     BancoEnergia(bancoEnergia).setInfoTx(
    //         InfoTx(
    //             TipoTx.consumo,
    //             block.timestamp,
    //             _tipoEnergia,
    //             _cantidadEnergia,
    //             infoContrato.dirContrato,
    //             infoContrato.empresa,
    //             nullAddress,
    //             "",
    //             BancoEnergia(bancoEnergia).getContadorTx()
    //         )
    //     );
    // }

    // function getEnergiaCliente(string memory _tipoEnergia)
    //     public
    //     view
    //     returns (InfoEnergia memory)
    // {
    //     return mappingEnergiasCliente[_tipoEnergia].getInfoEnergia();
    // }

    // function setEnergiaCliente(
    //     string memory _tipoEnergia,
    //     uint256 _cantidadEnergia
    // ) public {
    //     if (address(mappingEnergiasCliente[_tipoEnergia]) == nullAddress) {
    //         mappingEnergiasCliente[_tipoEnergia] = TipoEnergiaFactory(
    //             factoryEnergia
    //         ).generarNuevaEnergia(_tipoEnergia, _cantidadEnergia);
    //     } else {
    //         mappingEnergiasCliente[_tipoEnergia].addCantidadEnergia(
    //             _cantidadEnergia
    //         );
    //     }
    // }

    // function getTokensDelegados() public view returns (uint256) {
    //     address comercializador = infoContrato.comercializador;
    //     uint256 tokensDelegados = ReguladorMercado(reguladorMercado)
    //         .getTokensDelegadosByAddress(infoContrato.owner, comercializador);

    //     uint256 contadorEmisiones = Comercializador(comercializador)
    //         .contadorEmisiones();
    //     uint256 contadorTokensEnSolicitud = 0;
    //     for (uint256 i = 0; i <= contadorEmisiones; i++) {
    //         if (
    //             Comercializador(comercializador)
    //                 .getInfoEmisionesDeCompra(i)
    //                 .ownerCliente ==
    //             infoContrato.owner &&
    //             Comercializador(comercializador)
    //                 .getInfoEmisionesDeCompra(i)
    //                 .estado ==
    //             EstadoCompra.pendiente
    //         ) {
    //             string memory tipoEnergia = Comercializador(comercializador)
    //                 .getInfoEmisionesDeCompra(i)
    //                 .tipoEnergia;
    //             uint256 cantidadEnergia = Comercializador(comercializador)
    //                 .getInfoEmisionesDeCompra(i)
    //                 .cantidadEnergia;
    //             contadorTokensEnSolicitud +=
    //                 BancoEnergia(bancoEnergia)
    //                     .getEnergiaByNombre(tipoEnergia)
    //                     .precio *
    //                 cantidadEnergia;
    //         }
    //     }

    //     return tokensDelegados - contadorTokensEnSolicitud;
    // }

    // function setAcumuladoVenta(uint256 cantidadEnergia) public {
    //     acumuladoCompra += cantidadEnergia;
    // }

    // function getAcumuladoVenta() public view returns (uint256) {
    //     return acumuladoCompra;
    // }

    // function addCompraCliente(
    //     address _dirGenerador,
    //     string memory _nombreGenerador,
    //     address _dirPlanta,
    //     string memory _nombrePlanta,
    //     string memory _tipoEnergia,
    //     uint256 _cantidadEnergia
    // ) external onlyComercializador(msg.sender) {
    //     InfoCompraEnergia memory _infoCompraEnergia = InfoCompraEnergia(
    //         infoContrato.owner,
    //         infoContrato.dirContrato,
    //         infoContrato.empresa,
    //         _dirGenerador,
    //         _nombreGenerador,
    //         _dirPlanta,
    //         _nombrePlanta,
    //         infoContrato.comercializador,
    //         Comercializador(infoContrato.comercializador)
    //             .getInfoContrato()
    //             .empresa,
    //         _tipoEnergia,
    //         _cantidadEnergia,
    //         block.timestamp
    //     );
    //     ComprasRealizadas.push(_infoCompraEnergia);
    // }

    // function getComprasRealizadas()
    //     public
    //     view
    //     returns (InfoCompraEnergia[] memory)
    // {
    //     return ComprasRealizadas;
    // }

    modifier onlyComercializador(address _direction) {
        require(
            _direction == infoContrato.comercializador,
            "No tiene permisos para realizar la transaccion"
        );
        _;
    }
}
