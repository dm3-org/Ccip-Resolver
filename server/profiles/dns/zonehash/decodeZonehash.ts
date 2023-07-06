import { ethers } from "ethers";

export function decodeZonehash(context: string, data: ethers.utils.Result) {
    const { node, name } = data;
    return { node, context, name };
}
