pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../oracle/Airline.sol";


contract Consensus {
    using SafeMath for uint256;

    uint256 constant MULTIPARTY_CONSENSUS = 4;
    uint256 constant MULTIPARTY_CONSENSUS_DIVISOR = 2;


    Airline private data;


}