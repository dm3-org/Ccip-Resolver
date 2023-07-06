import { ethers } from "ethers";
import { L2PublicResolver } from "../../../typechain";

export async function getSlotForPubkeyX(l2PublicResolver: L2PublicResolver, context: string, node: string,): Promise<string> {
    //The storage slot within the particular contract
    const PUBKEY_SLOT_NAME = 9;

    const version = await l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForPubkey(PUBKEY_SLOT_NAME, version.toNumber(), context, node)
}

export async function getSlotForPubkeyY(l2PublicResolver: L2PublicResolver, context: string, node: string,): Promise<string> {
    const slotx = getSlotForPubkeyX(l2PublicResolver, context, node);
    return ethers.BigNumber.from(slotx).add(1).toHexString();
}

function getStorageSlotForPubkey(slot: number, versionNumber: number, context: string, node: string,) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = ethers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    return nodeHash;
}
