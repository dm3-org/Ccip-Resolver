import { ethers } from "ethers";

//TODO maybe remove everything except resolveWithProof
export function getResolverInterface() {
    return new ethers.utils.Interface([
        "function resolve(bytes calldata name, bytes calldata data) external view returns(bytes)",
        // eslint-disable-next-line max-len
        "function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)",
        //Text
        "function text(bytes32 node, string calldata key) external view returns (string memory)",
        //Address
        "function addr(bytes32 node) external view returns (address)",
        //ABI
        "function ABI(bytes calldata context,bytes32 node,uint256 contentTypes) external view returns(uint256, bytes memory)",
        //ContentHash
        "function contenthash(bytes calldata context, bytes32 node) external view returns (bytes memory)",
        "function contenthash(bytes32 node) external view returns (bytes memory)",
        //Interface
        "function interfaceImplementer (bytes calldata context, bytes32 node, bytes4 interfaceID) external view returns (address)",
        //Name
        "function name(bytes calldata context ,bytes32 node) external view returns (string memory)",
        //Pubkey
        "function pubkey(bytes calldata context ,bytes32 node) external view returns (bytes memory x, bytes memory y)",
        //DNS
        "function dnsRecord(bytes calldata context,bytes32 node,bytes32 name,uint16 resource) public view  returns(bytes memory)",
        "function hasDNSRecords(bytes calldata context, bytes32 node, bytes32 name) public view  returns (bool)",
        "function zonehash(bytes calldata context, bytes32 node) external view  returns (bytes memory)"
    ]);
}
