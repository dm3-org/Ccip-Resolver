import { ethers } from "hardhat";
import { encodeText } from "./../encoding/text/encodeText";
import { EnsService } from "../ens/EnsService";
import { getProofParamType } from "../encoding/proof/getProofParamType";
export class CcipRouter {
    private readonly ensService: EnsService;

    constructor(ensService: EnsService) {
        this.ensService = ensService;
    }
    public static instance() {
        return new CcipRouter(EnsService.instance());
    }
    public async handleRequest(signature: string, request: any) {
        switch (signature) {
            case "text(bytes32,string)":
                return await this.handleText(request);
            default:
                return null;
        }
    }

    private async handleText(request: any) {
        const { proof, result } = await this.ensService.proofText(request.ownedNode, request.record);

        const encodedGetTextResult = encodeText(result);
        const proofParamType = await getProofParamType();

        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetTextResult, proof]);
    }
}
