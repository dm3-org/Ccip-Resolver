// SPDX-License-Identifier: MIT
pragma solidity >=0.8.15;

interface IContextResolver {
    /** @dev Returns the owner of the resolver on L2
     * @return graphqlurl
     * @return context can be l2 resolver contract address for evm chain but can be any l2 storage identifier for non evm chain
     */
    function metadata() external view returns (string memory, uint256, string memory, uint8, bytes memory);
}
