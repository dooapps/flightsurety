var Test = require('../config/config.js');



// contract("Airline Surety Tests", accounts => {


//     // premium paid by a passenger for insurance - global varialbe since reused in different tests
//     const premium = 1; // in ether
//     var config;

//     before('setup contract', async () => {
//       config = await Test.Config(accounts);
//       await config.airline.authorizeAirline(config.flightSuretyApp.address);
//     });

//   /****************************************************************************************/
//   /* Operations and Settings                                                              */
//   /****************************************************************************************/
//   it(`(multiparty) has correct initial isOperational() value`, async () => {
//     let status = await config.airline.isOperational.call();
//     assert.equal(status, true, "Incorrect initial operating status value");
//   });

//   it(`(multiparty) can block access to setOperatingStatus() for non-Owner account`, async function () {

//     // Ensure that access is denied for non-Contract Owner account
//     let denied = false;
//     try 
//     {
//         await config.airline.setOperatingStatus(false, { from: account[2] });
//     }
//     catch(e) {
//         denied = true;
//     }
//     assert.equal(denied, true, 
//       "Access not restricted to  Owner");
          
//   });


// });