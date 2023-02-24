import { toRpcHexString } from "@eth-optimism/core-utils";
import { asL2Provider, CrossChainMessenger, L2Provider, makeMerkleTreeProof, StateRoot } from "@eth-optimism/sdk";
import { BigNumber, ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { EthGetProofResponse, ProofInputObject, StorageProof } from "./types";

export class ProofService {
    private readonly l1_provider: ethers.providers.StaticJsonRpcProvider;
    private readonly l2_provider: L2Provider<ethers.providers.StaticJsonRpcProvider>;
    private readonly crossChainMessenger: CrossChainMessenger;

    constructor(l1_provider: ethers.providers.StaticJsonRpcProvider, l2_provider: ethers.providers.JsonRpcProvider) {
        this.l1_provider = l1_provider;
        this.l2_provider = asL2Provider(l2_provider);
        this.crossChainMessenger = new CrossChainMessenger({
            l1ChainId: 1,
            l2ChainId: 10,
            l1SignerOrProvider: this.l1_provider,
            l2SignerOrProvider: this.l2_provider,
        });
    }
    //Todo move to own TS type
    public async createProof(target: string, slot: string): Promise<{ proof: ProofInputObject; result: string }> {
        const [optimismStateRoot, blockNr] = await this.getStateRoot();
        const { storageProof, accountProof, length } = await this.getProofPerSlot(slot, blockNr, target);

        const stateRoot = optimismStateRoot.stateRoot;
        const stateRootBatchHeader = optimismStateRoot.batch.header;
        const stateRootProof = {
            index: optimismStateRoot.stateRootIndexInBatch,
            siblings: makeMerkleTreeProof(optimismStateRoot.batch.stateRoots, optimismStateRoot.stateRootIndexInBatch),
        };
        const stateTrieWitness = ethers.utils.RLP.encode(accountProof);

        const result = storageProof
            .reduce((agg, cur) => agg + cur.value.substring(2), "0x")
            .substring(0, length * 2 + 2);

        const proof = {
            target,
            stateRoot,
            storageProofs: storageProof,
            stateRootBatchHeader,
            stateRootProof,
            stateTrieWitness,
            length,
        };

        return { result, proof };
    }

    private async getProofPerSlot(
        initalSlot: string,
        blockNr: number,
        resolverAddr: string
    ): Promise<{ storageProof: StorageProof[]; accountProof: string[]; length: number }> {
        const slotValue = await this.l2_provider.getStorageAt(resolverAddr, initalSlot, blockNr);

        const length = this.decodeLength(slotValue);

        //Handle slots at most 31 bytes long
        if (length <= 31) {
            console.log("handle short type");
            return this.handleShortType(resolverAddr, initalSlot, blockNr, length);
        }
        console.log("handle long type");
        return this.handleLongType(initalSlot, resolverAddr, blockNr, length);
    }

    private async handleShortType(resolverAddr: string, slot: string, blockNr: number, length: number) {
        const res = await this.makeGetProofRpcCall(resolverAddr, [slot], blockNr);
        const { storageProof, accountProof } = res;

        return {
            accountProof,
            storageProof: this.mapStorageProof(storageProof),
            length,
        };
    }

    private async handleLongType(initialSlot: string, resolverAddr: string, blocknr: number, length: number) {
        const firstSlot = keccak256(initialSlot);
        const totalSlots = Math.ceil((length * 2 + 1) / 64);

        const slots = [...Array(totalSlots).keys()].map((i) => BigNumber.from(firstSlot).add(i).toHexString());
        const proofResponse = await this.makeGetProofRpcCall(resolverAddr, slots, blocknr);

        if (proofResponse.storageProof.length !== totalSlots) {
            throw "invalid proof response";
        }

        return {
            accountProof: proofResponse.accountProof,
            storageProof: this.mapStorageProof(proofResponse.storageProof),
            length,
        };
    }
    private mapStorageProof(storageProofs: EthGetProofResponse["storageProof"]): StorageProof[] {
        return storageProofs.map(({ key, proof, value }) => ({
            key,
            value,
            storageTrieWitness: ethers.utils.RLP.encode(proof),
        }));
    }
    private decodeLength(slot: string) {
        const lastByte = slot.substring(slot.length - 2);
        const lastBit = parseInt(lastByte, 16) % 2;
        //If the last bit is not set it is a short type
        if (lastBit === 0) {
            //The length is encoded as length / 2
            return BigNumber.from("0x" + lastByte)
                .div(2)
                .toNumber();
        }
        //The length is encoded as length *2+1
        return BigNumber.from(slot).sub(1).div(2).toNumber();
    }
    private async makeGetProofRpcCall(
        resolverAddr: string,
        slots: string[],
        blocknr: number
    ): Promise<EthGetProofResponse> {
        const getProofResponse = await this.l2_provider.send("eth_getProof", [
            resolverAddr,
            slots,
            toRpcHexString(blocknr),
        ]);
        return getProofResponse;
    }

    private async getStateRoot(): Promise<[StateRoot, number]> {
        const batchIndex = await this.crossChainMessenger.contracts.l1.StateCommitmentChain.getTotalBatches();
        const stateRoot = await this.crossChainMessenger.getFirstStateRootInBatch(batchIndex.toNumber() - 1);

        if (!stateRoot) {
            throw "State root not found";
        }
        const magicBlocknr = stateRoot.batch.header.prevTotalElements.add(stateRoot.stateRootIndexInBatch).add(1);
        return [stateRoot, magicBlocknr.toNumber()];
    }
}
