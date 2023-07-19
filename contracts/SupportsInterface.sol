// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ISupportsInterface {
    function supportsInterface(bytes4 interfaceID) external pure returns (bool);
}

abstract contract SupportsInterface is ISupportsInterface {
    function supportsInterface(bytes4 interfaceID) public pure virtual override returns (bool) {
        return interfaceID == type(ISupportsInterface).interfaceId;
    }
}
