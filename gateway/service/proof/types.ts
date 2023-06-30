import { StorageLayout } from "./ProofService";

export interface EthGetProofResponse {
    accountProof: string;
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
    layout: StorageLayout;
    target: string;
    length: number;
    storageHash: string;
    stateTrieWitness: string;
    l2OutputIndex: number;
    outputRootProof: OutputRootProof;
    storageProofs: StorageProof[];
}
export interface StorageProof {
    key: string;
    storageTrieWitness: string;
}

export interface CreateProofResult {
    proof: ProofInputObject;
    result: string;
}

type bytes32 = string;
export interface OutputRootProof {
    version: bytes32;
    stateRoot: bytes32;
    messagePasserStorageRoot: bytes32;
    latestBlockhash: bytes32;
}
