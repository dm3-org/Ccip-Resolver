import { ethers } from "ethers";
import { L2PublicResolver } from "../../../typechain";
export async function getSlotForContentHash(l2PublicResolver: L2PublicResolver,context: string, node: string): Promise<string> {
    //The storage slot within the particular contract
    const CONTENTHASH_SLOT_NAME = 4;
    const version = await l2PublicResolver.recordVersions(context, node);

    return getStorageSlotForContentHash(CONTENTHASH_SLOT_NAME, version.toNumber(), context, node);
}

function getStorageSlotForContentHash(slot: number, versionNumber: number, context: string, node: string,) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = ethers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const outerHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    return outerHash;
}
