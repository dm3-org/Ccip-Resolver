import { ethers } from "ethers";

export function decodeZonehash(context: string, data: ethers.utils.Result) {
    const { node, name, resource } = data;
    return { node, context, name, resource };
}
