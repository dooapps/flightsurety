import FlightSuretyApp from '../../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../../build/contracts/FlightSuretyData.json';
import Config from './config.json';


import Web3Util from "web3-utils";
import Web3 from 'web3';


export default class Contract {
  constructor(network, callback) {

    this.AIRLINE_FEE   = Web3Util.toWei("10", "ether");
    this.INSURANCE_FEE = Web3Util.toWei("1", "ether");
    this.TIMESTAMP     = Math.floor(Date.now() / 1000);

    this.config = Config[network];

    console.log(this.config);

    this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress);
    this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, this.config.dataAddress);


    this.initialize(callback);
    this.owner = null;
    this.firstAirline = null;
    this.airlines = [];
    this.passengers = [];

    this.flight = "0050";
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }
      callback();

      this.flightSuretyData.methods
        .authorizeCaller(this.config.appAddress);
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyData.methods
         .isOperational()
         .call({from: self.owner}, callback);
  }

  getAirlines(callback) {
    let self = this;
    self.flightSuretyData.methods.getAirlines()
         .call({ from: self.owner}, callback);
  }

  async getCurrentFlights(callback){
    let self = this;
      await self.flightSuretyData.methods.getCurrentFlight()
      .call({from: self.owner}, callback);
  }


  getAirlinesRegisteredFunded(callback) {
    let self = this;
    self.flightSuretyData.methods
      .getAirlinesRegisteredFunded()
      .call()
      .then((value) => {
        this.firstAirline = value[0];
        callback(value[0]);
      })
      .catch((error) => {
        alert(error);
      });
  }

  async registerAirline(name, address, callback) {
    try {
      let self = this;
      var result = await self.flightSuretyApp.methods
        .registerAirline(name, address)
        .send({ from: this.firstAirline });
      result = await self.flightSuretyData.methods
        .isRegisteredAirline(address)
        .call();
      callback(result);
    } catch (error) {
      console.log(error);
    }
  }

  async payAirline(address, callback) {
    let self = this;
    var result =  await self.flightSuretyApp.methods.pay(this.owner).call(this.owner, {value: this.AIRLINE_FEE})
        callback(result);
  }

  async registerFlight(callback) {
    let self = this;
    var result = await self.flightSuretyApp.methods.registerFlight.send(
      this.flight,
      this.flightFrom,
      this.flightTo,
      this.TIMESTAMP,
      { from: this.firstAirline }
    );
    callback(result);
  }

  async registerInsurance(callback) {
    debugger;
    let self = this;
    var result = await self.flightSuretyApp.methods.registerInsurance.call(
      this.firstAirline,
      this.flight,
      this.TIMESTAMP,
      { from: this.passengers[8], value: this.INSURANCE_FEE }
    );
    debugger;
    callback(result);
  }

  fetchFlightStatus(flight, callback) {
    let self = this;
    let payload = {
        airline: self.airlines[0],
        passenger: self.passengers[0],
        flight: flight,
        timestamp: Math.floor(Date.now() / 1000)
    };
    self.flightSuretyApp.methods
        .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
        .send({from: payload.passenger}, (error, result) => {
            callback(error, payload);
        });
  }
}