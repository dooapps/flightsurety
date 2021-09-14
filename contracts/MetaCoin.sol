// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This is a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MetaCoin {
    using SafeMath for uint256;
    
    // Errors allow you to provide information about
    // why an operation failed. They are returned
    // to the caller of the function.
    error InsufficientBalance(uint requested, uint available);


    // Events allow clients to react to specific
    // contract changes you declare
    event Sent(address from, address to, uint amount);
    event Response(bool success, bytes data);    


    mapping (address => uint) balances;



    constructor() {
        balances[msg.sender] = 10000;
    }

    function send(address payable _to) public payable {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        (bool sent, bytes memory data) = _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        emit Response(sent, data);
    }

}
