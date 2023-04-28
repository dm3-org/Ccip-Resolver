// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@ensdomains/ens-contracts/contracts/resolvers/profiles/ABIResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/AddrResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/ContentHashResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/InterfaceResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/NameResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/PubkeyResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/TextResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/ExtendedResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/Multicallable.sol";

import {LibOwnedENSNode} from "../lib/LibOwnedENSNode.sol";

contract L2PublicResolver is
    Multicallable,
    ABIResolver,
    AddrResolver,
    ContentHashResolver,
    InterfaceResolver,
    NameResolver,
    PubkeyResolver,
    TextResolver,
    ExtendedResolver
{
    uint256 private constant COIN_TYPE_ETH = 60;
    event TextChanged(
        bytes32 indexed node,
        bytes32 indexed ownedNode,
        string indexed indexedKey,
        string key,
        string value
    );
    event AddrChanged(bytes32 indexed node, bytes32 indexed ownedNode, address a);
    event AddressChanged(bytes32 indexed node, bytes32 indexed ownedNode, uint256 coinType, bytes newAddress);
    event ABIChanged(bytes32 indexed node, bytes32 indexed ownedNode, uint256 indexed contentType);
    event ContenthashChanged(bytes32 indexed node, bytes32 indexed ownedNode, bytes hash);
    event InterfaceChanged(
        bytes32 indexed node,
        bytes32 indexed ownedNode,
        bytes4 indexed interfaceID,
        address implementer
    );
    event NameChanged(bytes32 indexed node, bytes32 indexed ownedNode, string name);
    event PubkeyChanged(bytes32 indexed node, bytes32 indexed ownedNode, bytes32 x, bytes32 y);

    function isAuthorised(bytes32 node) internal view override returns (bool) {
        return false;
    }

    function supportsInterface(bytes4 interfaceID)
        public
        view
        override(
            Multicallable,
            ABIResolver,
            AddrResolver,
            ContentHashResolver,
            InterfaceResolver,
            NameResolver,
            PubkeyResolver,
            TextResolver
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceID);
    }

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
        emit AddressChanged(node, ownedNode, coinType, a);
        if (coinType == COIN_TYPE_ETH) {
            emit AddrChanged(node, ownedNode, bytesToAddress(a));
        }
        versionable_addresses[recordVersions[ownedNode]][ownedNode][coinType] = a;
    }

    /**
     * Sets the ABI associated with an ENS node.
     * Nodes may have one ABI of each content type. To remove an ABI, set it to
     * the empty string.
     * @param node The node to update.
     * @param contentType The content type of the ABI
     * @param data The ABI data.
     */
    function setABI(
        bytes32 node,
        uint256 contentType,
        bytes calldata data
    ) external override {
        // Content types must be powers of 2
        require(((contentType - 1) & contentType) == 0, "contentType unsupported");
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);

        versionable_abis[recordVersions[ownedNode]][ownedNode][contentType] = data;
        emit ABIChanged(node, ownedNode, contentType);
    }

    /**
     * Sets the contenthash associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param hash The contenthash to set
     */
    function setContenthash(bytes32 node, bytes calldata hash) external override {
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);
        versionable_hashes[recordVersions[ownedNode]][ownedNode] = hash;
        emit ContenthashChanged(node, ownedNode, hash);
    }

    /**
     * Sets an interface associated with a name.
     * Setting the address to 0 restores the default behaviour of querying the contract at `addr()` for interface support.
     * @param node The node to update.
     * @param interfaceID The EIP 165 interface ID.
     * @param implementer The address of a contract that implements this interface for this node.
     */
    function setInterface(
        bytes32 node,
        bytes4 interfaceID,
        address implementer
    ) external override {
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);
        versionable_interfaces[recordVersions[ownedNode]][ownedNode][interfaceID] = implementer;
        emit InterfaceChanged(node, ownedNode, interfaceID, implementer);
    }

    /**
     * Sets the name associated with an ENS node, for reverse records.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     */
    function setName(bytes32 node, string calldata newName) external override {
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);
        versionable_names[recordVersions[ownedNode]][ownedNode] = newName;
        emit NameChanged(node, ownedNode, newName);
    }

    /**
     * Sets the SECP256k1 public key associated with an ENS node.
     * @param node The ENS node to query
     * @param x the X coordinate of the curve point for the public key.
     * @param y the Y coordinate of the curve point for the public key.
     */
    function setPubkey(
        bytes32 node,
        bytes32 x,
        bytes32 y
    ) external override {
        bytes32 ownedNode = LibOwnedENSNode.getOwnedENSNode(node, msg.sender);
        versionable_pubkeys[recordVersions[ownedNode]][ownedNode] = PublicKey(x, y);
        emit PubkeyChanged(node, ownedNode, x, y);
    }
}
