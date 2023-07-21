// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IContextResolver {
    /**
     * @notice Get metadata about the CCIP Resolver
     * @dev This function provides metadata about the CCIP Resolver, including its name, coin type, GraphQL URL, storage type, and encoded information.
     * @param name The domain name in format (dnsEncoded)
     * @return name The name of the resolver ("CCIP RESOLVER")
     * @return coinType Resolvers coin type (60 for Ethereum)
     * @return graphqlUrl The GraphQL URL used by the resolver
     * @return storageType Storage Type (0 for EVM)
     * @return encodedData Encoded data representing the resolver ("CCIP RESOLVER")
     */
    function metadata(bytes calldata name) external view returns (string memory, uint256, string memory, uint8, bytes memory);
}
