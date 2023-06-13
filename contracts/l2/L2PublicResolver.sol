// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@ensdomains/ens-contracts/contracts/resolvers/Multicallable.sol";
import {AddrResolver} from "./profiles/addr/AddrResolver.sol";

import {LibOwnedENSNode} from "../lib/LibOwnedENSNode.sol";

contract L2PublicResolver is Multicallable, AddrResolver {
    function supportsInterface(bytes4 interfaceID) public view override(Multicallable, AddrResolver) returns (bool) {
        return super.supportsInterface(interfaceID);
    }
}
