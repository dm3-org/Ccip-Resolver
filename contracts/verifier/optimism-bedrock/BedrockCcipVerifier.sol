// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {CcipResponseVerifier} from "../CcipResponseVerifier.sol";
import {IBedrockProofVerifier} from "./IBedrockProofVerifier.sol";

contract BedrockCcipVerifier is CcipResponseVerifier {
    IBedrockProofVerifier public immutable bedrockProofVerifier;
    address public immutable target;

    constructor(IBedrockProofVerifier _bedrockProofVerifier, address _target) {
        bedrockProofVerifier = _bedrockProofVerifier;
        target = _target;
    }

    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view override returns (bytes memory) {
        (bytes memory responseEncoded, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(
            response,
            (bytes, IBedrockProofVerifier.BedrockStateProof)
        );
        require(proof.target == target, "proof target does not match resolver");
        require(
            proof.layout == 0
                ? keccak256(bedrockProofVerifier.getProofValue(proof)) == keccak256(responseEncoded)
                : keccak256(abi.encode(bedrockProofVerifier.getProofValue(proof))) == keccak256(responseEncoded),
            "proof does not match response"
        );

        return responseEncoded;
    }
}
