import { ethers } from "hardhat";

import { mockProofOfMultislot } from "test/mocks/mockProofForMultislot";
import { EnsService } from "../ens/EnsService";
import { ProofService } from "../proof/ProofService";
import { ProofInputObject } from "../proof/types";
import { OptimisimProofVerifier, IOptimismProofVerifier__factory } from "typechain";

export class CcipRouter {
    private readonly resolverAddress: string;
    constructor(resolverAddress: string) {
        this.resolverAddress = resolverAddress;
    }
    public async handleRequest(signature: string, request: any) {
        switch (signature) {
            case "text(bytes32,string)":
                return await this.handleText(request);
            default:
                return null;
        }
    }

    private handleText(request: any) {
        //Todo implement proper request
        const proof = mockProofOfMultislot;
        return true;
    }
    private async encodeProof(proof: ProofInputObject) {
        const interface = (await ethers.getContractFactory("IOptimisimProofVerifier")).interface;

        interface.encodeFunctionData()

        const myStructData = ethers.utils.AbiCoder.prototype.encode(["address", "uint", "bool"], [a, b, c]);
        return ethers.utils.defaultAbiCoder.encode(["bytes", "uint64", "bytes"], [result, validUntil, sig]);
    }
}
