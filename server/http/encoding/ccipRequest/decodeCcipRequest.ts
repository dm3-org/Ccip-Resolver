import { getResolverInterface } from "../../../utils/getResolverInterface";

import { decodeAbi } from "../../profiles/abi/decodeAbi";
import { getSlotForAbi } from "../../profiles/abi/getSlotForAbi";
import { decodeAddr } from "../../profiles/addr/decodeAddr";
import { getSlotForAddr } from "../../profiles/addr/getSlotForAddr";
import { getSlotForContentHash } from "../../profiles/contentHash/getSlotForContentHash";
import { getSlotForDnsRecord } from "../../profiles/dns/dnsRecord/getSlotForDnsRecord";
import { getSlotForHasDnsRecords } from "../../profiles/dns/hasDnsRecord/getSlotForHasDnsRecord";
import { getSlotForZoneHash } from "../../profiles/dns/zonehash/getSlotForZonehash";
import { getSlotForName } from "../../profiles/name/getSlotForName";
import { getSlotForPubkeyX } from "../../profiles/pubkey/getStorageSlotForPubkey";
import { decodeText } from "../../profiles/text/decodeText";
import { getSlotForText } from "../../profiles/text/getSlotForText";
import { decodeContentHash } from "../../profiles/contentHash/decodeContentHash";
import { decodeName } from "../../profiles/name/decodeName";
import { decodePubkey } from "../../profiles/pubkey/decodePubKey";
import { decodeDNSRecord } from "../../profiles/dns/dnsRecord/decodeDnsRecord";
import { decodeHasDNSRecords } from "../../profiles/dns/hasDnsRecord/decodeHasDnsRecords";
import { decodeZonehash } from "../../profiles/dns/zonehash/decodeZonehash";

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
                {

                    const { node, record } = decodeText(context, args);
                    return getSlotForText(context, node, record)
                }
            case "addr(bytes32)":
                {
                    const { node } = decodeAddr(context, args);
                    return getSlotForAddr(context, node, 60);
                }
            case "ABI(bytes,bytes32,uint256)":
                {
                    const { node, contentTypes } = decodeAbi(context, args);
                    return getSlotForAbi(context, node, contentTypes);
                }
            case "contenthash(bytes32)":
                {
                    const { node } = decodeContentHash(context, args);
                    return getSlotForContentHash(context, node);

                }
            case "name(bytes,bytes32)":
                {
                    const { node } = decodeName(context, args);
                    return getSlotForName(context, node);

                }
            case "pubkey(bytes,bytes32)":
                {
                    const { node } = decodePubkey(context, args);
                    return getSlotForPubkeyX(context, node);
                }
            case "dnsRecord(bytes,bytes32,bytes32,uint16)":
                {
                    const { node, name, resource } = decodeDNSRecord(context, args)
                    return getSlotForDnsRecord(context, node, name, resource)

                }
            case "hasDNSRecords(bytes,bytes32,bytes32)":
                {
                    const { node, name } = decodeHasDNSRecords(context, args)
                    return getSlotForHasDnsRecords(context, node, name)
                }
            case "zonehash(bytes,bytes32)":
                {
                    const { node, name } = decodeZonehash(context, args)
                    return getSlotForZoneHash(context, node, name)
                }
            default:

                //Unsupported signature
                return null
        }
    } catch (err: any) {
        console.log("[Decode Calldata] Can't decode calldata ");
        console.log(err);
        throw err;
    }
}
