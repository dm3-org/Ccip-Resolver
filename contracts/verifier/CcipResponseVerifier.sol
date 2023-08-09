// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ICcipResponseVerifier} from "./ICcipResponseVerifier.sol";
import {SupportsInterface, ISupportsInterface} from "../SupportsInterface.sol";

abstract contract CcipResponseVerifier is ICcipResponseVerifier, SupportsInterface {
    /*
     *   --------------------------------------------------
     *    EVENTS
     *   --------------------------------------------------
     */

    event GraphQlUrlChanged(string newGraphQlUrl);
    event OwnerChanged(address newOwner);

    /*
     *   --------------------------------------------------
     *    State Variables
     *   --------------------------------------------------
     */

    /**
     * @notice The owner of the contract
     * The owner of the contract can set the graphQlUrl and determine a new owner
     */
    address public owner;

    string public graphqlUrl;

    /*
     *   --------------------------------------------------
     *    Modifier
     *   --------------------------------------------------
     */

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    /**
     * @notice Set the GraphQL endpoint URL for the contract
     * @dev This function can only be called by the current owner.
     * @param _graphqlUrl The new GraphQL endpoint URL to be set
     */
    function setGraphUrl(string memory _graphqlUrl) external onlyOwner {
        graphqlUrl = _graphqlUrl;
        emit GraphQlUrlChanged(_graphqlUrl);
    }

    /**
     * @notice Set the new owner of the contract
     * @dev This function can only be called by the current owner.
     * @param _owner The address of the new owner
     */
    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
        emit OwnerChanged(_owner);
    }

    /*
     *   --------------------------------------------------
     *    Constructor
     *   --------------------------------------------------
     */

    constructor(address _owner, string memory _graphqlUrl) {
        owner = _owner;
        graphqlUrl = _graphqlUrl;
    }

    /*
     *   --------------------------------------------------
     *    External functions
     *   --------------------------------------------------
     */

    /**
     * @notice Check if the contract supports the given interface
     * @dev This function checks if the contract supports the provided interface by comparing the `interfaceID` with the supported interface IDs.
     * @param interfaceID The interface ID to check for support
     * @return true if the contract supports the interface, false otherwise
     */
    function supportsInterface(
        bytes4 interfaceID
    ) public pure override(SupportsInterface, ISupportsInterface) returns (bool) {
        /*
         * Supports both ICcipResponseVerifier and ISupportsInterfacef
         */
        return interfaceID == type(ICcipResponseVerifier).interfaceId || super.supportsInterface(interfaceID);
    }

    /**
     * @notice To support other to be resolved than just bytes it is possible to override this function. In that case the function selector of the overridden function should be returned. The default implementation returns the function selector of the `resolveWithProof` function.
     * @return The function selector of the `resolveWithProof` function
     */
    function onResolveWithProof(bytes calldata, bytes calldata) public pure virtual override returns (bytes4) {
        return this.resolveWithProof.selector;
    }
}
