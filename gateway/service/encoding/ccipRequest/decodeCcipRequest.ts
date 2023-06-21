import { getResolverInterface } from "../../../utils/getResolverInterface";
import { decodeText } from "../text/decodeText";
import { decodeAddr } from "../addr/decodeAddr";
import { decodeAbi } from "../abi/decodeAbi";
import { decodeContentHash } from "../contenthash/decodeContentHash";
import { decodeInterface } from "../interface/decodeInterface";
import { decodeName } from "../name/decodeName";
import { decodePubkey } from "../pubkey/decodePubKey";

export function decodeCcipRequest(calldata: string) {
    try {
        const textResolver = getResolverInterface();

        //Parse the calldata returned by the contract
        const [context, data] = textResolver.parseTransaction({
            data: calldata,
        }).args;

        const { signature, args } = textResolver.parseTransaction({
            data,
        });
        switch (signature) {
            case "text(bytes32,string)":
                return { signature, request: decodeText(context, args) };
            case "addr(bytes32)":
                return { signature, request: decodeAddr(context, args) };
            case "ABI(bytes,bytes32,uint256)":
                return { signature, request: decodeAbi(context, args) };
            case "contenthash(bytes32)":
                return { signature, request: decodeContentHash(context, args) };
            case "interfaceImplementer(bytes,bytes32,bytes4)":
                return { signature, request: decodeInterface(context, args) };
            case "name(bytes,bytes32)":
                return { signature, request: decodeName(context, args) };
            case "pubkey(bytes,bytes32)":
                return { signature, request: decodePubkey(context, args) };
            default:
                return { signature, request: null };
        }
    } catch (err: any) {
        console.log("[Decode Calldata] Can't decode calldata ");
        console.log(err);
        throw err;
    }
}
