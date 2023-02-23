// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";

interface IOptimismProofVerifier {
    struct L2StateProof {
        //The address of the contract we are trying to prove
        address target;
        //The stateroot the account proof is based on
        bytes32 stateRoot;
        //The batch header of the state root batch
        Lib_OVMCodec.ChainBatchHeader stateRootBatchHeader;
        //The inclusion proof of the state root in the batch
        Lib_OVMCodec.ChainInclusionProof stateRootProof;
        //The accountProof RLP-Encoded
        bytes stateTrieWitness;
        //The length of the result
        uint256 length;
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
    /// @param proof  L2StateProof
    /// @return The value of all included slots concatinated

    function getProofValue(L2StateProof memory proof) external view returns (bytes memory);
}
