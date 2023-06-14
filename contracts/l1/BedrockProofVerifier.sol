// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {IBedrockProofVerifier, IL2OutputOracle} from "./IBedrockProofVerifier.sol";

import {RLPReader} from "@eth-optimism/contracts-bedrock/contracts/libraries/rlp/RLPReader.sol";
import {Hashing} from "@eth-optimism/contracts-bedrock/contracts/libraries/Hashing.sol";
//import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";

contract BedrockProofVerifier is IBedrockProofVerifier {
    IL2OutputOracle public immutable l2OutputOracle;

    constructor(address _l2OutputOracle) {
        l2OutputOracle = IL2OutputOracle(_l2OutputOracle);
    }

    /**
     * Takes an BedrockStateProof and validates that the provided value is valied. If so the value is returned.
     * @param proof  BedrockStateProof
     * @return The value of all included slots concatinated
     */
    function getProofValue(BedrockStateProof memory proof) public view returns (bytes memory) {
        /**
         *Validate the provided output root is valid
         *see https://github.com/ethereum-optimism/optimism/blob/4611198bf8bfd16563cc6bdf49bb35eed2e46801/packages/contracts-bedrock/contracts/L1/OptimismPortal.sol#L261
         *
         */
        require(
            l2OutputOracle.getL2Output(proof.l2OutputIndex).outputRoot == Hashing.hashOutputRootProof(proof.outputRootProof),
            "Invalid output root"
        );

        bytes memory result = getMultipleStorageProofs(proof);
        return trimResult(result, proof.length);
    }

    /**
     * Returns the storage root of the account the proof is based on
     * @param proof The BedrockStateProof
     * @return The storage root of the account the proof is based on
     */
    function getStorageRoot(BedrockStateProof memory proof) private pure returns (bytes32) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(proof.target),
            proof.stateTrieWitness,
            proof.outputRootProof.stateRoot
        );
        require(exists, "Account it not part of the provided state root");
        RLPReader.RLPItem[] memory accountState = RLPReader.readList(encodedResolverAccount);
        return bytes32(RLPReader.readBytes(accountState[2]));
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

    function getMultipleStorageProofs(BedrockStateProof memory proof) private pure returns (bytes memory) {
        bytes memory result = new bytes(0);
        bytes32 storageRoot = getStorageRoot(proof);

        for (uint256 i = 0; i < proof.storageProofs.length; i++) {
            StorageProof memory storageProof = proof.storageProofs[i];
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
            abi.encodePacked(storageProof.key), //Slot
            storageProof.storageTrieWitness,
            storageRoot
        );
        //This means the storage slot is empty. So we can directly return 0x without RLP encoding it.
        if (!storageExists) {
            return retrievedValue;
        }
        return RLPReader.readBytes(retrievedValue);
    }
}
