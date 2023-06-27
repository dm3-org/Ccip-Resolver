import { ethers as hreEthers } from "hardhat";

export async function getSlotForAddr(context: string, node: string, coinType: number): Promise<string> {
    //The storage slot within the particular contract
    const ADDR_SLOT_NAME = 1;
    const version = await this.l2PublicResolver.recordVersions(context, node);

    return getStorageSlotForAddr(ADDR_SLOT_NAME, version.toNumber(), context, node, coinType);
}

function getStorageSlotForAddr(slot: number, versionNumber: number, context: string, node: string, coinType: number) {
    const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    const outerHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [coinType, nodeHash]);
    return outerHash;
}
