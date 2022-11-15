// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./models/InfoContrato.sol";
import "./models/Factory.sol";
import "./libraries/Validations.sol";
import "./Generador.sol";

contract MvmGeneradorFactory is Factory {
    address private generadorTransactionsHelper;
    mapping(address => address) public DirContratosGeneradores;

    constructor(
        address _reguladorMercado,
        address _certificador,
        address _generadorTransactionsHelper
    ) {
        owner = msg.sender;
        dirContrato = address(this);
        reguladorMercado = _reguladorMercado;
        certificador = _certificador;
        generadorTransactionsHelper = _generadorTransactionsHelper;
    }

    function FactoryContrato(InfoContrato memory _infoContrato)
        public
        override
        canCreate
    {
        require(
            Validations.aproveCreation(_infoContrato.owner, contratosOwners),
            "Una direccion no puede tener mas de un generador"
        );
        require(
            ReguladorMercado(reguladorMercado).existeSolicitud(
                _infoContrato.owner
            ),
            "No existe la solicitud"
        );
        _infoContrato.dirContrato = DirContratosGeneradores[
            _infoContrato.owner
        ];
        DirContratosGeneradores[_infoContrato.owner] = address(
            new Generador(_infoContrato, generadorTransactionsHelper)
        );

        _infoContrato.dirContrato = DirContratosGeneradores[
            _infoContrato.owner
        ];
        diligenciarContratoRegulador(
            _infoContrato.owner,
            _infoContrato,
            EstadoSolicitud.aprobada
        );
        contratosOwners.push(
            Generador(DirContratosGeneradores[_infoContrato.owner])
                .getInfoContrato()
        );
        Generador(DirContratosGeneradores[_infoContrato.owner])
            .setEnergiasBolsa();
        Certificador(certificador).expedirCertificadoAgente(_infoContrato);
        emit Creacion(
            _infoContrato.empresa,
            DirContratosGeneradores[_infoContrato.owner]
        );
    }

    function existeGenerador(
        address contractDir,
        InfoContrato[] memory arrayContracts
    ) public pure returns (bool) {
        return Validations.existsContract(contractDir, arrayContracts);
    }
}
