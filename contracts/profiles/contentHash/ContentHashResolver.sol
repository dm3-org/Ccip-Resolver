// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {IContentHashResolver} from "./IContentHashResolver.sol";

abstract contract ContentHashResolver is IContentHashResolver, ResolverBase {
    using BytesUtils for bytes;
    mapping(uint64 => mapping(bytes => mapping(bytes32 => bytes))) versionable_hashes;

    /**
     * Sets the contenthash associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param name  The name to update.
     * @param hash The contenthash to set
     */
    function setContenthash(bytes calldata name, bytes calldata hash) external virtual {
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        versionable_hashes[recordVersions[context][node]][context][node] = hash;
        emit ContenthashChanged(context, name, node, hash);
    }

    /**
     * Returns the contenthash associated with an ENS node.
     * @param node The ENS node to query.
     * @return The associated contenthash.
     */
    function contenthash(bytes calldata context, bytes32 node) external view virtual override returns (bytes memory) {
        return versionable_hashes[recordVersions[context][node]][context][node];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IContentHashResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
