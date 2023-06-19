// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IExtendedResolver {
    function resolve(bytes memory name, bytes memory data) external view returns (bytes memory);

    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory);
}

interface IResolverService {
    function resolve(
        bytes calldata name,
        bytes calldata data
    ) external view returns (bytes memory result, uint64 expires, bytes memory sig);
}
