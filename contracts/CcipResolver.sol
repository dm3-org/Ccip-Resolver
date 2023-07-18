// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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
        string gatewayUrl;
        ICcipResponseVerifier verifierAddress;
    }
    event GraphQlUrlChanged(string newGraphQlUrl);
    event OwnerChanged(address newOwner);
    event VerifierAdded(bytes32 indexed node, address verifierAddress, string gatewayUrl);

    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);
    error InvalidOperation();

    ENSRegistry public ensRegistry;
    INameWrapper public nameWrapper;

    address public owner;
    string public graphqlUrl;

    mapping(bytes32 => CcipVerifier) public ccipVerifier;

    constructor(
        //The owner of the resolver
        address _owner,
        //The ENS registry
        ENSRegistry _ensRegistry,
        INameWrapper _nameWrapper,
        //The graphQl Url
        string memory _graphqlUrl
    ) {
        owner = _owner;
        ensRegistry = _ensRegistry;
        nameWrapper = _nameWrapper;
        graphqlUrl = _graphqlUrl;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    function setGraphUrl(string memory _graphqlUrl) external onlyOwner {
        graphqlUrl = _graphqlUrl;
        emit GraphQlUrlChanged(_graphqlUrl);
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
        emit OwnerChanged(_owner);
    }

    /**
     * @notice Sets a Cross-chain Information Protocol (CCIP) Verifier for a specific domain node.
     * @param node The domain node for which the CCIP Verifier is set.
     * @param verifierAddress The address of the CcipResponseVerifier contract.
     * @param url The gateway url that should handle the OffchainLookup.
     * Requirements:
     *   - The provided node must not be the zero address (0x0).
     *   - The provided verifierAddress must not be the zero address (0x0).
     *   - The caller of this function must be the owner of the given node.
     *   - The verifierAddress must implement the ICcipResponseVerifier interface.
     *   - The URL must not be empty.
     */
    function setVerifierForDomain(bytes32 node, address verifierAddress, string memory url) external {
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
        require(bytes(url).length > 0, "url is empty");

        /**
         * Set the new verifier for the given node.
         */
        CcipVerifier memory _ccipVerifier = CcipVerifier(url, ICcipResponseVerifier(verifierAddress));
        ccipVerifier[node] = _ccipVerifier;

        emit VerifierAdded(node, verifierAddress, url);
    }

    /**
     * Resolves a name, as specified by ENSIP 10.
     * @param name The DNS-encoded name to resolve.
     * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
     * @return The return data, ABI encoded identically to the underlying function.
     */
    function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory) {
        (CcipVerifier memory _verifier, bytes32 node) = getVerifierOfDomain(name);

        address nodeOwner = getNodeOwner(node);

        bytes memory context = abi.encodePacked(nodeOwner);
        bytes memory callData = abi.encodeWithSelector(IResolverService.resolveWithContext.selector, name, data, context);

        string[] memory urls = new string[](1);
        urls[0] = _verifier.gatewayUrl;
        revert OffchainLookup(address(this), urls, callData, CcipResolver.resolveWithProof.selector, callData);
    }

    function getVerifierOfDomain(bytes calldata name) public view returns (CcipVerifier memory, bytes32) {
        uint offset = 0;

        while (offset < name.length - 1) {
            bytes32 node = name.namehash(offset);

            CcipVerifier memory _ccipVerifier = ccipVerifier[node];
            if (address(_ccipVerifier.verifierAddress) != address(0)) {
                return (_ccipVerifier, node);
            }
            (, offset) = name.readLabel(offset);
        }

        revert InvalidOperation();
    }

    /**
     * Callback used by CCIP read compatible clients to verify and parse the response.
     * extraData -> the original call data
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory) {
        (bytes memory name, bytes memory data) = abi.decode(extraData[4:], (bytes, bytes));

        bytes32 node = bytes32(BytesLib.slice(data, 4, 32));
        CcipVerifier memory _ccipVerifier = ccipVerifier[node];

        bytes4 callBackSelector = ICcipResponseVerifier(_ccipVerifier.verifierAddress).onResolveWithProof(name, data);

        require(callBackSelector != bytes4(0), "No callback selector found");
        (bool success, bytes memory resolveWithProofResponse) = address(_ccipVerifier.verifierAddress).staticcall(
            abi.encodeWithSelector(callBackSelector, response, extraData)
        );

        require(success, "ResolveWithProof call failed");
        return resolveWithProofResponse;
    }

    function supportsInterface(bytes4 interfaceID) public pure override returns (bool) {
        return interfaceID == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceID);
    }

    function metadata() external view returns (string memory, uint256, string memory, uint8, bytes memory) {
        return (
            string("CCIP RESOLVER"), //The name of the resolver
            uint256(60), //Resolvers coin type => Etheruem
            graphqlUrl, //The GraphQl Url
            uint8(0), //Storage Type 0 => EVM
            bytes(string.concat("CCIP RESOLVER"))
        );
    }

    function getNodeOwner(bytes32 node) internal view returns (address nodeOwner) {
        nodeOwner = ensRegistry.owner(node);
        if (nodeOwner == address(nameWrapper)) {
            nodeOwner = nameWrapper.ownerOf(uint256(node));
        }
    }
}
