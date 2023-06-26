import { getResolverInterface } from "../../../utils/getResolverInterface";
import { decodeText } from "../text/decodeText";
import { decodeAddr } from "../addr/decodeAddr";
import { decodeAbi } from "../abi/decodeAbi";
import { decodeContentHash } from "../contenthash/decodeContentHash";
import { decodeName } from "../name/decodeName";
import { decodePubkey } from "../pubkey/decodePubKey";
import { decodeDNSRecord } from "../dns/decodeDnsRecord";
import { decodeHasDNSRecords } from "../dns/decodeHasDnsRecords";
import { decodeZonehash } from "../dns/decodeZonehash";

export function decodeCcipRequest(calldata: string) {
    try {
        const l2Resolverinterface = getResolverInterface();

        //Parse the calldata returned by the contract
        const [context, data] = l2Resolverinterface.parseTransaction({
            data: calldata,
        }).args;

        const { signature, args } = l2Resolverinterface.parseTransaction({
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
                return { signature, request: decodeContentHash(context, args) };;
            case "name(bytes,bytes32)":
                return { signature, request: decodeName(context, args) };
            case "pubkey(bytes,bytes32)":
                return { signature, request: decodePubkey(context, args) };
            case "dnsRecord(bytes,bytes32,bytes32,uint16)":
                return { signature, request: decodeDNSRecord(context, args) };
            case "hasDNSRecords(bytes,bytes32,bytes32)":
                return { signature, request: decodeHasDNSRecords(context, args) }
            case "zonehash(bytes,bytes32)":
                return { signature, request: decodeZonehash(context, args) }
            default:
                return { signature, request: null };
        }
    } catch (err: any) {
        console.log("[Decode Calldata] Can't decode calldata ");
        console.log(err);
        throw err;
    }
}
