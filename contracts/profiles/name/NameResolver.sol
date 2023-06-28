// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {INameResolver} from "./INameResolver.sol";

abstract contract NameResolver is INameResolver, ResolverBase {
    using BytesUtils for bytes;
    mapping(uint64 => mapping(bytes => mapping(bytes32 => string))) public versionable_names;

    /**
     * Sets the name associated with an ENS node, for reverse records.
     * May only be called by the owner of that node in the ENS registry.
     * @param nodeName The name to update.
     */
    function setName(bytes calldata nodeName, string calldata newName) external virtual {
        bytes32 node = nodeName.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        versionable_names[recordVersions[context][node]][context][node] = newName;
        emit NameChanged(context, nodeName, node, newName);
    }

    /**
     * Returns the name associated with an ENS node, for reverse records.
     * Defined in EIP181.
     * @param node The ENS node to query.
     * @return The associated name.
     */
    function name(bytes calldata context, bytes32 node) external view returns (string memory) {
        return versionable_names[recordVersions[context][node]][context][node];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(INameResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
