// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./InfoContrato.sol";
import "../libraries/Validations.sol";
import "../Certificador.sol";
import "../ReguladorMercado.sol";


abstract contract Factory {
    address public owner;
    address public dirContrato;
    address public reguladorMercado;
    address public certificador;
    
    InfoContrato[] internal contratosOwners;
    event Creacion(string, address);

    function getContratosOwners() public view returns (InfoContrato[] memory) {
        return contratosOwners;
    }

    function direccionRegistrada() public view returns (bool) {
        return !Validations.aproveCreation(msg.sender, contratosOwners);
    }

    function FactoryContrato(InfoContrato memory infoContrato) external virtual;

    modifier canCreate() {
        require(
            msg.sender == ReguladorMercado(reguladorMercado).getOwner(),
            "No tiene permisos para crear contratos"
        );
        _;
    }

    function diligenciarContratoRegulador(
        address dir,
        InfoContrato memory infoContrato,
        EstadoSolicitud _estado
    ) public {
        require(
            ReguladorMercado(reguladorMercado).existeSolicitud(dir),
            "No existe solicitud"
        );
        uint256 indexSolicitud = ReguladorMercado(reguladorMercado)
            .getIndexSolicitudes(dir);
        ReguladorMercado(reguladorMercado).diligenciarSolicitud(indexSolicitud,infoContrato,_estado);
    }
}
