// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

//A fork of the ENS public resolver
contract PublicResolver {
    mapping(bytes32 => mapping(string => string)) public texts;

    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external {
        texts[node][key] = value;
    }
}
