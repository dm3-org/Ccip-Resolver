import { ethers } from "ethers";

export function decodeName(context: string, data: ethers.utils.Result) {
    const { node } = data;
    return { node, context };
}
