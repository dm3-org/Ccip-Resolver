// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {CcipResponseVerifier} from "../CcipResponseVerifier.sol";
import {SignatureVerifier} from "./SignatureVerifier.sol";
import {convertEVMChainIdToCoinType} from "../../coinType/Ensip11CointType.sol";

contract SignatureCcipVerifier is CcipResponseVerifier {
    string public name;
    address public immutable resolver;

    mapping(address => bool) public signers;

    event NewOwner(address newOwner);
    event NewSigners(address[] signers);
    event SignerRemoved(address removedSinger);

    constructor(
        address _owner,
        string memory _graphQlUrl,
        string memory _name,
        address _resolver,
        address[] memory _signers
    ) CcipResponseVerifier(_owner, _graphQlUrl) {
        name = _name;
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
            //Without this if check it's possible to add a signer to the SignerRemoved Event that never was a signer in the first place. This may cause failures at indexing services that are trying to delete a non-existing signer...
            if (signers[_signers[i]]) {
                signers[_signers[i]] = false;
                emit SignerRemoved((_signers[i]));
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
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view override returns (bytes memory) {
        (address signer, bytes memory result) = SignatureVerifier.verify(resolver, extraData, response);
        require(signers[signer], "SignatureVerifier: Invalid sigature");
        /**
         * @dev Because this function is ment to be called via staticcall, we need to decode the response data before returning it.
         */
        bytes memory decodedResponse = abi.decode(result, (bytes));
        return decodedResponse;
    }

    /**
     * @notice Get metadata about the CCIP Resolver
     * @dev This function provides metadata about the CCIP Resolver, including its name, coin type, GraphQL URL, storage type, and encoded information.
     * @return name The name of the resolver ("CCIP RESOLVER")
     * @return coinType Resolvers coin type (60 for Ethereum)
     * @return graphqlUrl The GraphQL URL used by the resolver
     * @return storageType Storage Type (0 for EVM)
     * @return storageLocation The storage identifier. For EVM chains, this is the address of the resolver contract.
     * @return context the owner of the name. Always returns address(0) since the owner is determined by the ccipResolver contract.
     */
    function metadata(
        bytes calldata
    ) external view override returns (string memory, uint256, string memory, uint8, bytes memory, bytes memory) {
        return (
            name, //The name of the resolver
            convertEVMChainIdToCoinType(60), //Resolvers coin type => Etheruem
            this.graphqlUrl(), //The GraphQl Url
            uint8(1), //Storage Type 0 => Offchain Database
            "Postgres", //Storage Location => Resolver Address
            abi.encodePacked(address(0)) //Context => Owner Address
        );
    }
}
