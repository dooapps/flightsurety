const HDWalletProvider = require("truffle-hdwallet-provider");
const infuraKey = "83bbd39963d440d894b639ba20dcce2f";
//
//const fs = require('fs');
//const mnemonic = fs.readFileSync(".secret").toString().trim();
const mnemonic = "catalog chaos garlic tilt glory strong rule super coast sheriff water access";
var NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker");

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 10);
      },
      network_id: '*',
      gas: 6721975
    },
    rinkeby: {
      provider: function () {
        var wallet = new HDWalletProvider(
          mnemonic,
          "http://127.0.0.1:8545/",
          0,
          50
        );
        var nonceTracker = new NonceTrackerSubprovider();
        wallet.engine._providers.unshift(nonceTracker);
        nonceTracker.setEngine(wallet.engine);
        return wallet;
      },
      network_id: "*",
    },
  },

  compilers: {
    solc: {
      version: "^0.8.0"

  }
  }
};