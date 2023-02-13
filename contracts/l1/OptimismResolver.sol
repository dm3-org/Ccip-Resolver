// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IExtendedResolver.sol";
import "./SupportsInterface.sol";
import "hardhat/console.sol";

import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import {Lib_AddressResolver} from "@eth-optimism/contracts/libraries/resolver/Lib_AddressResolver.sol";
import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import {Lib_RLPReader} from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import {Lib_BytesUtils} from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";
import {IStateCommitmentChain} from "@eth-optimism/contracts/L1/rollup/IStateCommitmentChain.sol";

/**
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */
contract OptimismResolver is IExtendedResolver, SupportsInterface, Lib_AddressResolver {
    address public owner;
    string public url;
    mapping(address => bool) public signers;

    event NewOwner(address newOwner);
    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);
    struct L2StateProof {
        bytes32 stateRoot;
        Lib_OVMCodec.ChainBatchHeader stateRootBatchHeader;
        Lib_OVMCodec.ChainInclusionProof stateRootProof;
        bytes stateTrieWitness;
        bytes storageTrieWitness;
    }

    constructor(
        string memory _url,
        address _owner,
        address _ovmAddressManager,
        address _l2resolver
    ) Lib_AddressResolver(_ovmAddressManager) {
        url = _url;
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    function setOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
        emit NewOwner(owner);
    }

    //This function only exists during develoopent. Will be removed before releasing prod
    function setUrl(string memory _url) external onlyOwner {
        url = _url;
    }

    /**
     * Resolves a name, as specified by ENSIP 10.
     * @param name The DNS-encoded name to resolve.
     * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
     * @return The return data, ABI encoded identically to the underlying function.
     */
    function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory) {
        bytes memory callData = abi.encodeWithSelector(IResolverService.resolve.selector, name, data);
        string[] memory urls = new string[](1);
        urls[0] = url;
        revert OffchainLookup(address(this), urls, callData, OptimismResolver.resolveWithProof.selector, callData);
    }

    function getResponse(string calldata node, L2StateProof calldata proof) public pure returns (bytes memory) {
        return abi.encode(node, proof);
    }

    /**
     * Callback used by CCIP read compatible clients to verify and parse the response.
     * extraData -> the original call data
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory result)
    {
        (bytes memory result, L2StateProof memory proof) = abi.decode(response, (bytes, L2StateProof));
        console.log(proof.stateRootBatchHeader.batchIndex);

        //Do stuff with proof
        // require(verifyStateRootProof(proof), "Invalid state root");

        // bytes32 slot = keccak256(abi.encodePacked(node, uint256(1)));
        //bytes32 value = getStorageValue(l2resolver, slot, proof);

        return result;
    }

    function verifyStateRootProof(L2StateProof memory proof) internal view returns (bool) {
        IStateCommitmentChain ovmStateCommitmentChain = IStateCommitmentChain(resolve("OVM_StateCommitmentChain"));
        return
            ovmStateCommitmentChain.verifyStateCommitment(
                proof.stateRoot,
                proof.stateRootBatchHeader,
                proof.stateRootProof
            );
    }

    function getStorageValue(
        address target,
        bytes32 slot,
        L2StateProof memory proof
    ) internal pure returns (bytes32) {
        (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(target),
            proof.stateTrieWitness,
            proof.stateRoot
        );
        require(exists, "Account does not exist");
        Lib_OVMCodec.EVMAccount memory account = Lib_OVMCodec.decodeEVMAccount(encodedResolverAccount);
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie.get(
            abi.encodePacked(slot),
            proof.storageTrieWitness,
            account.storageRoot
        );
        require(storageExists, "Storage value does not exist");
        return Lib_BytesUtils.toBytes32(Lib_RLPReader.readBytes(retrievedValue));
    }

    function supportsInterface(bytes4 interfaceID) public pure override returns (bool) {
        return interfaceID == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
