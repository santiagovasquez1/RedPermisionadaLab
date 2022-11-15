// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./TokenErc20/ERC20.sol";
import "./models/InfoContrato.sol";
import "./libraries/Validations.sol";
import "./models/DateTime.sol";

contract ReguladorMercado {
    //Token del contrato
    ERC20Basic private token;
    address private nullAddress = 0x0000000000000000000000000000000000000000;

    string public name;
    address public owner;
    address public dirContrato;
    address private dateTimeContract;
    uint256 public cantidadTokens = 1000000;
    SolicitudContrato[] private solicitudes;
    mapping(bytes32 => OrdenDespacho) OrdenesDespacho;
    OrdenDespacho[] private DespachosRealizados;
    event ComprandoTokens(uint256, address);
    event tokensDevueltos(uint256, address);
    event EnviarTokensEvent(uint256, address, address);
    event SolicitudDeRegistro(SolicitudContrato);
    event ContratoDiligenciado(SolicitudContrato);
    event inyeccionDespacho();

    constructor(string memory _name, address _dateTime) {
        name = _name;
        owner = msg.sender;
        dirContrato = address(this);
        dateTimeContract = _dateTime;
        token = new ERC20Basic(cantidadTokens);
    }

    modifier authorize(address direction) {
        require(
            direction == owner,
            "No tienes permisos para realizar la transaccion"
        );
        _;
    }

    function PrecioTokens(uint256 _numTokens) private pure returns (uint256) {
        return _numTokens * (1e15);
    }

    function GenerarTokens(uint256 numTokens) public authorize(msg.sender) {
        token.increaseTotalSupply(numTokens);
    }

    function TokensDisponibles() public view returns (uint256) {
        return token.balanceOf(dirContrato);
    }

    function ComprarTokens(uint256 numTokens) public {
        uint256 coste = PrecioTokens(numTokens);
        //Obtener el balance de tokens del contrato
        uint256 balance = TokensDisponibles();
        //Filtro para evaluar los tokens disponibles
        require(numTokens <= balance, "Compra un numero de tokens adecuado");
        //Transferir tokens al comprador
        token.transfer(msg.sender, numTokens);
        emit ComprandoTokens(numTokens, msg.sender);
    }

    function transferirTokensInyeccion(
        uint256 numTokens,
        address _ownerGenerador
    ) public authorize(tx.origin) {
        uint256 balance = TokensDisponibles();
        //Filtro para evaluar los tokens disponibles
        require(numTokens <= balance, "Compra un numero de tokens adecuado");
        //Transferir tokens al comprador
        token.transfer(_ownerGenerador, numTokens);
    }

    function intercambioDirectoTokens(
        uint256 numTokens,
        address address1,
        address address2
    ) public {
        //El numero de tokens debe de ser mayor a cero
        require(
            numTokens > 0,
            "Necesitas devolver un numero positivo de tokens"
        );
        //EL cliente debe tener los tokens que desea devolver
        require(
            numTokens <= MisTokens(address1),
            "No puedes transferir mas tokens de los que tienes disponibles"
        );
        //1.Devolucion de tokens por parte del cliente al contrato
        token.transferTwo(address1, address2, numTokens);
    }

    function IntercambiarTokens(
        address _dir1,
        address _dir2,
        address _dir3,
        uint256 numTokens
    ) public {
        token.transferFrom(_dir1, _dir2, _dir3, numTokens);
        emit EnviarTokensEvent(numTokens, _dir1, _dir2);
    }

    function MisTokens(address _direction) public view returns (uint256) {
        return token.balanceOf(_direction);
    }

    function DevolverTokens(uint256 numTokens) public {
        //El numero de tokens debe de ser mayor a cero
        require(
            numTokens > 0,
            "Necesitas devolver un numero positivo de tokens"
        );
        //EL cliente debe tener los tokens que desea devolver
        require(
            numTokens <= MisTokens(msg.sender),
            "No puedes devolver mas tokens de los que tienes disponibles"
        );
        //1.Devolucion de tokens por parte del cliente al contrato
        token.transferTwo(msg.sender, address(this), numTokens);

        //2.Pago de tokens devueltos en ethers
        emit tokensDevueltos(numTokens, msg.sender);
    }

    function delegarTokens(address delegate, uint256 numTokens) public {
        token.approve(delegate, numTokens);
    }

    function retornarDelegacion(address delegate, uint256 numTokens) public {
        token.disapprove(delegate, numTokens);
    }

    function getTokensDelegados(address delegate)
        public
        view
        returns (uint256)
    {
        return token.allowance(msg.sender, delegate);
    }

    function getTokensDelegadosByAddress(address _owner, address delegate)
        public
        view
        returns (uint256)
    {
        return token.allowance(_owner, delegate);
    }

    function getSolicitudes() public view returns (SolicitudContrato[] memory) {
        return solicitudes;
    }

    function getRegistros() public view returns (SolicitudContrato[] memory) {
        uint256 contadorAprobados = 0;
        uint256 j = 0;

        for (uint256 i = 0; i < solicitudes.length; i++) {
            if (solicitudes[i].estadoSolicitud == EstadoSolicitud.aprobada) {
                contadorAprobados++;
            }
        }
        SolicitudContrato[] memory tempRegistros = new SolicitudContrato[](
            contadorAprobados
        );

        for (uint256 i = 0; i < solicitudes.length; i++) {
            if (solicitudes[i].estadoSolicitud == EstadoSolicitud.aprobada) {
                tempRegistros[j] = solicitudes[i];
                j++;
            }
        }
        return tempRegistros;
    }

    function registrarSolicitud(
        InfoContrato memory _infoContrato,
        uint256 _tipoContrato
    ) public {
        bool bandera = existeSolicitud(msg.sender);
        require(!bandera, "Ya tienes una solicitud registrada");
        solicitudes.push(
            SolicitudContrato(
                _infoContrato,
                TiposContratos(_tipoContrato),
                EstadoSolicitud.pendiente,
                block.timestamp,
                0
            )
        );
        emit SolicitudDeRegistro(solicitudes[solicitudes.length - 1]);
    }

    function diligenciarSolicitud(
        uint256 index,
        InfoContrato memory infoContrato,
        EstadoSolicitud _estado
    ) public authorize(tx.origin) {
        require(
            solicitudes[index].estadoSolicitud == EstadoSolicitud.pendiente,
            "La solicitud no esta en pendiente"
        );
        solicitudes[index].infoContrato = infoContrato;
        solicitudes[index].estadoSolicitud = _estado;
        solicitudes[index].fechaAprobacion = block.timestamp;
        emit ContratoDiligenciado(solicitudes[index]);
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function existeSolicitud(address ownerSolicitud)
        public
        view
        returns (bool)
    {
        if (solicitudes.length > 0) {
            for (uint256 i = 0; i < solicitudes.length; i++) {
                if (ownerSolicitud == solicitudes[i].infoContrato.owner) {
                    return true;
                }
            }
        }
        return false;
    }

    function validarUsuario()
        public
        view
        returns (
            bool,
            address,
            TiposContratos
        )
    {
        if (msg.sender == owner) {
            return (true, dirContrato, TiposContratos.ReguladorMercado);
        }

        return Validations.validarUsuario(msg.sender, solicitudes);
    }

    function getIndexSolicitudes(address dir) public view returns (uint256) {
        for (uint256 i = 0; i < solicitudes.length; i++) {
            if (dir == solicitudes[i].infoContrato.owner) {
                return i;
            }
        }
        return 0;
    }

    function getInfoRegulador() public view returns (InfoRegulador memory) {
        InfoRegulador memory tempRegulador = InfoRegulador(
            owner,
            dirContrato,
            TokensDisponibles(),
            token.name(),
            token.symbol(),
            PrecioTokens(1)
        );
        return tempRegulador;
    }

    function setDespachoEnergia(address _dirGenerador, uint32 _cantidadEnergia)
        public
        authorize(msg.sender)
    {
        uint256 fechaOrden = DateTime(dateTimeContract).getDate(
            block.timestamp
        );

        bytes32 hashOrdenDespacho = keccak256(
            abi.encodePacked(_dirGenerador, fechaOrden)
        );

        OrdenDespacho memory tempOrden = OrdenDespacho(
            _dirGenerador,
            _cantidadEnergia,
            0,
            fechaOrden
        );

        OrdenesDespacho[hashOrdenDespacho] = tempOrden;
    }

    function editCantidadDespacho(
        address _dirGenerador,
        uint256 _cantidadEnergia,
        uint256 _fechaOrden
    ) public authorize(msg.sender) {
        uint256 fechaOrden = DateTime(dateTimeContract).getDate(_fechaOrden);
        bytes32 hashOrdenDespacho = keccak256(
            abi.encodePacked(_dirGenerador, fechaOrden)
        );

        OrdenesDespacho[hashOrdenDespacho].cantidadEnergia = _cantidadEnergia;
    }

    //TODO: Agregar modifier para que solo se pueda ejecutar desde el generador
    function inyeccionEnergiaOrden(
        address _dirGenerador,
        uint256 _cantidadEnergia,
        uint256 _fechaOrden
    ) public {
        uint256 fechaOrden = DateTime(dateTimeContract).getDate(_fechaOrden);
        bytes32 hashOrdenDespacho = keccak256(
            abi.encodePacked(_dirGenerador, fechaOrden)
        );
        OrdenesDespacho[hashOrdenDespacho].cantidadProducida =
            OrdenesDespacho[hashOrdenDespacho].cantidadProducida +
            _cantidadEnergia;

        DespachosRealizados.push(OrdenesDespacho[hashOrdenDespacho]);
        emit inyeccionDespacho();
    }

    function getDespachosByGeneradorAndDate(
        address _dirGenerador,
        uint256 _fechaOrden
    ) public view returns (OrdenDespacho memory) {
        uint256 fechaOrden = DateTime(dateTimeContract).getDate(_fechaOrden);

        bytes32 hashOrdenDespacho = keccak256(
            abi.encodePacked(_dirGenerador, fechaOrden)
        );
        require(
            OrdenesDespacho[hashOrdenDespacho].dirGenerador != nullAddress,
            "No existe orden"
        );
        return OrdenesDespacho[hashOrdenDespacho];
    }

    function getDespachosRealizados()
        public
        view
        returns (OrdenDespacho[] memory)
    {
        return DespachosRealizados;
    }
}
