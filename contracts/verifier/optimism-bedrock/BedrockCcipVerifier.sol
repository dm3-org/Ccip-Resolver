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
        (, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(response, (string, IBedrockProofVerifier.BedrockStateProof));

        require(proof.target == target, "proof target does not match resolver");
        return bedrockProofVerifier.getProofValue(proof);
    }
}
