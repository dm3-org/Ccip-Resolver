// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {ICcipResponseVerifier} from "./ICcipResponseVerifier.sol";
import {SupportsInterface, ISupportsInterface} from "../SupportsInterface.sol";

abstract contract CcipResponseVerifier is ICcipResponseVerifier, SupportsInterface {
    /**
     * @notice Check if the contract supports the given interface
     * @dev This function checks if the contract supports the provided interface by comparing the `interfaceID` with the supported interface IDs.
     * @param interfaceID The interface ID to check for support
     * @return true if the contract supports the interface, false otherwise
     */
    function supportsInterface(bytes4 interfaceID) public pure override(SupportsInterface, ISupportsInterface) returns (bool) {
        //Supports both ICcipResponseVerifier and ISupportsInterface
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
