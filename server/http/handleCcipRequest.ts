import { getResolverInterface } from "../utils/getResolverInterface";

import { decodeAbi } from "./profiles/abi/decodeAbi";
import { getSlotForAbi } from "./profiles/abi/getSlotForAbi";
import { decodeAddr } from "./profiles/addr/decodeAddr";
import { getSlotForAddr } from "./profiles/addr/getSlotForAddr";
import { getSlotForContentHash } from "./profiles/contentHash/getSlotForContentHash";
import { getSlotForDnsRecord } from "./profiles/dns/dnsRecord/getSlotForDnsRecord";
import { getSlotForHasDnsRecords } from "./profiles/dns/hasDnsRecord/getSlotForHasDnsRecord";
import { getSlotForZoneHash } from "./profiles/dns/zonehash/getSlotForZonehash";
import { getSlotForName } from "./profiles/name/getSlotForName";
import { getSlotForPubkeyX } from "./profiles/pubkey/getStorageSlotForPubkey";
import { decodeText } from "./profiles/text/decodeText";
import { getSlotForText } from "./profiles/text/getSlotForText";
import { decodeContentHash } from "./profiles/contentHash/decodeContentHash";
import { decodeName } from "./profiles/name/decodeName";
import { decodePubkey } from "./profiles/pubkey/decodePubKey";
import { decodeDNSRecord } from "./profiles/dns/dnsRecord/decodeDnsRecord";
import { decodeHasDNSRecords } from "./profiles/dns/hasDnsRecord/decodeHasDnsRecords";
import { decodeZonehash } from "./profiles/dns/zonehash/decodeZonehash";
import { L2PublicResolver } from "../../typechain";
import { StorageLayout } from "./profiles/StorageLayout";

export async function handleCcipRequest(l2PubicResolver: L2PublicResolver, calldata: string) {
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
                    const slot = await getSlotForText(l2PubicResolver, context, node, record)
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
                }
            case "addr(bytes32)":
                {
                    const { node } = decodeAddr(context, args);
                    return getSlotForAddr(l2PubicResolver, context, node, 60);
                }
            case "ABI(bytes,bytes32,uint256)":
                {
                    const { node, contentTypes } = decodeAbi(context, args);
                    const slot = await getSlotForAbi(l2PubicResolver, context, node, contentTypes);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
                }
            case "contenthash(bytes32)":
                {
                    const { node } = decodeContentHash(context, args);
                    const slot = await getSlotForContentHash(l2PubicResolver, context, node);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }

                }
            case "name(bytes,bytes32)":
                {
                    const { node } = decodeName(context, args);
                    const slot = await getSlotForName(l2PubicResolver, context, node);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }

                }
            case "pubkey(bytes,bytes32)":
                {
                    const { node } = decodePubkey(context, args);
                    const slot = await getSlotForPubkeyX(l2PubicResolver, context, node);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
                }
            case "dnsRecord(bytes,bytes32,bytes32,uint16)":
                {
                    const { node, name, resource } = decodeDNSRecord(context, args)
                    const slot = getSlotForDnsRecord(l2PubicResolver, context, node, name, resource)
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }

                }
            case "hasDNSRecords(bytes,bytes32,bytes32)":
                {
                    const { node, name } = decodeHasDNSRecords(context, args)
                    const slot = await getSlotForHasDnsRecords(l2PubicResolver, context, node, name)
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
                }
            case "zonehash(bytes,bytes32)":
                {
                    const { node, name } = decodeZonehash(context, args)
                    const slot = await getSlotForZoneHash(l2PubicResolver, context, node, name)
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
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
