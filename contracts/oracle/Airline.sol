// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract Airline {
    using SafeMath for uint256;


    address private owner;                                      // Account used to deploy contract
    bool private operational = true;                            // Blocks all state changes throughout the contract if false
    address[] airlines_registered = new address[](0);
   
    uint256 count_airlines;
    uint256 count_consensus;
    uint256 count_funded;


    mapping(address => bool) private authorized_airlines;                   // all authorized contracts (callers)
    mapping(address=>Airline) private airlines; 
    mapping(address => address[]) private consensus_airlines;

    struct Airline {
        bool is_registered;
        bool is_funded;
    }

    /**
    * @dev Constructor
    *      The deploying account becomes contract owner
    */
    constructor()                              
    {
        owner = msg.sender;      
        
        count_airlines = count_airlines.add(1);                 // count how many airlines are available
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

    modifier requireOwner() { 
        require(
            msg.sender == owner,
            "Only airline can call this contract."
        );
        _;
    }

    modifier requireCallers(){
        require(authorized_airlines[msg.sender], 
        "Caller is not authorized");
        _;
    }


    /**
    * @dev Modifier that requires the "owner" account to be the function caller
    */
    modifier requireAirlineRegistered
    ( 
        address _airline 
    )
    {
        require(airlines[_airline].is_registered, 
        "Airline is not registered");
        _;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
        /// @dev Add an authorized airline
    function authorizeAirline
    (
        address _address
    ) 
    external 
    requireOwner 
    {
        authorized_airlines[_address] = true;
    }
    
    
    function isOperational
                            (

                            ) 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
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

    function isFunded(address airline )
                            external
                            view
                            returns(bool)
    {

        return airlines[airline].is_funded;
    }


    function isRegisteredAirline(address _airline) external view
    returns(bool) {
        return airlines[_airline].is_registered;
    }




}