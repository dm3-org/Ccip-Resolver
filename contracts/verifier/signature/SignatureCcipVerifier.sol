// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {CcipResponseVerifier} from "../CcipResponseVerifier.sol";
import {SignatureVerifier} from "./SignatureVerifier.sol";
import {convertEVMChainIdToCoinType} from "../../coinType/Ensip11CoinType.sol";

contract SignatureCcipVerifier is CcipResponseVerifier {
    address public immutable resolver;

    mapping(address => bool) public signers;

    event NewOwner(address newOwner);
    event NewSigners(address[] signers);
    event SignerRemoved(address removedSigner);

    constructor(
        address _owner,
        string memory _graphQlUrl,
        string memory _resolverName,
        uint256 _l2ResolverChainID,
        address _resolver,
        address[] memory _signers
    ) CcipResponseVerifier(_owner, _graphQlUrl, _resolverName, _l2ResolverChainID) {
        resolver = _resolver;

        for (uint256 i = 0; i < _signers.length; i++) {
            signers[_signers[i]] = true;
        }
        emit NewSigners(_signers);
    }

    /**
     * @notice Add new signers
     * @dev This function can only be called by the current contract owner. It adds the provided addresses as new signers.
     * @param _signers An array of addresses representing the new signers to be added
     */
    function addSigners(address[] memory _signers) external onlyOwner {
        for (uint256 i = 0; i < _signers.length; i++) {
            signers[_signers[i]] = true;
        }
        emit NewSigners(_signers);
    }

    /**
     * @notice Remove signers
     * @dev This function can only be called by the current contract owner. It removes the provided addresses from the list of authorized signers.
     * @param _signers An array of addresses representing the signers to be removed
     */
    function removeSigners(address[] memory _signers) external onlyOwner {
        for (uint256 i = 0; i < _signers.length; i++) {
            /*
             * Without this if check, it's possible to add a signer to the SignerRemoved Event
             * that never was a signer in the first place.
             * This may cause failures at indexing services that are trying to delete a non-existing signer...
             */
            if (signers[_signers[i]]) {
                signers[_signers[i]] = false;
                emit SignerRemoved(_signers[i]);
            }
        }
    }

    /**
     * @notice Resolve with Proof
     * @dev This function is used to resolve a response with a proof using the SignatureVerifier.
     * @param response The response data returned from the SignatureVerifier
     * @param extraData Additional data needed for verification
     * @return The decoded response data
     * Note: It's essential to handle access control mechanisms properly to ensure that only authorized signers can resolve responses with proofs.
     */
    function resolveWithProof(
        bytes calldata response,
        bytes calldata extraData
    ) external view override returns (bytes memory) {
        (address signer, bytes memory result) = SignatureVerifier.verify(resolver, extraData, response);
        require(signers[signer], "SignatureVerifier: Invalid signature");
        /**
         * @dev Because this function is meant to be called via staticcall, we need to decode the response data before returning it.
         */
        bytes memory decodedResponse = abi.decode(result, (bytes));
        return decodedResponse;
    }

    /**
     * @param response The response bytes received from the AddrResolver.
     * @return The Ethereum address resolved from the response bytes.
     * @dev The AddrResolver stores addresses as bytes instead of Ethereum addresses.
     * This is done to support other blockchain addresses, not just EVM addresses.
     * However, the return type of `addr(bytes32)` is `address`,
     * which means the client library expects an Ethereum address to be returned.
     * To meet this expectation, we convert the bytes into an Ethereum address and return it.
     */
    function resolveWithAddress(bytes calldata response, bytes calldata extraData) public view returns (address) {
        (address signer, bytes memory result) = SignatureVerifier.verify(resolver, extraData, response);
        require(signers[signer], "SignatureVerifier: Invalid signature");

        /**
         * The AddrResolver stores addresses as bytes instead of Ethereum addresses.
         * This is to support other blockchain addresses and not just EVM addresses.
         * However, the return type of `addr(bytes32)` is `address`,
         * so the client library expects an Ethereum address to be returned.
         * For that reason, we have to convert the bytes into an address.
         */
        return address(bytes20(result));
    }

    /**
     * @dev Can be called to determine what function to use to handle resolveWithProof. Returns the selector that then can be called via staticcall
     * @return The four-byte function selector of the corresponding resolution function..
     */
    function onResolveWithProof(bytes calldata, bytes calldata data) public pure override returns (bytes4) {
        /**
         * if the function addr(bytes32) is called, return the selector of resolveWithAddress.
         */
        if (bytes4(data) == 0x3b3b57de) {
            return this.resolveWithAddress.selector;
        }
        /**
         * any other selector will be handled by the default resolveWithProof function.
         */
        return this.resolveWithProof.selector;
    }

    /**
     * @notice Get metadata about the CCIP Resolver
     * @dev This function provides metadata about the CCIP Resolver, including its name, coin type, GraphQL URL, storage type, and encoded information.
     * @return name The name of the resolver ("CCIP RESOLVER")
     * @return coinType Resolvers coin type (60 for Ethereum)
     * @return graphqlUrl The GraphQL URL used by the resolver
     * @return storageType Storage Type (0 for EVM)
     * @return storageLocation The storage identifier. For EVM chains, this is the address of the resolver contract.
     * @return context The owner of the name. Always returns address(0) since the owner is determined by the erc3668Resolver contract.
     */
    function metadata(
        bytes calldata
    ) external view override returns (string memory, uint256, string memory, uint8, bytes memory, bytes memory) {
        return (
            resolverName, // The name of the resolver
            convertEVMChainIdToCoinType(60), // Resolvers coin type => Ethereum
            this.graphqlUrl(), // The GraphQL Url
            uint8(1), // Storage Type 0 => Offchain Database
            "Postgres", // Storage Location => Resolver Address
            abi.encodePacked(address(0)) // Context => Owner Address
        );
    }
}
