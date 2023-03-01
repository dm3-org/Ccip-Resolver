import { ethers } from "hardhat";
import { encodeText } from "./../encoding/text/encodeText";
import { EnsResolverService } from "../ens/EnsService";
import { getProofParamType } from "../encoding/proof/getProofParamType";
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
        const { proof, result } = await this.ensService.proofText(request.ownedNode, request.record);

        const encodedGetTextResult = encodeText(result);
        const proofParamType = await getProofParamType();

        return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [encodedGetTextResult, proof]);
    }
}
