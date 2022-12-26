const BancoEnergia = artifacts.require("BancoEnergia");
const _DateTime = artifacts.require("DateTime");
const ReguladorMercado = artifacts.require("ReguladorMercado");
contract("BancoEnergia", accounts => {
    let dateTime;
    let bancoEnergia;
    let reguladorMercado;
    const cuentaGenerador = accounts[1];

    beforeEach(async() => {
        dateTime = await _DateTime.deployed();
        reguladorMercado = await ReguladorMercado.new('Regulador');
        bancoEnergia = await BancoEnergia.new(reguladorMercado.address, dateTime.address);
    });

    describe('Pruebas inyeccion energia al banco', () => {
        it("Prueba inyeccion energia 1", async() => {

            const nowInNumber = parseInt(Date.now() / 1000);
            const infoEnergia = {
                nombre: 'solar',
                cantidadEnergia: 500
            }

            const infoPlanta = {
                dirPlanta: accounts[2],
                nombre: 'planta prueba',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                coordenadas: '0x 0y',
                fechaInicio: nowInNumber,
                tasaEmision: 500,
                isRec: true,
                capacidadNominal: 5000,
                tecnologia: 'solar',
                cantidadEnergia: 3500,
                estado: 0
            }

            const infoInyeccion = {
                infoEnergia,
                infoPlanta,
                dirContratoGenerador: accounts[3],
                ownerGenerador: cuentaGenerador,
                precioEnergia: 4,
                fechaInyeccion: nowInNumber
            }
            await bancoEnergia.setInfoInyeccionesEnergias(infoInyeccion, { from: cuentaGenerador });
            const inyecciones = await bancoEnergia.getInfoInyeccionesEnergias();
            assert.equal(inyecciones.length, 1);
        });
    });

    describe('Prueba liquidacion inyecciones', () => {
        it('prueba liquidacion 1 cuando la fecha de inyeccion es igual a la fecha de corte', async() => {
            const nowInNumber = parseInt(Date.now() / 1000);
            const infoEnergia = {
                nombre: 'solar',
                cantidadEnergia: 500
            }

            const infoPlanta = {
                dirPlanta: accounts[2],
                nombre: 'planta prueba',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                coordenadas: '0x 0y',
                fechaInicio: nowInNumber,
                tasaEmision: 500,
                isRec: true,
                capacidadNominal: 5000,
                tecnologia: 'solar',
                cantidadEnergia: 3500,
                estado: 0
            }

            const infoInyeccion = {
                infoEnergia,
                infoPlanta,
                dirContratoGenerador: accounts[3],
                ownerGenerador: cuentaGenerador,
                precioEnergia: 4,
                fechaInyeccion: nowInNumber
            }

            await bancoEnergia.setInfoInyeccionesEnergias(infoInyeccion, { from: cuentaGenerador });
            await bancoEnergia.liquidarInyecciones(nowInNumber, { from: accounts[0] });
            const tokensGenerador = await reguladorMercado.MisTokens(cuentaGenerador);
            assert.equal(tokensGenerador.toNumber(), 2000);
        });

        it('prueba liquidacion 1 cuando la fecha de inyeccion es diferente a la fecha de corte', async() => {
            const nowInNumber = parseInt(Date.now() / 1000);
            const fechaTx = new Date(2022, 10, 6).getSeconds();
            const infoEnergia = {
                nombre: 'solar',
                cantidadEnergia: 500
            }

            const infoPlanta = {
                dirPlanta: accounts[2],
                nombre: 'planta prueba',
                departamento: 'Antioquia',
                ciudad: 'Medellin',
                coordenadas: '0x 0y',
                fechaInicio: fechaTx,
                tasaEmision: 500,
                isRec: true,
                capacidadNominal: 5000,
                tecnologia: 'solar',
                cantidadEnergia: 3500,
                estado: 0
            }

            const infoInyeccion = {
                infoEnergia,
                infoPlanta,
                dirContratoGenerador: accounts[3],
                ownerGenerador: cuentaGenerador,
                precioEnergia: 4,
                fechaInyeccion: fechaTx
            }

            await bancoEnergia.setInfoInyeccionesEnergias(infoInyeccion, { from: cuentaGenerador });
            await bancoEnergia.liquidarInyecciones(nowInNumber, { from: accounts[0] });
            const tokensGenerador = await reguladorMercado.MisTokens(cuentaGenerador);
            assert.equal(tokensGenerador.toNumber(), 0);
        });
    })

    //TODO: Modificar test cuando se integre el generador al proyecto
    describe('Prueba compra-venta energia a la bolsa', () => {
        it('prueba 1 funcion ventaEnergiaBolsa', async() => {
            //Compra de tokens por parte del generador
            await reguladorMercado.ComprarTokens(5000, { from: cuentaGenerador });
            //Inyeccion energia al banco
            await bancoEnergia.onCantidadEnergiaChange('solar', 200, 0, { from: cuentaGenerador });
            //Seteo de precio de venta
            await bancoEnergia.setPrecioVentaEnergia(5, { from: accounts[0] });
            //Compra de energia por parte del generador
            await bancoEnergia.ventaEnergiaBolsa(cuentaGenerador, 100, 'solar', { from: cuentaGenerador });
            // Tokens del generador
            const tokensGenerador = await reguladorMercado.MisTokens(cuentaGenerador);
            const energiaVenta = await bancoEnergia.getEnergiaByNombre('solar');

            assert.equal(tokensGenerador.toNumber(), 4500);
            assert.equal(energiaVenta[1], 100);
        });
    })
});