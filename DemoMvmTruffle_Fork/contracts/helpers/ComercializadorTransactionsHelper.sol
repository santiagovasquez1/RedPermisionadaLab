// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../models/InfoContrato.sol";
import "../ReguladorMercado.sol";
import "../Cliente.sol";
import "../Comercializador.sol";
import "../BancoEnergia.sol";
import "../Generador.sol";

contract ComercializadorTransactionsHelper {
    address private owner;
    address private reguladorMercado;
    address private bancoEnergia;
    address public nullAddress = 0x0000000000000000000000000000000000000000;

    constructor(address _reguladorMercado, address _bancoEnergia) {
        owner = msg.sender;
        reguladorMercado = _reguladorMercado;
        bancoEnergia = _bancoEnergia;
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

    function getAcuerdosByCliente(
        address _dirComercializador,
        address _dirCliente
    ) public view returns (AcuerdoEnergia[] memory) {
        return
            Comercializador(_dirComercializador).getAcuerdosDeCompraPorCliente(
                _dirCliente
            );
    }

    function getAcuerdosByClienteAndFecha(
        address _dirComercializador,
        address _dirCliente,
        uint256 _fechaSolicitud
    ) external view returns (AcuerdoEnergia memory) {
        AcuerdoEnergia memory tempAcuerdo;
        AcuerdoEnergia[] memory acuerdosCliente = Comercializador(
            _dirComercializador
        ).getAcuerdosDeCompraPorCliente(_dirCliente);

        require(acuerdosCliente.length > 0, "No existen acuerdos del cliente");

        for (uint256 i = 0; i < acuerdosCliente.length; i++) {
            if (acuerdosCliente[i].fechaSolicitud == _fechaSolicitud) {
                tempAcuerdo = acuerdosCliente[i];
                break;
            }
        }

        return tempAcuerdo;
    }

    function realizarAcuerdo(
        address _dirGenerador,
        address _dirCliente,
        uint256 _indexAcuerdoCliente
    ) public authorize returns (AcuerdoEnergia memory _acuerdoEnergia) {
        AcuerdoEnergia[] memory acuerdosCliente = Comercializador(msg.sender)
            .getAcuerdosDeCompraPorCliente(_dirCliente);

        require(acuerdosCliente.length > 0, "No existen acuerdos del cliente");
        Comercializador(msg.sender).updateAcuerdoCompra(
            _dirCliente,
            _indexAcuerdoCliente,
            _dirGenerador,
            block.timestamp
        );

        //Actualizacion de info del contrato
        acuerdosCliente = Comercializador(msg.sender)
            .getAcuerdosDeCompraPorCliente(_dirCliente);

        BancoEnergia(bancoEnergia).setInfoTx(
            InfoTx(
                TipoTx.solicitud,
                block.timestamp,
                acuerdosCliente[_indexAcuerdoCliente].tipoEnergia,
                acuerdosCliente[_indexAcuerdoCliente].cantidadEnergiaTotal,
                _dirCliente,
                Cliente(_dirCliente).getInfoContrato().empresa,
                _dirGenerador,
                Generador(_dirGenerador).getInfoContrato().empresa,
                BancoEnergia(bancoEnergia).getContadorTx()
            )
        );

        return acuerdosCliente[_indexAcuerdoCliente];
    }
}
