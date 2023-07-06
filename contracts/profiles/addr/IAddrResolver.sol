// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * Interface for the legacy (ETH-only) addr function.
 */
interface IAddrResolver {
    event AddrChanged(bytes context, bytes name, bytes32 indexed node, address a);

    /**
     * Returns the address associated with an ENS node.
     * @param node The ENS node to query.
     * @return The associated address.
     */
    function addr(bytes calldata context, bytes32 node) external view returns (address payable);
}
