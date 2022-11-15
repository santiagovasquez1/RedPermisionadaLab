// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./models/InfoContrato.sol";
import "./models/Factory.sol";
import "./libraries/Validations.sol";
import "./models/PlantaEnergia.sol";
import "./Generador.sol";

contract MvmPlantaEnergiasFactory {
    address private owner;
    address private dirContrato;
    address private reguladorMercado;
    address private bancoEnergia;
    using StringLibrary for string;

    constructor(
        address _reguladorMercado,
        address _bancoEnergia
    ) {
        owner = msg.sender;
        dirContrato = address(this);
        reguladorMercado = _reguladorMercado;
        bancoEnergia = _bancoEnergia;
    }

    function FactoryGenerador(
        address _dirGenerador,
        InfoPlanta memory _infoPlanta
    ) external {
        require(isTipoEnergiaValido(_infoPlanta.tecnologia), "Tipo de energia no valido");
        PlantaEnergia plantaEnergia = new PlantaEnergia(
            msg.sender,
            _infoPlanta
        );

        Generador(_dirGenerador).setPlantasEnergias(
            plantaEnergia.getInfoPlanta(),
            address(plantaEnergia)
        );
    }

    function isTipoEnergiaValido(string memory _tipoEnergia)
        public
        view
        returns (bool)
    {
        InfoEnergia[] memory infoEnergias = BancoEnergia(bancoEnergia)
            .getTiposEnergiasDisponibles();
        return
            Validations.validarEnergiasDisponibles(_tipoEnergia, infoEnergias);
    }
}
