import { ethers } from "ethers";
import { L2PublicResolver } from "../../../typechain";

export async function getSlotForAbi(l2PublicResolver: L2PublicResolver, context: string, node: string, contentType: number): Promise<string> {
    //The storage slot within the particular contract
    const ABI_SLOT_NAME = 3;
    const version = await l2PublicResolver.recordVersions(context, node);

    return getStorageSlotForAbi(ABI_SLOT_NAME, version.toNumber(), context, node, contentType);

}

function getStorageSlotForAbi(slot: number, versionNumber: number, context: string, node: string, contentType: number) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = ethers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    const outerHash = ethers.utils.solidityKeccak256(["uint256", "bytes32"], [contentType, nodeHash]);
    return outerHash;
}
