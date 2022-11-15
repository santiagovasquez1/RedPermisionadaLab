// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./SafeMath.sol";

interface IERC20 {
    //Devuelve la cantidad de tokens en existencia en toda la red
    function totalSupply() external view returns (uint256);

    //Devuelve la cantidad de tokens para una direccion indicada por parametro
    function balanceOf(address account) external view returns (uint256);

    //Devuelve el numero de token que el spender podra gastar en nombre del propietario
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    //Devuelve un valor boolean resultado de la operacion de transferencia
    function transfer(address recipiant, uint256 amount)
        external
        returns (bool);

    //Devuelve un valor boolean resultado de la operacion de gasto
    function approve(address spender, uint256 amount) external returns (bool);

    function disapprove(address spender, uint256 amount)
        external
        returns (bool);

    //Devuelve un valor boolean resultado de la operacion de paso de una cantidad de tokens usando el metodo allowance
    function transferFrom(
        address owner,
        address recipiant,
        address intermediary,
        uint256 amount
    ) external returns (bool);

    //Eventos
    //Evento que se dispara cuando una cantidad de tokens pase de un origen a un destino
    event Transfer(address indexed from, address indexed to, uint256 value);

    //Evento que se dispara cuando se establece una asignacion con el metodo allowance
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract ERC20Basic is IERC20 {
    //Variables de instancia
    string public constant name = "ERC20_MVM";
    string public constant symbol = "MVM";
    uint8 public constant decimals = 2;

    //Cantidad de tokens en existencia
    uint256 public totalSupply_;

    using SafeMath for uint256;
    //Mapping: Es una estructura de datos que permite almacenar una lista de valores
    mapping(address => uint256) balances;
    //Mapping de direcciones a cantidades de tokens, ejemplo de minero y cede las cantidades a diferentes personas
    mapping(address => mapping(address => uint256)) allowed;

    //Constructor
    constructor(uint256 initialSupply) {
        totalSupply_ = initialSupply;
        balances[msg.sender] = initialSupply;
    }

    function totalSupply() public view override returns (uint256) {
        return totalSupply_;
    }

    function increaseTotalSupply(uint256 newTokensAmount) public {
        totalSupply_ += newTokensAmount;
        balances[msg.sender] += newTokensAmount;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return balances[account];
    }

    function allowance(address owner, address delegate)
        public
        view
        override
        returns (uint256)
    {
        return allowed[owner][delegate];
    }

    function transfer(address recipiant, uint256 amount)
        public
        override
        returns (bool)
    {
        require(amount <= balances[msg.sender], "Error en balance");
        //Primero se realiza el descuento de las transferencias
        balances[msg.sender] = balances[msg.sender].sub(amount);
        balances[recipiant] = balances[recipiant].add(amount);

        //Notificacion de evento
        emit Transfer(msg.sender, recipiant, amount);
        return true;
    }

    function transferTwo(
        address sender,
        address receiver,
        uint256 numTokens
    ) public returns (bool) {
        require(
            numTokens <= balances[sender],
            "El numero de tokens a transferir es mayor que el saldo"
        );
        balances[sender] = balances[sender].sub(numTokens);
        balances[receiver] = balances[receiver].add(numTokens);
        emit Transfer(sender, receiver, numTokens);
        return true;
    }

    function approve(address delegate, uint256 numTokens)
        public
        override
        returns (bool)
    {
        require(
            balances[tx.origin] >= numTokens,
            "No tienes suficientes tokens"
        );
        allowed[tx.origin][delegate] = allowed[tx.origin][delegate].add(
            numTokens
        );
        emit Approval(tx.origin, delegate, numTokens);
        return true;
    }

    function disapprove(address delegate, uint256 numTokens)
        public
        override
        returns (bool)
    {
        require(
            allowed[tx.origin][delegate] >= numTokens,
            "No tienes suficientes tokens"
        );
        allowed[tx.origin][delegate] = allowed[tx.origin][delegate].sub(
            numTokens
        );
        emit Approval(tx.origin, delegate, numTokens);
        return true;
    }

    //Metodo para transferir tokens a una direccion desde un intermediario, primero se deben de delegar los tokens al intermediario
    function transferFrom(
        address owner,
        address buyer,
        address intermediary,
        uint256 numTokens
    ) public override returns (bool) {
        require(numTokens <= balances[owner], "El owner no tiene los tokens");
        require(
            numTokens <= allowed[owner][intermediary],
            "No se han delegado los tokens a la direccion"
        );

        balances[owner] = balances[owner].sub(numTokens);
        allowed[owner][intermediary] = allowed[owner][intermediary].sub(
            numTokens
        );

        balances[buyer] = balances[buyer].add(numTokens);
        emit Transfer(owner, buyer, numTokens);
        return true;
    }
}
