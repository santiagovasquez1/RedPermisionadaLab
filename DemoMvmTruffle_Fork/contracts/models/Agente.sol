// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "../ReguladorMercado.sol";
import "./InfoContrato.sol";

abstract contract Agente {
    address public reguladorMercado;
    InfoContrato infoContrato;
    address public nullAddress = 0x0000000000000000000000000000000000000000;

    modifier authorize(address _direction) {
        require(
            _direction == infoContrato.owner,
            "No tiene permisos para ejecutar la transaccion"
        );
        _;
    }

    modifier onlyHelper(address _transactionHelper) {
        require(
            msg.sender == _transactionHelper,
            "No tiene permisos para realizar la tx"
        );
        _;
    }

    function MisTokens() public view returns (uint256) {
        return ReguladorMercado(reguladorMercado).MisTokens(msg.sender);
    }

    function getInfoContrato() public view returns (InfoContrato memory) {
        return infoContrato;
    }
}
