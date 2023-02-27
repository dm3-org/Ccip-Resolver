// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol";
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol";
import {LibOwnedENSNode} from "../lib/LibOwnedENSNode.sol";

contract L2PublicResolver is PublicResolver(ENS(address(0)), INameWrapper(address(0)), address(0), address(0)) {
    event TextChanged(
        bytes32 indexed node,
        bytes32 indexed ownedNode,
        string indexed indexedKey,
        string key,
        string value
    );

    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external override {
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);
        versionable_texts[recordVersions[ownedNode]][ownedNode][key] = value;
        emit TextChanged(node, ownedNode, key, key, value);
    }
}
