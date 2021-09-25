import FlightSuretyApp  from '../../../build/contracts/FlightSuretyApp.json'
import FlightSuretyData from '../../../build/contracts/FlightSuretyData.json'

import Config from './config.json'
import Web3 from 'web3'
import express from 'express'
require('babel-polyfill')
const bodyParser = require('body-parser')

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress)
const NUMBER_OF_ACCOUNTS = 10 // update in truffle.js and start ganacle-cli with the right number of accounts if necessary
const NUMBER_OF_ORACLES = 10


console.log(flightSuretyApp.events);

const Server = {
  oracles: [],
  flights: [],
  states: {
    0: 'unknown',
    10: 'on time',
    20: 'late due to airline',
    30: 'late due to weather',
    40: 'late due to technical reason',
    50: 'late due to other reason'
  },

  init: async function (numberOracles) {
    // EVENTS LISTENERS
    flightSuretyApp.events.OracleRegistered()
      .on('data', log => {
        const { event, returnValues: { indexes } } = log
        console.log(`${event}: indexes ${indexes[0]} ${indexes[1]} ${indexes[2]}`)
      })
      .on('error', error => { console.log(error) })

    flightSuretyApp.events.OracleRequest()
      .on('error', error => { console.log(error) })
      .on('data', async log => {
        const {
          event,
          returnValues: { index, airline, flight, timestamp }
        } = log

        console.log(`${event}: index ${index}, airline ${airline}, flight ${flight}, date ${timestamp}`)
        await this.submitResponses(airline, flight, timestamp)
      })

    flightSuretyApp.events.OracleReport()
      .on('data', log => {
        const {
          event,
          returnValues: { airline, flight, timestamp, status }
        } = log
        console.log(`${event}: airline ${airline}, flight ${flight}, date ${timestamp}, status ${this.states[status]}`)
      })

    flightSuretyApp.events.FlightStatusInfo()
      .on('data', log => {
        const {
          event,
          returnValues: { airline, flight, timestamp, status }
        } = log
        console.log(`${event}: airline ${airline}, flight ${flight}, date ${timestamp}, status ${this.states[status]}`)
      })
      .on('error', error => { console.log(error) })

    // Authorize
    await flightSuretyData.methods.authorizeCaller(flightSuretyApp._address)

    // Add oracles addresses
    this.oracles = (await web3.eth.getAccounts()).slice(NUMBER_OF_ACCOUNTS - numberOracles)
    // register oracles
    const REGISTRATION_FEE = await flightSuretyApp.methods.REGISTRATION_FEE().call()
    this.oracles.forEach(async account => {
      try {
        await flightSuretyApp.methods.registerOracle().send({
          from: account,
          value: REGISTRATION_FEE,
          gas: 4712388,
          gasPrice: 100000000000
        })
      } catch (error) {
        // console.log(error.message)
      }
    })

    // get and store existing flights
//    this.updateFlights()
  },

  submitResponses: async function (airline, flight, timestamp) {
    this.oracles.forEach(async oracle => {
      // random number out of [10, 20, 30, 40, 50]
      const statusCode = (Math.floor(Math.random() * 5) + 1) * 10
      // get indexes
      const oracleIndexes = await flightSuretyApp.methods.getMyIndexes().call({ from: oracle })
      oracleIndexes.forEach(async index => {
        try {
          await flightSuretyApp.methods.submitOracleResponse(
            index,
            airline,
            flight,
            timestamp,
            statusCode
          ).send({ from: oracle })
        } catch (error) {
          // console.log(error.message)
        }
      })
    })
  },

}

Server.init(NUMBER_OF_ORACLES)

const app = express()
app.use(bodyParser.json())
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
app.use(express.json())
// app.use(bodyParser.urlencoded({ extended: true }))
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})
app.set('json spaces', 2)
app.get('/flights', (req, res) => {
  res.json(Server.flights)
})

export default app