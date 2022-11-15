// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../TokenErc20/SafeMath.sol";
import "./InfoContrato.sol";

contract TipoEnergia {
    string public nombre;
    uint256 public cantidadEnergia;
    using SafeMath for uint256;

    constructor(string memory _nombre, uint256 _cantidadEnergia) {
        nombre = _nombre;
        cantidadEnergia = _cantidadEnergia;
    }

    function getCantidadEnergia() public view returns (uint256) {
        return cantidadEnergia;
    }

    function getNombreTipoEnergia() public view returns (string memory) {
        return nombre;
    }

    function addCantidadEnergia(uint256 _cantidadEnergia) public {
        uint256 tempCantidad = cantidadEnergia.add(_cantidadEnergia);
        cantidadEnergia = tempCantidad;
    }

    function restarCantidadEnergia(uint256 _cantidadEnergia) public {
        uint256 tempCantidad = cantidadEnergia.sub(_cantidadEnergia);
        cantidadEnergia = tempCantidad;
    }

    function getInfoEnergia() public view returns (InfoEnergia memory) {
        InfoEnergia memory infoEnergia = InfoEnergia(
            nombre,
            cantidadEnergia
        );
        return infoEnergia;
    }
}
