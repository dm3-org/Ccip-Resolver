// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {ISupportsInterface} from "../SupportsInterface.sol";

interface ICcipResponseVerifier is ISupportsInterface {
    function resolveWithProof(bytes calldata response, bytes calldata extraData, bytes calldata verifierData) external view returns (bytes memory);

    function onResolveWithProof(bytes calldata name, bytes calldata data) external pure returns (bytes4);

    function metadata(
        bytes calldata name
    ) external view returns (string memory, uint256, string memory, uint8, bytes memory, bytes memory);
}
