// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IExtendedResolver, IResolverService} from "./IExtendedResolver.sol";
import {IContextResolver} from "./IContextResolver.sol";
import {SupportsInterface} from "./SupportsInterface.sol";
import {CcipResponseVerifier, ICcipResponseVerifier} from "./verifier/CcipResponseVerifier.sol";
import {ENS} from "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import {INameWrapper} from "@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol";
import {BytesUtils} from "@ensdomains/ens-contracts/contracts/wrapper/BytesUtils.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";

/**
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */
contract OptimismResolver is IExtendedResolver, IContextResolver, SupportsInterface {
    using BytesUtils for bytes;

    ENS public ensRegistry;
    INameWrapper public nameWrapper;

    address public owner;
    string public graphqlUrl;

    mapping(bytes32 => Resolver) public resolvers;

    event GraphQlUrlChanged(string newGraphQlUrl);
    event OwnerChanged(address newOwner);
    event ResolverAdded(bytes32 indexed node, string gatewayUrl, address resolverAddress);

    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);
    error InvalidOperation();

    struct Resolver {
        string gatewayUrl;
        ICcipResponseVerifier resolverAddress;
    }

    constructor(
        //The owner of the resolver
        address _owner,
        //The ENS registry
        ENS _ensRegistry,
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

    function setResolverForDomain(bytes32 node, address resolverAddress, string memory url) external {
        require(node != bytes32(0), "node is 0x0");
        require(resolverAddress != address(0), "resolverAddress is 0x0");

        require(msg.sender == getNodeOwner(node), "only subdomain owner");

        (bool success, bytes memory response) = resolverAddress.staticcall(
            abi.encodeWithSignature("supportsInterface(bytes4)", ICcipResponseVerifier.resolveWithProof.selector)
        );

        require(
            success && response.length == 32 && (response[response.length - 1] & 0x01) == 0x01,
            "resolverAddress is not a CCIP Resolver"
        );

        require(bytes(url).length > 0, "url is empty");

        Resolver memory resolver = Resolver(url, ICcipResponseVerifier(resolverAddress));
        resolvers[node] = resolver;

        emit ResolverAdded(node, url, resolverAddress);
    }

    /**
     * Resolves a name, as specified by ENSIP 10.
     * @param name The DNS-encoded name to resolve.
     * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
     * @return The return data, ABI encoded identically to the underlying function.
     */
    function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory) {
        (Resolver memory _resolver, bytes32 node) = getResolverOfDomain(name);

        address nodeOwner = getNodeOwner(node);

        bytes memory context = abi.encodePacked(nodeOwner);
        bytes memory callData = abi.encodeWithSelector(IResolverService.resolve.selector, context, data);

        string[] memory urls = new string[](1);
        urls[0] = _resolver.gatewayUrl;

        revert OffchainLookup(address(this), urls, callData, OptimismResolver.resolveWithProof.selector, callData);
    }

    function getResolverOfDomain(bytes calldata name) public view returns (Resolver memory, bytes32) {
        uint offset = 0;

        while (offset < name.length - 1) {
            bytes32 node = name.namehash(offset);

            Resolver memory resolver = resolvers[node];
            if (address(resolver.resolverAddress) != address(0)) {
                return (resolver, node);
            }
            (, offset) = name.readLabel(offset);
        }

        revert InvalidOperation();
    }

    /**
     * Callback used by CCIP read compatible clients to verify and parse the response.
     * extraData -> the original call data
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view override returns (bytes memory) {
        (, bytes memory data) = abi.decode(extraData[4:], (bytes, bytes));

        bytes32 node = bytes32(BytesLib.slice(data, 4, 32));
        Resolver memory resolver = resolvers[node];

        //TODO revert if unknown resolver
        return ICcipResponseVerifier(resolver.resolverAddress).resolveWithProof(response, extraData);
    }

    function supportsInterface(bytes4 interfaceID) public pure override returns (bool) {
        return interfaceID == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceID);
    }

    function metadata() external view returns (string memory, uint256, string memory, uint8, bytes memory) {
        return (
            string("OPTIMISM RESOLVER"), //The name of the resolver
            uint256(60), //Resolvers coin type => Etheruem
            graphqlUrl, //The GraphQl Url
            uint8(0), //Storage Type 0 => EVM
            bytes(string.concat("OPTIMISM RESOLVER: ", "{NODE_OWNER}"))
        );
    }

    function getNodeOwner(bytes32 node) internal view returns (address owner) {
        owner = ensRegistry.owner(node);
        if (owner == address(nameWrapper)) {
            owner = nameWrapper.ownerOf(uint256(node));
        }
    }
}
