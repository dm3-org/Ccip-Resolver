// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {IPubkeyResolver} from "./IPubkeyResolver.sol";

abstract contract PubkeyResolver is IPubkeyResolver, ResolverBase {
    using BytesUtils for bytes;
    struct PublicKey {
        bytes x;
        bytes y;
    }

    mapping(uint64 => mapping(bytes => mapping(bytes32 => PublicKey))) versionable_pubkeys;

    /**
     * Sets the SECP256k1 public key associated with an ENS node.
     * @param name The ENS node to query
     * @param x the X coordinate of the curve point for the public key.
     * @param y the Y coordinate of the curve point for the public key.
     */
    function setPubkey(bytes calldata name, bytes calldata x, bytes calldata y) external virtual {
        bytes memory context = abi.encodePacked(msg.sender);
        bytes32 node = name.namehash(0);
        versionable_pubkeys[recordVersions[context][node]][context][node] = PublicKey(x, y);
        emit PubkeyChanged(context, name, node, x, y);
    }

    /**
     * Returns the SECP256k1 public key associated with an ENS node.
     * Defined in EIP 619.
     * @param node The ENS node to query
     * @return x The X coordinate of the curve point for the public key.
     * @return y The Y coordinate of the curve point for the public key.
     */
    function pubkey(bytes calldata context, bytes32 node) external view virtual override returns (bytes memory x, bytes memory y) {
        uint64 currentRecordVersion = recordVersions[context][node];
        return (versionable_pubkeys[currentRecordVersion][context][node].x, versionable_pubkeys[currentRecordVersion][context][node].y);
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IPubkeyResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
