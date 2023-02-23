import { StateRootBatchHeader } from "@eth-optimism/sdk";

export interface EthGetProofResponse {
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

export interface ProofInputObject {
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
export interface StorageProof {
    key: string;
    value: string;
    storageTrieWitness: string;
}
