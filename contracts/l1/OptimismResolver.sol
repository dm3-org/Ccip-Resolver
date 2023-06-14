// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {IExtendedResolver, IResolverService} from "./IExtendedResolver.sol";
import {IContextResolver} from "./IContextResolver.sol";
import {SupportsInterface} from "./SupportsInterface.sol";
import {IBedrockProofVerifier} from "./IBedrockProofVerifier.sol";
import {ENS} from "@ensdomains/ens-contracts/contracts/registry/ENS.sol";

/**
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */
contract OptimismResolver is IExtendedResolver, IContextResolver, SupportsInterface {
    ENS public ensRegistry;
    address public owner;
    string public url;
    IBedrockProofVerifier public bedrockProofVerifier;
    address public l2Resolver;
    string public graphqlUrl;

    event NewOwner(address newOwner);
    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);

    constructor(
        //The CCIP gateway url
        string memory _url,
        //The owner of the resolver
        address _owner,
        //The bedrock proof verifier
        IBedrockProofVerifier _bedrockProofVerifier,
        //The ENS registry
        ENS _ensRegistry,
        //The instance of the L2PublicResolver
        address _l2Resolver,
        //The graphQl Url
        string memory _graphqlUrl
    ) {
        ensRegistry = _ensRegistry;
        url = _url;
        owner = _owner;
        bedrockProofVerifier = _bedrockProofVerifier;
        l2Resolver = _l2Resolver;
        graphqlUrl = _graphqlUrl;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    function setOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
        emit NewOwner(owner);
    }

    function setL2Resolver(address _newL2Resolver) external onlyOwner {
        l2Resolver = _newL2Resolver;
        emit NewOwner(owner);
    }

    function setUrl(string memory _url) external onlyOwner {
        url = _url;
    }

    function setGraphUl(string memory _graphqlUrl) external onlyOwner {
        graphqlUrl = _graphqlUrl;
    }

    /**
     * Resolves a name, as specified by ENSIP 10.
     * @param name The DNS-encoded name to resolve.
     * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
     * @return The return data, ABI encoded identically to the underlying function.
     */
    function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory) {
        bytes32 node = bytes32(data[4:36]);
        address nodeOwner = ensRegistry.owner(node);

        bytes memory context = abi.encodePacked(nodeOwner);
        bytes memory callData = abi.encodeWithSelector(IResolverService.resolve.selector, context, data);

        string[] memory urls = new string[](1);
        urls[0] = url;
        revert OffchainLookup(address(this), urls, callData, OptimismResolver.resolveWithProof.selector, callData);
    }

    /**
     * Callback used by CCIP read compatible clients to verify and parse the response.
     * extraData -> the original call data
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view override returns (bytes memory) {
        (string memory result, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(
            response,
            (string, IBedrockProofVerifier.BedrockStateProof)
        );
        require(proof.target == l2Resolver, "proof target does not match resolver");
        return bedrockProofVerifier.getProofValue(proof);
    }

    function supportsInterface(bytes4 interfaceID) public pure override returns (bool) {
        return interfaceID == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceID);
    }

    function metadata() external view returns (string memory, uint256, string memory, uint8, bytes memory) {
        return (
            string("OPTIMISM RESOLVER"), //The name of the resolver
            uint256(60), //Resolvers coin type => Etheruem
            graphqlUrl, //The GraphQl Url
            uint8(0), //Storage Type 0=>EVM
            bytes(string.concat("OPTIMISM RESOLVER: ", "{NODE_OWNER}"))
        );
    }
}
