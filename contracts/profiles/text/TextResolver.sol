// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {ITextResolver} from "./ITextResolver.sol";

abstract contract TextResolver is ITextResolver, ResolverBase {
    using BytesUtils for bytes;
    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(string => string)))) public versionable_texts;

    /**
     * Sets the text data associated with an ENS node and key.
     * May only be called by the owner of that node in the ENS registry.
     * @param name The name to update.
     * @param key The key to set.
     * @param value The text data value to set.
     */
    function setText(bytes calldata name, string calldata key, string calldata value) external virtual {
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        versionable_texts[recordVersions[context][node]][context][node][key] = value;
        emit TextChanged(context, name, node, key, key, value);
    }

    /**
     * Returns the text data associated with an ENS node and key.
     * @param node The ENS node to query.
     * @param key The text data key to query.
     * @return The associated text data.
     */
    function text(bytes calldata context, bytes32 node, string calldata key) external view virtual override returns (string memory) {
        return versionable_texts[recordVersions[context][node]][context][node][key];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(ITextResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
