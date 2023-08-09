// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {Types} from "@eth-optimism/contracts-bedrock/contracts/libraries/Types.sol";

interface IBedrockProofVerifier {
    struct BedrockStateProof {
        uint8 layout;
        // the address of the contract we are trying to prove
        address target;
        // the length of the result
        uint256 length;
        // the state root of the account we are trying to prove
        bytes32 storageHash;
        // the accountProof RLP-Encoded
        bytes stateTrieWitness;
        // the output index the proof refers to
        uint256 l2OutputIndex;
        // the bedrock output RootProof struct
        Types.OutputRootProof outputRootProof;
        // the storage proofs for each slot included in the proof
        StorageProof[] storageProofs;
    }
    struct StorageProof {
        // the slot address
        bytes32 key;
        // the storageProof RLP-Encoded
        bytes storageTrieWitness;
    }

    /// @notice returns the value of one or more storage slots given the provided proof is correct
    /// @param proof BedrockStateProof
    /// @return the value of all included slots concatenated
    function getProofValue(BedrockStateProof memory proof) external view returns (bytes memory);
}

interface IL2OutputOracle {
    function getL2Output(uint256 _l2OutputIndex) external view returns (Types.OutputProposal memory);
}
