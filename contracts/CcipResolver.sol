// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IExtendedResolver, IResolverService} from "./IExtendedResolver.sol";
import {IMetadataResolver} from "./IMetadataResolver.sol";
import {SupportsInterface} from "./SupportsInterface.sol";
import {CcipResponseVerifier, ICcipResponseVerifier} from "./verifier/CcipResponseVerifier.sol";
import {ENSRegistry} from "@ensdomains/ens-contracts/contracts/registry/ENSRegistry.sol";
import {INameWrapper} from "@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol";
import {BytesUtils} from "@ensdomains/ens-contracts/contracts/wrapper/BytesUtils.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";

/*
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */
contract CcipResolver is IExtendedResolver, IMetadataResolver, SupportsInterface {
    using BytesUtils for bytes;

    struct CcipVerifier {
        string[] gatewayUrls;
        ICcipResponseVerifier verifierAddress;
    }

    /*
     *   --------------------------------------------------
     *    EVENTS
     *   --------------------------------------------------
     */

    event VerifierAdded(bytes32 indexed node, address verifierAddress, string[] gatewayUrls);
    /*
     *   --------------------------------------------------
     *    Errors
     *   --------------------------------------------------
     */

    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);
    error UnknownVerifier();

    /*
     *   --------------------------------------------------
     *    State Variables
     *   --------------------------------------------------
     */

    ENSRegistry public immutable ensRegistry;
    INameWrapper public immutable nameWrapper;

    mapping(bytes32 => CcipVerifier) public ccipVerifier;

    /*
     *   --------------------------------------------------
     *    Constructor
     *   --------------------------------------------------
     */

    constructor(
        // The ENS registry
        ENSRegistry _ensRegistry,
        // The name wrapper
        INameWrapper _nameWrapper
    ) {
        ensRegistry = _ensRegistry;
        nameWrapper = _nameWrapper;
    }

    /*
     *   --------------------------------------------------
     *    External functions
     *   --------------------------------------------------
     */

    /**
     * @notice Sets a Cross-chain Information Protocol (CCIP) Verifier for a specific domain node.
     * @param node The domain node for which the CCIP Verifier is set.
     * @param verifierAddress The address of the CcipResponseVerifier contract.
     * @param urls The gateway url that should handle the OffchainLookup.
     */
    function setVerifierForDomain(bytes32 node, address verifierAddress, string[] memory urls) external {
        require(node != bytes32(0), "node is 0x0");
        require(verifierAddress != address(0), "verifierAddress is 0x0");

        /*
         * Only the node owner can set the verifier for a node. NameWrapper profiles are supported too.
         */
        require(msg.sender == getNodeOwner(node), "only node owner");
        /*
         * We're doing a staticcall here to check if the verifierAddress implements the ICcipResponseVerifier interface.
         * This is done to prevent the user from setting an arbitrary address as the verifierAddress.
         */
        (bool success, bytes memory response) = verifierAddress.staticcall(
            abi.encodeWithSignature("supportsInterface(bytes4)", type(ICcipResponseVerifier).interfaceId)
        );

        /*
         * A successful static call will return 0x0000000000000000000000000000000000000000000000000000000000000001
         * Hence we've to check that the last bit is set.
         */
        require(
            success && response.length == 32 && (response[response.length - 1] & 0x01) == 0x01,
            "verifierAddress is not a CCIP Verifier"
        );
        /*
         * Check that the url is non-null.
         * Although it may not be a sufficient url check, it prevents users from passing undefined or empty strings.
         */
        require(urls.length > 0, "at least one gateway url has to be provided");

        /*
         * Set the new verifier for the given node.
         */
        CcipVerifier memory _ccipVerifier = CcipVerifier(urls, ICcipResponseVerifier(verifierAddress));
        ccipVerifier[node] = _ccipVerifier;

        emit VerifierAdded(node, verifierAddress, urls);
    }

    /**
     * Resolves arbitrary data for a particular name, as specified by ENSIP 10.
     * @param name The DNS-encoded name to resolve.
     * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
     * @return The return data, ABI encoded identically to the underlying function.
     */
    function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory) {
        /*
         * Get the verifier for the given name.
         * reverts if no verifier was set in advance
         */
        (CcipVerifier memory _verifier, bytes32 node) = getVerifierOfDomain(name);
        /*
         * Retrieves the owner of the node. NameWrapper profiles are supported too. This will be the context of the request.
         */
        address nodeOwner = getNodeOwner(node);
        bytes memory context = abi.encodePacked(nodeOwner);
        /*
         * The calldata the gateway has to resolve
         */
        bytes memory callData = abi.encodeWithSelector(
            IResolverService.resolveWithContext.selector,
            name,
            data,
            context
        );

        revert OffchainLookup(
            address(this),
            _verifier.gatewayUrls,
            callData,
            CcipResolver.resolveWithProof.selector,
            callData
        );
    }

    /**
     * @dev Function to resolve a domain name with proof using an off-chain callback mechanism.
     * @param response The response received from off-chain resolution.
     * @param extraData The actual calldata that was called on the gateway.
     * @return the result of the offchain lookup
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory) {
        /*
         * decode the calldata that was encoded in the resolve function for IResolverService.resolveWithContext()
         * bytes memory callData = abi.encodeWithSelector(IResolverService.resolveWithContext.selector, name, data context);
         */
        (bytes memory name, bytes memory data) = abi.decode(extraData[4:], (bytes, bytes));
        /*
         * Get the verifier for the given name.
         * reverts if no verifier was set in advance
         */
        (CcipVerifier memory _ccipVerifier, ) = getVerifierOfDomain(name);
        /*
         * to enable the CcipResolver to return data other than bytes it might be possible to override the
         * resolvewithProofCallback function.
         */
        bytes4 callBackSelector = ICcipResponseVerifier(_ccipVerifier.verifierAddress).onResolveWithProof(name, data);
        /*
         * reverts when no callback selector was found. This should normally never happen because setVerifier() checks * that the verifierAddress implements the ICcipResponseVerifier interface. However, it might be possible by
         * overriding the onResolveWithProof function and return 0x. In that case, the contract reverts here.
         */
        require(callBackSelector != bytes4(0), "No callback selector found");

        /*
         * staticcall to the callback function on the verifier contract.
         * This function always returns bytes even the called function returns a Fixed type due to the return type of staticcall in solidity.
         * So you might want to decode the result using abi.decode(resolveWithProofResponse, (bytes))
         */
        (bool success, bytes memory resolveWithProofResponse) = address(_ccipVerifier.verifierAddress).staticcall(
            abi.encodeWithSelector(callBackSelector, response, extraData)
        );
        /*
         * Reverts if the call is not successful
         */
        require(success, "staticcall to verifier failed");
        return resolveWithProofResponse;
    }

    /**
     * @notice Get metadata about the CCIP Resolver
     * @dev This function provides metadata about the CCIP Resolver, including its name, coin type, GraphQL URL, storage type, and encoded information.
     * @param name The domain name in format (dnsEncoded)
     * @return name The name of the resolver ("CCIP RESOLVER")
     * @return coinType Resolvers coin type (60 for Ethereum)
     * @return graphqlUrl The GraphQL URL used by the resolver
     * @return storageType Storage Type (0 for EVM)
     * @return storageLocation The storage identifier. For EVM chains, this is the address of the resolver contract.
     * @return context can be l2 resolver contract address for evm chain but can be any l2 storage identifier for non-evm chain
     */
    function metadata(
        bytes calldata name
    ) external view returns (string memory, uint256, string memory, uint8, bytes memory, bytes memory) {
        /*
         * Get the verifier for the given name.
         * reverts if no verifier was set in advance
         */
        (CcipVerifier memory _ccipVerifier, ) = getVerifierOfDomain(name);

        /*
         * Get the metadata from the verifier contract
         */
        (
            string memory resolverName,
            uint256 coinType,
            string memory graphqlUrl,
            uint8 storageType,
            bytes memory storageLocation,

        ) = ICcipResponseVerifier(_ccipVerifier.verifierAddress).metadata(name);

        /*
         * To determine the context of the request, we need to get the owner of the node.
         */
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(getNodeOwner(node));

        return (resolverName, coinType, graphqlUrl, storageType, storageLocation, context);
    }

    /*
     *   --------------------------------------------------
     *    Public Functions
     *   --------------------------------------------------
     */

    /**
     * @notice Get the CCIP Verifier and node for a given domain name
     * @dev This function allows retrieving the CCIP Verifier and its associated node for a given domain name. For subdomains, it will return the CCIP Verifier of the closest parent.
     * @param name The domain name in bytes (dnsEncoded)
     * @return _ccipVerifier The CCIP Verifier associated with the given domain name
     * @return node The node associated with the given domain name
     */
    function getVerifierOfDomain(bytes memory name) public view returns (CcipVerifier memory, bytes32) {
        return getVerifierOfSegment(name, 0, name.namehash(0));
    }

    /**
     * @notice Check if the contract supports a specific interface
     * @dev Implements the ERC-165 standard to check for interface support.
     * @param interfaceID The interface identifier to check
     * @return True if the contract supports the given interface, otherwise false
     */
    function supportsInterface(bytes4 interfaceID) public pure override returns (bool) {
        return interfaceID == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceID);
    }

    /*
     *   --------------------------------------------------
     *    Internal Functions
     *   --------------------------------------------------
     */

    /**
     * @notice Get the owner of the ENS node either from the ENS registry or the NameWrapper contract
     * @dev This function adds support for ENS nodes owned by the NameWrapper contract.
     * @param node The ENS node to query for the owner
     * @return nodeOwner The address of the owner of the ENS node
     */
    function getNodeOwner(bytes32 node) internal view returns (address nodeOwner) {
        nodeOwner = ensRegistry.owner(node);
        if (nodeOwner == address(nameWrapper)) {
            nodeOwner = nameWrapper.ownerOf(uint256(node));
        }
    }

    /*
     * --------------------------------------------------
     *    Private Functions
     * --------------------------------------------------
     *
     */
    /**
     * @dev Recursively searches for a verifier associated with a segment of the given domain name.
     * If a verifier is found, it returns the verifier and the corresponding node.
     *
     * @param name The domain name in bytes
     * @param offset The current offset in the name being processed
     * @param node The current node being processed
     * @return The CcipVerifier associated with the domain segment, and the corresponding node
     *
     * @notice This function searches for a verifier starting from the given offset in the domain name.
     *         It checks if a verifier is set for the current node, and if not, it continues with the next label.
     *         If the end of the name is reached and no verifier is found, it reverts with an UnknownVerifier error.
     */
    function getVerifierOfSegment(
        bytes memory name,
        uint256 offset,
        bytes32 node
    ) private view returns (CcipVerifier memory, bytes32) {
        /*
         * If we reached the root node and there is no verifier set, we revert with UnknownVerifier
         */
        if (offset >= name.length - 1) {
            revert UnknownVerifier();
        }

        CcipVerifier memory _ccipVerifier = ccipVerifier[node];
        /*
         * If the verifier is set for the given node, we return it and break the recursion
         */
        if (address(_ccipVerifier.verifierAddress) != address(0)) {
            return (_ccipVerifier, node);
        }
        /*
         * Otherwise, continue with the next label
         */
        (, offset) = name.readLabel(offset);
        return getVerifierOfSegment(name, offset, name.namehash(offset));
    }
}
