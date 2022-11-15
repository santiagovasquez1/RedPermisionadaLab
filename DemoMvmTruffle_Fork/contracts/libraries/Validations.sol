// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../models/InfoContrato.sol";
import "./StringLibrary.sol";

library Validations {
    address constant nullAddress = 0x0000000000000000000000000000000000000000;
    using StringLibrary for string;

    function aproveCreation(
        address direction,
        InfoContrato[] memory arrayDirections
    ) public pure returns (bool) {
        if (arrayDirections.length > 0) {
            for (uint256 i = 0; i < arrayDirections.length; i++) {
                if (direction == arrayDirections[i].owner) {
                    return false;
                }
            }
        }
        return true;
    }

    function existsContract(
        address contractDir,
        InfoContrato[] memory arrayContracts
    ) public pure returns (bool) {
        if (arrayContracts.length > 0) {
            for (uint256 i = 0; i < arrayContracts.length; i++) {
                if (contractDir == arrayContracts[i].dirContrato) {
                    return true;
                }
            }
        }
        return false;
    }

    function existsAddress(address dir, address[] memory arrayDirs)
        public
        pure
        returns (bool)
    {
        if (arrayDirs.length > 0) {
            for (uint256 i = 0; i < arrayDirs.length; i++) {
                if (dir == arrayDirs[i]) {
                    return true;
                }
            }
        }
        return false;
    }

    function getInfoContrato(
        address _dirContrato,
        SolicitudContrato[] memory _contratos
    ) public pure returns (SolicitudContrato memory) {
        SolicitudContrato memory infoContrato;
        for (uint256 i = 0; i < _contratos.length; i++) {
            if (_dirContrato == _contratos[i].infoContrato.dirContrato) {
                infoContrato = _contratos[i];
                return infoContrato;
            }
        }
        return infoContrato;
    }

    function validarUsuario(
        address _owner,
        SolicitudContrato[] memory _contratos
    )
        public
        pure
        returns (
            bool,
            address,
            TiposContratos
        )
    {
        if (_contratos.length > 0) {
            for (uint256 i = 0; i < _contratos.length; i++) {
                if (
                    _contratos[i].estadoSolicitud == EstadoSolicitud.aprobada &&
                    _owner == _contratos[i].infoContrato.owner
                ) {
                    return (
                        true,
                        _contratos[i].infoContrato.dirContrato,
                        _contratos[i].tipoContrato
                    );
                }
            }
        }

        return (false, nullAddress, TiposContratos.NullContract);
    }

    function validarEnergiasDisponibles(
        string memory _nombre,
        InfoEnergia[] memory _energias
    ) public pure returns (bool) {
        if (_nombre.equals("")) {
            return false;
        }
        for (uint256 i = 0; i < _energias.length; i++) {
            if (_nombre.equals(_energias[i].nombre)) {
                return true;
            }
        }
        return false;
    }
}
