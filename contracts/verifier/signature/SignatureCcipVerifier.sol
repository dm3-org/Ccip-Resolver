// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

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

    function addSigners(address[] memory _signers) external onlyOwner {
        for (uint256 i = 0; i < _signers.length; i++) {
            signers[_signers[i]] = true;
        }
        emit NewSigners(_signers);
    }

    function removeSigners(address[] memory _signers) external onlyOwner {
        for (uint256 i = 0; i < _signers.length; i++) {
            //Without this if check it's possible to add a signer to the SignerRemoved Event that never was a signer in the first place. This may cause failures at indexing services that are trying to delete a non-existing signer...
            if (signers[_signers[i]]) {
                signers[_signers[i]] = false;
                emit SignerRemoved((_signers[i]));
            }
        }
    }

    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view override returns (bytes memory) {
        (address signer, bytes memory result) = SignatureVerifier.verify(resolver, extraData, response);
        require(signers[signer], "SignatureVerifier: Invalid sigature");
        bytes memory decodedResponse = abi.decode(result, (bytes));
        return decodedResponse;
    }
}
