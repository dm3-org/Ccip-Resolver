// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import {Lib_AddressResolver} from "@eth-optimism/contracts/libraries/resolver/Lib_AddressResolver.sol";
import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import {Lib_RLPReader} from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import {Lib_BytesUtils} from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";
import {IStateCommitmentChain} from "@eth-optimism/contracts/L1/rollup/IStateCommitmentChain.sol";
import {StateCommitmentChain} from "@eth-optimism/contracts/L1/rollup/StateCommitmentChain.sol";

import "hardhat/console.sol";

contract OptimisimProofVerifier is Lib_AddressResolver {
    constructor(address _ovmAddressManager) Lib_AddressResolver(_ovmAddressManager){}

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

    function getProofValue(L2StateProof memory proof) public view returns (bytes memory) {
        require(isValidStateCommitment(proof), "Invalid state root");

        bytes32 storageRoot = getStorageRoot(proof);
        bytes memory result = getMultipleStorageProofs(storageRoot, proof.storageProofs);
        return trimResult(result, proof.length);
    }

    function isValidStateCommitment(L2StateProof memory proof) private view returns (bool) {
        IStateCommitmentChain ovmStateCommitmentChain = IStateCommitmentChain(resolve("StateCommitmentChain"));
        return
            ovmStateCommitmentChain.verifyStateCommitment(
                proof.stateRoot,
                proof.stateRootBatchHeader,
                proof.stateRootProof
            );
    }

    //Todo rename to getStorageRoot
    function getStorageRoot(L2StateProof memory proof) private view returns (bytes32) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(proof.target),
            proof.stateTrieWitness,
            proof.stateRoot
        );
        require(exists, "Account it not part of the provided state root");
        return Lib_OVMCodec.decodeEVMAccount(encodedResolverAccount).storageRoot;
    }

    function trimResult(bytes memory result, uint256 length) private pure returns (bytes memory) {
        if (length == 0) {
            return result;
        }
        bytes memory trimed = new bytes((length / 2) - 1);

        for (uint256 i = 0; i < (length / 2) - 1; i++) {
            trimed[i] = (result[i]);
        }
        return trimed;
    }

    function getMultipleStorageProofs(bytes32 storageRoot, StorageProof[] memory storageProofs)
        private
        view
        returns (bytes memory)
    {
        bytes memory result = new bytes(0);

        for (uint256 i = 0; i < storageProofs.length; i++) {
            StorageProof memory storageProof = storageProofs[i];
            bytes memory slotValue = getSingleStorageProof(storageRoot, storageProof);
            //The first slot should not be included in the result

            if (storageProofs.length > 1 && i == 0) {
                continue;
            }

            result = abi.encodePacked(result, slotValue);
        }
        return result;
    }

    function getSingleStorageProof(bytes32 storageRoot, StorageProof memory storageProof)
        private
        view
        returns (bytes memory)
    {
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(storageProof.key),
            storageProof.storageTrieWitness,
            storageRoot
        );
        if (!storageExists) {
            return retrievedValue;
        }
        return Lib_RLPReader.readBytes(retrievedValue);
    }
}
