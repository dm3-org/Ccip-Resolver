import axios from 'axios';


import { OptimismBedrockConfigEntry } from '../../config/Config';
import { ProofService } from '../../service/proof/ProofService';
import { ethers } from 'hardhat';
import { getProofParamType } from "../../service/encoding/proof/getProofParamType";

export async function optimismBedrockHandler(
    calldata: string,
    resolverAddr: string,
    configEntry: OptimismBedrockConfigEntry,
) {
    //Data source has to return target, 
    const { target, slot, layout, } = (
        await axios.get(`${configEntry.handlerUrl}/${resolverAddr}/${calldata}`)
    ).data;

    console.log("optimismBedrockHandler : ", target, slot, layout);
    if (!target || !slot || !!layout) {
        throw new Error("optimismBedrockHandler : Invalid data source response");
    }

    const l1Provider = new ethers.providers.StaticJsonRpcProvider(configEntry.l1providerUrl)
    const l2Provider = new ethers.providers.StaticJsonRpcProvider(configEntry.l2providerUrl)

    //TODO initialize once globally
    await Promise.all([
        l1Provider.detectNetwork(),
        l2Provider.detectNetwork(),
    ])

    //Input arg for resolveWithProof
    const { proof, result } = await new ProofService(
        l1Provider, l2Provider
    ).createProof(target, slot, layout);


    const proofParamType = await getProofParamType();
    return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [result, proof]);


}
