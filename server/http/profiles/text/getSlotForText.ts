import { ethers } from "ethers";
import { L2PublicResolver } from "../../../../typechain";
export async function getSlotForText(l2PublicResolver: L2PublicResolver,context: string, node: string, recordName: string): Promise<string> {
    //The storage slot within the particular contract
    const TEXTS_SLOT_NAME = 2;

    const version = await l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForText(TEXTS_SLOT_NAME, version.toNumber(), context, node, recordName);
}

function getStorageSlotForText(slot: number, versionNumber: number, context: string, node: string, recordName: string) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = ethers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const middleHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    const outerHash = ethers.utils.solidityKeccak256(["string", "bytes32"], [recordName, middleHash]);
    return outerHash;
}
