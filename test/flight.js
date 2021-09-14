var Test = require('./config/config.js');
var BigNumber = require('bignumber.js');

const Web3 = require("web3");



contract("Flight Surety Tests", accounts => {


    var config;
    before('setup contract', async () => {
      config = await Test.Config(accounts);
      await config.flightSuretyData.authorizeCaller(config.flightSuretyData.address, {from: config.owner});
    });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async () => {
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Owner account`, async function () {

    // Ensure that access is denied for non-Contract Owner account
    let denied = false;
    try 
    {
        await config.flightSuretyData.setOperatingStatus(false, { from: account[2] });
    }
    catch(e) {
        denied = true;
    }
    assert.equal(denied, true, 
      "Access not restricted to  Owner");
          
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Owner account`, async function () {

    // Ensure that access is allowed for Contract Owner account
    let denied = false;
    try 
    {
        await config.flightSuretyData.setOperatingStatus(false);
    }
    catch(e) {
        denied = true;
    }
    assert.equal(denied, false, "Access not restricted to Owner");
    
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try 
    {
        await config.flightSurety.setTestingMode(true);
    }
    catch(e) {
        reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);

  });

  it("should send payment correctly", async () => {
    // send coins from account 1 to 2
    const amount = Web3.utils.toWei('10', 'ether');
    await config.flightSuretyApp.send(accounts[3], { from: accounts[1], value: amount });



  });


});