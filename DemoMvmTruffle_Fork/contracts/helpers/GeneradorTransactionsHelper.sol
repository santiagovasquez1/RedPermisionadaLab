// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../models/InfoContrato.sol";
import "../ReguladorMercado.sol";
import "../MvmPlantaEnergiasFactory.sol";
import "../libraries/Validations.sol";
import "../BancoEnergia.sol";
import "../Generador.sol";
import "../models/PlantaEnergia.sol";

contract GeneradorTransactionsHelper {
    address private owner;
    address private reguladorMercado;
    address private factoryPlanta;
    address private bancoEnergia;

    constructor(
        address _reguladorMercado,
        address _factoryPlanta,
        address _bancoEnergia
    ) {
        owner = msg.sender;
        reguladorMercado = _reguladorMercado;
        factoryPlanta = _factoryPlanta;
        bancoEnergia = _bancoEnergia;
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
        OrdenDespacho memory ordenDespacho = ReguladorMercado(reguladorMercado)
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
        ReguladorMercado(reguladorMercado).inyeccionEnergiaOrden(
            _dirGenerador,
            _cantidadEnergia,
            block.timestamp
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

        //Restar energia de planta
        //PlantaEnergia(_dirPlanta).gastoEnergia(_cantidadEnergia);
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

    // function ComprarEnergia(
    //     address _dirGenerador,
    //     address _dirPlanta,
    //     uint256 cantidadEnergia,
    //     address _dirOwnerContrato
    // ) external authorize {
    //     //Verificar que exista la planta de energia
    //     require(
    //         Generador(_dirGenerador).existePlanta(_dirPlanta),
    //         "No existe la planta de energia"
    //     );
    //     string memory tipoEnergia = PlantaEnergia(_dirPlanta)
    //         .getTipoEnergia()
    //         .nombre;

    //     //Comprobar que la cantiadad de energia solicitada no supere la producida
    //     uint256 cantidadEnergiaDisponible = PlantaEnergia(_dirPlanta)
    //         .getTipoEnergia()
    //         .cantidadEnergia;

    //     require(
    //         cantidadEnergiaDisponible >= cantidadEnergia,
    //         "No puede comprar mas energia de la disponible"
    //     );

    //     //Calcular el coste de la energia
    //     uint256 costeEnergia = PlantaEnergia(_dirPlanta).getCosteEnergia(
    //         cantidadEnergia,
    //         Generador(_dirGenerador).getPrecioEnergia()
    //     );
    //     //Verficar que el comprador cuente con fondos suficientes
    //     require(
    //         costeEnergia <=
    //             ReguladorMercado(reguladorMercado).MisTokens(_dirOwnerContrato),
    //         "No tienes tokens suficientes"
    //     );

    //     //Transferencia de los tokens al owner del contrato
    //     ReguladorMercado(reguladorMercado).IntercambiarTokens(
    //         _dirOwnerContrato,
    //         Generador(_dirGenerador).getInfoContrato().owner,
    //         msg.sender,
    //         costeEnergia
    //     );

    //     //Descontar la energia disponible
    //     PlantaEnergia(_dirPlanta).gastoEnergia(cantidadEnergia);

    //     BancoEnergia(bancoEnergia).onCantidadEnergiaChange(
    //         tipoEnergia,
    //         cantidadEnergia,
    //         Operacion.restar
    //     );
    // }

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


}
