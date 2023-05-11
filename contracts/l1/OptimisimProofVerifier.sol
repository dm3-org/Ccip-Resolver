// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import {Lib_AddressResolver} from "@eth-optimism/contracts/libraries/resolver/Lib_AddressResolver.sol";
import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import {Lib_RLPReader} from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import {Lib_BytesUtils} from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";
import {IStateCommitmentChain} from "@eth-optimism/contracts/L1/rollup/IStateCommitmentChain.sol";
import {StateCommitmentChain} from "@eth-optimism/contracts/L1/rollup/StateCommitmentChain.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";
import {IOptimismProofVerifier} from "./IOptimismProofVerifier.sol";

contract OptimisimProofVerifier is IOptimismProofVerifier, Lib_AddressResolver {
    constructor(address _ovmAddressManager) Lib_AddressResolver(_ovmAddressManager) {}

    /**
     * Takes an L2StateProof and validates that the provided value is valied. If so the value is returned.
     * @param proof  L2StateProof
     * @return The value of all included slots concatinated
     */
    function getProofValue(L2StateProof memory proof) public view returns (bytes memory) {
        require(isValidStateCommitment(proof), "Invalid state root");

        bytes32 storageRoot = getStorageRoot(proof);
        bytes memory result = getMultipleStorageProofs(storageRoot, proof.storageProofs);
        return trimResult(result, proof.length);
    }

    /**
     * Verify if the provided stateRoot was commited to the StateCommitmentChain.
     * @param proof The L2 state proof
     * @return True if the state commitment is valid, otherwise false
     */
    function isValidStateCommitment(L2StateProof memory proof) private view returns (bool) {
        IStateCommitmentChain ovmStateCommitmentChain = IStateCommitmentChain(resolve("StateCommitmentChain"));
        return ovmStateCommitmentChain.verifyStateCommitment(proof.stateRoot, proof.stateRootBatchHeader, proof.stateRootProof);
    }

    /**
     * Returns the storage root of the account the proof is based on
     * @param proof The L2StateProof
     * @return The storage root of the account the proof is based on
     */
    function getStorageRoot(L2StateProof memory proof) private pure returns (bytes32) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(proof.target),
            proof.stateTrieWitness,
            proof.stateRoot
        );
        require(exists, "Account it not part of the provided state root");
        return Lib_OVMCodec.decodeEVMAccount(encodedResolverAccount).storageRoot;
    }

    /**
     * The slot values are padded with 0 so that they are 32 bytes long. This padding has to be returned so the returned value is the same length as the original value
     * @param result The concatinated result of all storage slots
     * @param length The length of the original value
     */
    function trimResult(bytes memory result, uint256 length) private pure returns (bytes memory) {
        if (length == 0) {
            return result;
        }
        return BytesLib.slice(result, 0, length);
    }

    /**
     * Iterates over all storage proofs and returns the concatinated result
     * @param storageRoot The storage root of the storage trie
     * @param storageProofs The storage proofs for each single storage slot
     */
    function getMultipleStorageProofs(bytes32 storageRoot, StorageProof[] memory storageProofs) private pure returns (bytes memory) {
        bytes memory result = new bytes(0);

        for (uint256 i = 0; i < storageProofs.length; i++) {
            StorageProof memory storageProof = storageProofs[i];
            bytes memory slotValue = getSingleStorageProof(storageRoot, storageProof);
            result = BytesLib.concat(result, slotValue);
        }
        return result;
    }

    /**
     * This function returns the value of a storage key in a given storage trie.
     * @param storageRoot The storage root of the storage trie
     * @param storageProof The storage proof of the storage key
     * @return  value of the storage slot
     */
    function getSingleStorageProof(bytes32 storageRoot, StorageProof memory storageProof) private pure returns (bytes memory) {
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(storageProof.key),
            storageProof.storageTrieWitness,
            storageRoot
        );
        //This means the storage slot is empty. So we can directly return 0x without RLP encoding it.
        if (!storageExists) {
            return retrievedValue;
        }
        return Lib_RLPReader.readBytes(retrievedValue);
    }
}
