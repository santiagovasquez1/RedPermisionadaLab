// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./models/InfoContrato.sol";
import "./models/Factory.sol";
import "./libraries/Validations.sol";
import "./Comercializador.sol";

contract MvmComercializadorFactory is Factory {
    mapping(address => address) public DirContratosComercializadores;
    address private comercializadorTransactionsHelper;
    address private bancoEnergia;

    constructor(
        address _reguladorMercado,
        address _certificador,
        address _bancoEnergia,
        address _comercializadorTransactionsHelper
    ) {
        owner = msg.sender;
        dirContrato = address(this);
        reguladorMercado = _reguladorMercado;
        certificador = _certificador;
        bancoEnergia = _bancoEnergia;
        comercializadorTransactionsHelper = _comercializadorTransactionsHelper;
    }

    function FactoryContrato(InfoContrato memory _infoContrato)
        public
        override
        canCreate
    {
        require(
            Validations.aproveCreation(_infoContrato.owner, contratosOwners),
            "Una direccion no puede tener mas de un comercializador"
        );
        DirContratosComercializadores[_infoContrato.owner] = address(
            new Comercializador(
                _infoContrato,
                reguladorMercado,
                certificador,
                bancoEnergia,
                comercializadorTransactionsHelper
            )
        );
        _infoContrato.dirContrato = DirContratosComercializadores[
            _infoContrato.owner
        ];
        diligenciarContratoRegulador(
            _infoContrato.owner,
            _infoContrato,
            EstadoSolicitud.aprobada
        );
        contratosOwners.push(
            Comercializador(DirContratosComercializadores[_infoContrato.owner])
                .getInfoContrato()
        );
        Certificador(certificador).expedirCertificadoAgente(_infoContrato);
        emit Creacion(
            _infoContrato.empresa,
            DirContratosComercializadores[_infoContrato.owner]
        );
    }

    function existeComercializador(
        address contractDir,
        InfoContrato[] memory arrayContracts
    ) public pure returns (bool) {
        return Validations.existsContract(contractDir, arrayContracts);
    }
}
