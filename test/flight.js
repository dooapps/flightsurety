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

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

    let operational = await config.flightSuretyData.isOperational();
    //console.log(operational);

    if (operational == true) {
        await config.flightSuretyData.setOperatingStatus(false, {from: config.owner});
    }

    let reverted = false;
    try 
    {
        res = await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline});
        print(res);
    }
    catch(e) {
        reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

    // Set it back for other tests to work
    operational = await config.flightSuretyData.isOperational();
    if (operational == false) {
        await config.flightSuretyData.setOperatingStatus(true, {from: config.owner});
    }
  });

  it('airline cannot register an Airline using registerAirline() if it is not funded', async () => {
    let new_airline = accounts[2];
    try {
        registe_airline = await config.flightSuretyApp.registerAirline(new_airline, {from: config.firstAirline});
    }
    catch(e) {
      console.log(e.message)
    }
    let res = await config.flightSuretyApp.isAirline(new_airline); 
    assert.equal(res, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
 
  it(`First Airline is registered when contract is deployed`, async function () {
    // Determine if Airline is registered
    let res = await config.flightSuretyData.isRegisteredAirline(config.owner);
    assert.equal(res, true, "First airline was not registed upon contract creation");
  });




  // it("should send payment correctly", async () => {
  //   // send coins from account 1 to 2
  //   const amount = Web3.utils.toWei('10', 'ether');
  //   await config.flightSuretyApp.send(accounts[3], { from: accounts[1], value: amount });
  // });


});