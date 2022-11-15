const MvmGeneradorFactory = artifacts.require("MvmGeneradorFactory");
const Certificador = artifacts.require("Certificador");
const GeneradorTransactionsHelper = artifacts.require("GeneradorTransactionsHelper");
const Generador = artifacts.require("Generador");
const ReguladorMercado = artifacts.require("ReguladorMercado");
const PlantaEnergia = artifacts.require("PlantaEnergia");
const MvmPlantaEnergiasFactory = artifacts.require("MvmPlantaEnergiasFactory");
const BancoEnergia = artifacts.require("BancoEnergia");
const _DateTime = artifacts.require("DateTime");

contract("Generador", accounts => {
    let generadorTransactionsHelper = undefined;
    let generadorFactory = undefined;
    let generadorAddress = undefined;
    let regulador = undefined;

    let infoContrato = {};
    let generadorOwner = accounts[1];
    let bancoEnergia = undefined;

    beforeEach(async() => {
        const _dateTime = await _DateTime.deployed();
        const plantaEnergiaFactory = await MvmPlantaEnergiasFactory.deployed();
        const certificador = await Certificador.deployed();

        regulador = await ReguladorMercado.new('Regulador mercado', _dateTime.address);
        bancoEnergia = await BancoEnergia.new(regulador.address, _dateTime.address);
        generadorTransactionsHelper = await GeneradorTransactionsHelper.new(regulador.address, plantaEnergiaFactory.address, bancoEnergia.address);

        generadorFactory = await MvmGeneradorFactory.new(regulador.address, certificador.address, generadorTransactionsHelper.address);

        infoContrato = {
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
        }

        await regulador.registrarSolicitud(infoContrato, 2, { from: generadorOwner });
        await generadorFactory.FactoryContrato(infoContrato, { from: accounts[0] });

        let generadores = await generadorFactory.getContratosOwners();
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
            await regulador.setDespachoEnergia(generador.address, 500, { from: accounts[0] });

            await generador.crearPlantaEnergia(infoPlanta, { from: generadorOwner });
            let plantas = await generador.getPlantasEnergia({ from: generadorOwner });
            await generador.inyectarEnergiaPlanta(plantas[0].dirPlanta, 'solar', 300, 200, { from: generadorOwner });
            plantas = await generador.getPlantasEnergia({ from: generadorOwner });

            let orden = await regulador.getDespachosByGeneradorAndDate(generador.address, parseInt(Date.now() / 1000));

            assert.equal(plantas[0].cantidadEnergia, 500);
            assert.equal(orden[2], 500);
        });
    })

    describe('Compra energia en bolsa', () => {
        it('Prueba compra energia en bolsa', async() => {
            await regulador.ComprarTokens(5000, { from: generadorOwner });
            await bancoEnergia.onCantidadEnergiaChange('solar', 500, 0, { from: generadorOwner });
            await bancoEnergia.setPrecioVentaEnergia(5, { from: accounts[0] });
            const generador = await Generador.at(generadorAddress);
            await generador.compraEnergiaBolsa(200, 'solar', { from: generadorOwner });
            const tokensGenerador = await regulador.MisTokens(generadorOwner);
            const energiaSolarBolsa = await generador.getCantidadEnergiaBolsaByName('solar');
            assert.equal(tokensGenerador.toNumber(), 4000);
            assert.equal(energiaSolarBolsa.toNumber(), 200);
        });
    });

    // describe('Inyeccion de energia en bolsa', () => {
    //     it('Prueba inyeccion energia en bolsa', async() => {
    //         const generador = await Generador.at(generadorAddress);

    //         const infoPlanta = {
    //             dirPlanta: '0x0000000000000000000000000000000000000000',
    //             nombre: 'Planta 1',
    //             departamento: 'Antioquia',
    //             ciudad: 'Medellin',
    //             coordenadas: '0x 0y 0z',
    //             fechaInicio: parseInt(Date.now() / 1000),
    //             tasaEmision: 300,
    //             isRec: true,
    //             capacidadNominal: 1500,
    //             tecnologia: 'solar',
    //             cantidadEnergia: 0,
    //             estado: 0,
    //         }

    //         //Generacion de despacho
    //         await regulador.setDespachoEnergia(generador.address, 500, { from: accounts[0] });

    //         await generador.crearPlantaEnergia(infoPlanta, { from: generadorOwner });
    //         let plantas = await generador.getPlantasEnergia({ from: generadorOwner });
    //         const dirPlanta = plantas[0].dirPlanta;
    //         await generador.inyectarEnergiaPlanta(dirPlanta, 'solar', 300, { from: generadorOwner });

    //         await generador.setPrecioEnergia(3, { from: generadorOwner });
    //         await generador.inyectarEnergiaEnBolsa(dirPlanta, 150, { from: generadorOwner });
    //         const infoEnergiaBolsa = await bancoEnergia.getEnergiaByNombre('solar');
    //         plantas = await generador.getPlantasEnergia({ from: generadorOwner });
    //         let orden = await regulador.getDespachosByGeneradorAndDate(generador.address, parseInt(Date.now() / 1000));

    //         assert.equal(plantas[0].cantidadEnergia, 150);
    //         assert.equal(infoEnergiaBolsa.cantidadEnergia, 150);
    //         assert.equal(orden[2], 300);
    //     });
    // })
});