// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPubkeyResolver {
    event PubkeyChanged(bytes context, bytes name, bytes32 indexed node, bytes x, bytes y);

    /**
     * Returns the SECP256k1 public key associated with an ENS node.
     * Defined in EIP 619.
     * @param node The ENS node to query
     * @return x The X coordinate of the curve point for the public key.
     * @return y The Y coordinate of the curve point for the public key.
     */
    function pubkey(bytes calldata context, bytes32 node) external view returns (bytes memory x, bytes memory y);
}
