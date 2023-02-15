import { BigNumber, Contract, ethers } from "ethers";
import { makeStateTrieProof, asL2Provider, L2Provider } from "@eth-optimism/sdk";
import { StorageHelper } from "../storage/StorageService";
import { keccak256 } from "ethers/lib/utils";

const TEXTS_SLOT_NAME = 9;
const ZERO_BYTES = "0x0000000000000000000000000000000000000000000000000000000000000000";

interface StorageProof {
    key: string;
    value: string;
    proof: string[];
}
export class ProofService {
    private readonly l2_provider: L2Provider<ethers.providers.StaticJsonRpcProvider>;

    constructor(l2_provider: ethers.providers.JsonRpcProvider) {
        this.l2_provider = asL2Provider(l2_provider);
    }

    public async proofText(resolverAddr: string, node: string, recordName: string) {
        const blocknr = await this.l2_provider.getBlockNumber();
        const slot = StorageHelper.getStorageSlot(TEXTS_SLOT_NAME, node, recordName);

        const proofs = await this.iterateOverStorage(slot, blocknr, resolverAddr);

        console.log(proofs);
    }

    private async iterateOverStorage(initalSlot: string, blockNr: number, resolverAddr: string) {
        const getProofResponse = await makeStateTrieProof(this.l2_provider, blockNr, resolverAddr, initalSlot);

        const value = getProofResponse.storageValue.toHexString();
        if (value === ZERO_BYTES) {
            console.log("Slot empty");
            //TODO figure out how to proof empty slot
            return;
        }

        const lastByte = value.substring(value.length - 2);
        const lastBit = parseInt(lastByte, 16) % 2;

        const storageProof: StorageProof = {
            key: initalSlot,
            value,
            proof: getProofResponse.storageProof,
        };

        if (lastBit === 0) {
            console.log("SINGLE SLOT");
            return storageProof;
        }

        const length = BigNumber.from(value).toNumber() + 2;
        const consequentStorageProofs = await this.proofComplexData(initalSlot, length, resolverAddr);

        return [storageProof, ...consequentStorageProofs];
    }
    private async proofComplexData(initialSlot: string, length: number, resolverAddr: string) {
        const firstSlot = keccak256(initialSlot);
        const totalSlots = Math.ceil(length / 64);

        const slots = [...Array(totalSlots).keys()].map((i) => BigNumber.from(firstSlot).add(i).toHexString());
        const getProofResponse = await this.l2_provider.send("eth_getProof", [resolverAddr, slots, "latest"]);

        return getProofResponse.storageProof;
    }
}
