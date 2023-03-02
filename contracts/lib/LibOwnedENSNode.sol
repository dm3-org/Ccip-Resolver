// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library LibOwnedENSNode {
    function getOwnedENSNode(bytes32 node, address owner) internal pure returns (bytes32) {
        return keccak256(abi.encode(node, owner));
    }
}
