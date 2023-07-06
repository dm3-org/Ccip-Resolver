// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../ResolverBase.sol";
import {IAddrResolver} from "./IAddrResolver.sol";
import {IAddressResolver} from "./IAddressResolver.sol";

abstract contract AddrResolver is IAddrResolver, IAddressResolver, ResolverBase {
    using BytesUtils for bytes;
    uint256 private constant COIN_TYPE_ETH = 60;

    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(uint256 => bytes)))) public versionable_addresses;

    /**
     * Sets the address associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param name The name to update.
     * @param a The address to set.
     */
    function setAddr(bytes calldata name, address a) external virtual {
        setAddr(name, COIN_TYPE_ETH, addressToBytes(a));
    }

    /**
     * Returns the address associated with an ENS node.
     * @param node The ENS node to query.
     * @return The associated address.
     */
    function addr(bytes calldata context, bytes32 node) public view virtual override returns (address payable) {
        bytes memory a = addr(context, node, COIN_TYPE_ETH);
        if (a.length == 0) {
            return payable(0);
        }
        return bytesToAddress(a);
    }

    function setAddr(bytes calldata name, uint256 coinType, bytes memory a) public virtual {
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        emit AddressChanged(context, name, node, coinType, a);
        if (coinType == COIN_TYPE_ETH) {
            emit AddrChanged(context, name, node, bytesToAddress(a));
        }
        versionable_addresses[recordVersions[context][node]][context][node][coinType] = a;
    }

    function addr(bytes calldata context, bytes32 node, uint256 coinType) public view virtual override returns (bytes memory) {
        return versionable_addresses[recordVersions[context][node]][context][node][coinType];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return
            interfaceID == type(IAddrResolver).interfaceId ||
            interfaceID == type(IAddressResolver).interfaceId ||
            super.supportsInterface(interfaceID);
    }

    function bytesToAddress(bytes memory b) internal pure returns (address payable a) {
        require(b.length == 20);
        assembly {
            a := div(mload(add(b, 32)), exp(256, 12))
        }
    }

    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }
}
