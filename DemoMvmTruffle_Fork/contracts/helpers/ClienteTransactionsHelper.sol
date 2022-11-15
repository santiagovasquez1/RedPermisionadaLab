// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../models/InfoContrato.sol";
import "../ReguladorMercado.sol";
import "../Cliente.sol";
import "../Comercializador.sol";
import "../BancoEnergia.sol";

contract ClienteTransactionsHelper {
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

        AcuerdoEnergia memory tempAcuerdoCompra = AcuerdoEnergia(
            infoContrato.dirContrato,
            nullAddress,
            infoContrato.comercializador,
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
        Comercializador(infoContrato.comercializador).setInfoEmisionesDeCompra(
            _dirCliente,
            tempAcuerdoCompra
        );

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
}
