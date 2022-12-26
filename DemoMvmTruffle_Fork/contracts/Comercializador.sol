// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./models/TipoEnergia.sol";
import "./models/InfoContrato.sol";
import "./Generador.sol";
import "./Cliente.sol";
import "./Certificador.sol";
import "./models/Agente.sol";
import "./libraries/Validations.sol";
import "./models/PlantaEnergia.sol";
import "./BancoEnergia.sol";
import "./helpers/ComercializadorTransactionsHelper.sol";

contract Comercializador is Agente {
    uint256 public contadorAcuerdos = 0;
    //Variable que se encarga de guardar las direccions de los contratos del comercializador
    InfoContrato[] private clientesComercializador;

    //Variable que se encarga de guardar las direccions de los contratos del comercializador segun el owner
    address private certificador;
    address private bancoEnergia;
    address private comercializadorTransactionsHelper;
    AcuerdoEnergia[] private acuerdosDeCompra;
    mapping(address => AcuerdoEnergia[]) public acuerdosDeCompraPorCliente;

    event EmisionDeCompra();
    event EmisionCompraExitosa();

    constructor(
        InfoContrato memory _infoContrato,
        address _reguladorMercado,
        address _certificador,
        address _bancoEnergia,
        address _comercializadorTransactionsHelper
    ) {
        reguladorMercado = _reguladorMercado;
        bancoEnergia = _bancoEnergia;
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
        certificador = _certificador;
        comercializadorTransactionsHelper = _comercializadorTransactionsHelper;
    }

    modifier onlyCliente() {
        address owner = Cliente(msg.sender).getInfoContrato().owner;
        require(owner != nullAddress, "El tipo de contrato no es cliente");
        _;
    }

    function setClientesComercializador(InfoContrato memory _infoContrato)
        external
        onlyCliente
    {
        clientesComercializador.push(_infoContrato);
    }

    function setInfoEmisionesDeCompra() public {
        emit EmisionDeCompra();
    }

    function getClientesComercializador()
        public
        view
        returns (InfoContrato[] memory)
    {
        return clientesComercializador;
    }

    function getHistoricoAcuerdos()
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        return
            ComercializadorTransactionsHelper(comercializadorTransactionsHelper)
                .getHistoricoAcuerdos();
    }

    function realizarAcuerdo(
        address _dirGenerador,
        address _dirCliente,
        uint256 _indexGlobal
    ) public authorize(msg.sender) {
        AcuerdoEnergia
            memory _acuerdoEnergia = ComercializadorTransactionsHelper(
                comercializadorTransactionsHelper
            ).realizarAcuerdo(_dirGenerador, _dirCliente, _indexGlobal);
    }

    // function rechazarCompra(address _ownerCliente, uint256 index)
    //     public
    //     authorize(msg.sender)
    //     onlyCliente
    // {
    //     require(
    //         !Validations.aproveCreation(_ownerCliente, clientesComercializador),
    //         "El cliente no es un cliente de este contrato"
    //     );
    //     emisionCompra[index].estado = EstadoCompra.rechazada;
    // }
}
