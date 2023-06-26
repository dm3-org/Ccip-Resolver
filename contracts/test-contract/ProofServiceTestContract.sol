// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract ProofServiceTestContract {
    bytes32 public testBytes32;
    bool public testBool;
    uint256 public testUnit;

    function setBytes32(bytes32 _testBytes32) external {
        testBytes32 = _testBytes32;
    }

    function setBool(bool _testBool) external {
        testBool = _testBool;
    }

    function setUint256(uint256 _testUint) external {
        testUnit = _testUint;
    }
}
