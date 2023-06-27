import { ethers as hreEthers } from "hardhat";
export async function getSlotForPubkeyX(context: string, node: string,): Promise<string> {
    //The storage slot within the particular contract
    const PUBKEY_SLOT_NAME = 9;

    const version = await this.l2PublicResolver.recordVersions(context, node);
    return getStorageSlotForPubkey(PUBKEY_SLOT_NAME, version.toNumber(), context, node)
}

export async function getSlotForPubkeyY(context: string, node: string,): Promise<string> {
    const slotx = this.getSlotForPubkeyX(context, node);
    return hreEthers.BigNumber.from(slotx).add(1).toHexString();
}

function getStorageSlotForPubkey(slot: number, versionNumber: number, context: string, node: string,) {
    const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    return nodeHash;
}
