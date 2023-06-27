import { ethers as hreEthers } from "hardhat";

export async function getSlotForDnsRecord(context: string, node: string, name: string, resource: string): Promise<string> {
    //The storage slot within the particular contract
    const NAME_SLOT_NAME = 6;
    const version = await this.l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForDnsRecord(NAME_SLOT_NAME, version.toNumber(), context, node, name, resource);
}

function getStorageSlotForDnsRecord(slot: number, versionNumber: number, context: string, node: string, name: string, resource: string) {
    const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    const nameHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [name, nodeHash]);
    const resourceHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [resource, nameHash]);
    return resourceHash;
}
