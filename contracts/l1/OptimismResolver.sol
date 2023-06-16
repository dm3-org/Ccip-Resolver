// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {IExtendedResolver, IResolverService} from "./IExtendedResolver.sol";
import {IContextResolver} from "./IContextResolver.sol";
import {SupportsInterface} from "./SupportsInterface.sol";
import {CcipResponseVerifier, ICcipResponseVerifier} from "./verifier/CcipResponseVerifier.sol";
import {ENS} from "@ensdomains/ens-contracts/contracts/registry/ENS.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";

import "hardhat/console.sol";

/**
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */

/**
 * TODO Use OZ for auth
 * TODO Add onlyDomainOwner modifier
 */
contract OptimismResolver is IExtendedResolver, IContextResolver, SupportsInterface {
    ENS public ensRegistry;
    address public owner;
    string public graphqlUrl;

    event NewOwner(address newOwner);
    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);

    constructor(
        //The owner of the resolver
        address _owner,
        //The ENS registry
        ENS _ensRegistry,
        //The graphQl Url
        string memory _graphqlUrl
    ) {
        ensRegistry = _ensRegistry;
        owner = _owner;
        graphqlUrl = _graphqlUrl;
    }

    //Todo move to OZ ownable
    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    function setGraphUrl(string memory _graphqlUrl) external onlyOwner {
        graphqlUrl = _graphqlUrl;
    }

    struct Resolver {
        string gatewayUrl;
        ICcipResponseVerifier resolverAddress;
    }
    mapping(bytes32 => Resolver) public resolver;

    function setResolverForDomain(bytes32 node, address resolverAddress, string memory url) external {
        require(node != bytes32(0), "node is 0x0");
        require(resolverAddress != address(0), "resolverAddress is 0x0");

        require(msg.sender == ensRegistry.owner(node), "only subdomain owner");

        (bool success, bytes memory response) = resolverAddress.staticcall(
            abi.encodeWithSignature("supportsInterface(bytes4)", ICcipResponseVerifier.resolveWithProof.selector)
        );

        require(success && response.length == 32 && (response[response.length - 1] & 0x01) == 0x01, "resolverAddress is not CCIP Resolver");

        //TODO check if resolverAddress is a valid CCIP resolver via use interface

        Resolver memory _resolver = Resolver(url, ICcipResponseVerifier(resolverAddress));
        resolver[node] = _resolver;
    }

    /**
     * Resolves a name, as specified by ENSIP 10.
     * @param name The DNS-encoded name to resolve.
     * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
     * @return The return data, ABI encoded identically to the underlying function.
     */
    function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory) {
        bytes32 node = bytes32(data[4:36]);
        //TODO support nameWrapper
        address nodeOwner = ensRegistry.owner(node);

        //TODO revert if node is 0x0
        //TODO revert if nodeOwner is 0x0

        bytes memory context = abi.encodePacked(nodeOwner);
        bytes memory callData = abi.encodeWithSelector(IResolverService.resolve.selector, context, data);

        Resolver memory _resolver = resolver[node];

        //TODO revert if resolver is 0
        string[] memory urls = new string[](1);
        urls[0] = _resolver.gatewayUrl;

        revert OffchainLookup(address(this), urls, callData, OptimismResolver.resolveWithProof.selector, callData);
    }

    /**
     * Callback used by CCIP read compatible clients to verify and parse the response.
     * extraData -> the original call data
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view override returns (bytes memory) {
        (bytes memory context, bytes memory data) = abi.decode(extraData[4:], (bytes, bytes));

        bytes32 node = bytes32(BytesLib.slice(data, 4, 32));
        Resolver memory _resolver = resolver[node];

        //TODO revert if unknown resolver
        return ICcipResponseVerifier(_resolver.resolverAddress).resolveWithProof(response, extraData);
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
}
