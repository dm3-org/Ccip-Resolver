import { ethers } from "ethers";

export function decodePubkey(context: string, data: ethers.utils.Result) {
    const { node } = data;
    return { node, context };
}
