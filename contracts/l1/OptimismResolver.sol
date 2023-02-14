// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IExtendedResolver.sol";
import "./SupportsInterface.sol";
import "./OptimisimProofVerifier.sol";

/**
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */
contract OptimismResolver is IExtendedResolver, SupportsInterface, OptimisimProofVerifier {
    address public owner;
    string public url;
    mapping(address => bool) public signers;

    event NewOwner(address newOwner);
    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);

    constructor(
        string memory _url,
        address _owner,
        address _ovmAddressManager,
        address _l2resolver
    ) OptimisimProofVerifier(_ovmAddressManager, _l2resolver) {
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

    /**
     * Callback used by CCIP read compatible clients to verify and parse the response.
     * extraData -> the original call data
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory) {
        (bytes memory result, bytes32 slot, L2StateProof memory proof) = abi.decode(
            response,
            (bytes, bytes32, L2StateProof)
        );

        return isValidProof(slot, proof);
        //Do stuff with proof

        // bytes32 slot = keccak256(abi.encodePacked(node, uint256(1)));
        //bytes32 value = getStorageValue(l2resolver, slot, proof);
    }

    function supportsInterface(bytes4 interfaceID) public pure override returns (bool) {
        return interfaceID == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
