import { ethers } from "hardhat";

import { EnsService } from "../ens/EnsService";
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

        //Encode the proof so it can be used as calldata for the getProofValue function
        const iOptimismProofVerifier = (await ethers.getContractFactory("OptimisimProofVerifier")).interface;

        const iTextResolver = new ethers.utils.Interface([
            "function text(bytes32 node, string calldata key) external view returns (string memory)",
        ]);

        //The return type of getText should be the value of as a string.
        const getTextResult = iTextResolver.encodeFunctionResult("text(bytes32,string)", [
            Buffer.from(result.slice(2), "hex").toString(),
        ]);
        console.log(proof.length);
        return ethers.utils.defaultAbiCoder.encode(
            ["bytes", iOptimismProofVerifier.fragments[1].inputs[0]],
            [getTextResult, proof]
        );
    }
}
