import { BigNumber, Contract, ethers } from "ethers";
import { makeStateTrieProof } from "@eth-optimism/sdk";

export class ProofService {
    private readonly l2_provider: ethers.providers.JsonRpcProvider;

    constructor(l2_provider: ethers.providers.JsonRpcProvider) {
        this.l2_provider = l2_provider;
    }

    public async proofText(contractAddress: string) {
        const blocknr = await this.l2_provider.getBlockNumber();
        const p = await makeStateTrieProof(this.l2_provider, blocknr, contractAddress, "0");
        console.log(p);
    }
}
