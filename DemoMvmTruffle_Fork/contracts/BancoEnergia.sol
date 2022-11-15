// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./models/InfoContrato.sol";
import "./models/TipoEnergia.sol";
import "./ReguladorMercado.sol";
import "./libraries/StringLibrary.sol";
import "./libraries/Validations.sol";
import "./models/DateTime.sol";

contract BancoEnergia {
    using StringLibrary for string;
    address public owner;
    address public dirContrato;
    ReguladorMercado private reguladorMercado;
    TipoEnergia[] private tiposEnergiasDisponibles;
    InfoInyeccionEnergia[] private infoInyeccionesEnergias;
    InfoConsumoEnergia[] private infoConsumosEnergias;
    InfoTx[] private infoTransacciones;
    uint256 private contadorTransacciones;
    uint256 private precioVentaEnergia;
    address private dateTimeContract;

    event cambioDeEnergia(InfoEnergia);
    event eventoTransaccion();
    event inyeccionEnergiaEnBolsa();

    modifier authorize(address direction) {
        require(direction == owner);
        _;
    }

    modifier canChangeCantidad(address direction) {
        SolicitudContrato memory solicitud = Validations.getInfoContrato(
            msg.sender,
            reguladorMercado.getRegistros()
        );
        require(solicitud.tipoContrato == TiposContratos.Generador);
        _;
    }

    constructor(ReguladorMercado _regulador, address _dateTime) {
        owner = msg.sender;
        dirContrato = address(this);
        reguladorMercado = _regulador;
        dateTimeContract = _dateTime;
        setEnergiaDisponible("solar", 0);
        setEnergiaDisponible("eolica", 0);
    }

    function setEnergiaDisponible(string memory _nombre, uint256 _cantidad)
        private
        authorize(msg.sender)
    {
        TipoEnergia tempTipoEnergia = new TipoEnergia(_nombre, _cantidad);
        tiposEnergiasDisponibles.push(tempTipoEnergia);
    }

    function getTiposEnergiasDisponibles()
        public
        view
        returns (InfoEnergia[] memory)
    {
        InfoEnergia[] memory infoEnergias = new InfoEnergia[](
            tiposEnergiasDisponibles.length
        );
        for (uint256 i = 0; i < tiposEnergiasDisponibles.length; i++) {
            InfoEnergia memory infoEnergia = InfoEnergia(
                tiposEnergiasDisponibles[i].nombre(),
                tiposEnergiasDisponibles[i].cantidadEnergia()
            );
            infoEnergias[i] = infoEnergia;
        }
        return infoEnergias;
    }

    function getEnergiaByNombre(string memory _tipoEnergia)
        public
        view
        returns (InfoEnergia memory)
    {
        InfoEnergia[] memory infoEnergias = getTiposEnergiasDisponibles();
        InfoEnergia memory tempInfo;
        for (uint256 i = 0; i < infoEnergias.length; i++) {
            if (infoEnergias[i].nombre.equals(_tipoEnergia)) {
                tempInfo = infoEnergias[i];
                break;
            }
        }

        return tempInfo;
    }

    function setInfoInyeccionesEnergias(
        InfoInyeccionEnergia memory _infoInyeccionEnergia
    ) public {
        infoInyeccionesEnergias.push(_infoInyeccionEnergia);
        onCantidadEnergiaChange(
            _infoInyeccionEnergia.infoEnergia.nombre,
            _infoInyeccionEnergia.infoEnergia.cantidadEnergia,
            Operacion.adicionar
        );
        emit inyeccionEnergiaEnBolsa();
    }

    function setInfoConsumosEnergias(
        InfoConsumoEnergia memory _infoConsumoEnergia
    ) external {
        infoConsumosEnergias.push(_infoConsumoEnergia);
    }

    function getContadorTx() public view returns (uint256) {
        return contadorTransacciones;
    }

    function setInfoTx(InfoTx memory _infoTx) external {
        infoTransacciones.push(_infoTx);
        contadorTransacciones++;
        emit eventoTransaccion();
    }

    function getInfoTxs() public view returns (InfoTx[] memory) {
        return infoTransacciones;
    }

    function getInfoTxsByTipo(TipoTx _tipoTx)
        public
        view
        returns (InfoTx[] memory)
    {
        uint256 cantidad = 0;

        for (uint256 i = 0; i < infoTransacciones.length; i++) {
            if (infoTransacciones[i].tipoTx == _tipoTx) {
                cantidad++;
            }
        }

        InfoTx[] memory infoTxs = new InfoTx[](cantidad);
        uint256 j = 0;
        for (uint256 i = 0; i < infoTransacciones.length; i++) {
            if (infoTransacciones[i].tipoTx == _tipoTx) {
                infoTxs[j] = infoTransacciones[i];
                j++;
            }
        }

        return infoTxs;
    }

    function getInfoInyeccionesEnergias()
        public
        view
        returns (InfoInyeccionEnergia[] memory)
    {
        return infoInyeccionesEnergias;
    }

    function getInfoConsumosEnergias()
        public
        view
        returns (InfoConsumoEnergia[] memory)
    {
        return infoConsumosEnergias;
    }

    function setPrecioVentaEnergia(uint256 _precio)
        public
        authorize(msg.sender)
    {
        precioVentaEnergia = _precio;
    }

    function getPrecioVentaEnergia() public view returns (uint256) {
        return precioVentaEnergia;
    }

    function liquidarInyecciones(uint256 _fechaLiquidacion)
        public
        authorize(msg.sender)
    {
        uint256 dayOfYear = DateTime(dateTimeContract).getDate(
            _fechaLiquidacion
        );
        uint256 precioMayor = 0;
        uint256 contadorInyeccionesDia = 0;
        for (uint256 i = 0; i < infoInyeccionesEnergias.length; i++) {
            uint256 _tempDay = DateTime(dateTimeContract).getDate(
                infoInyeccionesEnergias[i].fechaInyeccion
            );
            if (dayOfYear == _tempDay) {
                if (infoInyeccionesEnergias[i].precioEnergia >= precioMayor) {
                    precioMayor = infoInyeccionesEnergias[i].precioEnergia;
                }
                contadorInyeccionesDia++;
            }
        }

        for (uint256 i = 0; i < infoInyeccionesEnergias.length; i++) {
            uint256 _tempDay = DateTime(dateTimeContract).getDate(
                infoInyeccionesEnergias[i].fechaInyeccion
            );
            if (dayOfYear == _tempDay) {
                uint256 cantidadTokens = infoInyeccionesEnergias[i]
                    .infoEnergia
                    .cantidadEnergia * precioMayor;
                if (reguladorMercado.TokensDisponibles() <= cantidadTokens) {
                    reguladorMercado.GenerarTokens(cantidadTokens);
                }
                reguladorMercado.transferirTokensInyeccion(
                    cantidadTokens,
                    infoInyeccionesEnergias[i].ownerGenerador
                );
            }
        }
    }

    /*TODO: Invocar funcion desde el contrato generador o importar el contrato generador 
    y como parametros de entrada poner la direccion del contrato
    */
    function ventaEnergiaBolsa(
        address _dirComprador,
        uint256 _cantidadEnergia,
        string memory _tipoEnergia
    ) public {
        require(
            Validations.validarEnergiasDisponibles(
                _tipoEnergia,
                getTiposEnergiasDisponibles()
            ),
            "No es un tipo de energia valido"
        );
        InfoEnergia memory tempInfoEnergia = getEnergiaByNombre(_tipoEnergia);
        require(
            _cantidadEnergia <= tempInfoEnergia.cantidadEnergia,
            "No puede comprar mas de la energia disponible"
        );

        uint256 costoCompra = precioVentaEnergia * _cantidadEnergia;
        require(
            costoCompra <= reguladorMercado.MisTokens(_dirComprador),
            "No tienes tokens disponibles para la compra"
        );

        //Transferencia de tokens del generador a la bolsa de energia

        reguladorMercado.intercambioDirectoTokens(
            costoCompra,
            _dirComprador,
            address(reguladorMercado)
        );
        onCantidadEnergiaChange(
            _tipoEnergia,
            _cantidadEnergia,
            Operacion.restar
        );
    }

    //TODO: Agregar external canChangeCantidad(msg.sender)
    function onCantidadEnergiaChange(
        string memory _nombre,
        uint256 _cantidadEnergia,
        Operacion _operacion
    ) public {
        for (uint256 i = 0; i < tiposEnergiasDisponibles.length; i++) {
            if (tiposEnergiasDisponibles[i].nombre().equals(_nombre)) {
                if (_operacion == Operacion.adicionar) {
                    tiposEnergiasDisponibles[i].addCantidadEnergia(
                        _cantidadEnergia
                    );
                } else {
                    tiposEnergiasDisponibles[i].restarCantidadEnergia(
                        _cantidadEnergia
                    );
                }
                emit cambioDeEnergia(
                    InfoEnergia(
                        _nombre,
                        tiposEnergiasDisponibles[i].cantidadEnergia()
                    )
                );
                break;
            }
        }
    }
}
