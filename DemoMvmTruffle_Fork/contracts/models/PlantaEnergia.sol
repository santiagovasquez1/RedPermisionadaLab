// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./InfoContrato.sol";
import "../BancoEnergia.sol";

contract PlantaEnergia {
    address nullAddress = 0x0000000000000000000000000000000000000000;
    //Direccion del contrato dueña de la planta de energia
    address owner;
    InfoPlanta infoPlanta;
    TipoEnergia private tipoEnergia;

    using StringLibrary for string;

    constructor(
        address _owner,
        InfoPlanta memory _infoPlanta
    ) {
        owner = _owner;
        infoPlanta = InfoPlanta(
            address(this),
            _infoPlanta.nombre,
            _infoPlanta.departamento,
            _infoPlanta.ciudad,
            _infoPlanta.coordenadas,
            block.timestamp,
            _infoPlanta.tasaEmision,
            _infoPlanta.isRec,
            _infoPlanta.capacidadNominal,
            _infoPlanta.tecnologia,
            0,
            _infoPlanta.estado
        );
        tipoEnergia = new TipoEnergia(infoPlanta.tecnologia, 0);
    }

    function getInfoPlanta() public view returns (InfoPlanta memory) {
        InfoPlanta memory tempInfo = infoPlanta;
        tempInfo.cantidadEnergia = tipoEnergia.getCantidadEnergia();
        return tempInfo;
    }

    function inyectarEnergia(
        string memory nombreTipoEnergia,
        uint256 _cantidadEnergia
    ) public onlyOwner {
        require(
            nombreTipoEnergia.equals(tipoEnergia.getNombreTipoEnergia()),
            "El tipo de energia no es el mismo"
        );
        require(
            tipoEnergia.getCantidadEnergia() + _cantidadEnergia <=
                infoPlanta.capacidadNominal,
            "No hay suficiente capacidad para inyectar energia"
        );
        tipoEnergia.addCantidadEnergia(_cantidadEnergia);
        infoPlanta.cantidadEnergia += _cantidadEnergia;
    }

    function gastoEnergia(uint256 _cantidadEnergia) public onlyOwner {
        require(
            address(tipoEnergia) != nullAddress,
            "No hay energia para gastar"
        );
        require(
            tipoEnergia.getCantidadEnergia() - _cantidadEnergia >= 0,
            "No hay suficiente energia para gastar"
        );
        tipoEnergia.restarCantidadEnergia(_cantidadEnergia);
        infoPlanta.cantidadEnergia -= _cantidadEnergia;
    }

    function aumentarCapacidadNominal(uint256 _cantidad) public onlyOwner {
        infoPlanta.capacidadNominal += _cantidad;
    }

    function disminuirCapacidadNominal(uint256 _cantidad) public onlyOwner {
        require(
            infoPlanta.capacidadNominal - _cantidad >= 0,
            "No hay suficiente capacidad para disminuir"
        );
        infoPlanta.capacidadNominal -= _cantidad;
    }

    function getTipoEnergia() public view returns (InfoEnergia memory) {
        return tipoEnergia.getInfoEnergia();
    }

    function getCosteEnergia(
        uint256 _cantidadEnergia,
        uint256 _precioVentaEnergia
    ) public pure returns (uint256) {
        return _cantidadEnergia * _precioVentaEnergia;
    }

    function setRec(bool _isRec) public {
        infoPlanta.isRec = _isRec;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "No tiene permisos para ejecutar la transaccion"
        );
        _;
    }
}
