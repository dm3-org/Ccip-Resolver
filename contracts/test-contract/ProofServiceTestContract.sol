// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract ProofServiceTestContract {
    bool public testBool;
    bytes32 public testBytes32;
    address public testAddress;
    uint256 public testUnit;

    bytes public testBytes;
    string public testString;
    string public longString;

    function setBool(bool _testBool) external {
        testBool = _testBool;
    }

    function setAddress(address _testAddress) external {
        testAddress = _testAddress;
    }

    function setUint256(uint256 _testUint) external {
        testUnit = _testUint;
    }

    function setBytes32(bytes32 _testBytes32) external {
        testBytes32 = _testBytes32;
    }

    function setBytes(bytes calldata _testBytes) external {
        testBytes = _testBytes;
    }

    function setString(string calldata _testString) external {
        testString = _testString;
    }

    function setLongString(string calldata _longString) external {
        longString = _longString;
    }
}
