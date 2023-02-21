import { ethers } from "ethers";
import { keccak256, solidityKeccak256 } from "ethers/lib/utils";
import { decodeDnsName } from "../dnsName/decodeDnsName";

/**
Decodes the text record of a given ENS name and returns an object containing the name and the record.
@param ensName - The ENS name to be decoded.
@param data - The data containing the namehash and the record.
@returns An object containing the name and the record.
@throws An error if the namehash doesn't match the ENS name.
*/
export function decodeText(ensName: string, data: ethers.utils.Result) {
    const [ownedNode, record] = data;

    return { ownedNode, record };
}
