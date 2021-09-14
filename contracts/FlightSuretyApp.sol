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

    address private owner;                                      // Account used to deploy contract
    bool private operational = true; 
     
    
    FlightSuretyData private flightSuretyData;

    // list of all airlines
    address[] private airlines = new address[](0);

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
    returns(bool)
    {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        
        if(msg.value > 10 ether){
            (bool sent, bytes memory data) = _to.call{value: msg.value}("");
            flightSuretyData.fund(msg.sender);
            require(sent, "Failed to send Ether");
            emit Response(sent, data);
            return sent;
        }
        else{
            return false;
        }

    }



    /********************************************************************************************/
    /*                                           FALLBACK                                       */
    /********************************************************************************************/

    /// @dev make sure fallback function is not not payable so can't be used for funding smart contract
    fallback() external {
    }

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
    function testIsOperational() public view requireIsOperational returns(bool) {
        return true;
    }


    function isAirline(address airline)
                            external
                            returns(bool)
    {
        return(flightSuretyData.isAirline(airline));
    }


/// @dev Register an airline
    function registerAirline(address airline)
        public 
        requireIsOperational  
        returns(bool success)                         
    {
        require(flightSuretyData.isAirline(msg.sender), "Requesting Airline is not funded");
        require(flightSuretyData.isRegisteredAirline(airline) == false, "Airline already registered");


        uint256 count_airlines = flightSuretyData.GetAirlines();
        if ( count_airlines < 5) {
            flightSuretyData.registerAirline(airline);
            success = flightSuretyData.isRegisteredAirline(airline);
        }
        
       flightSuretyData.fund(airline);
        
       return true;
        
        
    }

    


}