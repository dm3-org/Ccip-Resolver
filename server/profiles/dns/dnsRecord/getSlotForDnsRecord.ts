import { ethers } from "ethers";
import { L2PublicResolver } from "../../../../typechain";
export async function getSlotForDnsRecord(l2PublicResolver: L2PublicResolver, context: string, node: string, name: string, resource: string): Promise<string> {
    //The storage slot within the particular contract
    const NAME_SLOT_NAME = 6;
    const version = await l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForDnsRecord(NAME_SLOT_NAME, version.toNumber(), context, node, name, resource);
}

function getStorageSlotForDnsRecord(slot: number, versionNumber: number, context: string, node: string, name: string, resource: string) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = ethers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    const nameHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [name, nodeHash]);
    const resourceHash = ethers.utils.solidityKeccak256(["uint256", "bytes32"], [resource, nameHash]);
    return resourceHash;
}
