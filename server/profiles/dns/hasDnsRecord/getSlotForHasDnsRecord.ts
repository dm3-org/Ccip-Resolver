import { ethers } from "ethers";
import { L2PublicResolver } from "../../../../typechain";

export async function getSlotForHasDnsRecords(l2PublicResolver: L2PublicResolver, context: string, node: string, name: string,): Promise<string> {
    //The storage slot within the particular contract
    const NAME_SLOT_NAME = 6;
    const version = await l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForHasDnsRecords(NAME_SLOT_NAME, version.toNumber(), context, node, name);
}

function getStorageSlotForHasDnsRecords(slot: number, versionNumber: number, context: string, node: string, name: string) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = ethers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    const nameHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [name, nodeHash]);
    return nameHash;
}
