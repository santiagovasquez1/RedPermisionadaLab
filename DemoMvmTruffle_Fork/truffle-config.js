// const HDWalletProvider = require("truffle-hdwallet-provider");
const PrivateProvider = require('@truffle/hdwallet-provider');
const privateKeys = [
    '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63',
    'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
    'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
    'd75c2f061c3d007962d4712671d6d605ba135ae4d526550eefcdadc8c534e3d0',
    'd39bf425690d185b2aff9f0cccda0f89a1e38e7635f550d4641df6de604c579e'
];

module.exports = {
    networks: {
        development: {
            host: "localhost", // Localhost (default: none)
            port: 7545, // Standard Ethereum port (default: none)
            network_id: "*" // Any network (default: none)
        },
        develop: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
            gas: 0x1fffffffffffff,
            gasPrice: 0,

        },
        besu: {
            provider: new PrivateProvider(privateKeys, 'http://node1:8540', 0, 3),
            network_id: "*",
        }
    },

    // Set default mocha options here, use special reporters etc.
    mocha: {
        // timeout: 100000
        reporter: 'list',
        reporterOptions: {
            output: './test-results.xml'
        },
        useColors: true
    },

    // Configure your compilers
    compilers: {
        solc: {
            version: "0.8.0", // Fetch exact version from solc-bin (default: truffle's version)
            //docker: true, // Use "0.5.1" you've installed locally with docker (default: false)
            settings: { // See the solidity docs for advice about optimization and evmVersion
                optimizer: {
                    enabled: true,
                    runs: 200
                },
            }
        }
    }
};