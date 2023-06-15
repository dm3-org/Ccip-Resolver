// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface ICcipResponseVerifier {
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory);
}
