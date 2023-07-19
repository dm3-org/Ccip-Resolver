// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {CcipResponseVerifier} from "../CcipResponseVerifier.sol";
import {SignatureVerifier} from "./SignatureVerifier.sol";

contract SignatureCcipVerifier is CcipResponseVerifier {
    address public owner;
    address public immutable resolver;

    mapping(address => bool) public signers;

    event NewOwner(address newOwner);
    event NewSigners(address[] signers);
    event SignerRemoved(address removedSinger);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    /**
     * @notice Set the new owner of the contract
     * @dev This function can only be called by the current contract owner. It allows changing the ownership by setting a new owner address.
     * @param _newOwner The address of the new owner to be set
     */
    function setOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
        emit NewOwner(owner);
    }

    constructor(address _owner, address _resolver, address[] memory _signers) {
        owner = _owner;
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
}
