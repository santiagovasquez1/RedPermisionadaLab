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

contract("Generador", accounts => {
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

    describe('Prueba creacion e inyeccion', () => {
        it('Prueba creacion planta', async() => {
            const generador = await Generador.at(generadorAddress);

            const infoPlanta = {
                dirPlanta: '0x0000000000000000000000000000000000000000',
                nombre: 'Planta 1',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                coordenadas: '0x 0y 0z',
                fechaInicio: 0,
                tasaEmision: 0,
                isRec: true,
                capacidadNominal: 1500,
                tecnologia: 'solar',
                cantidadEnergia: 0,
                estado: 0,
            }

            await generador.crearPlantaEnergia(infoPlanta, { from: generadorOwner });
            const plantas = await generador.getPlantasEnergia({ from: generadorOwner });
            assert.equal(plantas.length, 1);
        });

        it('Prueba inyeccion energia en planta', async() => {
            const generador = await Generador.at(generadorAddress);

            const infoPlanta = {
                dirPlanta: '0x0000000000000000000000000000000000000000',
                nombre: 'Planta 1',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                coordenadas: '0x 0y 0z',
                fechaInicio: 0,
                tasaEmision: 0,
                isRec: true,
                capacidadNominal: 1500,
                tecnologia: 'solar',
                cantidadEnergia: 0,
                estado: 0,
            }

            //Generacion de despacho
            await despachosEnergia.setDespachoEnergia(generador.address, 500, { from: accounts[0] });

            await generador.crearPlantaEnergia(infoPlanta, { from: generadorOwner });
            let plantas = await generador.getPlantasEnergia({ from: generadorOwner });
            await generador.inyectarEnergiaPlanta(plantas[0].dirPlanta, 'solar', 300, 200, { from: generadorOwner });
            plantas = await generador.getPlantasEnergia({ from: generadorOwner });

            let orden = await despachosEnergia.getDespachosByGeneradorAndDate(generador.address, parseInt(Date.now() / 1000));

            assert.equal(plantas[0].cantidadEnergia, 500);
            assert.equal(orden[2], 500);
        });
    })

    describe('Compra energia en bolsa', () => {
        it('Prueba compra energia en bolsa', async() => {
            await regulador.ComprarTokens(5000, { from: generadorOwner });
            await banco.onCantidadEnergiaChange('solar', 500, 0, { from: generadorOwner });
            await banco.setPrecioVentaEnergia(5, { from: accounts[0] });
            const generador = await Generador.at(generadorAddress);
            await generador.compraEnergiaBolsa(200, 'solar', { from: generadorOwner });
            const tokensGenerador = await regulador.MisTokens(generadorOwner);
            let energiaSolarBolsa = await generador.getCantidadEnergiaBolsaByName('solar');
            assert.equal(tokensGenerador.toNumber(), 4000);
            assert.equal(energiaSolarBolsa.toNumber(), 200);
        });
    });

    describe('Inyeccion de energia a acuerdo de energia', () => {
        it('Prueba inyeccion energia a contrato', async() => {
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

            //Generacion de despacho
            await despachosEnergia.setDespachoEnergia(generador.address, 500, { from: accounts[0] });
            const infoPlanta = {
                dirPlanta: '0x0000000000000000000000000000000000000000',
                nombre: 'Planta 1',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                coordenadas: '0x 0y 0z',
                fechaInicio: 0,
                tasaEmision: 0,
                isRec: true,
                capacidadNominal: 1500,
                tecnologia: 'solar',
                cantidadEnergia: 0,
                estado: 0,
            }
            await generador.crearPlantaEnergia(infoPlanta, { from: generadorOwner });
            let plantas = await generador.getPlantasEnergia({ from: generadorOwner });

            await generador.inyectarEnergiaPlanta(plantas[0].dirPlanta, 'solar', 300, 200, { from: generadorOwner });
            let energiaSolarBolsa = await generador.getCantidadEnergiaBolsaByName('solar');

            await generador.inyectarEnergiaContratos(clienteAddress, 'solar', 150, indexGlobal, { from: generadorOwner });
            energiaSolarBolsa = await generador.getCantidadEnergiaBolsaByName('solar');

            acuerdosCliente = await cliente.getAcuerdosDeCompra();
            let acuerdosGenerador = await generador.getAcuerdosDeCompraGenerador();

            assert.equal(acuerdosGenerador[0]['cantidadEnergiaInyectada'], acuerdosCliente[0]['cantidadEnergiaInyectada']);
            assert.equal(energiaSolarBolsa.toNumber(), 150);
        });
    })

    describe('Liquidacion de contrato', () => {
        it('Prueba de liquidacion de contrato entre agentes', async() => {
            let [cliente, comercializador, generador] = await Promise.all([
                Cliente.at(clienteAddress),
                Comercializador.at(comercializadorAddress),
                Generador.at(generadorAddress),
            ]);

            await cliente.contratarComercializador(comercializadorAddress, { from: clienteOwner });
            await cliente.comprarEnergia('solar', 300, 100, { from: clienteOwner });

            acuerdosCliente = await acuerdosLedger.getAcuerdosByCliente(clienteAddress);
            let indexGlobal = parseInt(acuerdosCliente[0]['indexGlobal']);
            await generador.setPrecioEnergia(2, { from: generadorOwner });

            await comercializador.realizarAcuerdo(generadorAddress, clienteAddress, indexGlobal, { from: comercializadorOwner });

            //Generacion de despacho
            await despachosEnergia.setDespachoEnergia(generador.address, 500, { from: accounts[0] });
            const infoPlanta = {
                dirPlanta: '0x0000000000000000000000000000000000000000',
                nombre: 'Planta 1',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                coordenadas: '0x 0y 0z',
                fechaInicio: 0,
                tasaEmision: 0,
                isRec: true,
                capacidadNominal: 1500,
                tecnologia: 'solar',
                cantidadEnergia: 0,
                estado: 0,
            }
            await generador.crearPlantaEnergia(infoPlanta, { from: generadorOwner });
            let plantas = await generador.getPlantasEnergia({ from: generadorOwner });

            await generador.inyectarEnergiaPlanta(plantas[0].dirPlanta, 'solar', 300, 200, { from: generadorOwner });
            await generador.inyectarEnergiaContratos(clienteAddress, 'solar', 300, indexGlobal, { from: generadorOwner });

            await regulador.ComprarTokens(600, { from: clienteOwner });
            await acuerdosLedger.liquidacionContrato(indexGlobal, { from: admin });

            const acuerdos = await acuerdosLedger.getAcuerdosDeCompraMercado();
            const tokensCliente = await regulador.MisTokens(clienteOwner);
            const tokensGenerador = await regulador.MisTokens(generadorOwner);

            assert.equal(tokensCliente.toNumber(), 0);
            assert.equal(tokensGenerador.toNumber(), 600);
        });
    })

});