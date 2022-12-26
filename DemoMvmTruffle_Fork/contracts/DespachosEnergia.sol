pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./models/InfoContrato.sol";
import "./libraries/Validations.sol";
import "./models/DateTime.sol";
import "./Generador.sol";

contract DespachosEnergia {
    address private nullAddress = 0x0000000000000000000000000000000000000000;
    string public name;
    address public owner;
    address public dirContrato;
    address private dateTimeContract;
    mapping(bytes32 => OrdenDespacho) OrdenesDespacho;
    OrdenDespacho[] private DespachosRealizados;
    OrdenDespacho[] private HistoricoOrdenesDespacho;
    uint256 counterDespachos;
    event inyeccionDespacho();
    event ordenDespacho();

    constructor(address _dateTime) {
        owner = msg.sender;
        dirContrato = address(this);
        dateTimeContract = _dateTime;
    }

    modifier authorize(address direction) {
        require(
            direction == owner,
            "No tienes permisos para realizar la transaccion"
        );
        _;
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
            Generador(_dirGenerador).getInfoContrato().empresa,
            _cantidadEnergia,
            0,
            fechaOrden,
            counterDespachos
        );

        OrdenesDespacho[hashOrdenDespacho] = tempOrden;
        HistoricoOrdenesDespacho.push(tempOrden);
        counterDespachos++;
        emit ordenDespacho();
    }

    function editCantidadDespacho(
        address _dirGenerador,
        uint256 _cantidadEnergia,
        uint256 _fechaOrden,
        uint256 _index
    ) public authorize(msg.sender) {
        uint256 fechaOrden = DateTime(dateTimeContract).getDate(_fechaOrden);
        bytes32 hashOrdenDespacho = keccak256(
            abi.encodePacked(_dirGenerador, fechaOrden)
        );

        OrdenesDespacho[hashOrdenDespacho].cantidadEnergia = _cantidadEnergia;
        HistoricoOrdenesDespacho[_index] = OrdenesDespacho[hashOrdenDespacho];
    }

    //TODO: Agregar modifier para que solo se pueda ejecutar desde el generador
    function inyeccionEnergiaOrden(
        address _dirGenerador,
        uint256 _cantidadEnergia,
        uint256 _fechaOrden,
        uint256 _index
    ) public {
        uint256 fechaOrden = DateTime(dateTimeContract).getDate(_fechaOrden);
        bytes32 hashOrdenDespacho = keccak256(
            abi.encodePacked(_dirGenerador, fechaOrden)
        );
        OrdenesDespacho[hashOrdenDespacho].cantidadProducida =
            OrdenesDespacho[hashOrdenDespacho].cantidadProducida +
            _cantidadEnergia;

        DespachosRealizados.push(OrdenesDespacho[hashOrdenDespacho]);
        HistoricoOrdenesDespacho[_index] = OrdenesDespacho[hashOrdenDespacho];
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

    function getDespachosByGenerador(address _dirGenerador)
        public
        view
        returns (OrdenDespacho[] memory)
    {
        uint256 counterGenerador = 0;
        for (uint256 i = 0; i < HistoricoOrdenesDespacho.length; i++) {
            if (HistoricoOrdenesDespacho[i].dirGenerador == _dirGenerador) {
                counterGenerador++;
            }
        }

        OrdenDespacho[] memory ordenesGenerador = new OrdenDespacho[](
            counterGenerador
        );

        uint256 j = 0;
        for (uint256 i = 0; i < HistoricoOrdenesDespacho.length; i++) {
            if (HistoricoOrdenesDespacho[i].dirGenerador == _dirGenerador) {
                ordenesGenerador[j] = HistoricoOrdenesDespacho[i];
                j++;
            }
        }
    }

    function getDespachosRealizados()
        public
        view
        returns (OrdenDespacho[] memory)
    {
        return DespachosRealizados;
    }

    function getHistoricoDespachos()
        public
        view
        returns (OrdenDespacho[] memory)
    {
        return HistoricoOrdenesDespacho;
    }
}
