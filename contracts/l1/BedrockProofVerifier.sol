// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import {Lib_AddressResolver} from "@eth-optimism/contracts/libraries/resolver/Lib_AddressResolver.sol";
import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import {Lib_RLPReader} from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import {Lib_BytesUtils} from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";
import {Hashing} from "@eth-optimism/contracts-bedrock/contracts/libraries/Hashing.sol";
import {IBedrockProofVerifier} from "./IBedrockProofVerifier.sol";
import {L2OutputOracle} from "@eth-optimism/contracts-bedrock/contracts/L1/L2OutputOracle.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";
import "hardhat/console.sol";

contract BedrockProofVerifier is IBedrockProofVerifier {
    L2OutputOracle public immutable l2Oracle;

    constructor(address _l2Oracle) {
        l2Oracle = L2OutputOracle(_l2Oracle);
    }

    /**
     * Takes an L2StateProof and validates that the provided value is valied. If so the value is returned.
     * @param proof  L2StateProof
     * @return The value of all included slots concatinated
     */
    function getProofValue(BedrockStateProof memory proof) public view returns (bytes memory) {
        console.log("start get Proof Value");
        require(
            l2Oracle.getL2Output(proof.l2OutputIndex).outputRoot == Hashing.hashOutputRootProof(proof.outputRootProof),
            "Invalid output root"
        );

        bytes memory result = getMultipleStorageProofs(proof);
        return trimResult(result, proof.length);
    }

    /**
     * Returns the storage root of the account the proof is based on
     * @param proof The L2StateProof
     * @return The storage root of the account the proof is based on
     */
    function getStorageRoot(BedrockStateProof memory proof) private pure returns (bytes32) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(proof.target),
            proof.stateTrieWitness,
            proof.outputRootProof.stateRoot
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

    function getMultipleStorageProofs(BedrockStateProof memory proof) private pure returns (bytes memory) {
        bytes32 storageRoot = getStorageRoot(proof);
        bytes memory result = new bytes(0);

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
        return Lib_RLPReader.readBytes(retrievedValue);
    }
}
