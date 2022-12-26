// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../models/InfoContrato.sol";
import "../ReguladorMercado.sol";
import "../models/Agente.sol";
import "../Cliente.sol";
import "../Comercializador.sol";
import "../BancoEnergia.sol";
import "../AcuerdosLedger.sol";
import "../models/DateTime.sol";

contract ClienteTransactionsHelper {
    address private owner;
    address private reguladorMercado;
    address private acuerdosLedger;
    address private bancoEnergia;
    address private dateTimeContract;
    address public nullAddress = 0x0000000000000000000000000000000000000000;

    constructor(
        address _reguladorMercado,
        address _bancoEnergia,
        address _acuerdosLedger,
        address _dateTime
    ) {
        owner = msg.sender;
        reguladorMercado = _reguladorMercado;
        bancoEnergia = _bancoEnergia;
        acuerdosLedger = _acuerdosLedger;
        dateTimeContract = _dateTime;
    }

    modifier authorize() {
        address owner = Cliente(msg.sender).getInfoContrato().owner;
        require(owner != nullAddress, "El tipo de contrato no es cliente");
        _;
    }

    function comprarEnergia(
        address _dirCliente,
        string memory _tipoEnergia,
        uint256 _cantidadEnergia,
        uint256 _fechaFin
    ) public authorize {
        require(
            Cliente(_dirCliente).getInfoContrato().comercializador !=
                nullAddress,
            "No tienes contrato de comercializador"
        );

        InfoContrato memory infoContrato = Cliente(_dirCliente)
            .getInfoContrato();

        DataAgenteAcuerdo memory dataCliente = DataAgenteAcuerdo(
            infoContrato.dirContrato,
            infoContrato.empresa
        );

        DataAgenteAcuerdo memory dataComercializador = DataAgenteAcuerdo(
            infoContrato.comercializador,
            Agente(infoContrato.comercializador).getInfoContrato().empresa
        );

        DataAgenteAcuerdo memory dataGenerador = DataAgenteAcuerdo(
            nullAddress,
            ""
        );

        AcuerdoEnergia memory tempAcuerdoCompra = AcuerdoEnergia(
            dataCliente,
            dataGenerador,
            dataComercializador,
            _tipoEnergia,
            _cantidadEnergia,
            0,
            block.timestamp,
            0,
            _fechaFin,
            EstadoAcuerdo.pendiente,
            0,
            0
        );

        Cliente(_dirCliente).setAcuerdosDeCompra(tempAcuerdoCompra);
        Comercializador(infoContrato.comercializador).setInfoEmisionesDeCompra();

        BancoEnergia(bancoEnergia).setInfoTx(
            InfoTx(
                TipoTx.solicitud,
                block.timestamp,
                _tipoEnergia,
                _cantidadEnergia,
                _dirCliente,
                infoContrato.empresa,
                infoContrato.comercializador,
                Comercializador(infoContrato.comercializador)
                    .getInfoContrato()
                    .empresa,
                BancoEnergia(bancoEnergia).getContadorTx()
            )
        );
    }

    function getAcuerdosDeCompra()
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        return AcuerdosLedger(acuerdosLedger).getAcuerdosByCliente(msg.sender);
    }

    function setAcuerdosDeCompra(AcuerdoEnergia memory _acuerdoCompra)
        public
        authorize
    {
        AcuerdosLedger(acuerdosLedger).setAcuerdosDeCompraMercado(
            _acuerdoCompra
        );
    }

    function setEnergiasCliente() public authorize returns (uint256) {
        AcuerdoEnergia[] memory tempAcuerdos = AcuerdosLedger(acuerdosLedger)
            .getAcuerdosByCliente(msg.sender);
        uint256 cantidadEnergia;

        for (uint256 i = 0; i < tempAcuerdos.length; i++) {
            cantidadEnergia += tempAcuerdos[i].cantidadEnergiaTotal;
        }

        return cantidadEnergia;
    }
}
