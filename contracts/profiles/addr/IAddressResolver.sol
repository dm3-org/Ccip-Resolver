// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * Interface for the new (multicoin) addr function.
 */
interface IAddressResolver {
    event AddressChanged(bytes context, bytes name, bytes32 indexed node, uint256 coinType, bytes newAddress);

    function addr(bytes calldata context, bytes32 node, uint256 coinType) external view returns (bytes memory);
}
