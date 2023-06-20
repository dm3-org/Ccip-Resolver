// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Multicallable} from "@ensdomains/ens-contracts/contracts/resolvers/Multicallable.sol";
import {AddrResolver} from "./profiles/addr/AddrResolver.sol";
import {TextResolver} from "./profiles/text/TextResolver.sol";
import {ABIResolver} from "./profiles/abi/ABIResolver.sol";
import {ContentHashResolver} from "./profiles/contentHash/ContentHashResolver.sol";

contract L2PublicResolver is Multicallable, AddrResolver, TextResolver, ABIResolver, ContentHashResolver {
    function supportsInterface(
        bytes4 interfaceID
    ) public view override(Multicallable, AddrResolver, TextResolver, ABIResolver, ContentHashResolver) returns (bool) {
        return super.supportsInterface(interfaceID);
    }
}
