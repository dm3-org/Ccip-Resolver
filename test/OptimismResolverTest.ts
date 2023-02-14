import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers.js";
import { Contract } from "ethers";
import { keccak256, hexlify } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { TrieTestGenerator } from "./helper/trie-test-generator.js";
import { IStateCommitmentChain, LibAddressManager, OptimismResolver } from "typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { expect } from "chai";

describe("OptimismResolver", () => {
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    let addressManager: FakeContract<LibAddressManager>;
    let stateCommitmentChain: FakeContract<IStateCommitmentChain>;

    let resolver: SignerWithAddress;

    let optimismResolver: OptimismResolver;

    async function mockContracts() {
        stateCommitmentChain = await smock.fake("IStateCommitmentChain");
        //TODO find a way to test this
        stateCommitmentChain.verifyStateCommitment.returns(true);

        addressManager = await smock.fake("Lib_AddressManager");
        addressManager.getAddress.whenCalledWith("StateCommitmentChain").returns(stateCommitmentChain.address);
    }

    beforeEach(async () => {
        [user1, user2] = await ethers.getSigners();

        //TODO mock addr
        resolver = user2;

        await mockContracts();

        const optimismResolverFactory = await ethers.getContractFactory("OptimismResolver");
        optimismResolver = (await optimismResolverFactory.deploy(
            "foo.io",
            user1.address,
            addressManager.address,
            resolver.address
        )) as OptimismResolver;
    });

    it("returns dm3 profile if valid", async () => {
        const node = ethers.utils.namehash("foo.eth");
        const storageKey = keccak256(node + "00".repeat(31) + "01");
        const profile = {
            publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
            publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
            deliveryServices: ["foo.dm3"],
        };

        //The storage of the resolver smart contract account
        const storageGenerator = await TrieTestGenerator.fromNodes({
            nodes: [
                {
                    key: storageKey,
                    // 0x94 is the RLP prefix for a 20-byte string
                    val: ethers.utils.RLP.encode(ethers.utils.toUtf8Bytes(JSON.stringify(profile))),
                },
            ],
            secure: true,
        });

        const generator = await TrieTestGenerator.fromAccounts({
            accounts: [
                {
                    address: resolver.address,
                    nonce: 0,
                    balance: 0,
                    codeHash: keccak256("0x1234"),
                    storageRoot: hexlify(storageGenerator._trie.root),
                },
            ],
            secure: true,
        });
        const proof = {
            stateRoot: hexlify(generator._trie.root),
            stateRootBatchHeader: {
                batchIndex: 1,
                batchRoot: "0x0000000000000000000000000000000000000000000000000000000000000000",
                batchSize: 0,
                prevTotalElements: 0,
                extraData: "0x0000000000000000000000000000000000000000000000000000000000000000",
            },
            stateRootProof: {
                index: 0,
                siblings: ["0x0000000000000000000000000000000000000000000000000000000000000000"],
            },
            stateTrieWitness: (await generator.makeAccountProofTest(resolver.address)).accountTrieWitness,
            storageTrieWitness: (await storageGenerator.makeInclusionProofTest(storageKey)).proof,
        };

        const calldata = await optimismResolver.getResponse(node, proof);

        const responseBytes = await optimismResolver.resolveWithProof(calldata, "0x");
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql(JSON.stringify(profile));
    });
});
