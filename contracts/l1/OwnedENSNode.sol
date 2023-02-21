// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";

abstract contract OwnedENSNode {
    ENS public ensRegistry;

    constructor(ENS _ensRegistry) {
        ensRegistry = _ensRegistry;
    }

    function getOwnerNode(bytes32 node) internal view returns (bytes32) {
        address nodeOwner = ensRegistry.owner(node);
        return keccak256(abi.encode(node, nodeOwner));
    }

    function replaceNodeWithOwnedNode(bytes calldata data) public view returns (bytes memory) {
        bytes4 selector = bytes4(data[:4]);
        bytes32 node = bytes32(data[4:36]);
        bytes memory additionalData = data[36:];

        return bytes.concat(selector, getOwnerNode(node), additionalData);
    }
}
