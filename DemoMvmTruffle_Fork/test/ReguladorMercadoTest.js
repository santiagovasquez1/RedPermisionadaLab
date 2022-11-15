// const Web3 = require("web3");
// const ReguladorMercado = artifacts.require("ReguladorMercado");

// contract("ReguladorMercado", accounts => {
//     let regulador = undefined;

//     beforeEach(async() => {
//         regulador = await ReguladorMercado.new('Regulador mercado');
//     })

//     let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
//     it("Generar tokens", async() => {
//         const numTokens = 100;
//         const tokensOrigen = await regulador.TokensDisponibles({ from: accounts[0] });
//         await regulador.GenerarTokens(numTokens, { from: accounts[0] });
//         const tokensDisponibles = await regulador.TokensDisponibles({ from: accounts[0] });
//         assert.equal(tokensDisponibles.toNumber(), tokensOrigen.toNumber() + numTokens);
//     });

//     it("Funcion ComprarTokens()", async() => {
//         const numTokens = 1000;
//         const valorEthers = web3.utils.toWei(numTokens.toString(), 'finney');

//         await regulador.ComprarTokens(numTokens, { from: accounts[1], value: valorEthers });
//         const tokensCuenta1 = await regulador.MisTokens(accounts[1], { from: accounts[1] });
//         assert.equal(tokensCuenta1.toNumber(), numTokens);
//     });

//     it("Funcion DelegarTokens()", async() => {
//         const numTokens = 1000;
//         const valorEthers = web3.utils.toWei(numTokens.toString(), 'finney');
//         await regulador.ComprarTokens(numTokens, { from: accounts[1], value: valorEthers });
//         await regulador.delegarTokens(accounts[2], 500, { from: accounts[1] });
//         const tokensCuenta1 = await regulador.MisTokens(accounts[1], { from: accounts[1] });
//         assert.equal(tokensCuenta1.toNumber(), 1000);
//     });

//     it("Funcion DevolverTokens()", async() => {
//         const numTokens = 1000;
//         const valorEthers = web3.utils.toWei(numTokens.toString(), 'finney');
//         await regulador.ComprarTokens(numTokens, { from: accounts[1], value: valorEthers });
//         await regulador.DevolverTokens(1000, { from: accounts[1] });
//         const tokensCuenta1 = await regulador.MisTokens(accounts[1], { from: accounts[1] });
//         assert.equal(tokensCuenta1.toNumber(), 0);
//     });

//     it("Funcion registrar solicitud y obtener el index", async() => {
//         let solicitudContrato = {
//             infoContrato: {
//                 dirContrato: "0x0000000000000000000000000000000000000000",
//                 owner: accounts[1],
//                 nit: "123456789",
//                 empresa: "Generador",
//                 contacto: "Juan",
//                 telefono: "123456789",
//                 correo: "prueba@gmail.com",
//                 departamento: "Antioquia",
//                 ciudad: "Medellin",
//                 direccion: "Calle falsa 123",
//                 comercializador: "0x0000000000000000000000000000000000000000",
//                 tipoComercio: 2
//             },
//             tipoContrato: 2
//         }

//         let tx = await regulador.registrarSolicitud(solicitudContrato.infoContrato, solicitudContrato.tipoContrato, { from: accounts[1] });
//         solicitudContrato.infoContrato.owner = accounts[2];
//         await regulador.registrarSolicitud(solicitudContrato.infoContrato, solicitudContrato.tipoContrato, { from: accounts[2] });
//         let index = await regulador.getIndexSolicitudes(accounts[2]);
//         console.log(index.toNumber());
//         assert.equal(index.toNumber(), 1);
//     })

//     it("Funcion validarUsuario", async() => {
//         let solicitudContrato = {
//             infoContrato: {
//                 dirContrato: "0x0000000000000000000000000000000000000000",
//                 owner: accounts[1],
//                 nit: "123456789",
//                 empresa: "Generador",
//                 contacto: "Juan",
//                 telefono: "123456789",
//                 correo: "prueba@gmail.com",
//                 departamento: "Antioquia",
//                 ciudad: "Medellin",
//                 direccion: "Calle falsa 123",
//                 comercializador: "0x0000000000000000000000000000000000000000",
//                 tipoComercio: 2
//             },
//             tipoContrato: 2
//         }
//         await regulador.registrarSolicitud(solicitudContrato.infoContrato, solicitudContrato.tipoContrato, { from: accounts[1] });
//         let tx = await regulador.diligenciarSolicitud(0, solicitudContrato.infoContrato, { from: accounts[0] });
//         let validacionUsuario = await regulador.validarUsuario({ from: accounts[1] });
//         assert.equal(validacionUsuario[0], true);
//     })
// });