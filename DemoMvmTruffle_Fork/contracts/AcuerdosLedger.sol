// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./models/Agente.sol";
import "./models/InfoContrato.sol";
import "./ReguladorMercado.sol";
import "./libraries/Validations.sol";

contract AcuerdosLedger {
    address public owner;
    address public dirContrato;
    address private reguladorMercado;
    uint256 private counterAcuerdos;
    AcuerdoEnergia[] private acuerdosDeCompraMercado;
    address private nullAddress = 0x0000000000000000000000000000000000000000;

    event creacionAcuerdo();
    event actualizacionAcuerdo();
    event liquidacionAcuerdo();

    constructor(address _reguladorMercado) {
        owner = msg.sender;
        dirContrato = address(this);
        reguladorMercado = _reguladorMercado;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner, "No es administrador de la plataforma");
        _;
    }

    modifier authorize() {
        SolicitudContrato[] memory arraySolicitudes = ReguladorMercado(
            reguladorMercado
        ).getRegistros();
        require(
            Validations.existsContract2(msg.sender, arraySolicitudes),
            "No existe el contrato"
        );
        SolicitudContrato memory solicitud = Validations.getInfoContrato(
            msg.sender,
            ReguladorMercado(reguladorMercado).getRegistros()
        );
        require(
            solicitud.estadoSolicitud == EstadoSolicitud.aprobada,
            "No tiene permisos para realizar la transaccion"
        );
        _;
    }

    function setAcuerdosDeCompraMercado(AcuerdoEnergia memory _acuerdoEnergia)
        public
    {
        _acuerdoEnergia.indexGlobal = counterAcuerdos;
        acuerdosDeCompraMercado.push(_acuerdoEnergia);
        counterAcuerdos++;
        emit creacionAcuerdo();
    }

    function updateAcuerdoDeCompra(
        AcuerdoEnergia memory _acuerdoEnergia,
        uint256 _indexGlobal
    ) public {
        acuerdosDeCompraMercado[_indexGlobal] = _acuerdoEnergia;
        emit actualizacionAcuerdo();
    }

    function getAcuerdosDeCompraMercado()
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        return acuerdosDeCompraMercado;
    }

    function getAcuerdoByIndex(uint256 _indexGlobal)
        public
        view
        returns (AcuerdoEnergia memory)
    {
        return acuerdosDeCompraMercado[_indexGlobal];
    }

    function getAcuerdosByCliente(address _dirCliente)
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        uint256 counterAcuerdosCliente = 0;

        for (uint256 i = 0; i < acuerdosDeCompraMercado.length; i++) {
            if (
                acuerdosDeCompraMercado[i].dataCliente.dirContrato ==
                _dirCliente
            ) {
                counterAcuerdosCliente++;
            }
        }

        AcuerdoEnergia[] memory acuerdosCliente = new AcuerdoEnergia[](
            counterAcuerdosCliente
        );

        uint256 j = 0;
        for (uint256 i = 0; i < acuerdosDeCompraMercado.length; i++) {
            if (
                acuerdosDeCompraMercado[i].dataCliente.dirContrato ==
                _dirCliente
            ) {
                acuerdosCliente[j] = acuerdosDeCompraMercado[i];
                j++;
            }
        }

        return acuerdosCliente;
    }

    function getAcuerdosByGenerador(address _dirGenerador)
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        uint256 counterAcuerdosGenerador = 0;

        for (uint256 i = 0; i < acuerdosDeCompraMercado.length; i++) {
            if (
                acuerdosDeCompraMercado[i].dataGenerador.dirContrato ==
                _dirGenerador
            ) {
                counterAcuerdosGenerador++;
            }
        }

        AcuerdoEnergia[] memory acuerdosGenerador = new AcuerdoEnergia[](
            counterAcuerdosGenerador
        );

        uint256 j = 0;
        for (uint256 i = 0; i < acuerdosDeCompraMercado.length; i++) {
            if (
                acuerdosDeCompraMercado[i].dataGenerador.dirContrato ==
                _dirGenerador
            ) {
                acuerdosGenerador[j] = acuerdosDeCompraMercado[i];
                j++;
            }
        }

        return acuerdosGenerador;
    }

    function getAcuerdosByComercializador(address _dirComercializador)
        public
        view
        returns (AcuerdoEnergia[] memory)
    {
        uint256 counterAcuerdosComercializador = 0;

        for (uint256 i = 0; i < acuerdosDeCompraMercado.length; i++) {
            if (
                acuerdosDeCompraMercado[i].dataComercializador.dirContrato ==
                _dirComercializador
            ) {
                counterAcuerdosComercializador++;
            }
        }

        AcuerdoEnergia[] memory acuerdosComercializador = new AcuerdoEnergia[](
            counterAcuerdosComercializador
        );

        uint256 j = 0;
        for (uint256 i = 0; i < acuerdosDeCompraMercado.length; i++) {
            if (
                acuerdosDeCompraMercado[i].dataComercializador.dirContrato ==
                _dirComercializador
            ) {
                acuerdosComercializador[j] = acuerdosDeCompraMercado[i];
                j++;
            }
        }

        return acuerdosComercializador;
    }

    function liquidacionContrato(uint256 _indexGlobal) public onlyAdmin {
        address ownerCliente = Agente(
            acuerdosDeCompraMercado[_indexGlobal].dataCliente.dirContrato
        ).getInfoContrato().owner;

        address ownerGenerador = Agente(
            acuerdosDeCompraMercado[_indexGlobal].dataGenerador.dirContrato
        ).getInfoContrato().owner;

        require(
            acuerdosDeCompraMercado[_indexGlobal].estadoAcuerdo ==
                EstadoAcuerdo.activo,
            "El acuerdo debe de estar activo"
        );

        require(
            acuerdosDeCompraMercado[_indexGlobal].fechaFin <= block.timestamp,
            "No puede liquidar un contrato antes de su fecha de vencimiento"
        );

        require(
            acuerdosDeCompraMercado[_indexGlobal].cantidadEnergiaInyectada ==
                acuerdosDeCompraMercado[_indexGlobal].cantidadEnergiaTotal,
            "No se puede liquidar el contrato hasta que no se cumpla la cantidad de energia pactada"
        );

        require(
            ReguladorMercado(reguladorMercado).MisTokens(ownerCliente) >=
                acuerdosDeCompraMercado[_indexGlobal].valorContrato,
            "Fondos insuficientes en el cliente, requiere comprar mas tokens"
        );

        //Transferencia de tokens
        ReguladorMercado(reguladorMercado).intercambioDirectoTokens(
            acuerdosDeCompraMercado[_indexGlobal].valorContrato,
            ownerCliente,
            ownerGenerador
        );

        acuerdosDeCompraMercado[_indexGlobal].estadoAcuerdo = EstadoAcuerdo
            .cerrado;

        emit liquidacionAcuerdo();
    }
}
