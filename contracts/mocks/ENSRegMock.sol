// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ENSRegMock {
    address public theOwner;

    constructor (address _owner){
        theOwner = _owner;
    }

    function owner(bytes32 node) external view returns (address) {
        return theOwner;
    }

}