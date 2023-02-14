// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;

// //Collection of  Helper functions
// contract Helper {
//     function getResponse(
//         bytes calldata result,
//         bytes32 slot,
//         L2StateProof calldata proof
//     ) public pure returns (bytes memory) {
//         return abi.encode(result, slot, proof);
//     }

//     //Helper function during development. Will be removed before releasing prod
//     function mapLocation(
//         uint256 slot,
//         bytes32 k1,
//         string calldata k2
//     ) public pure returns (bytes32) {
//         //f(k1, k2) = keccak256(k2 . keccak256(k1 . p))
//         return keccak256(abi.encodePacked(k2, keccak256(abi.encodePacked(k1, slot))));
//     }
// }
