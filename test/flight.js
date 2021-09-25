var Test = require('./config/config.js');


const Web3 = require("web3");



contract("Flight Surety Tests", accounts => {
    //W (double check and validation)
    let config;
    before('setup contract', async () => {
      config = await Test.Config(accounts);
      await config.flightSuretyData.authorizeCaller(config.flightSuretyData.address, {from: config.owner});
    }); 

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it('(contract) has correct initial isOperational()', async () => {
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial status");
  });


  it('(contract) it does not allow access to setOperatingStatus() for non-owner account', async function () {
    let denied = false;
    try 
    {
        await config.flightSuretyData.setOperatingStatus(false, { from: account[5] });
    }
    catch(e) {
        denied = true;
    }
    assert.equal(denied, true, 
      "non-owner allow to");
  });

  it('(contract) it allows access to setOperatingStatus() for owner account', async function () {
    let denied = false;
    try 
    {
       await config.flightSuretyData.setOperatingStatus(false);
    }
    catch(e) {
        denied = true;
    }
    assert.equal(denied, false, "owner allow to");
    
  });

  it('(contract) it allows access to functions using requireIsOperational when operating status is false', async function () {
    await config.flightSuretyData.setOperatingStatus(false);
    let res = false;
    try 
    {
        await config.flightSurety.setTestingMode(true);
    }
    catch(e) {
        res = true;
    }
    assert.equal(res, true, "not allowed to require requireIsOperational");      
    await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(contract)(airline) it allows to block access to functions using requireIsOperational when operating status is false', async function () {

    let operational = await config.flightSuretyData.isOperational();

    if (operational == true) {
        await config.flightSuretyData.setOperatingStatus(false, {from: config.owner});
    }

    let reverted = false;
    try 
    {
        await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline});
    }
    catch(e) {
        reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

    operational = await config.flightSuretyData.isOperational();
    //console.log(operational)
    if (operational == false) {
        await config.flightSuretyData.setOperatingStatus(true, {from: config.owner});
    }
  });

  it('it does not allow airline to register a new airline using registerAirline() if it is not funded', async () => {
    let new_airline = accounts[2];
    try {
        await config.flightSuretyApp.registerAirline.call(new_airline, {from: config.firstAirline});
    }
    catch(e) {
    }
    let res = await config.flightSuretyApp.isAirline.call(new_airline); 
    assert.equal(res, false, "Airline should not be allow to register another airline if it hasn't provided funding");
  });
 
  it('(airline) first airline is registered when contract is deployed', async function () {
    assert.equal(await config.flightSuretyData.isRegisteredAirline(config.owner), true, 
    "First airline was not registed upon contract creation");
  });

  it('(airline) it tests the registration of  Airline() for the first 4 airlines ', async () => {
 
    const newAirline2 = accounts[2];
    const newAirline3 = accounts[3];
    const newAirline4 = accounts[4];
    const newAirline5 = accounts[5];

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

    assert.equal(resultnewAirline2, true, "2nd airline was accepted");
    assert.equal(resultnewAirline3, true, "3rd airline was accepted");
    assert.equal(resultnewAirline4, true, "4th airline was accepted");
    assert.equal(resultnewAirline5, false, "The 5th airline should have 50% votes before being accepted");

  });



  it('(airline)(multiparty) testing the voting system for registerAirline() for the 5th airline ', async () => {


    let newAirline2 = accounts[2];
    let newAirline3 = accounts[3];
    let newAirline4 = accounts[4];
    let newAirline5 = accounts[5];
 
    const amount = Web3.utils.toWei('10', 'ether');

    await config.flightSuretyApp.pay(newAirline2, {from: newAirline2, value: amount});
    await config.flightSuretyApp.pay(newAirline3, {from: newAirline3, value: amount}); 
    await config.flightSuretyApp.pay(newAirline4, {from: newAirline4, value: amount}); 

    console.log("airlines number: " + await config.flightSuretyData.getAirlines());
    console.log("funded airlines: " + await config.flightSuretyData.getFunded());
        
    assert.equal(await config.flightSuretyApp.isAirline.call(newAirline2), true, "2nd airline is not funded yet.");
    assert.equal(await config.flightSuretyApp.isAirline.call(newAirline3), true, "3rd airline is not funded yet.");
    assert.equal(await config.flightSuretyApp.isAirline.call(newAirline4), true, "4th airline is not funded yet.");

    try {
        await config.flightSuretyApp.registerAirline(newAirline5, {from: newAirline2});
    }
    catch(e) {
        console.log(e.message)
    }
    let resultnewAirline5 = await config.flightSuretyData.isRegisteredAirline.call(newAirline5); 
  
    assert.equal(resultnewAirline5, true,  "The 5th airline should be accepted after getting 2 votes out of 4");
    });


    it('(airline) it allows to get Airlines Info', async () => { 
      res = await config.flightSuretyData.getAirlinesInfo(config.firstAirline);
      console.log("airlines registered: " + res);
       for (let i = 0; i < res.length; i++) {
        console.log(res[i]);
      //   ref = await config.flightSuretyData.getFlightInfo.call(res[i]);
      //   console.log(ref);
      //   for (let x = 0; x < ref.length; x++) {
      //     console.log(ref['airline']);
      //   }
      //     ;
       }
    });
    
    it('(flight) it allows to register a flight', async () => {
      await config.flightSuretyApp.registerFlight("0050", config.timestamp, {from: config.owner});
    });


    it('(flight) it allows to get current flight', async () => { 
      res = await config.flightSuretyData.getCurrentFlight();
      console.log(res);
      for (let i = 0; i < res.length; i++) {
        console.log(res[i]);
        ref = await config.flightSuretyData.getFlightInfo.call(res[i]);
        console.log(ref);
        for (let x = 0; x < ref.length; x++) {
          console.log(ref['airline']);
        }
          ;
      } 
      
    });

    it('(insurance) it allows to passengers may pay up to 1 ether for purchasing flight insurance.', async()=>{
      let passenger1 = accounts[8];
      let passenger2 = accounts[9];
    
        let value1 = web3.utils.toWei('2', "ether");
        let value2 = web3.utils.toWei('.1', "ether");
    
        let result1 = false;
        let result2 = false;
    
        try {
          let balanceBeforePasseger1 = await web3.eth.getBalance(passenger1);
          console.log(web3.utils.toWei(balanceBeforePasseger1, "ether"));
            await config.flightSuretyApp.registerInsurance("0050", config.owner, config.timestamp,  {from: passenger1, value: value1});
            await config.flightSuretyApp.pay(passenger1, {from: passenger1, value: value1});
            let balanceAfterPasseger1 = await web3.eth.getBalance(passenger1);
            console.log(balanceAfterPasseger1);
        }
        catch(e) {
            result1 = true;
        }
    
        try {
            await config.flightSuretyApp.registerInsurance("0050", config.owner, config.timestamp, {from: passenger2, value: value2});
            await config.flightSuretyApp.pay(passenger2, {from: passenger2, value: value2});
        }
        catch(e) {
            result2 = true;
        }
    
        // ASSERT
        assert.equal(result1, true, "the payment should less than 1 ether");
        assert.equal(result2, false, "buy insurence failed");
    });



  //   it('Passengers can see their insurance', async() =>{
  //     let passenger1 = accounts[8];
  //     let passenger2 = accounts[9];

  //       let ins = await config.flightSuretyApp.getInsuranceInfo.call("0050", config.owner, 1631834815695, {from: passenger1});
  //         console.log(ins[0]);
  //         console.log(ins[1]);
  //   });

  // // it("should send payment correctly", async () => {
  // //   // send coins from account 1 to 2
  // //   const amount = Web3.utils.toWei('10', 'ether');
  // //   await config.flightSuretyApp.send(accounts[3], { from: accounts[1], value: amount });
  // // });


});