import { ethers as hreEthers } from "hardhat";
export async function getSlotForZoneHash(context: string, node: string, name: string): Promise<string> {
    //The storage slot within the particular contract
    const NAME_SLOT_NAME = 5;
    const version = await this.l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForZonehash(NAME_SLOT_NAME, version.toNumber(), context, node, name);
}

function getStorageSlotForZonehash(slot: number, versionNumber: number, context: string, node: string, name: string) {
    const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    return nodeHash;
}
