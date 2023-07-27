// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

function convertEVMChainIdToCoinType(uint256 chainId) pure returns (uint256) {
    return (0x80000000 | chainId) >> 0;
}

function convertCoinTypeToEVMChainId(uint256 coinType) pure returns (uint256) {
    return (0x7fffffff & coinType) >> 0;
}
