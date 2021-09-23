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

    function send
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

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        
        ResponseInfo storage flightResponse = oracleResponses[key];
        
        flightResponse.isOpen = true;
        flightResponse.requester = msg.sender;    

        emit OracleRequest(index, airline, flight, timestamp);
    }


    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, departureTime)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 departureTime,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 departureTime,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 departureTime
    );

    // Register an oracle with the contract
    function registerOracle() external payable requireIsOperational {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function isOracleRegistered(address oracleAddress)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return oracles[oracleAddress].isRegistered;
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
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string calldata flight,
        uint256 departureTime,
        uint8 statusCode
    ) external requireIsOperational {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, departureTime));
        require(
            oracleResponses[key].isOpen,
            "Flight or departureTime do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, departureTime, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {

            // Handle flight status as appropriate
            //processFlightStatus(airline, flight, departureTime, statusCode);
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
        uint8 maxValue = 10;

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
                ) % maxValue
            );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }



}