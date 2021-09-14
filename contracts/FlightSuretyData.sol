// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;


    address private owner;                                      // Account used to deploy contract
    bool private operational = true;                            // Blocks all state changes throughout the contract if false
    address[] airlines_registered = new address[](0);
    
    
    
    

    struct Airline {
        bool is_registered;
        bool is_funded;
    }

    mapping(address => bool) private callers;                   // all authorized contracts (callers)
    mapping(address=>Airline) private airlines; 



    /**
    * @dev Constructor
    *      The deploying account becomes contract owner
    */
    constructor()                              
    {
        owner = msg.sender;      
        

        airlines[owner].is_registered = true;
        airlines[owner].is_funded = true;
                
    }



    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /// @dev Modifier that requires the "operational" boolean variable to be "true"
    ///      This is used on all state changing functions to pause the contract in 
    ///      the event there is an issue that needs to be fixed

    /**
    * @dev Get operating status of contract
    *
    */      
    modifier requireIsOperational(){
        require(operational, 
        "Contract FlightSuretyData is currently not operational");
        _;
    }

    /// @dev Modifier that requires the "ContractOwner" account to be the function caller
    modifier requireOwner(){
        require(msg.sender == owner, 
        "Caller of FlightSuretyData is not contract owner");
        _;
    }

    /// @dev Modifier that requires the function caller to be authorized
    modifier requireCallers(){
        require(callers[msg.sender], 
        "Caller is not authorized");
        _;
    }


    /**
    * @dev Modifier that requires the "owner" account to be the function caller
    */
    modifier requireAirlineRegistered( address _airline )
    {
        require(airlines[_airline].is_registered, 
        "Airline is not registered");
        _;
    }

 /********************************************************************************************/
 /*                                       UTILITY FUNCTIONS                                  */
/********************************************************************************************/


    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }

    /// @dev Add an authorized address
    function authorizeCaller(address _address) external requireOwner {
        callers[_address] = true;
    }

    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireOwner 
    {
        operational = mode;
    }

    /**
    * @dev determine if an address is an airline
    * @return A bool that is true if it is a funded airline
    */
    function isAirline( address airline )
                            external
                            view
                            returns(bool)
    {
        return airlines[airline].is_funded;
    }


   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address _airline
                            )
                            public
                            requireAirlineRegistered(_airline)
    {
//        recipient.transfer(msg.value); //// TODO causes test to fail; not funded
        airlines[_airline].is_funded = true;
        callers[_airline] = true;

    }


}