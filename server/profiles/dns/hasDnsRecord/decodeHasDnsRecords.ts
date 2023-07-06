import { ethers } from "ethers";

export function decodeHasDNSRecords(context: string, data: ethers.utils.Result) {
    const { node, name } = data;
    return { node, context, name };
}
