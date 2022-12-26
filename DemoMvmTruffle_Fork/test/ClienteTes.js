const ReguladorMercado = artifacts.require("ReguladorMercado");
const Comercializador = artifacts.require("Comercializador");
const Cliente = artifacts.require("Cliente");
const MvmClienteFactory = artifacts.require("MvmClienteFactory");
const MvmComercializadorFactory = artifacts.require("MvmComercializadorFactory");
const ClienteTransactionsHelper = artifacts.require("ClienteTransactionsHelper");
const ComercializadorTransactionsHelper = artifacts.require("ComercializadorTransactionsHelper");
const BancoEnergia = artifacts.require("BancoEnergia");
const _DateTime = artifacts.require("DateTime");
const Certificador = artifacts.require("Certificador");
const AcuerdosLedger = artifacts.require('AcuerdosLedger');

contract("Cliente", accounts => {
    let clienteTransactionsHelper;
    let comercializadorTransactionsHelper
    let clienteFactory;
    let comercializadorFactory;
    let regulador;
    const admin = accounts[0];
    const clienteOwner = accounts[1];
    let infoContrato = {
        dirContrato: '0x0000000000000000000000000000000000000000',
        owner: clienteOwner,
        nit: '123456789',
        empresa: 'epm',
        contacto: 'Santiago',
        telefono: '123456789',
        correo: 'prueba@gmail.com',
        departamento: 'Antioquia',
        ciudad: 'Medellin',
        direccion: 'Calle falsa 123',
        comercializador: '0x0000000000000000000000000000000000000000',
        tipoContrato: 0
    };
    let banco;
    let clienteAddress;
    let _dateTime;
    let certificador;
    let acuerdosLedger;

    beforeEach(async() => {
        [_dateTime, certificador] = await Promise.all([_DateTime.deployed(), Certificador.deployed()]);

        regulador = await ReguladorMercado.new('Regulador mercado');
        banco = await BancoEnergia.new(regulador.address, _dateTime.address);
        acuerdosLedger = await AcuerdosLedger.new(regulador.address);

        let helpersInstances = [];
        helpersInstances.push(ClienteTransactionsHelper.new(regulador.address, banco.address, acuerdosLedger.address, _dateTime.address));
        helpersInstances.push(ComercializadorTransactionsHelper.new(regulador.address, banco.address, acuerdosLedger.address));
        [clienteTransactionsHelper, comercializadorTransactionsHelper] = await Promise.all(helpersInstances);

        let factoriesInstances = [];
        factoriesInstances.push(MvmClienteFactory.new(regulador.address, certificador.address, banco.address, clienteTransactionsHelper.address));
        factoriesInstances.push(MvmComercializadorFactory.new(regulador.address, certificador.address, banco.address, comercializadorTransactionsHelper.address));
        [clienteFactory, comercializadorFactory] = await Promise.all(factoriesInstances);

        await regulador.registrarSolicitud(infoContrato, 0, { from: clienteOwner });
        await clienteFactory.FactoryContrato(infoContrato, { from: admin });

        let clientes = await clienteFactory.getContratosOwners();
        clienteAddress = clientes[0].dirContrato;
    });

    describe('Realizar acuerdo de compra por parte del cliente', () => {
        it('Prueba en comprarEnergia', async() => {
            let cliente = await Cliente.at(clienteAddress);

            let infoContratoComercializador = {
                dirContrato: '0x0000000000000000000000000000000000000000',
                owner: accounts[3],
                nit: '123456789',
                empresa: 'Comercializador',
                contacto: 'Santiago',
                telefono: '123456789',
                correo: 'prueba@gmail.com',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                direccion: 'Calle falsa 123',
                comercializador: '0x0000000000000000000000000000000000000000',
                tipoContrato: 1
            }

            await regulador.registrarSolicitud(infoContratoComercializador, 1, { from: accounts[3] });
            await comercializadorFactory.FactoryContrato(infoContratoComercializador, { from: admin });

            let comercializadores = await comercializadorFactory.getContratosOwners();
            let comercializadorAddress = comercializadores[0].dirContrato;
            let comercializador = await Comercializador.at(comercializadorAddress);

            await cliente.contratarComercializador(comercializador.address, { from: clienteOwner });
            await cliente.comprarEnergia('solar', 300, 100, { from: clienteOwner });
            let acuerdosCliente = await cliente.getAcuerdosDeCompra();

            assert.equal(acuerdosCliente.length, 1);
        });
    });

    describe('Prueba en funcion contratarComercializador', () => {
        it('funcion contratarComercializador exitosa', async() => {
            let cliente = await Cliente.at(clienteAddress);

            let infoContratoComercializador = {
                dirContrato: '0x0000000000000000000000000000000000000000',
                owner: accounts[2],
                nit: '123456789',
                empresa: 'Comercializador',
                contacto: 'Santiago',
                telefono: '123456789',
                correo: 'prueba@gmail.com',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                direccion: 'Calle falsa 123',
                comercializador: '0x0000000000000000000000000000000000000000',
                tipoContrato: 1
            }

            await regulador.registrarSolicitud(infoContratoComercializador, 1, { from: accounts[2] });
            await comercializadorFactory.FactoryContrato(infoContratoComercializador, { from: admin });

            let comercializadores = await comercializadorFactory.getContratosOwners();
            let comercializadorAddress = comercializadores[0].dirContrato;
            let comercializador = await Comercializador.at(comercializadorAddress);

            await cliente.contratarComercializador(comercializador.address, { from: clienteOwner });
            let tempInfoContrato = await cliente.getInfoContrato();
            let comercializadorContrato = tempInfoContrato.comercializador;
            assert.equal(comercializadorContrato, comercializador.address);
        });
    });


});