// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;
import {ISupportsInterface} from "../SupportsInterface.sol";

interface ICcipResponseVerifier is ISupportsInterface {
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory);

    function onResolveWithProof(bytes calldata name, bytes calldata data) external pure returns (bytes4);
}
