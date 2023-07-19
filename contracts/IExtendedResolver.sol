// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface IExtendedResolver {
    function resolve(bytes memory name, bytes memory data) external view returns (bytes memory);
}

interface IResolverService {
    function resolveWithContext(
        bytes calldata name,
        bytes calldata data,
        bytes calldata context
    ) external view returns (bytes memory result);
}
