import { ethers as hreEthers } from "hardhat";

export async function getSlotForContentHash(context: string, node: string): Promise<string> {
    //The storage slot within the particular contract
    const CONTENTHASH_SLOT_NAME = 4;
    const version = await this.l2PublicResolver.recordVersions(context, node);

    return getStorageSlotForContentHash(CONTENTHASH_SLOT_NAME, version.toNumber(), context, node);
}

function getStorageSlotForContentHash(slot: number, versionNumber: number, context: string, node: string,) {
    const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const outerHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    return outerHash;
}
