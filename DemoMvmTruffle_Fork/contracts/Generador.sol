// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./libraries/StringLibrary.sol";
import "./models/TipoEnergia.sol";
import "./models/InfoContrato.sol";
import "./models/Agente.sol";
import "./BancoEnergia.sol";
import "./models/PlantaEnergia.sol";
import "./helpers/GeneradorTransactionsHelper.sol";
import "./Comercializador.sol";

contract Generador is Agente {
    address public generadorTransactionsHelper;
    InfoPlanta[] private plantasEnergia;
    mapping(address => bool) private existenPlantas;
    uint256 private acumuladoVenta;
    InfoCompraEnergia[] private ComprasRealizadas;
    uint256 private precioVentaEnergia;
    uint256 private counterEnergiaDespacho;
    TipoEnergia[] private energiaDeBolsa;
    using StringLibrary for string;

    //Evento de compra de tokens
    event compraEnergia(uint256, string, address);
    event creacionPlanta();
    event inyeccionEnergia();
    event inyeccionEnergiaEnBolsa();
    event acuerdoConCliente();
    event actualizacionContrato();

    constructor(
        InfoContrato memory _infoContrato,
        address _generadorTransactionsHelper
    ) {
        infoContrato = InfoContrato(
            address(this),
            _infoContrato.owner,
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

        generadorTransactionsHelper = _generadorTransactionsHelper;
    }

    modifier onlyComercializador() {
        address owner = Comercializador(msg.sender).getInfoContrato().owner;
        require(
            owner != nullAddress,
            "El tipo de contrato no es comercializador"
        );
        _;
    }

    function crearPlantaEnergia(InfoPlanta memory _infoPlanta)
        public
        authorize(msg.sender)
    {
        GeneradorTransactionsHelper(generadorTransactionsHelper)
            .crearPlantaEnergia(_infoPlanta, infoContrato.dirContrato);
    }

    function setPrecioEnergia(uint256 _precioEnergia)
        public
        authorize(msg.sender)
    {
        precioVentaEnergia = _precioEnergia;
    }

    function getPrecioEnergia() public view returns (uint256) {
        return precioVentaEnergia;
    }

    function setEnergiasBolsa() public {
        GeneradorTransactionsHelper(generadorTransactionsHelper)
            .setEnergiasBolsa(infoContrato.dirContrato);
    }

    function addEnergiaBolsa(TipoEnergia _tipoEnergia)
        public
        onlyHelper(generadorTransactionsHelper)
    {
        energiaDeBolsa.push(_tipoEnergia);
    }

    function getAcuerdosDeCompraGenerador()
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        return
            GeneradorTransactionsHelper(generadorTransactionsHelper)
                .getAcuerdosDeCompraGenerador();
    }

    function setPlantasEnergias(
        InfoPlanta memory _infoPlanta,
        address _dirPlanta
    ) public {
        plantasEnergia.push(_infoPlanta);
        existenPlantas[_dirPlanta] = true;
    }

    function existePlanta(address _dirPlanta) public view returns (bool) {
        return existenPlantas[_dirPlanta];
    }

    function getPlantasEnergia() public view returns (InfoPlanta[] memory) {
        InfoPlanta[] memory tempPlantas = new InfoPlanta[](
            plantasEnergia.length
        );
        for (uint256 i = 0; i < plantasEnergia.length; i++) {
            tempPlantas[i] = PlantaEnergia(plantasEnergia[i].dirPlanta)
                .getInfoPlanta();
        }

        return tempPlantas;
    }

    function inyectarEnergiaPlanta(
        address _dirPlanta,
        string memory _tipoEnergia,
        uint256 _cantidadEnergiaGenerador,
        uint256 _cantidadEnergiaBolsa
    ) public authorize(msg.sender) {
        uint256 _cantidadEnergia = _cantidadEnergiaBolsa +
            _cantidadEnergiaGenerador;
        GeneradorTransactionsHelper(generadorTransactionsHelper)
            .inyectarEnergiaPlanta(
                infoContrato.dirContrato,
                _dirPlanta,
                _tipoEnergia,
                _cantidadEnergia
            );

        inyectarEnergiaEnBolsa(_dirPlanta, _cantidadEnergiaBolsa);
        inyeccionEnergiaBolsaGenerador(_tipoEnergia, _cantidadEnergiaGenerador);
        emit inyeccionEnergia();
    }

    function inyectarEnergiaEnBolsa(
        address _dirPlanta,
        uint256 _cantidadEnergia
    ) public authorize(msg.sender) {
        GeneradorTransactionsHelper(generadorTransactionsHelper)
            .inyectarEnergiaBolsa(_dirPlanta, _cantidadEnergia);
        emit inyeccionEnergiaEnBolsa();
    }

    function getCantidadEnergiaPlantas(string memory _tipoEnergia)
        public
        view
        returns (uint256)
    {
        uint256 cantidadEnergia = 0;
        for (uint256 i = 0; i < plantasEnergia.length; i++) {
            if (
                PlantaEnergia(plantasEnergia[i].dirPlanta)
                    .getTipoEnergia()
                    .nombre
                    .equals(_tipoEnergia)
            ) {
                cantidadEnergia += PlantaEnergia(plantasEnergia[i].dirPlanta)
                    .getTipoEnergia()
                    .cantidadEnergia;
            }
        }

        return cantidadEnergia;
    }

    function getCantidadEnergiaBolsaByName(string memory _tipoEnergia)
        public
        view
        returns (uint256)
    {
        uint256 cantidadEnergia = 0;
        for (uint256 i = 0; i < energiaDeBolsa.length; i++) {
            if (energiaDeBolsa[i].getNombreTipoEnergia().equals(_tipoEnergia)) {
                cantidadEnergia = energiaDeBolsa[i].getCantidadEnergia();
                break;
            }
        }
        return cantidadEnergia;
    }

    function compraEnergiaBolsa(
        uint256 _cantidadEnergia,
        string memory _tipoEnergia
    ) public authorize(msg.sender) {
        GeneradorTransactionsHelper(generadorTransactionsHelper)
            .compraEnergiaBolsa(
                infoContrato.owner,
                _cantidadEnergia,
                _tipoEnergia
            );
        //Adicion de energia
        inyeccionEnergiaBolsaGenerador(_tipoEnergia, _cantidadEnergia);
    }

    //Funcion que se invoca despues de la compra de energia a la bolsa
    function inyeccionEnergiaBolsaGenerador(
        string memory _tipoEnergia,
        uint256 _cantidadEnergia
    ) private authorize(msg.sender) {
        for (uint256 i = 0; i < energiaDeBolsa.length; i++) {
            if (energiaDeBolsa[i].getNombreTipoEnergia().equals(_tipoEnergia)) {
                energiaDeBolsa[i].addCantidadEnergia(_cantidadEnergia);
                break;
            }
        }
    }

    function inyectarEnergiaContratos(
        address _dirCliente,
        string memory _tipoEnergia,
        uint256 _cantidadEnergia,
        uint256 _indexGlobal
    ) public authorize(msg.sender) {
        uint256 indexEnergiaGenerador;
        for (uint256 i = 0; i < energiaDeBolsa.length; i++) {
            if (energiaDeBolsa[i].getNombreTipoEnergia().equals(_tipoEnergia)) {
                indexEnergiaGenerador = i;
                break;
            }
        }
        require(
            energiaDeBolsa[indexEnergiaGenerador].getCantidadEnergia() -
                _cantidadEnergia >=
                0,
            "No puede gastar mas energia que la disponible"
        );
        GeneradorTransactionsHelper(generadorTransactionsHelper)
            .inyectarEnergiaContratos(
                _dirCliente,
                _cantidadEnergia,
                _indexGlobal
            );

        energiaDeBolsa[indexEnergiaGenerador].restarCantidadEnergia(
            _cantidadEnergia
        );

        updateAcuerdoDeCompra();
    }

    function updateAcuerdoDeCompra() public {
        emit actualizacionContrato();
    }

    function setCounterDespacho(uint256 _cantidadEnergia) external {
        counterEnergiaDespacho += _cantidadEnergia;
    }

    function getCounterDespacho() public view returns (uint256) {
        return counterEnergiaDespacho;
    }

    function resetCounterDespacho() external {
        counterEnergiaDespacho = 0;
    }

    function getCapacidadNominalTotal() public view returns (uint256) {
        uint256 capacidadNominalTotal = 0;
        for (uint256 i = 0; i < plantasEnergia.length; i++) {
            capacidadNominalTotal += plantasEnergia[i].capacidadNominal;
        }
        return capacidadNominalTotal;
    }

    function getInfoEnergiaPlanta(address _dirPlanta)
        public
        view
        returns (InfoEnergia memory)
    {
        return PlantaEnergia(_dirPlanta).getTipoEnergia();
    }

    function getAcumuladoVenta() public view returns (uint256) {
        return acumuladoVenta;
    }

    function addCompraCliente(InfoCompraEnergia memory _infoCompraEnergia)
        external
    {
        ComprasRealizadas.push(_infoCompraEnergia);
    }

    function getComprasRealizadas()
        public
        view
        returns (InfoCompraEnergia[] memory)
    {
        return ComprasRealizadas;
    }
}
