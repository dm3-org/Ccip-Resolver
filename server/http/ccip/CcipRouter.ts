import { ethers } from "hardhat";
import { encodeAbi } from "../encoding/abi/encodeAbi";
import { encodeAddr } from "../encoding/addr/encodeAddr";
import { encodeContentHash } from "../encoding/contenthash/encodeContentHash";
import { encodeDnsRecord } from "../encoding/dns/encodeDnsRecord";
import { encodeHasDnsRecord } from "../encoding/dns/encodeHasDnsRecords";
import { encodeZonehash } from "../encoding/dns/encodeZonehash";
import { encodeName } from "../encoding/name/encodeName";
import { encodePubkey } from "../encoding/pubkey/encodePubkey";
import { encodeText } from "../encoding/text/encodeText";

import { getProofParamType } from "../encoding/proof/getProofParamType";
import { EnsResolverService } from "../ens/EnsService";
export class CcipRouter {
    private readonly ensService: EnsResolverService;

    constructor(ensService: EnsResolverService) {
        this.ensService = ensService;
    }
    public static async instance() {
        return new CcipRouter(await EnsResolverService.instance());
    }

    public async handleRequest(signature: string, request: any) {
        switch (signature) {
            case "text(bytes32,string)":
                return await this.handleText(request);
            case "addr(bytes32)":
                return await this.handleAddr(request);
            case "ABI(bytes,bytes32,uint256)":
                return await this.handleABI(request);
            case "contenthash(bytes32)":
                return await this.handleContentHash(request);
            case "name(bytes,bytes32)":
                return await this.handleName(request);
            case "pubkey(bytes,bytes32)":
                return await this.handlePubkey(request);
            case "dnsRecord(bytes,bytes32,bytes32,uint16)":
                return await this.handleDnsRecord(request);
            case "hasDNSRecords(bytes,bytes32,bytes32)":
                return await this.handleHasDnsRecords(request);
            case "zonehash(bytes,bytes32)":
                return await this.handleZonehash(request);
            default:
                return null;
        }
    }

    /**
     * Get text record for a given node
     * @param request.ownedNode - the owned Node
     * @param request.record - record name
     * @returns - the response of the ccip request
     */

    private async handleText(request: any) {
        const { proof, result } = await this.ensService.getSlotForText(request.context, request.node, request.record);



    }

    private async handleAddr(request: any) {
        const coinType = 60;
        const { proof, result } = await this.ensService.getSlotForAddr(request.context, request.node, coinType);
        const encodedGetTextResult = encodeAddr(result === "0x" ? ethers.constants.AddressZero : result);
        const proofParamType = await getProofParamType();
        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetTextResult, proof]);
    }
    private async handleABI(request: any) {
        const { proof, result } = await this.ensService.getSlotForAbi(request.context, request.node, request.contentTypes);

        //If the resut is 0x the content type shall be 0 
        const contentTypes = result === "0x" ? 0 : request.contentTypes

        const encodedGetTextResult = encodeAbi(result, contentTypes);
        const proofParamType = await getProofParamType();

        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetTextResult, proof]);
    }
    private async handleContentHash(request: any) {
        const { proof, result } = await this.ensService.getSlotForContentHash(request.context, request.node);

        const encodedGetTextResult = encodeContentHash(result);
        const proofParamType = await getProofParamType();

        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetTextResult, proof]);

    }

    private async handleName(request: any) {
        const { proof, result } = await this.ensService.getSlotForName(request.context, request.node);
        const encodedGetTextResult = encodeName(result);
        const proofParamType = await getProofParamType();

        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetTextResult, proof]);

    }
    private async handlePubkey(request: any) {
        const { proof, result } = await this.ensService.proofPubkey(request.context, request.node);
        const [x, y] = result
        const encodedGetTextResult = encodePubkey(x, y);
        const proofParamType = await getProofParamType();

        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetTextResult, proof]);

    }
    private async handleDnsRecord(request: any) {

        const { proof, result } = await this.ensService.getSlotForDnsRecord(request.context, request.node, request.name, request.resource);
        const encodedGetDnstResult = encodeDnsRecord(result);
        const proofParamType = await getProofParamType();
        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetDnstResult, proof]);

    }
    private async handleHasDnsRecords(request: any) {
        const { proof, result } = await this.ensService.getSlotForHasDnsRecords(request.context, request.node, request.name);
        const encodedGetDnstResult = encodeHasDnsRecord(result);
        const proofParamType = await getProofParamType();
        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetDnstResult, proof]);

    }
    private async handleZonehash(request: any) {
        const { proof, result } = await this.ensService.getSlotForZoneHash(request.context, request.node, request.name);
        const encodedGetDnstResult = encodeZonehash(result);
        const proofParamType = await getProofParamType();
        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetDnstResult, proof]);

    }
}
