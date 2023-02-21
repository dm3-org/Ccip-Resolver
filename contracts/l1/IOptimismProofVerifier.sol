// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";

interface IOptimismProofVerifier {
    struct L2StateProof {
        address target;
        bytes32 stateRoot;
        Lib_OVMCodec.ChainBatchHeader stateRootBatchHeader;
        Lib_OVMCodec.ChainInclusionProof stateRootProof;
        bytes stateTrieWitness;
        uint256 length;
        StorageProof[] storageProofs;
    }
    struct StorageProof {
        bytes32 key;
        bytes storageTrieWitness;
    }

    function getProofValue(L2StateProof memory proof) external view returns (bytes memory);
}
