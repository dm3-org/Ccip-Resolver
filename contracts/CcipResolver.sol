// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IExtendedResolver, IResolverService} from "./IExtendedResolver.sol";
import {IContextResolver} from "./IContextResolver.sol";
import {SupportsInterface} from "./SupportsInterface.sol";
import {CcipResponseVerifier, ICcipResponseVerifier} from "./verifier/CcipResponseVerifier.sol";
import {ENSRegistry} from "@ensdomains/ens-contracts/contracts/registry/ENSRegistry.sol";
import {INameWrapper} from "@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol";
import {BytesUtils} from "@ensdomains/ens-contracts/contracts/wrapper/BytesUtils.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";

/**
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */
contract CcipResolver is IExtendedResolver, IContextResolver, SupportsInterface {
    using BytesUtils for bytes;

    struct CcipVerifier {
        string[] gatewayUrls;
        ICcipResponseVerifier verifierAddress;
    }

    /**
     *   --------------------------------------------------
     *    EVENTS
     *   --------------------------------------------------
     */

    event GraphQlUrlChanged(string newGraphQlUrl);
    event OwnerChanged(address newOwner);
    event VerifierAdded(bytes32 indexed node, address verifierAddress, string[] gatewayUrls);
    /**
     *   --------------------------------------------------
     *    Errors
     *   --------------------------------------------------
     */

    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);
    error UnknownVerfier();

    /**
     *   --------------------------------------------------
     *    State Variables
     *   --------------------------------------------------
     */

    ENSRegistry public immutable ensRegistry;
    INameWrapper public immutable nameWrapper;

    address public owner;
    string public graphqlUrl;

    mapping(bytes32 => CcipVerifier) public ccipVerifier;

    /**
     *   --------------------------------------------------
     *    Constructor
     *   --------------------------------------------------
     */

    constructor(
        //The owner of the resolver
        address _owner,
        //The ENS registry
        ENSRegistry _ensRegistry,
        //The name wrapper
        INameWrapper _nameWrapper,
        //The graphQl Url
        string memory _graphqlUrl
    ) {
        owner = _owner;
        ensRegistry = _ensRegistry;
        nameWrapper = _nameWrapper;
        graphqlUrl = _graphqlUrl;
    }

    /**
     *   --------------------------------------------------
     *    Modifier
     *   --------------------------------------------------
     */

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    /**
     *   --------------------------------------------------
     *    External Functions
     *   --------------------------------------------------
     */

    /**
     * @notice Set the GraphQL endpoint URL for the contract
     * @dev This function can only be called by the current owner.
     * @param _graphqlUrl The new GraphQL endpoint URL to be set
     */
    function setGraphUrl(string memory _graphqlUrl) external onlyOwner {
        graphqlUrl = _graphqlUrl;
        emit GraphQlUrlChanged(_graphqlUrl);
    }

    /**
     * @notice Set the new owner of the contract
     * @dev This function can only be called by the current owner.
     * @param _owner The address of the new owner
     */
    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
        emit OwnerChanged(_owner);
    }

    /**
     * @notice Sets a Cross-chain Information Protocol (CCIP) Verifier for a specific domain node.
     * @param node The domain node for which the CCIP Verifier is set.
     * @param verifierAddress The address of the CcipResponseVerifier contract.
     * @param urls The gateway url that should handle the OffchainLookup.
     * Requirements:
     *   - The provided node must not be the zero address (0x0).
     *   - The provided verifierAddress must not be the zero address (0x0).
     *   - The caller of this function must be the owner of the given node.
     *   - The verifierAddress must implement the ICcipResponseVerifier interface.
     *   - The URL must not be empty.
     */
    function setVerifierForDomain(bytes32 node, address verifierAddress, string[] memory urls) external {
        require(node != bytes32(0), "node is 0x0");
        require(verifierAddress != address(0), "verifierAddress is 0x0");

        /**
         *Only the node owner can set the verifier for a node. NameWrapper profiles are supported too.
         */
        require(msg.sender == getNodeOwner(node), "only node owner");
        /**
         * We're doing a staticcall here to check if the verifierAddress implements the ICcipResponseVerifier interface.
         * This is done to prevent the user from setting an arbitrary address as the verifierAddress.
         */
        (bool success, bytes memory response) = verifierAddress.staticcall(
            abi.encodeWithSignature("supportsInterface(bytes4)", type(ICcipResponseVerifier).interfaceId)
        );

        /**
         * A successfull static call wil return 0x0000000000000000000000000000000000000000000000000000000000000001
         * Hence we've to check that the last bit is set.
         */
        require(
            success && response.length == 32 && (response[response.length - 1] & 0x01) == 0x01,
            "verifierAddress is not a CCIP Verifier"
        );
        /**
         * Check that the url is non null.
         * Although it may not be a sufficient url check it prevents users from passing undefined or empty strings.
         * @dev Maybe we should add a more sofisticated url check. Maybe not ??
         */
        require(urls.length > 0, "at least one gateway url has to be provided");

        /**
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
        /**
         * Get the verifier for the given name.
         * reverts if no verifier was set in advance
         */
        (CcipVerifier memory _verifier, bytes32 node) = getVerifierOfDomain(name);
        /**
         * Retrives the owner of the node. NameWrapper profiles are supported too. This will be the context of the request.
         */
        address nodeOwner = getNodeOwner(node);
        bytes memory context = abi.encodePacked(nodeOwner);
        /**
         * The calldata the gateway has to resolve
         */
        bytes memory callData = abi.encodeWithSelector(IResolverService.resolveWithContext.selector, name, data, context);
        /**
         * The gateway url that should handle the OffchainLookup.
         * @dev At the moement we just support a single URL. Maybe we should support multiple URLs in the future. Before entering the audit
         */

        revert OffchainLookup(address(this), _verifier.gatewayUrls, callData, CcipResolver.resolveWithProof.selector, callData);
    }

    /**
     * @dev Function to resolve a domain name with proof using an off-chain callback mechanism.
     * @param response The response received from off-chain resolution.
     * @param extraData The actual calldata that was called on the gateway.
     * @return the result of the offchain lookup
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory) {
        /**
         * decode the calldata that was encdoed in the the resolve function for IResolverService.resolveWithContext()
         * bytes memory callData = abi.encodeWithSelector(IResolverService.resolveWithContext.selector, name, data context);
         */
        (bytes memory name, bytes memory data) = abi.decode(extraData[4:], (bytes, bytes));
        /**
         * Get the verifier for the given name.
         * reverts if no verifier was set in advance
         */
        (CcipVerifier memory _ccipVerifier, ) = getVerifierOfDomain(name);
        /**
         * to enable the CcipResolver to return data other than bytes it might be possible to override the
         * resolvewithProofCallback function.
         */
        bytes4 callBackSelector = ICcipResponseVerifier(_ccipVerifier.verifierAddress).onResolveWithProof(name, data);
        /**
         * Reverts when no callback selector was found. This should normally never happen because setVerifier() checks * that the verifierAddress implements the ICcipResponseVerifier interface. However it might by possbible by
         * overtiding the onResolveWithProof function and return 0x. In that case the contract reverts here.
         */
        require(callBackSelector != bytes4(0), "No callback selector found");

        /**
         * staticcall to the callback function on the verifier contract.
         * This function always returns bytes even the called function returns a Fixed type due to the return type of staticcall in solidity.
         * So you might want to decode the result using abi.decode(resolveWithProofResponse,(bytes))
         */
        (bool success, bytes memory resolveWithProofResponse) = address(_ccipVerifier.verifierAddress).staticcall(
            abi.encodeWithSelector(callBackSelector, response, extraData)
        );
        /**
         * Reverts if the call is not successful
         */
        require(success, "staticcall to verifier failed");
        return resolveWithProofResponse;
    }

    /**
     * @notice Get metadata about the CCIP Resolver
     * @dev This function provides metadata about the CCIP Resolver, including its name, coin type, GraphQL URL, storage type, and encoded information.
     * @return name The name of the resolver ("CCIP RESOLVER")
     * @return coinType Resolvers coin type (60 for Ethereum)
     * @return graphqlUrl The GraphQL URL used by the resolver
     * @return storageType Storage Type (0 for EVM)
     * @return encodedData Encoded data representing the resolver ("CCIP RESOLVER")
     */
    function metadata() external view returns (string memory, uint256, string memory, uint8, bytes memory) {
        return (
            string("CCIP RESOLVER"), //The name of the resolver
            uint256(60), //Resolvers coin type => Etheruem
            graphqlUrl, //The GraphQl Url
            uint8(0), //Storage Type 0 => EVM
            abi.encodePacked("CCIP RESOLVER")
        );
    }

    /**
     *   --------------------------------------------------
     *    Public Functions
     *   --------------------------------------------------
     */

    /**
     * @notice Get the CCIP Verifier and node for a given domain name
     * @dev This function allows retrieving the CCIP Verifier and its associated node for a given domain name. For subdomians it will return the CCIP Verifier of the closest parent.
     * @param name The domain name in bytes format (encoded as per the ENS specification)
     * @return _ccipVerifier The CCIP Verifier associated with the given domain name
     * @return node The node associated with the given domain name
     */
    function getVerifierOfDomain(bytes memory name) public view returns (CcipVerifier memory, bytes32) {
        /**
         * We start with the entrire name and iterate over the labels until we find a verifier.
         */
        uint offset = 0;

        while (offset < name.length - 1) {
            /**
             * Get the node of the current label
             */
            bytes32 node = name.namehash(offset);

            CcipVerifier memory _ccipVerifier = ccipVerifier[node];
            /**
             * If the verifier is set return it
             */
            if (address(_ccipVerifier.verifierAddress) != address(0)) {
                return (_ccipVerifier, node);
            }
            /**
             * Otherwise continue with the next label
             */
            (, offset) = name.readLabel(offset);
        }

        revert UnknownVerfier();
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

    /**
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
}
