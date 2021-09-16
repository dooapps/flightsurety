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
    event ResponseFlightRegistered(bytes32 key);

    uint256 constant MULTIPARTY_CONSENSUS = 4;
    uint256 constant MULTIPARTY_CONSENSUS_DIVISOR = 2;

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
            flightSuretyData.fund(msg.sender);
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
        if (count_airlines <= MULTIPARTY_CONSENSUS) {
            flightSuretyData.registerAirline(airline);
            success = flightSuretyData.isRegisteredAirline(airline);
        }
        
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
        airlines_approved[airline].push(msg.sender);
        uint256 airlines_consensus = flightSuretyData.getConsensus();
        if (airlines_approved[airline].length >= airlines_consensus) {
                flightSuretyData.registerAirline(airline);
                success = flightSuretyData.isRegisteredAirline(airline);
        }



        flightSuretyData.fund(airline);
        success == false;
        return false;
        
        
    }

    function registerFlight 
    (
        string calldata _flight, 
        uint256 _departure 
    ) 
    external 
    requireIsOperational 
     {
        bytes32 key = getFlightKey(msg.sender, _flight, _departure);
        emit ResponseFlightRegistered(key);
        //require(!flightSuretyData.isFlightRegistered(key), "This flight is already registered");
        flightSuretyData.registerFlight(key, msg.sender, _departure, _flight, STATUS_CODE_UNKNOWN);

        emit ResponseFlightRegistered(key);
    }


    function getFlightKey(address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    


}