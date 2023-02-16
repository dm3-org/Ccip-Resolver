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
    }
    struct StorageProof {
        bytes32 key;
        bytes32 value;
        bytes[] proof;
        string storageTrieWitness;
    }

    function isValidProof(L2StateProof memory proof) public view returns (bytes memory) {
        console.log("start proof");
        require(verifyStateRootProof(proof), "Invalid state root");
        console.log("start acc");
        Lib_OVMCodec.EVMAccount memory account = getAccount(proof);
        console.log("got acc");
        console.logBytes32(account.codeHash);
    }

    function verifyStateRootProof(L2StateProof memory proof) private view returns (bool) {
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

    function getStorageValue(
        address target,
        bytes32 slot,
        L2StateProof memory proof
    ) private view returns (bytes memory) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(target),
            proof.stateTrieWitness,
            proof.stateRoot
        );
        require(exists, "Account does not exist");
        /*
        Lib_OVMCodec.EVMAccount memory account = Lib_OVMCodec.decodeEVMAccount(encodedResolverAccount);
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(slot),
            proof.storageTrieWitness,
            account.storageRoot
        );
        require(storageExists, "Storage value does not exist");
        return Lib_RLPReader.readBytes(retrievedValue); */
    }
}
