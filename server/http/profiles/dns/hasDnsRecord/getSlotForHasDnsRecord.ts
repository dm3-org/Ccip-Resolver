import { ethers as hreEthers } from "hardhat";
export async function getSlotForHasDnsRecords(context: string, node: string, name: string,): Promise<string> {
    //The storage slot within the particular contract
    const NAME_SLOT_NAME = 6;
    const version = await this.l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForHasDnsRecords(NAME_SLOT_NAME, version.toNumber(), context, node, name);
}

function getStorageSlotForHasDnsRecords(slot: number, versionNumber: number, context: string, node: string, name: string) {
    const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    const nameHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [name, nodeHash]);
    return nameHash;
}
