// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {CcipResponseVerifier} from "../CcipResponseVerifier.sol";
import {IBedrockProofVerifier} from "./IBedrockProofVerifier.sol";

//TODO use OZ Ownable
contract BedrockCcipVerifier is CcipResponseVerifier {
    IBedrockProofVerifier public bedrockProofVerifier;
    address public l2Resolver;

    constructor(IBedrockProofVerifier _bedrockProofVerifier, address _l2Resolver) {
        bedrockProofVerifier = _bedrockProofVerifier;
        l2Resolver = _l2Resolver;
    }

    //TODO add onlyOwner
    function setL2Resolver(address l2Resolver) external {
        l2Resolver = l2Resolver;
    }

    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view override returns (bytes memory) {
        (string memory result, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(
            response,
            (string, IBedrockProofVerifier.BedrockStateProof)
        );

        require(proof.target == l2Resolver, "proof target does not match resolver");
        return bedrockProofVerifier.getProofValue(proof);
    }
}
