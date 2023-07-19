// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {IBedrockProofVerifier, IL2OutputOracle} from "./IBedrockProofVerifier.sol";

import {RLPReader} from "@eth-optimism/contracts-bedrock/contracts/libraries/rlp/RLPReader.sol";
import {Hashing} from "@eth-optimism/contracts-bedrock/contracts/libraries/Hashing.sol";

import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";

contract BedrockProofVerifier is IBedrockProofVerifier {
    IL2OutputOracle public immutable l2OutputOracle;

    constructor(address _l2OutputOracle) {
        l2OutputOracle = IL2OutputOracle(_l2OutputOracle);
    }

    /**
     * @notice Get the proof value for the provided BedrockStateProof
     * @dev This function validates the provided BedrockStateProo and returns the value of the slot or slots included in the proof.
     * @param proof The BedrockStateProof struct containing the necessary proof data
     * @return result The value of the slot or slots included in the proof
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

        /**
         * If the storage layout is fixed the result dosen't need to be trimmed
         */
        if (proof.layout == 0) {
            return result;
        }
        return trimResult(result, proof.length);
    }

    /**
     * @notice Get the storage root for the provided BedrockStateProof
     * @dev This private function retrieves the storage root based on the provided BedrockStateProof.
     * @param proof The BedrockStateProof struct containing the necessary proof data
     * @return The storage root retrieved from the provided state root
     *
     */
    function getStorageRoot(BedrockStateProof memory proof) private pure returns (bytes32) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(proof.target),
            proof.stateTrieWitness,
            proof.outputRootProof.stateRoot
        );
        /**
         * The account stotage root has to be  part of the provided state root
         * It might take some time for the state root to be posted on L1 after the transaction is included in a block
         * Until then the account might not be part of the state root
         */
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

    /**
     * @notice Get multiple storage proofs for the provided BedrockStateProof
     * @dev Dynamic Types like bytes,strings or array are spread over multiple storage slots. This proofs every storage slot the dynamic type contains and returns the concatenated result
     * @param proof The BedrockStateProof struct containing the necessary proof data
     * @return result The concatenated storage proofs for the provided BedrockStateProof
     */
    function getMultipleStorageProofs(BedrockStateProof memory proof) private pure returns (bytes memory) {
        bytes memory result = new bytes(0);
        /**
         * The storage root of the account
         */
        bytes32 storageRoot = getStorageRoot(proof);

        /**
         * For each sub storage proof we are proofing that that slot is include in the account root of the account
         */
        for (uint256 i = 0; i < proof.storageProofs.length; i++) {
            bytes memory slotValue = getSingleStorageProof(storageRoot, proof.storageProofs[i]);
            /**
             * attach the current slot to the result
             */
            result = BytesLib.concat(result, slotValue);
        }
        return result;
    }

    /**
     * @notice Proofs weather the provided storage slot is part of the storageRoot
     * @param storageRoot The storage root for the account that contains the storage slot
     * @param storageProof The StorageProof struct containing the necessary proof data
     * @return The retrieved storage proof value or 0x if the storage slot is empty
     */
    function getSingleStorageProof(bytes32 storageRoot, StorageProof memory storageProof) private pure returns (bytes memory) {
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(storageProof.key),
            storageProof.storageTrieWitness,
            storageRoot
        );
        /**
         * This means the storage slot is empty. So we can directly return 0x without RLP encoding it.
         */
        if (!storageExists) {
            return retrievedValue;
        }
        return RLPReader.readBytes(retrievedValue);
    }
}
