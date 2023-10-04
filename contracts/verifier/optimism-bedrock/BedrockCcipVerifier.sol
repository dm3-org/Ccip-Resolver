// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {CcipResponseVerifier} from "../CcipResponseVerifier.sol";
import {IBedrockProofVerifier} from "./IBedrockProofVerifier.sol";
import {convertEVMChainIdToCoinType} from "../../coinType/Ensip11CoinType.sol";

abstract contract BedrockCcipVerifier is CcipResponseVerifier {
    IBedrockProofVerifier public immutable bedrockProofVerifier;

    constructor(
        address _owner,
        string memory _graphQlUrl,
        string memory _resolverName,
        uint256 _l2ResolverChainID,
        IBedrockProofVerifier _bedrockProofVerifier
    ) CcipResponseVerifier(_owner, _graphQlUrl, _resolverName, _l2ResolverChainID) {
        bedrockProofVerifier = _bedrockProofVerifier;
    }

    /**
     * @notice Resolve a response with a proof
     * @dev This function allows resolving a response along with a proof provided by IBedrockProofVerifier.
     * @param response The response data along with the associated proof
     * @param extraData The original data passed to the request
     * @return The resolved response data encoded as bytes
     */
    function resolveWithProof(
        bytes calldata response,
        bytes calldata extraData,
        bytes calldata verifierData
    ) public view virtual returns (bytes memory) {
        /*
         * @dev Decode the response and proof from the response bytes
         */
        (bytes memory responseEncoded, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(
            response,
            (bytes, IBedrockProofVerifier.BedrockStateProof)
        );
        /*
         * Revert if the proof target does not match the resolver. This is to prevent a malicious resolver from using a * proof intended for another address.
         */
        // address targetAddress = abi.decode(verifierData, (address));
        bytes memory vd = verifierData;
        address targetAddress;
        assembly {
            targetAddress := mload(add(vd, 0x14))
        }

        require(proof.target == targetAddress, "proof target does not match resolver");
        /*
         * bedrockProofVerifier.getProofValue(proof) always returns the packed result.
         * However, libraries like ethers.js expect the result to be encoded in bytes.
         * Hence, the gateway needs to encode the result before returning it to the client.
         * To ensure responseEncoded matches the value returned by bedrockProofVerifier.getProofValue(proof),
         * we need to check the layout of the proof and encode the result accordingly, so we can compare the two values * using the keccak256 hash.
         */

        require(
            proof.layout == 0
                ? keccak256(bedrockProofVerifier.getProofValue(proof)) == keccak256(responseEncoded)
                : keccak256(abi.encode(bedrockProofVerifier.getProofValue(proof))) == keccak256(responseEncoded),
            "proof does not match response"
        );

        return responseEncoded;
    }

    /**
     * @notice Get metadata about the CCIP Resolver
     * @dev This function provides metadata about the CCIP Resolver, including its name, coin type, GraphQL URL, storage type, and encoded information.
     * @return name The name of the resolver ("CCIP RESOLVER")
     * @return coinType Resolvers coin type (60 for Ethereum)
     * @return graphqlUrl The GraphQL URL used by the resolver
     * @return storageType Storage Type (0 for EVM)
     * @return storageLocation The storage identifier. For EVM chains, this is the address of the resolver contract.
     * @return context the owner of the name. Always returns address(0) since the owner is determined by the erc3668Resolver contract.
     */
    function metadata(
        bytes calldata
    ) external view override returns (string memory, uint256, string memory, uint8, bytes memory, bytes memory) {
        return (
            resolverName, // the name of the resolver
            convertEVMChainIdToCoinType(l2ResolverChainID), // coinType according to ENSIP-11 for chain id 420
            this.graphqlUrl(), // the GraphQL Url
            uint8(0), // storage Type 0 => EVM
            abi.encodePacked(address(0)), // storage location => resolver address
            abi.encodePacked(address(0))  // context => Kept for compatibility
        );
    }
}
