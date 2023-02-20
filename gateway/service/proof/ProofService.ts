import { toRpcHexString } from "@eth-optimism/core-utils";
import {
    asL2Provider,
    CrossChainMessenger,
    L2Provider,
    makeMerkleTreeProof,
    StateRoot,
    StateRootBatchHeader,
} from "@eth-optimism/sdk";
import { BigNumber, ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { StorageHelper } from "../storage/StorageService";

const TEXTS_SLOT_NAME = 9;
const ZERO_BYTES = "0x0000000000000000000000000000000000000000000000000000000000000000";

interface StorageProof {
    key: string;
    storageTrieWitness: string;
}

interface ProofInputObject {
    target: string;
    stateRoot: string;
    stateRootBatchHeader: StateRootBatchHeader;
    stateRootProof: {
        index: number;
        siblings: string[];
    };
    stateTrieWitness: string;
    storageProofs: StorageProof[];
    length: number;
}

interface EthGetProofResponse {
    accountProof: string[];
    balance: string;
    codeHash: string;
    nonce: string;
    storageHash: string;
    storageProof: {
        key: string;
        value: string;
        proof: string[];
    }[];
}
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
    //Refactor to general OP proofer
    public async proofText(resolverAddr: string, node: string, recordName: string): Promise<ProofInputObject> {
        const slot = StorageHelper.getStorageSlot(TEXTS_SLOT_NAME, node, recordName);

        const [optimismStateRoot, blockNr] = await this.getStateRoot();
        const { storageProof, accountProof, length } = await this.getProofPerSlot(slot, blockNr, resolverAddr);

        const stateRoot = optimismStateRoot.stateRoot;
        const stateRootBatchHeader = optimismStateRoot.batch.header;
        const stateRootProof = {
            index: optimismStateRoot.stateRootIndexInBatch,
            siblings: makeMerkleTreeProof(optimismStateRoot.batch.stateRoots, optimismStateRoot.stateRootIndexInBatch),
        };
        const stateTreeWitness = ethers.utils.RLP.encode(accountProof);

        return {
            target: resolverAddr,
            stateRoot,
            storageProofs: storageProof,
            stateRootBatchHeader,
            stateRootProof,
            stateTrieWitness: stateTreeWitness,
            length,
        };
    }

    //Return also the account proof
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
        const res = await this.getProof(resolverAddr, [slot], blockNr);
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
        const proofResponse = await this.getProof(resolverAddr, slots, blocknr);

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
        return storageProofs.map(({ key, proof }) => ({
            key,
            storageTrieWitness: ethers.utils.RLP.encode(proof),
        }));
    }
    private decodeLength(slot: string) {
        const lastByte = slot.substring(slot.length - 2);
        const lastBit = parseInt(lastByte, 16) % 2;

        //If the last bit is not set it is a short type
        if (lastBit === 0) {
            //The length is encoded as length / 2
            return BigNumber.from(lastByte).div(2).toNumber();
        }
        //The length is encoded as length *2+1
        return BigNumber.from(slot).sub(1).div(2).toNumber();
    }
    private async getProof(resolverAddr: string, slots: string[], blocknr: number): Promise<EthGetProofResponse> {
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
