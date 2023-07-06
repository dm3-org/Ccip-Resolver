import { ethers } from "ethers";

/**
Decodes the text record of a given ENS name and returns an object containing the name and the record.
@param context - The context of the ENS name. In this case the owner
@param data - The data containing the namehash and the record.
@returns An object containing the name and the record.
@throws An error if the namehash doesn't match the ENS name.
*/
export function decodeText(context: string, data: ethers.utils.Result) {
    const [node, record] = data;

    return { node, context, record };
}
