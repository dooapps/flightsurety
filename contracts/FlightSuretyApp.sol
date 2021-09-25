// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./FlightSuretyData.sol";

contract FlightSuretyApp {
    using SafeMath for uint256;


    // Errors allow you to provide information about
    // why an operation failed. They are returned
    // to the caller of the function.
    error InsufficientBalance(uint requested, uint available);

    event Response(bool success, bytes data);
    event ResponseSuccess(bool success);
    event ResponseFlightRegistered(bytes32 key, uint256 status);
    

    uint256 constant MULTIPARTY_CONSENSUS = 4;
    uint256 constant MULTIPARTY_CONSENSUS_DIVISOR = 2;

    uint256 constant INSURANCE_COST = 1 ether;

    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private owner;                                      // Account used to deploy contract
    bool private operational = true; 
    
     
    
    FlightSuretyData private flightSuretyData;

    // list of all airlines
    address[] private airlines = new address[](0);
    
    mapping(address => address[]) private airlines_approved;
 


    /********************************************************************************************/
    /*                                   CONSTRUCTOR & FALLBACK                                 */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
    (
        address _contract
    )
    {
        owner = msg.sender;
        flightSuretyData = FlightSuretyData(_contract);

        
    }

    function pay
    (
        address payable _to
    )

    public 
    payable
    {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
            (bool sent, bytes memory data) = _to.call{value: msg.value}("");

            require(sent, "Failed to send Ether");
            emit Response(sent, data);

    }



    /********************************************************************************************/
    /*                                           FALLBACK                                       */
    /********************************************************************************************/

    /// @dev make sure fallback function is not not payable so can't be used for funding smart contract
    fallback() external {}

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    /// @dev Modifier that requires the "operational" boolean variable to be "true"
    modifier requireIsOperational(){
         // Modify to call data contract's status
        require(operational, 
        "Contract FlightSuretyApp is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /********************************************************************************************/
    /*                                 FUNCTIONS FOR TESTING ONLY                               */
    /********************************************************************************************/

    /// @dev used for testing requireIsOperational, always returns true
    function testIsOperational() 
    public 
    view 
    requireIsOperational 
    returns(bool) 
    {
        return true;
    }


    function isAirline
    (
        address airline
    )
                            external
                            returns(bool)
    {
        return flightSuretyData.isAirline(airline);
    }


/// @dev Register an airline
    function registerAirline
    (
        address airline
    ) 
    public
        returns(bool success)                         
    {
        require(flightSuretyData.isAirline(msg.sender), "Requesting Airline is not funded");
        require(flightSuretyData.isRegisteredAirline(airline) == false, "Airline already registered");


        uint256 count_airlines = flightSuretyData.getAirlines();

        if (count_airlines > MULTIPARTY_CONSENSUS){
            bool is_duplicated = false;
                for(uint a = 0; a < airlines_approved[airline].length; a++) {
                    if (airlines_approved[airline][a] == msg.sender) {
                        is_duplicated = true;
                        break;
                    }
                }
            require(!is_duplicated, "Airline has already approved.");
        }

        if (count_airlines <= MULTIPARTY_CONSENSUS) {
            flightSuretyData.registerAirline(airline);
            success = flightSuretyData.isRegisteredAirline(airline);
        }
        

        airlines_approved[airline].push(msg.sender);
        uint256 airlines_consensus = flightSuretyData.getConsensus();
        if (airlines_approved[airline].length >= airlines_consensus) {
                flightSuretyData.registerAirline(airline);
                success = flightSuretyData.isRegisteredAirline(airline);
        }



        flightSuretyData.fund(airline);
    
        return success;
        
        
    }

    function registerFlight 
    (
        string memory _flight, 
        uint256 _departure
    ) 
    external 
    requireIsOperational 
     {
        bytes32 key = getKey(msg.sender, _flight, _departure);
        //require(!flightSuretyData.isFlightRegistered(key), "This flight is already registered");
        flightSuretyData.registerFlight(key, msg.sender, _departure, STATUS_CODE_UNKNOWN);

        emit ResponseFlightRegistered(key, STATUS_CODE_UNKNOWN);
    }


    function registerInsurance
    (
                                string memory flightname,
                                address _flight,
                                uint256 _departure
    )
    external
    payable
    requireIsOperational
    {
        require(msg.value <= INSURANCE_COST, "The insurance cost is 1 ether");
        bytes32 key = getKey(msg.sender, flightname, _departure);
        flightSuretyData.registerInsurance(getKey(_flight, flightname, _departure ), key, msg.sender, msg.value);
        
    }

    function getInsuranceInfo
    (
                                string memory flightname,
                                //address _flight,
                                uint256 _departure
    )
    external
    requireIsOperational
    returns
                            (
                                uint256
                            ) 
    {
        bytes32 key = getKey(msg.sender, flightname, _departure);
        return flightSuretyData.getInsuranceAmount(key);
    }


    function creditInsurees
                                (
                                string memory flightname,
                                address _flight,
                                uint256 _departure,
                                uint256 amount
                                )
                                internal
    {
        flightSuretyData.creditInsurees
        (
            getKey(_flight, flightname, _departure ), 
            getKey(msg.sender, flightname, _departure),
            amount
        );
    }



    function getKey(address _address, string memory _data, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(_address, _data, timestamp));
    }

 /*------------------------------------------------------------------------------------------*/
    /*                                     ORACLE MANAGEMENT                                    */
    /*------------------------------------------------------------------------------------------*/
    function fetchFlightStatus
                        (
                            address airline,
                            string calldata flight,
                            uint256 timestamp
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);
       
        ResponseInfo storage flightResponse = 
        oracleResponses[keccak256(abi.encodePacked(index, airline, flight, timestamp))];
        
        flightResponse.is_open = true;
        flightResponse.requester = msg.sender;    

        emit OracleRequest(index, airline, flight, timestamp);
    }

    uint8 private nonce = 0;

    uint256 public constant REGISTRATION_FEE = 1 ether;

    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool is_registered;
        uint8[3] indexes;
    }

    struct ResponseInfo {
        address requester;
        bool is_open; 
        mapping(uint8 => address[]) responses; 
    }

    mapping(address => Oracle) private oracles;
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 departure,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 departure,
        uint8 status
    );

    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 departure
    );


    event OracleRegistered(
        uint8[3] indexes
    );

    // Register an oracle with the contract
    function registerOracle() external payable requireIsOperational {

        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({is_registered: true, indexes: indexes});
    }

    function isOracleRegistered(address oracleAddress)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return oracles[oracleAddress].is_registered;
    }

    function getOracleRegistrationFee() 
        external 
        view 
        requireIsOperational 
        returns (uint256) {
        return REGISTRATION_FEE;
    }

    function getMyIndexes() 
        external 
        view 
        requireIsOperational 
        returns (uint8[3] memory) {
        require(
            oracles[msg.sender].is_registered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    function submitOracleResponse(
        uint8 index,
        address airline,
        string calldata flight,
        uint256 departure,
        uint8 status
    ) external requireIsOperational {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, departure));
        require(
            oracleResponses[key].is_open,
            "Flight or departureTime do not match oracle request"
        );

        oracleResponses[key].responses[status].push(msg.sender);

        emit OracleReport(airline, flight, departure, status);
        if (
            oracleResponses[key].responses[status].length >= MIN_RESPONSES
        ) {

        }
    }

    /*------------------------------------------------------------------------------------------*/
    /*                                     UTILITIES                                            */
    /*------------------------------------------------------------------------------------------*/
    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 max = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random =
            uint8(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            blockhash(block.number - nonce++),
                            account
                        )
                    )
                ) % max
            );

        if (nonce > 250) {
            nonce = 0; 
        }

        return random;
    }



}