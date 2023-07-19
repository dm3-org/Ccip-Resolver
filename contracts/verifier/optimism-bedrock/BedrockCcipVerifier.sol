// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {CcipResponseVerifier} from "../CcipResponseVerifier.sol";
import {IBedrockProofVerifier} from "./IBedrockProofVerifier.sol";

contract BedrockCcipVerifier is CcipResponseVerifier {
    IBedrockProofVerifier public immutable bedrockProofVerifier;
    address public immutable target;

    constructor(IBedrockProofVerifier _bedrockProofVerifier, address _target) {
        bedrockProofVerifier = _bedrockProofVerifier;
        target = _target;
    }

    /**
     * @notice Resolve a response with a proof
     * @dev This function allows resolving a response along with a proof provided by IBedrockProofVerifier.
     * @param response The response data along with the associated proof
     * @param extraData The original data passed to the request
     * @return The resolved response data encoded as bytes
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) public view virtual override returns (bytes memory) {
        /**
         * @dev Decode the response and proof from the response bytes
         */
        (bytes memory responseEncoded, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(
            response,
            (bytes, IBedrockProofVerifier.BedrockStateProof)
        );
        /**
         * Revert if the proof target does not match the resolver. This is to prevent a malicious resolver from using a proof intended for another address.
         */
        require(proof.target == target, "proof target does not match resolver");
        /**
         * bedrockProofVerifier.getProofValue(proof) always returns the packed result. However, libraries like ethers.js expect the result to be encoded in bytes. Hence, the gateway needs to encode the result before returning it to the client.
         * To ensure responseEncoded matches the value returned by bedrockProofVerifier.getProofValue(proof), we need to check the layout of the proof and encode the result accordingly, so we can compare the two values using the keccak256 hash.
         */

        require(
            proof.layout == 0
                ? keccak256(bedrockProofVerifier.getProofValue(proof)) == keccak256(responseEncoded)
                : keccak256(abi.encode(bedrockProofVerifier.getProofValue(proof))) == keccak256(responseEncoded),
            "proof does not match response"
        );

        return responseEncoded;
    }
}
