var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "field pair record bullet talk recall symbol melt clay knife panther sword";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      network_id: '*',
      gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
};