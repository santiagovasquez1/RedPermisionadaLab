// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;
import "./models/Agente.sol";
import "./models/InfoContrato.sol";

contract Certificador is Agente {
    event solicitudCertificado();
    event emisionCertificadoAgente();
    event emisionCertificadoCompra();

    mapping(address => InfoCertificadoAgente)
        private certificadosAgentesMapping;
    mapping(bytes32 => InfoCertificadoVentaEnergia)
        private certificadosComprasMapping;

    struct infoMappingCertificado {
        address dirContratoCliente;
        address dirContratoGenerador;
        address dirContratoComercializador;
        string tipoEnergia;
        uint256 cantidadEnergia;
        uint256 fechaCompra;
    }

    constructor(InfoContrato memory _infoContrato, address _reguladorMercado) {
        reguladorMercado = _reguladorMercado;
        infoContrato = InfoContrato(
            address(this),
            msg.sender,
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

    function expedirCertificadoAgente(InfoContrato memory _infoContrato)
        public
    {
        bytes32 tempHash = keccak256(
            abi.encodePacked(_infoContrato.dirContrato, block.timestamp)
        );
        InfoCertificadoAgente
            memory _infoCertificadoAgente = InfoCertificadoAgente(
                _infoContrato.dirContrato,
                _infoContrato.empresa,
                infoContrato.dirContrato,
                infoContrato.empresa,
                tempHash,
                block.timestamp
            );

        certificadosAgentesMapping[
            _infoContrato.dirContrato
        ] = _infoCertificadoAgente;
        emit emisionCertificadoAgente();
    }

    function expedirCertificadoCompra(
        InfoCompraEnergia memory _infoCompraEnergia
    ) public {
        bytes32 tempHash = keccak256(
            abi.encodePacked(
                _infoCompraEnergia.dirContratoCliente,
                _infoCompraEnergia.dirContratoGenerador,
                _infoCompraEnergia.dirComercializador,
                _infoCompraEnergia.tipoEnergia,
                _infoCompraEnergia.cantidadEnergia,
                _infoCompraEnergia.fechaAprobacion
            )
        );
        InfoCertificadoVentaEnergia
            memory tempInfo = InfoCertificadoVentaEnergia(
                _infoCompraEnergia.ownerCliente,
                _infoCompraEnergia.dirContratoCliente,
                _infoCompraEnergia.empresaCliente,
                _infoCompraEnergia.dirContratoGenerador,
                _infoCompraEnergia.empresaGenerador,
                _infoCompraEnergia.dirPlanta,
                _infoCompraEnergia.nombrePlanta,
                _infoCompraEnergia.dirComercializador,
                _infoCompraEnergia.empresaComercializador,
                infoContrato.dirContrato,
                infoContrato.empresa,
                _infoCompraEnergia.tipoEnergia,
                _infoCompraEnergia.cantidadEnergia,
                tempHash,
                block.timestamp
            );

        certificadosComprasMapping[tempHash] = tempInfo;
        emit emisionCertificadoCompra();
    }

    function getCertificadoAgente(address _dirContrato)
        public
        view
        returns (InfoCertificadoAgente memory)
    {
        return certificadosAgentesMapping[_dirContrato];
    }

    function getCertificadoCompra(
        infoMappingCertificado memory _infoMappingCertificado
    ) public view returns (InfoCertificadoVentaEnergia memory) {
        bytes32 tempHash = keccak256(
            abi.encodePacked(
                _infoMappingCertificado.dirContratoCliente,
                _infoMappingCertificado.dirContratoGenerador,
                _infoMappingCertificado.dirContratoComercializador,
                _infoMappingCertificado.tipoEnergia,
                _infoMappingCertificado.cantidadEnergia,
                _infoMappingCertificado.fechaCompra
            )
        );
        return certificadosComprasMapping[tempHash];
    }
}
