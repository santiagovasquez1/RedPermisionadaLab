const Migrations = artifacts.require("Migrations");
const SafeMath = artifacts.require("SafeMath");
const StringLibrary = artifacts.require("StringLibrary");
const Validations = artifacts.require("Validations");
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
// const axios = require('axios');

module.exports = async function(deployer) {
    try {
        await DeployContracts(deployer);
    } catch (error) {
        console.log(error);
    }
};

const DeployContracts = async(deployer) => {

    // const url = "http://node1:8540";
    // const data = {
    //     "jsonrpc": "2.0",
    //     "method": "ibft_getValidatorsByBlockNumber",
    //     "params": [
    //         "latest"
    //     ],
    //     "id": 1
    // };
    // const response = await axios({
    //     method: 'post',
    //     url,
    //     data
    // });
    // console.log(response);
    deployer.deploy(Migrations);
    deployer.deploy(SafeMath);

    deployer.deploy(StringLibrary);
    deployer.link(StringLibrary, Validations);
    deployer.deploy(Validations);

    deployer.link(Validations, GeneradorTransactionsHelper);
    deployer.link(Validations, ComercializadorTransactionsHelper);
    deployer.link(Validations, ClienteTransactionsHelper);

    deployer.link(Validations, MvmGeneradorFactory);
    deployer.link(StringLibrary, MvmGeneradorFactory);

    deployer.link(Validations, MvmPlantaEnergiasFactory);
    deployer.link(StringLibrary, MvmPlantaEnergiasFactory);

    deployer.link(Validations, ReguladorMercado);
    deployer.link(Validations, BancoEnergia);
    deployer.link(StringLibrary, BancoEnergia);

    deployer.link(Validations, MvmComercializadorFactory);
    deployer.link(StringLibrary, MvmComercializadorFactory);

    deployer.link(Validations, MvmClienteFactory);
    deployer.link(StringLibrary, MvmClienteFactory);

    await deployer.deploy(_DateTime);
    const dateTimeInstance = await _DateTime.deployed();
    await deployer.deploy(ReguladorMercado, 'Regulador mercado', dateTimeInstance.address);
    let reguladorMercado = await ReguladorMercado.deployed();
    await deployer.deploy(BancoEnergia, reguladorMercado.address, dateTimeInstance.address);
    let bancoEnergia = await BancoEnergia.deployed();

    await deployer.deploy(MvmPlantaEnergiasFactory, reguladorMercado.address, bancoEnergia.address);
    let plantaEnergiaFactory = await MvmPlantaEnergiasFactory.deployed();

    let infoCertificador = {
        dirContrato: '0x0000000000000000000000000000000000000000',
        owner: '0x0000000000000000000000000000000000000000',
        nit: '123456789',
        empresa: 'Mvm Ingenieria de software',
        contacto: 'Contacto Certificadora',
        telefono: '123456789',
        correo: 'santiago.vasquez@mvm.com.co',
        departamento: 'Antioquia',
        ciudad: 'Medellin',
        direccion: 'Calle 1 # 1-1',
        comercializador: '0x0000000000000000000000000000000000000000',
        tipoContrato: 4
    };
    await deployer.deploy(Certificador, infoCertificador, reguladorMercado.address);
    let certificador = await Certificador.deployed();

    let helpersDeploy = [];
    let helpersDeployed = [];
    helpersDeploy.push(deployer.deploy(GeneradorTransactionsHelper, reguladorMercado.address, plantaEnergiaFactory.address, bancoEnergia.address));
    helpersDeploy.push(deployer.deploy(ComercializadorTransactionsHelper, reguladorMercado.address, bancoEnergia.address));
    helpersDeploy.push(deployer.deploy(ClienteTransactionsHelper, reguladorMercado.address, bancoEnergia.address));

    await Promise.all(helpersDeploy);
    helpersDeployed.push(GeneradorTransactionsHelper.deployed());
    helpersDeployed.push(ComercializadorTransactionsHelper.deployed());
    helpersDeployed.push(ClienteTransactionsHelper.deployed());

    let [generadorTransactionsHelper, comercializadorTransactionsHelper, clienteTransactionsHelper] = await Promise.all(helpersDeployed);

    let factoriesDeploy = [];
    factoriesDeploy.push(deployer.deploy(MvmGeneradorFactory, reguladorMercado.address, certificador.address, generadorTransactionsHelper.address));
    factoriesDeploy.push(deployer.deploy(MvmComercializadorFactory, reguladorMercado.address, certificador.address, bancoEnergia.address, comercializadorTransactionsHelper.address));
    factoriesDeploy.push(deployer.deploy(MvmClienteFactory, reguladorMercado.address, certificador.address, bancoEnergia.address, clienteTransactionsHelper.address));

    await Promise.all(factoriesDeploy);
}