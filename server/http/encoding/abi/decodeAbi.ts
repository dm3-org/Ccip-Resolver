import { ethers } from "ethers";

export function decodeAbi(context: string, data: ethers.utils.Result) {
    const { node, contentTypes } = data;
    return { node, context, contentTypes };
}
