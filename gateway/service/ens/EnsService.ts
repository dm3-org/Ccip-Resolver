import { ethers, ethers as hreEthers } from "hardhat";
import { L2PublicResolver, L2PublicResolver__factory } from "typechain";
import { ProofService } from "../proof/ProofService";
import { CreateProofResult } from "../proof/types";
import { getPublicResolverAddress } from "./../../constants";

/**
 * This class provides the storage location for different for the particular fiels of the PublicResolverContract
 */
export class EnsResolverService {
    private readonly l2PublicResolver: L2PublicResolver;
    private readonly proofService: ProofService;

    constructor(l2PublicResolver: L2PublicResolver, proofService: ProofService) {
        this.l2PublicResolver = l2PublicResolver;
        this.proofService = proofService;
    }
    public static async instance() {
        const l2PublicResolverFactory = (await hreEthers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

        const l2PublicResolver = await l2PublicResolverFactory.attach(getPublicResolverAddress()).connect(global.l2_provider);
        return new EnsResolverService(l2PublicResolver, ProofService.instance());
    }

    public async proofText(context: string, node: string, recordName: string): Promise<CreateProofResult> {
        //The storage slot within the particular contract
        const TEXTS_SLOT_NAME = 2;

        const version = await this.l2PublicResolver.recordVersions(context, node);
        const slot = EnsResolverService.getStorageSlotForText(TEXTS_SLOT_NAME, version.toNumber(), context, node, recordName);

        return this.proofService.createProof(this.l2PublicResolver.address, slot);
    }
    public async proofAddr(context: string, node: string, coinType: number): Promise<CreateProofResult> {
        //The storage slot within the particular contract
        const ADDR_SLOT_NAME = 1;
        const version = await this.l2PublicResolver.recordVersions(context, node);

        const slot = EnsResolverService.getStorageSlotForAddr(ADDR_SLOT_NAME, version.toNumber(), context, node, coinType);

        return this.proofService.createProof(this.l2PublicResolver.address, slot);
    }
    public async proofAbi(context: string, node: string, contentType: number): Promise<CreateProofResult> {
        //The storage slot within the particular contract
        const ABI_SLOT_NAME = 3;
        const version = await this.l2PublicResolver.recordVersions(context, node);

        const slot = EnsResolverService.getStorageSlotForAbi(ABI_SLOT_NAME, version.toNumber(), context, node, contentType);


        return this.proofService.createProof(this.l2PublicResolver.address, slot);
    }
    public async proofContentHash(context: string, node: string): Promise<CreateProofResult> {
        //The storage slot within the particular contract
        const ABI_SLOT_NAME = 4;
        const version = await this.l2PublicResolver.recordVersions(context, node);

        const slot = EnsResolverService.getStorageSlotForContentType(ABI_SLOT_NAME, version.toNumber(), context, node);
        return this.proofService.createProof(this.l2PublicResolver.address, slot);
    }

    public static getStorageSlotForText(slot: number, versionNumber: number, context: string, node: string, recordName: string) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const middleHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["string", "bytes32"], [recordName, middleHash]);
        return outerHash;
    }
    public static getStorageSlotForAddr(slot: number, versionNumber: number, context: string, node: string, coinType: number) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [coinType, nodeHash]);
        return outerHash;
    }
    public static getStorageSlotForAbi(slot: number, versionNumber: number, context: string, node: string, contentType: number) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const nodeHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [contentType, nodeHash]);
        return outerHash;
    }
    public static getStorageSlotForContentType(slot: number, versionNumber: number, context: string, node: string,) {
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const contextHash = hreEthers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
        return outerHash;
    }

}
