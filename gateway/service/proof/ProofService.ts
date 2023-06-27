import { toRpcHexString } from "@eth-optimism/core-utils";
import { asL2Provider, CrossChainMessenger, L2Provider } from "@eth-optimism/sdk";
import { BigNumber, ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { CreateProofResult, EthGetProofResponse, StorageProof } from "./types";


export enum StorageLayout {
    /**
     * address,uint,bytes32,bool
     */
    FIXED,
    /**
     * array,bytes,string
     */
    DYNAMIC
}
/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network. It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class ProofService {
    private readonly l1_provider: ethers.providers.StaticJsonRpcProvider;
    private readonly l2_provider: L2Provider<ethers.providers.StaticJsonRpcProvider>;
    private readonly crossChainMessenger: CrossChainMessenger;

    constructor(l1_provider: ethers.providers.StaticJsonRpcProvider, l2_provider: ethers.providers.JsonRpcProvider) {
        this.l1_provider = l1_provider;
        this.l2_provider = asL2Provider(l2_provider);

        this.crossChainMessenger = new CrossChainMessenger({
            l1ChainId: l1_provider.network.chainId,
            l2ChainId: l2_provider.network.chainId,
            l1SignerOrProvider: this.l1_provider,
            l2SignerOrProvider: this.l2_provider,
        });
    }

    /**
     * Creates a {@see CreateProofResult} for a given target and slot.
     * @param target The address of the smart contract that contains the storage slot
     * @param slot The storage slot the proof should be created for
     */

    public async createProof(target: string, slot: string, layout: StorageLayout = StorageLayout.DYNAMIC): Promise<CreateProofResult> {
        //use the most recent block to build the proof posted to L1
        const { l2OutputIndex, number, stateRoot, hash } = await this.getLatestProposedBlock();

        const { storageProof, storageHash, accountProof, length } = await this.getProofForSlot(slot, number, target, layout);

        //The messengePasserStorageRoot is important for the verification on chain
        const messagePasserStorageRoot = await this.getMessagePasserStorageRoot(number);

        const proof = {
            layout: layout,
            //The contract address of the slot beeing proofed
            target,
            //The length actual length of the value
            length,
            //RLP encoded account proof
            stateTrieWitness: ethers.utils.RLP.encode(accountProof),
            //The state output the proof is beeing created for
            l2OutputIndex,
            //The storage hash of the target
            storageHash,
            //Bedrock OutputRootProof type
            outputRootProof: {
                version: ethers.constants.HashZero,
                stateRoot,
                messagePasserStorageRoot,
                latestBlockhash: hash,
            },
            //RLP encoded storage proof for every slot
            storageProofs: storageProof,
        };



        //The result is not part of the proof but its convenient to have it i:E in tests
        const result = storageProof.reduce((agg, cur) => agg + cur.value.substring(2), "0x").substring(0, length * 2 + 2);
        return { result, proof };
    }
    /**
     * Retrieves the latest proposed block.
     * @returns An object containing the state root, hash, number, and L2 output index of the latest proposed block.
     * @throws An error if the state root for the block is not found.
     */
    private async getLatestProposedBlock() {
        //Get the latest ouput from the L2Oracle. We're building the proove with this batch
        //We go 5 batches backwards to avoid erros like delays between nodes
        const l2OutputIndex = (await this.crossChainMessenger.contracts.l1.L2OutputOracle.latestOutputIndex()).sub(5);
        const output = await this.crossChainMessenger.contracts.l1.L2OutputOracle.getL2Output(l2OutputIndex);

        const { stateRoot, hash } = (await this.l2_provider.getBlock(output.l2BlockNumber.toNumber())) as any;

        if (!stateRoot) {
            throw new Error(`StateRoot for block ${output.l2BlockNumber.toNumber()} not found`);
        }

        return { stateRoot, hash, number: output.l2BlockNumber.toNumber(), l2OutputIndex: l2OutputIndex.toNumber() };
    }


    /**
     * Creates the actual proof using the eth_proof RPC method. To get an better understanding how the storage layout looks like visit {@link https://docs.soliditylang.org/en/v0.8.17/internals/layout_in_storage.html}
     */
    private async getProofForSlot(
        initalSlot: string,
        blockNr: number,
        resolverAddr: string,
        layout: StorageLayout
    ): Promise<{ storageProof: StorageProof[]; accountProof: string[]; storageHash: string; length: number }> {

        if (layout === StorageLayout.FIXED) {
            /**
            * Since we're prooving one entrie slot the length is always 32
            */
            return this.handleShortType(resolverAddr, initalSlot, blockNr, 32)
        }
        //The initial value. We used it to determine how many slots we need to proof
        //See https://docs.soliditylang.org/en/v0.8.17/internals/layout_in_storage.html#mappings-and-dynamic-arrays
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
    private async handleShortType(resolverAddr: string, slot: string, blockNr: number, length: number) {
        const res = await this.makeGetProofRpcCall(resolverAddr, [slot], blockNr);
        const { storageProof, accountProof, storageHash } = res;
        return {
            accountProof,
            storageProof: this.mapStorageProof(storageProof),
            storageHash,
            length,
        };
    }

    private async handleLongType(initialSlot: string, resolverAddr: string, blocknr: number, length: number) {
        //For long types the initial slot just contains the length of the entire data structure. We're using this information to calculate the number of slots we need to request.
        const totalSlots = Math.ceil((length * 2 + 1) / 64);

        //The first slot is the keccak256 hash of the initial slot. After that the slots are calculated by adding 1 to the previous slot.
        const firstSlot = keccak256(initialSlot);
        //Computing the address of every other slot
        const slots = [...Array(totalSlots).keys()].map((i) => BigNumber.from(firstSlot).add(i).toHexString());
        //After we've calculated all slots we can request the proof for all of them for the blockNr the stateRoot is based on
        const { accountProof, storageProof, storageHash } = await this.makeGetProofRpcCall(resolverAddr, slots, blocknr);

        return {
            accountProof: accountProof,
            storageProof: this.mapStorageProof(storageProof),
            storageHash: storageHash,
            length,
        };
    }
    /**
     * Retrieves the storage hash for the L2ToL1MessagePassercontract. This hash is part of every outputRoot posted by the L2OutputOracle.
     *To learn more about Bedrock commitments visits @link {https://github.com/ethereum-optimism/optimism/blob/develop/specs/proposals.md#l2-output-commitment-construction}
     * @param blockNr The block number for which to fetch the storage hash.
     * @returns A promise that resolves to the storage hash.
     */
    private async getMessagePasserStorageRoot(blockNr: number) {
        const { storageHash } = await this.makeGetProofRpcCall(
            this.crossChainMessenger.contracts.l2.BedrockMessagePasser.address,
            [],
            blockNr
        );

        return storageHash;
    }
    /**
     * Makes an RPC call to retrieve the proof for the specified resolver address, slots, and block number.
     * @param resolverAddr The resolver address for which to fetch the proof.
     * @param slots The slots for which to fetch the proof.
     * @param blocknr The block number for which to fetch the proof.
     * @returns A promise that resolves to the proof response.
     */
    private async makeGetProofRpcCall(resolverAddr: string, slots: string[], blocknr: number): Promise<EthGetProofResponse> {
        return await this.l2_provider.send("eth_getProof", [resolverAddr, slots, toRpcHexString(blocknr)]);
    }
    /**
     * RLP encodes the storage proof
     * @param storageProofs The storage proofs to be mapped.
     * @returns An array of mapped storage proofs.
     */
    private mapStorageProof(storageProofs: EthGetProofResponse["storageProof"]): StorageProof[] {
        return storageProofs.map(({ key, proof, value }) => ({
            key,
            value,
            //The contracts needs the merkle proof RLP encoded
            storageTrieWitness: ethers.utils.RLP.encode(proof),
        }));
    }
}
