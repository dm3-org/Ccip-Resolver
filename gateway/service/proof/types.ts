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
    outputRootProof: OutputRootProof;
    storageProofs: StorageProof[];
    length: number;
}
export interface StorageProof {
    key: string;
    value: string;
    storageTrieWitness: string;
}

export interface CreateProofResult {
    proof: ProofInputObject;
    result: string;
}

type bytes32 = string;
/**
 *   struct OutputRootProof {
        bytes32 version;
        bytes32 stateRoot;
        bytes32 messagePasserStorageRoot;
        bytes32 latestBlockhash;
    }
 */
export interface OutputRootProof {
    version: bytes32;
    stateRoot: bytes32;
    messagePasserStorageRoot: bytes32;
    latestBlockhash: bytes32;
}
