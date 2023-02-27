// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol";
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol";
import {LibOwnedENSNode} from "../lib/LibOwnedENSNode.sol";

contract L2PublicResolver is PublicResolver(ENS(address(0)), INameWrapper(address(0)), address(0), address(0)) {
    uint256 private constant COIN_TYPE_ETH = 60;
    event TextChanged(
        bytes32 indexed node,
        bytes32 indexed ownedNode,
        string indexed indexedKey,
        string key,
        string value
    );
    event AddrChanged(bytes32 indexed node, bytes32 ownNode, address a);

    /**
     * Sets the text data associated with an ENS node and key.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param key The key to set.
     * @param value The text data value to set.
     */
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external override {
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);
        versionable_texts[recordVersions[ownedNode]][ownedNode][key] = value;
        emit TextChanged(node, ownedNode, key, key, value);
    }

    /**
     * Sets the address associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param a The address to set.
     */
    function setAddr(bytes32 node, address a) external override {
        setAddr(node, COIN_TYPE_ETH, super.addressToBytes(a));
    }

    function setAddr(
        bytes32 node,
        uint256 coinType,
        bytes memory a
    ) public override {
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);
        emit AddressChanged(node, coinType, a);
        if (coinType == COIN_TYPE_ETH) {
            emit AddrChanged(node, bytesToAddress(a));
        }
        versionable_addresses[recordVersions[ownedNode]][ownedNode][coinType] = a;
    }
}
