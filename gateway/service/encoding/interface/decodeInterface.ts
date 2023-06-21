import { ethers } from "ethers";

export function decodeInterface(context: string, data: ethers.utils.Result) {
    const { node, interfaceID } = data;

    return { node, context, interfaceID };
}
