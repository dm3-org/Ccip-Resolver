// SPDX-License-Identifier: MIT
import {Types} from "@eth-optimism/contracts-bedrock/contracts/libraries/Types.sol";

pragma solidity ^0.8.9;
import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";

interface IBedrockProofVerifier {
    struct BedrockStateProof {
        //The address of the contract we are trying to prove
        address target;
        //The length of the result
        uint256 length;
        //The state root of the account we are trying to prove
        bytes32 storageHash;
        //The accountProof RLP-Encoded
        bytes stateTrieWitness;
        //The output index the prop refers to
        uint256 l2OutputIndex;
        //The bedock output RootProof sturct
        Types.OutputRootProof outputRootProof;
        //The storage proofs for each slot included in the proof
        StorageProof[] storageProofs;
    }
    struct StorageProof {
        //The slot address
        bytes32 key;
        //The storageProof RLP-Encoded
        bytes storageTrieWitness;
    }

    /// @notice Returns the value of one or more storage slots given the provided proof is correct
    /// @param proof  BedrockStateProof
    /// @return The value of all included slots concatinated

    function getProofValue(BedrockStateProof memory proof) external view returns (bytes memory);
}
