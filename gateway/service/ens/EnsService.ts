import { ethers as hreEthers } from "hardhat";
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

    public async proofText(node: string, recordName: string): Promise<CreateProofResult> {
        //The storage slot within the particular contract
        const TEXTS_SLOT_NAME = 7;
        const version = await this.l2PublicResolver.recordVersions(node);
        const slot = EnsResolverService.getStorageSlotForText(TEXTS_SLOT_NAME, version.toNumber(), node, recordName);
        return this.proofService.createProof(this.l2PublicResolver.address, slot);
    }
    public async proofAddr(node: string, coinType: number): Promise<CreateProofResult> {
        //The storage slot within the particular contract
        const ADDR_SLOT_NAME = 2;
        const version = await this.l2PublicResolver.recordVersions(node);
        const slot = EnsResolverService.getStorageSlotForAddr(ADDR_SLOT_NAME, version.toNumber(), node, coinType);

        return this.proofService.createProof(this.l2PublicResolver.address, slot);
    }

    public static getStorageSlotForText(slot: number, versionNumber: number, node: string, recordName: string) {
        //versionable_texts[number][node][key]
        //versionable_texts[inner][middle][outer]
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const middleHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["string", "bytes32"], [recordName, middleHash]);
        return outerHash;
    }
    public static getStorageSlotForAddr(slot: number, versionNumber: number, node: string, coinType: number) {
        //versionable_addresses[number][node][coinType]
        //versionable_texts[inner][middle][outer]
        const innerHash = hreEthers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
        const middleHash = hreEthers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
        const outerHash = hreEthers.utils.solidityKeccak256(["uint256", "bytes32"], [coinType, middleHash]);
        return outerHash;
    }
}
