import axios from "axios";
import { ethers } from "ethers";

import { OptimismBedrockConfigEntry } from "../../config/Config";
import { getProofParamType } from "../../service/encoding/proof/getProofParamType";
import { ProofService } from "../../service/proof/ProofService";

export async function optimismBedrockHandler(calldata: string, resolverAddr: string, configEntry: OptimismBedrockConfigEntry) {
    // Data source has to return target,
    const { target, slot, layout, result } = (await axios.get(`${configEntry.handlerUrl}/${resolverAddr}/${calldata}`)).data;

    if (!target || !slot || layout === undefined) {
        throw new Error("optimismBedrockHandler : Invalid data source response");
    }

    const l1Provider = new ethers.providers.StaticJsonRpcProvider(configEntry.l1ProviderUrl);
    const l2Provider = new ethers.providers.StaticJsonRpcProvider(configEntry.l2ProviderUrl);

    // TODO initialize once globally
    await Promise.all([l1Provider.detectNetwork(), l2Provider.detectNetwork()]);

    // Input arg for resolveWithProof
    const { proof } = await new ProofService(l1Provider, l2Provider).createProof(target, slot, layout);


    const proofParamType = await getProofParamType();
    return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [result, proof]);
}
