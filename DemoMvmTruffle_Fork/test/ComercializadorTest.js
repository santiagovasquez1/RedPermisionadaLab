const ReguladorMercado = artifacts.require("ReguladorMercado");
const BancoEnergia = artifacts.require("BancoEnergia");
const Certificador = artifacts.require("Certificador");
const _DateTime = artifacts.require("DateTime");
const MvmGeneradorFactory = artifacts.require("MvmGeneradorFactory");
const MvmPlantaEnergiasFactory = artifacts.require("MvmPlantaEnergiasFactory");
const GeneradorTransactionsHelper = artifacts.require("GeneradorTransactionsHelper");
const ComercializadorTransactionsHelper = artifacts.require("ComercializadorTransactionsHelper");
const ClienteTransactionsHelper = artifacts.require("ClienteTransactionsHelper");
const MvmComercializadorFactory = artifacts.require("MvmComercializadorFactory");
const MvmClienteFactory = artifacts.require("MvmClienteFactory");
const Comercializador = artifacts.require("Comercializador");
const Cliente = artifacts.require("Cliente");
const Generador = artifacts.require("Generador");
const AcuerdosLedger = artifacts.require('AcuerdosLedger');
const DespachosEnergia = artifacts.require("DespachosEnergia");

contract("Comercializador", accounts => {
    const admin = accounts[0];
    const comercializadorOwner = accounts[1];
    const clienteOwner = accounts[2];
    const generadorOwner = accounts[3];
    let clienteTransactionsHelper;
    let comercializadorTransactionsHelper;
    let generadorTransactionsHelper;
    let clienteFactory;
    let comercializadorFactory;
    let generadorFactory;
    let regulador;
    let banco;
    let acuerdosLedger;
    let clienteAddress;
    let comercializadorAddress;
    let generadorAddress;
    let _dateTime;
    let certificador;
    let plantaEnergiaFactory;
    let despachosEnergia;
    const infoContratoComercializador = {
        dirContrato: '0x0000000000000000000000000000000000000000',
        owner: comercializadorOwner,
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
    };
    const infoContratoCliente = {
        dirContrato: '0x0000000000000000000000000000000000000000',
        owner: clienteOwner,
        nit: '123456789',
        empresa: 'Cliente',
        contacto: 'Santiago',
        telefono: '123456789',
        correo: 'prueba@gmail.com',
        departamento: 'Antioquia',
        ciudad: 'Medellin',
        direccion: 'Calle falsa 123',
        comercializador: '0x0000000000000000000000000000000000000000',
        tipoContrato: 0
    };
    const infoContratoGenerador = {
        dirContrato: '0x0000000000000000000000000000000000000000',
        owner: generadorOwner,
        nit: '123456789',
        empresa: 'epm',
        contacto: 'Santiago',
        telefono: '123456789',
        correo: 'prueba@gmail.com',
        departamento: 'Antioquia',
        ciudad: 'Medellin',
        direccion: 'Calle falsa 123',
        comercializador: '0x0000000000000000000000000000000000000000',
        tipoContrato: 2
    };

    beforeEach(async() => {
        [_dateTime, certificador, plantaEnergiaFactory] = await Promise.all([
            _DateTime.deployed(),
            Certificador.deployed(),
            MvmPlantaEnergiasFactory.deployed()
        ]);

        regulador = await ReguladorMercado.new('Regulador mercado');
        banco = await BancoEnergia.new(regulador.address, _dateTime.address);
        acuerdosLedger = await AcuerdosLedger.new(regulador.address);
        despachosEnergia = await DespachosEnergia.new(_dateTime.address);

        let helpersInstances = [];
        helpersInstances.push(ClienteTransactionsHelper.new(regulador.address, banco.address, acuerdosLedger.address, _dateTime.address));
        helpersInstances.push(ComercializadorTransactionsHelper.new(regulador.address, banco.address, acuerdosLedger.address));
        helpersInstances.push(GeneradorTransactionsHelper.new(regulador.address, plantaEnergiaFactory.address, banco.address, acuerdosLedger.address, despachosEnergia.address));
        [clienteTransactionsHelper, comercializadorTransactionsHelper, generadorTransactionsHelper] = await Promise.all(helpersInstances);

        let factoriesInstances = [];
        factoriesInstances.push(MvmClienteFactory.new(regulador.address, certificador.address, banco.address, clienteTransactionsHelper.address));
        factoriesInstances.push(MvmComercializadorFactory.new(regulador.address, certificador.address, banco.address, comercializadorTransactionsHelper.address));
        factoriesInstances.push(MvmGeneradorFactory.new(regulador.address, certificador.address, generadorTransactionsHelper.address));
        [clienteFactory, comercializadorFactory, generadorFactory] = await Promise.all(factoriesInstances);

        let registrosSolicitudes = [];
        registrosSolicitudes.push(regulador.registrarSolicitud(infoContratoCliente, 0, { from: clienteOwner }));
        registrosSolicitudes.push(regulador.registrarSolicitud(infoContratoComercializador, 1, { from: comercializadorOwner }));
        registrosSolicitudes.push(regulador.registrarSolicitud(infoContratoGenerador, 2, { from: generadorOwner }));
        await Promise.all(registrosSolicitudes);

        let instanciasContratros = [];
        instanciasContratros.push(clienteFactory.FactoryContrato(infoContratoCliente, { from: admin }));
        instanciasContratros.push(comercializadorFactory.FactoryContrato(infoContratoComercializador, { from: admin }));
        instanciasContratros.push(generadorFactory.FactoryContrato(infoContratoGenerador, { from: admin }));
        await Promise.all(instanciasContratros);

        let contratos = []
        contratos.push(clienteFactory.getContratosOwners());
        contratos.push(comercializadorFactory.getContratosOwners());
        contratos.push(generadorFactory.getContratosOwners());
        let [clientes, comercializadores, generadores] = await Promise.all(contratos);

        clienteAddress = clientes[0].dirContrato;
        comercializadorAddress = comercializadores[0].dirContrato;
        generadorAddress = generadores[0].dirContrato;
    });

    describe('Agregar cliente al comercializador', () => {
        it('Prueba en funcion setClientesComercializador', async() => {
            let [cliente, comercializador] = await Promise.all([
                Cliente.at(clienteAddress),
                Comercializador.at(comercializadorAddress),
            ]);

            await cliente.contratarComercializador(comercializadorAddress, { from: clienteOwner });
            const clientesComercializador = await comercializador.getClientesComercializador();
            assert.equal(clientesComercializador.length, 1);
        });
    });

    describe('Realizar acuerdo de compra entre agentes', () => {
        it('Prueba en funcion realizarAcuerdo', async() => {
            let [cliente, comercializador, generador] = await Promise.all([
                Cliente.at(clienteAddress),
                Comercializador.at(comercializadorAddress),
                Generador.at(generadorAddress),
            ]);

            await cliente.contratarComercializador(comercializadorAddress, { from: clienteOwner });
            await cliente.comprarEnergia('solar', 300, 100, { from: clienteOwner });
            acuerdosCliente = await acuerdosLedger.getAcuerdosByCliente(clienteAddress);
            let indexGlobal = parseInt(acuerdosCliente[0]['indexGlobal']);
            await comercializador.realizarAcuerdo(generadorAddress, clienteAddress, indexGlobal, { from: comercializadorOwner });

            acuerdosCliente = await cliente.getAcuerdosDeCompra();
            const acuerdosGenerador = await generador.getAcuerdosDeCompraGenerador();

            assert.equal(acuerdosGenerador[0]['dirCliente'], acuerdosCliente[0]['dirCliente']);
            assert.equal(acuerdosGenerador[0]['indexGlobal'], acuerdosCliente[0]['indexGlobal']);
        });
    });
});