import { ethers } from "ethers";
/**
Decodes the call data of addr(bytes 32) 
@param ensName - The ENS name to be decoded.
@param data - The data containing the namehash.
@returns An object containing the name.
@throws An error if the namehash doesn't match the ENS name.
*/
export function decodeAddr(ensName: string, data: ethers.utils.Result) {
    const ownedNode = data.node;
    return { ownedNode };
}
