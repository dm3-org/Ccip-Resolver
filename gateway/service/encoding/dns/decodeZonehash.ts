import { ethers } from "ethers";

export function decodeZonehash(context: string, data: ethers.utils.Result) {
    const { node, } = data;
    return { node, context };
}
