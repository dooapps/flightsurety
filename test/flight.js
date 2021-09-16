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
        await config.flightSuretyApp.registerAirline.call(new_airline, {from: config.firstAirline});
    }
    catch(e) {
    }
    let res = await config.flightSuretyApp.isAirline.call(new_airline); 
    assert.equal(res, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
 
  it(`First Airline is registered when contract is deployed`, async function () {
    // Determine if Airline is registered
    let res = await config.flightSuretyData.isRegisteredAirline(config.owner);
    assert.equal(res, true, "First airline was not registed upon contract creation");
  });

  it('(airline) testing registerAirline() for the first 4 airlines ', async () => {
 
    const newAirline2 = accounts[2];
    const newAirline3 = accounts[3];
    const newAirline4 = accounts[4];
    const newAirline5 = accounts[5];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline2, {from: config.owner});
        await config.flightSuretyApp.registerAirline(newAirline3, {from: config.owner});
        await config.flightSuretyApp.registerAirline(newAirline4, {from: config.owner});
    }
    catch(e) {
        console.log(e.message)
    }
    let resultnewAirline2 = await config.flightSuretyData.isRegisteredAirline.call(newAirline2); 
    let resultnewAirline3 = await config.flightSuretyData.isRegisteredAirline.call(newAirline3); 
    let resultnewAirline4 = await config.flightSuretyData.isRegisteredAirline.call(newAirline4); 
    let resultnewAirline5 = await config.flightSuretyData.isRegisteredAirline.call(newAirline5); 

    // ASSERT
    assert.equal(resultnewAirline2, true, "2nd airlines should be accepted automatically");
    assert.equal(resultnewAirline3, true, "3rd airlines should be accepted automatically");
    assert.equal(resultnewAirline4, true, "4th airlines should be accepted automatically");
    assert.equal(resultnewAirline5, false, "The 5th airline forword should have 50% votes before being accepted");

  });



  it('(airline)(multiparty) testing the voting system for registerAirline() for the 5th airline ', async () => {
    const amount = Web3.utils.toWei('10', 'ether');

    // ARRANGE
    let newAirline2 = accounts[2];
    let newAirline3 = accounts[3];
    let newAirline4 = accounts[4];
    let newAirline5 = accounts[5];
  
    await config.flightSuretyApp.send(newAirline2, {from: newAirline2, value: amount});
    await config.flightSuretyApp.send(newAirline3, {from: newAirline3, value: amount}); 
    await config.flightSuretyApp.send(newAirline4, {from: newAirline4, value: amount}); 

    console.log("Number of airlines : "+ await config.flightSuretyData.getAirlines());
    console.log("Funded airlines count: "+ await config.flightSuretyData.getFunded());
        
    assert.equal(await config.flightSuretyApp.isAirline.call(newAirline2), true, "second airline is not funded yet.");
    assert.equal(await config.flightSuretyApp.isAirline.call(newAirline3), true, "third airline is not funded yet.");
    assert.equal(await config.flightSuretyApp.isAirline.call(newAirline4), true, "fourth airline is not funded yet.");

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline5, {from: newAirline2});
    }
    catch(e) {
        console.log(e.message)
    }
    let resultnewAirline5 = await config.flightSuretyData.isRegisteredAirline.call(newAirline5); 
    // ASSERT
    assert.equal(resultnewAirline5, true,  "The 5th airline should be accepted after getting 2 votes out of 4");
    });

    it('Can register flight', async () => {
      await config.flightSuretyApp.registerFlight("1098", new Date().getTime(), {from: config.firstAirline});
      await config.flightSuretyApp.registerFlight("7654", new Date().getTime(), {from: config.firstAirline});
   });


  // it("should send payment correctly", async () => {
  //   // send coins from account 1 to 2
  //   const amount = Web3.utils.toWei('10', 'ether');
  //   await config.flightSuretyApp.send(accounts[3], { from: accounts[1], value: amount });
  // });


});