import { ethers } from "ethers";
import { L2_PUBLIC_RESOLVER_ADDRESS } from "./../../constants";
import { ProofService } from "../proof/ProofService";
import { ProofInputObject } from "../proof/types";

//TOdo rename to something like resolverService
export class EnsService {
    private readonly resolverAddress: string;
    private readonly proofService: ProofService;

    constructor(resolverAddress: string, proofService: ProofService) {
        this.resolverAddress = resolverAddress;
        this.proofService = proofService;
    }
    public static instance() {
        return new EnsService(L2_PUBLIC_RESOLVER_ADDRESS, new ProofService(global.l1_provider, global.l2_provider));
    }

    public proofText(node: string, recordName: string): Promise<{ proof: ProofInputObject; result: string }> {
        const TEXTS_SLOT_NAME = 9;
        const slot = EnsService.getStorageSlotForText(TEXTS_SLOT_NAME, node, recordName);
        return this.proofService.createProof(this.resolverAddress, slot);
    }
    public static getStorageSlotForText(slot: number, node: string, recordName: string) {
        const innerHash = ethers.utils.solidityKeccak256(["bytes32", "uint256"], [node, slot]);
        return ethers.utils.solidityKeccak256(["string", "bytes32"], [recordName, innerHash]);
    }
}
