// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../models/InfoContrato.sol";
import "../ReguladorMercado.sol";
import "../DespachosEnergia.sol";
import "../MvmPlantaEnergiasFactory.sol";
import "../libraries/Validations.sol";
import "../BancoEnergia.sol";
import "../Generador.sol";
import "../Cliente.sol";
import "../models/PlantaEnergia.sol";
import "../AcuerdosLedger.sol";

contract GeneradorTransactionsHelper {
    address private owner;
    address private reguladorMercado;
    address private despachosEnergia;
    address private factoryPlanta;
    address private bancoEnergia;
    address private acuerdosLedger;

    constructor(
        address _reguladorMercado,
        address _factoryPlanta,
        address _bancoEnergia,
        address _acuerdosLedger,
        address _despachosEnergia
    ) {
        owner = msg.sender;
        reguladorMercado = _reguladorMercado;
        factoryPlanta = _factoryPlanta;
        bancoEnergia = _bancoEnergia;
        acuerdosLedger = _acuerdosLedger;
        despachosEnergia = _despachosEnergia;
    }

    modifier authorize() {
        SolicitudContrato memory solicitud = Validations.getInfoContrato(
            msg.sender,
            ReguladorMercado(reguladorMercado).getRegistros()
        );
        require(
            solicitud.tipoContrato == TiposContratos.Generador,
            "El tipo de contrato no es generador"
        );
        _;
    }

    modifier authorizeAdmin() {
        require(tx.origin == owner, "No es el admin de la plataforma");
        _;
    }

    function crearPlantaEnergia(
        InfoPlanta memory _infoPlanta,
        address _generadorContract
    ) external authorize {
        MvmPlantaEnergiasFactory(factoryPlanta).FactoryGenerador(
            _generadorContract,
            _infoPlanta
        );
    }

    function setEnergiasBolsa(address _generadorContract)
        public
        authorizeAdmin
    {
        InfoEnergia[] memory tempEnergiasDisponibles = BancoEnergia(
            bancoEnergia
        ).getTiposEnergiasDisponibles();
        for (uint256 i = 0; i < tempEnergiasDisponibles.length; i++) {
            TipoEnergia tempTipoEnergia = new TipoEnergia(
                tempEnergiasDisponibles[i].nombre,
                0
            );
            Generador(_generadorContract).addEnergiaBolsa(tempTipoEnergia);
        }
    }

    function inyectarEnergiaPlanta(
        address _dirGenerador,
        address _dirPlanta,
        string memory _tipoEnergia,
        uint256 _cantidadEnergia
    ) public authorize {
        OrdenDespacho memory ordenDespacho = DespachosEnergia(despachosEnergia)
            .getDespachosByGeneradorAndDate(_dirGenerador, block.timestamp);

        uint256 energiaDespachada = Generador(_dirGenerador)
            .getCounterDespacho();

        require(
            energiaDespachada + ordenDespacho.cantidadProducida <=
                ordenDespacho.cantidadEnergia,
            "No puede producir mas de lo requerido"
        );

        require(
            Generador(_dirGenerador).existePlanta(_dirPlanta),
            "No existe la planta de energia"
        );
        require(isTipoEnergiaValido(_tipoEnergia), "Tipo de energia no valido");

        PlantaEnergia(_dirPlanta).inyectarEnergia(
            _tipoEnergia,
            _cantidadEnergia
        );

        Generador(_dirGenerador).setCounterDespacho(_cantidadEnergia);
        DespachosEnergia(despachosEnergia).inyeccionEnergiaOrden(
            _dirGenerador,
            _cantidadEnergia,
            block.timestamp,
            ordenDespacho.index
        );

        BancoEnergia(bancoEnergia).setInfoTx(
            InfoTx(
                TipoTx.inyeccion,
                block.timestamp,
                _tipoEnergia,
                _cantidadEnergia,
                Generador(_dirGenerador).getInfoContrato().dirContrato,
                Generador(_dirGenerador).getInfoContrato().empresa,
                _dirPlanta,
                PlantaEnergia(_dirPlanta).getInfoPlanta().nombre,
                BancoEnergia(bancoEnergia).getContadorTx()
            )
        );
    }

    function inyectarEnergiaBolsa(address _dirPlanta, uint256 _cantidadEnergia)
        public
        authorize
    {
        InfoContrato memory _infoContratoGenerador = Generador(msg.sender)
            .getInfoContrato();

        InfoPlanta memory _infoPlanta = PlantaEnergia(_dirPlanta)
            .getInfoPlanta();

        InfoEnergia memory _infoEnergia = InfoEnergia(
            _infoPlanta.tecnologia,
            _cantidadEnergia
        );

        InfoInyeccionEnergia
            memory _infoInyeccionEnergia = InfoInyeccionEnergia(
                _infoEnergia,
                _infoPlanta,
                _infoContratoGenerador.dirContrato,
                _infoContratoGenerador.owner,
                Generador(msg.sender).getPrecioEnergia(),
                block.timestamp
            );

        //Inyectar energia en la bolsa
        BancoEnergia(bancoEnergia).setInfoInyeccionesEnergias(
            _infoInyeccionEnergia
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

    function inyectarEnergiaContratos(
        address _dirCliente,
        uint256 _cantidadEnergia,
        uint256 _indexGlobal
    ) public authorize {
        AcuerdoEnergia memory acuerdoCompra = AcuerdosLedger(acuerdosLedger)
            .getAcuerdoByIndex(_indexGlobal);
        require(
            acuerdoCompra.dataGenerador.dirContrato == msg.sender,
            "Generador incorrecto"
        );
        require(
            acuerdoCompra.dataCliente.dirContrato == _dirCliente,
            "Cliente incorrecto"
        );

        require(
            acuerdoCompra.cantidadEnergiaInyectada + _cantidadEnergia <=
                acuerdoCompra.cantidadEnergiaTotal,
            "No puede inyectar mas energia que la total"
        );

        acuerdoCompra.cantidadEnergiaInyectada += _cantidadEnergia;
        AcuerdosLedger(acuerdosLedger).updateAcuerdoDeCompra(
            acuerdoCompra,
            _indexGlobal
        );

        Cliente(_dirCliente).updateAcuerdoDeCompra();
    }

    function compraEnergiaBolsa(
        address _ownerGenerador,
        uint256 _cantidadEnergia,
        string memory _tipoEnergia
    ) public authorize {
        BancoEnergia(bancoEnergia).ventaEnergiaBolsa(
            _ownerGenerador,
            _cantidadEnergia,
            _tipoEnergia
        );
    }

    function getAcuerdosDeCompraGenerador()
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        return
            AcuerdosLedger(acuerdosLedger).getAcuerdosByGenerador(msg.sender);
    }
}
