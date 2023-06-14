import { ethers } from "ethers";
/**
Decodes the call data of addr(bytes 32) 
@param context - The context of the ENS name. In this case the owner
@param data - The data containing the namehash.
@returns An object containing the name.
@throws An error if the namehash doesn't match the ENS name.
*/
export function decodeAddr(context: string, data: ethers.utils.Result) {
    const node = data.node;
    return { node, context };
}
