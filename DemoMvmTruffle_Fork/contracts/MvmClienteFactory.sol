// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./models/InfoContrato.sol";
import "./models/Factory.sol";
import "./libraries/Validations.sol";
import "./Cliente.sol";

contract MvmClienteFactory is Factory {
    mapping(address => address) public DirContratosClientes;
    address private bancoEnergia;
    address private clienteTransactionsHelper;

    constructor(
        address _reguladorMercado,
        address _certificador,
        address _bancoEnergia,
        address _clienteTransactionsHelper
    ) {
        owner = msg.sender;
        dirContrato = address(this);
        reguladorMercado = _reguladorMercado;
        certificador = _certificador;
        bancoEnergia = _bancoEnergia;
        clienteTransactionsHelper = _clienteTransactionsHelper;
    }

    function FactoryContrato(InfoContrato memory _infoContrato)
        public
        override
        canCreate
    {
        require(
            Validations.aproveCreation(_infoContrato.owner, contratosOwners),
            "El cliente ya existe"
        );
        DirContratosClientes[_infoContrato.owner] = address(
            new Cliente(
                _infoContrato,
                reguladorMercado,
                bancoEnergia,
                clienteTransactionsHelper
            )
        );
        _infoContrato.dirContrato = DirContratosClientes[_infoContrato.owner];
        diligenciarContratoRegulador(
            _infoContrato.owner,
            _infoContrato,
            EstadoSolicitud.aprobada
        );
        contratosOwners.push(
            Cliente(DirContratosClientes[_infoContrato.owner]).getInfoContrato()
        );
        Certificador(certificador).expedirCertificadoAgente(_infoContrato);
        emit Creacion(
            _infoContrato.empresa,
            DirContratosClientes[_infoContrato.owner]
        );
    }
}
