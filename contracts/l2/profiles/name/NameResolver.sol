// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {ResolverBase} from "../ResolverBase.sol";
import {INameResolver} from "./INameResolver.sol";

abstract contract NameResolver is INameResolver, ResolverBase {
    mapping(uint64 => mapping(bytes => mapping(bytes32 => string))) versionable_names;

    /**
     * Sets the name associated with an ENS node, for reverse records.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     */
    function setName(bytes32 node, string calldata newName) external virtual {
        bytes memory context = abi.encodePacked(msg.sender);
        versionable_names[recordVersions[context][node]][context][node] = newName;
        emit NameChanged(context, node, newName);
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
