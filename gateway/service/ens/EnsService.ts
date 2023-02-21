import { ethers } from "ethers";
import { ProofInputObject, ProofService } from "../proof/ProofService";

const TEXTS_SLOT_NAME = 9;

export class EnsService {
    private readonly resolverAddress: string;
    private readonly proofService: ProofService;

    constructor(resolverAddress: string) {
        this.resolverAddress = resolverAddress;
    }

    public proofText(node: string, recordName: string): Promise<ProofInputObject> {
        const slot = EnsService.getStorageSlotForText(TEXTS_SLOT_NAME, node, recordName);
        return this.proofService.createProof(this.resolverAddress, slot);
    }
    public static getStorageSlotForText(slot: number, node: string, recordName: string) {
        const innerHash = ethers.utils.solidityKeccak256(["bytes32", "uint256"], [node, slot]);
        return ethers.utils.solidityKeccak256(["string", "bytes32"], [recordName, innerHash]);
    }
}
