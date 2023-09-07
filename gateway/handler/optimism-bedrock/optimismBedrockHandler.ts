import axios from 'axios';
import { ethers } from 'ethers';

import { OptimismBedrockConfigEntry } from '../../config/Config';
import { getProofParamType } from '../../service/encoding/proof/getProofParamType';
import { ProofService } from '../../service/proof/ProofService';

export async function optimismBedrockHandler(
    calldata: string,
    resolverAddr: string,
    configEntry: OptimismBedrockConfigEntry,
) {
    /**
     * The optimism-handler has to return the following data:
     * 1. The target contract address. This is the contract deployed on Optimism that contains the state we want to resolve.
     * 2. The slot of the state we want to resolve.
     * 3. The layout of the state we want to resolve. This can be either fixed(address,bytes32,uint256) or dynamic(string,bytes,array).
     */
    const proofRequests = (await axios.get(`${configEntry.handlerUrl}/${resolverAddr}/${calldata}`)).data;

    const l1Provider = new ethers.providers.StaticJsonRpcProvider(configEntry.l1ProviderUrl);
    const l2Provider = new ethers.providers.StaticJsonRpcProvider(configEntry.l2ProviderUrl);

    /**
     * Detect the network of the providers. This is required to create the proof.
     */
    await Promise.all([l1Provider.detectNetwork(), l2Provider.detectNetwork()]);

    // for each proof request, create a proof
    const proofs = await Promise.all(
        proofRequests.map(async ({ target, slot, layout, result }) => {
            if (!target || !slot || layout === undefined) {
                throw new Error('optimismBedrockHandler : Invalid data source response');
            }

            const { proof, result: proofResult } = await new ProofService(l1Provider, l2Provider).createProof(
                target,
                slot,
                layout,
            );

            console.log('Proof result: ', proofResult);

            const proofParamType = await getProofParamType();
            return ethers.utils.defaultAbiCoder.encode(['bytes', proofParamType], [result, proof]);
        }),
    );
    // return the proofs as bytes array
    return ethers.utils.defaultAbiCoder.encode(['bytes[]'], [proofs]);
}
