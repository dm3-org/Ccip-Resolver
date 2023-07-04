import axios from "axios";
import { ethers } from "ethers";

import { OptimismBedrockConfigEntry } from "../../config/Config";
import { getProofParamType } from "../../service/encoding/proof/getProofParamType";
import { ProofService } from "../../service/proof/ProofService";
import { dnsEncode } from "ethers/lib/utils";

export async function optimismBedrockHandler(calldata: string, resolverAddr: string, configEntry: OptimismBedrockConfigEntry) {
    // Data source has to return target,
    const { target, slot, layout } = (await axios.get(`${configEntry.handlerUrl}/${resolverAddr}/${calldata}`)).data;

    if (!target || !slot || layout === undefined) {
        throw new Error("optimismBedrockHandler : Invalid data source response");
    }
    const l1Provider = new ethers.providers.JsonRpcProvider(
        configEntry.l1ProviderUrl,

    );

    const l2Provider = new ethers.providers.JsonRpcProvider(
        configEntry.l2ProviderUrl
    );
    await Promise.all([l1Provider.detectNetwork(), l2Provider.detectNetwork()]);

    console.log("XXX")
    // Input arg for resolveWithProof
    const { proof, result } = await new ProofService(l1Provider, l2Provider).createProof(target, slot, layout);

    const proofParamType = await getProofParamType();
    console.log("XXX")

    return ethers.utils.defaultAbiCoder.encode(["bytes", proofParamType], [result, proof]);

}
