import axios from "axios";
import { ethers } from "ethers";

import { OptimismBedrockConfigEntry } from "../../config/Config";
import { getProofParamType } from "../../service/encoding/proof/getProofParamType";
import { ProofService } from "../../service/proof/ProofService";
import { dnsEncode } from "ethers/lib/utils";

export async function optimismBedrockHandler(calldata: string, resolverAddr: string, configEntry: OptimismBedrockConfigEntry) {
    // Data source has to return target,
    const { target, slot, layout, result } = (await axios.get(`${configEntry.handlerUrl}/${resolverAddr}/${calldata}`)).data;

    if (!target || !slot || layout === undefined) {
        throw new Error("optimismBedrockHandler : Invalid data source response");
    }
    const l1Provider = new ethers.providers.StaticJsonRpcProvider(
        configEntry.l1ProviderUrl,
        {
            chainId: parseInt(configEntry.l1chainId),
            name: "goerli"
        }
    );

    const l2Provider = new ethers.providers.StaticJsonRpcProvider(
        configEntry.l2ProviderUrl, {
        chainId: parseInt(configEntry.l2chainId),
        name: "op"
    });


    // Input arg for resolveWithProof
    const { proof } = await new ProofService(l1Provider, l2Provider).createProof(target, slot, layout);

    console.log(result)
    console.log("proof")

    const iface = new ethers.utils.Interface([
        "function resolve(bytes calldata name, bytes calldata data) external view returns(bytes)",
        "function text(bytes32 node, string calldata key) external view returns (string memory)"
    ]);

    const inner = iface.encodeFunctionResult("text", ["my-record"]);
    const encodedResult = iface.encodeFunctionResult("resolve", [inner]);
    return encodedResult;

    console.log(encodedResult)



    const proofParamType = await getProofParamType();
    return ethers.utils.defaultAbiCoder.encode(["bytes", "bytes"], [encodedResult, "0x"]);
}
