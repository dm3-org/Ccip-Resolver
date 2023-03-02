import { ethers } from "ethers";

export function encodeAddr(result: string) {
    const iTextResolver = new ethers.utils.Interface([
        "function addr(bytes32 node) external view returns (address payable)",
    ]);
    return iTextResolver.encodeFunctionResult("addr(bytes32)", [result]);
}
