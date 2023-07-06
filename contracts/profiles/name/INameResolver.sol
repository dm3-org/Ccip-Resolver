// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface INameResolver {
    event NameChanged(bytes context, bytes nodeName, bytes32 indexed node, string name);

    /**
     * Returns the name associated with an ENS node, for reverse records.
     * Defined in EIP181.
     * @param node The ENS node to query.
     * @return The associated name.
     */
    function name(bytes calldata context, bytes32 node) external view returns (string memory);
}
