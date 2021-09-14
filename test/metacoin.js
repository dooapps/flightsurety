const MetaCoin = artifacts.require("MetaCoin");

const Web3 = require("web3");



contract("MetaCoin", accounts => {

  const account1 = accounts[0];
  const account2 = accounts[1];

//   it("Test initial balance", async () => {
//     const instance = await MetaCoin.deployed();
//     const account1 = accounts[0];
//     const account2 = accounts[1];

//     const initBalance1 = await instance.getBalance.call(account1);
//     console.log(initBalance1.toNumber())
//     assert.notEqual(
//       0,
//       initBalance1.toNumber(),
//       "Amount wasn't correctly",
//     );

// });

  // it("should send coin correctly", async () => {
  //   const instance = await MetaCoin.deployed();

  //   const account1 = accounts[0];
  //   const account2 = accounts[1];

  //   // send coins from account 1 to 2
  //   const amount = Web3.utils.toWei('1', 'ether');
  //   await instance.send(account2, { from: account1, value: amount });



  // });
});
