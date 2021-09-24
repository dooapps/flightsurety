
import FlightSuretyApp from '../../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../../build/contracts/FlightSuretyData.json';

import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {
        let config = Config[network];
        
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.initialize(callback);
    }

    async initialize(callback) {
        this.web3.eth.getAccounts((error, accounts) => {

            const _flights = [['3012','9355','6378'], 
                              ['3587','5594','516'] , 
                              ['7782','998','2283'], 
                              ['8801','2662', '2093']];
           
            this.owner = accounts[0];
            this.passenger = accounts[11];

            let counter = 1;

            console.log("Owner: " + this.owner);
            console.log("Passenger: "+ this.passenger);
            

            console.log("Airlines: "+this.airlines);

            try{
                console.log("this.config.appAddress:   "+this.flightSuretyApp.address);

            }catch(error){
                console.log(error);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyData.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            departe: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}