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
    //TODO Remove constructor
    address l2Resolver;

    constructor(address _ovmAddressManager, address _l2resolver) Lib_AddressResolver(_ovmAddressManager) {
        l2Resolver = _l2resolver;
    }

    struct L2StateProof {
        address target;
        bytes32 stateRoot;
        Lib_OVMCodec.ChainBatchHeader stateRootBatchHeader;
        Lib_OVMCodec.ChainInclusionProof stateRootProof;
        bytes stateTrieWitness;
        StorageProof[] storageProofs;
        //Todo add length
    }
    struct StorageProof {
        bytes32 key;
        //Todo remove value
        bytes32 value;
        //Todo remove proof
        bytes[] proof;
        bytes storageTrieWitness;
    }

    function isValidProof(L2StateProof memory proof) public view returns (bytes memory) {
        console.log("start proof");
        require(isValidStateCommitment(proof), "Invalid state root");
        console.log("start acc");
        Lib_OVMCodec.EVMAccount memory account = getAccount(proof);
        console.log("got acc");

        bytes memory result = proofStorageProofs(account.storageRoot, proof.storageProofs);
        console.logBytes(result);
        console.log("exit");
    }

    function isValidStateCommitment(L2StateProof memory proof) private view returns (bool) {
        //StateCommitmentChain
        //https://etherscan.io/address/0xBe5dAb4A2e9cd0F27300dB4aB94BeE3A233AEB19
        address ovmStateCommitmentChainAddress = resolve("StateCommitmentChain");
        IStateCommitmentChain ovmStateCommitmentChain = IStateCommitmentChain(ovmStateCommitmentChainAddress);
        return
            ovmStateCommitmentChain.verifyStateCommitment(
                proof.stateRoot,
                proof.stateRootBatchHeader,
                proof.stateRootProof
            );
    }

    function getAccount(L2StateProof memory proof) public view returns (Lib_OVMCodec.EVMAccount memory) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(proof.target),
            proof.stateTrieWitness,
            proof.stateRoot
        );
        require(exists, "Account does not exist");
        return Lib_OVMCodec.decodeEVMAccount(encodedResolverAccount);
    }

    function proofStorageProofs(bytes32 storageRoot, StorageProof[] memory storageProofs)
        private
        view
        returns (bytes memory)
    {
        //TODO return result without trailing 0
        bytes memory result = abi.encodePacked("0x");

        for (uint256 i = 0; i < storageProofs.length; i++) {
            StorageProof memory storageProof = storageProofs[i];
            bytes memory slotValue = proofSingleSlot(storageRoot, storageProof);
            console.logBytes(slotValue);
            result = abi.encodePacked(result, slotValue);
        }
        return result;
    }

    function proofSingleSlot(bytes32 storageRoot, StorageProof memory storageProof)
        private
        view
        returns (bytes memory)
    {
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(storageProof.key),
            storageProof.storageTrieWitness,
            storageRoot
        );
        require(storageExists, "Storage value does not exist");
        return Lib_RLPReader.readBytes(retrievedValue);
    }
}
