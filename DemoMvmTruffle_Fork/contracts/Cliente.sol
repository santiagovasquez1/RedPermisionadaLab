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
    address private bancoEnergia;
    address private clienteTransactionHelper;
    uint256 private energiaAcuerdosCompra;
    uint256 private energiaGastada;
    uint256 private energiaTotal;

    event actualizacionContrato();
    using StringLibrary for string;

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
        return
            ClienteTransactionsHelper(clienteTransactionHelper)
                .getAcuerdosDeCompra();
    }

    function setAcuerdosDeCompra(AcuerdoEnergia memory _acuerdoCompra)
        public
        onlyHelper(clienteTransactionHelper)
    {
        ClienteTransactionsHelper(clienteTransactionHelper).setAcuerdosDeCompra(
                _acuerdoCompra
            );
    }

    function updateAcuerdoDeCompra() public {
        emit actualizacionContrato();
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
        setEnergiaCliente();
        setEnergiaTotal();
    }

    function setEnergiaCliente() private authorize(msg.sender) {
        energiaAcuerdosCompra = ClienteTransactionsHelper(
            clienteTransactionHelper
        ).setEnergiasCliente();
    }

    function setEnergiaTotal() private authorize(msg.sender) {
        energiaTotal = energiaAcuerdosCompra - energiaGastada;
    }

    function setGastoEnergia(uint256 _cantidadEnergia)
        public
        authorize(msg.sender)
        returns (uint256)
    {
        require(
            energiaAcuerdosCompra - _cantidadEnergia >= 0,
            "No puedes gastar mas energia que la disponible"
        );
        BancoEnergia(bancoEnergia).setInfoTx(
            InfoTx(
                TipoTx.consumo,
                block.timestamp,
                "",
                _cantidadEnergia,
                infoContrato.dirContrato,
                infoContrato.empresa,
                nullAddress,
                "",
                BancoEnergia(bancoEnergia).getContadorTx()
            )
        );

        setEnergiaTotal();
        return energiaTotal;
    }

    function getEnergiaCliente() public view returns (uint256) {
        return energiaAcuerdosCompra;
    }

    function getEnergiaGastada() public view returns (uint256) {
        return energiaGastada;
    }

    function getEnergiaTotal() public view returns (uint256) {
        return energiaTotal;
    }

    modifier onlyComercializador(address _direction) {
        require(
            _direction == infoContrato.comercializador,
            "No tiene permisos para realizar la transaccion"
        );
        _;
    }
}
