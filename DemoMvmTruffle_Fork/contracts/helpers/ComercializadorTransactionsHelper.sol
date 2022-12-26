// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../models/InfoContrato.sol";
import "../models/Agente.sol";
import "../ReguladorMercado.sol";
import "../Cliente.sol";
import "../Comercializador.sol";
import "../BancoEnergia.sol";
import "../Generador.sol";
import "../AcuerdosLedger.sol";

contract ComercializadorTransactionsHelper {
    address private owner;
    address private reguladorMercado;
    address private bancoEnergia;
    address private acuerdosLedger;
    address public nullAddress = 0x0000000000000000000000000000000000000000;

    constructor(
        address _reguladorMercado,
        address _bancoEnergia,
        address _acuerdosLedger
    ) {
        owner = msg.sender;
        reguladorMercado = _reguladorMercado;
        bancoEnergia = _bancoEnergia;
        acuerdosLedger = _acuerdosLedger;
    }

    modifier authorize() {
        address owner = Comercializador(msg.sender).getInfoContrato().owner;
        require(
            owner != nullAddress,
            "El tipo de contrato no es comercializador"
        );
        _;
    }

    function setClientesComercializador(
        address _dirComercializador,
        InfoContrato memory _infoContrato
    ) public authorize {
        Comercializador(_dirComercializador).setClientesComercializador(
            _infoContrato
        );
    }

    function getHistoricoAcuerdos()
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        AcuerdosLedger(acuerdosLedger).getAcuerdosByComercializador(msg.sender);
    }

    function realizarAcuerdo(
        address _dirGenerador,
        address _dirCliente,
        uint256 _indexGlobal
    ) public authorize returns (AcuerdoEnergia memory _acuerdoEnergia) {
        AcuerdoEnergia memory acuerdoCliente = AcuerdosLedger(acuerdosLedger)
            .getAcuerdoByIndex(_indexGlobal);

        require(
            acuerdoCliente.dataComercializador.dirContrato == msg.sender,
            "No es un acuerdo de este comercializador"
        );

        require(
            acuerdoCliente.dataCliente.dirContrato == _dirCliente,
            "Cliente incorrecto"
        );

        acuerdoCliente.dataGenerador.dirContrato = _dirGenerador;
        acuerdoCliente.dataGenerador.nombreAgente = Agente(_dirGenerador)
            .getInfoContrato()
            .empresa;
        acuerdoCliente.fechaInicio = block.timestamp;
        acuerdoCliente.estadoAcuerdo = EstadoAcuerdo.activo;
        acuerdoCliente.valorContrato =
            Generador(_dirGenerador).getPrecioEnergia() *
            acuerdoCliente.cantidadEnergiaTotal;
        //Actualizacion de info del contrato
        AcuerdosLedger(acuerdosLedger).updateAcuerdoDeCompra(
            acuerdoCliente,
            _indexGlobal
        );

        Cliente(_dirCliente).updateAcuerdoDeCompra();
        Generador(_dirGenerador).updateAcuerdoDeCompra();

        BancoEnergia(bancoEnergia).setInfoTx(
            InfoTx(
                TipoTx.solicitud,
                block.timestamp,
                acuerdoCliente.tipoEnergia,
                acuerdoCliente.cantidadEnergiaTotal,
                _dirCliente,
                Cliente(_dirCliente).getInfoContrato().empresa,
                _dirGenerador,
                Generador(_dirGenerador).getInfoContrato().empresa,
                BancoEnergia(bancoEnergia).getContadorTx()
            )
        );

        return AcuerdosLedger(acuerdosLedger).getAcuerdoByIndex(_indexGlobal);
    }
}
