// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Multicallable} from "@ensdomains/ens-contracts/contracts/resolvers/Multicallable.sol";
import {AddrResolver} from "./profiles/addr/AddrResolver.sol";
import {TextResolver} from "./profiles/text/TextResolver.sol";
import {ABIResolver} from "./profiles/abi/ABIResolver.sol";
import {ContentHashResolver} from "./profiles/contentHash/ContentHashResolver.sol";
import {DNSResolver} from "./profiles/dns/DNSResolver.sol";
import {NameResolver} from "./profiles/name/NameResolver.sol";
import {PubkeyResolver} from "./profiles/pubkey/PubkeyResolver.sol";

contract L2PublicResolver is
    Multicallable,
    AddrResolver,
    TextResolver,
    ABIResolver,
    ContentHashResolver,
    DNSResolver,
    NameResolver,
    PubkeyResolver
{
    function supportsInterface(
        bytes4 interfaceID
    )
        public
        view
        override(Multicallable, AddrResolver, TextResolver, ABIResolver, ContentHashResolver, DNSResolver, NameResolver, PubkeyResolver)
        returns (bool)
    {
        return super.supportsInterface(interfaceID);
    }
}
