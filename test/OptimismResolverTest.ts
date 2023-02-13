import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers.js";
import { Contract } from "ethers";
import { keccak256, hexlify } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { TrieTestGenerator } from "./helper/trie-test-generator.js";
import { OptimismResolver } from "typechain";

describe("OptimismResolver", () => {
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    let addressManager: Contract;
    let resolver: SignerWithAddress;

    let optimismResolver: OptimismResolver;

    beforeEach(async () => {
        [user1, user2] = await ethers.getSigners();
        addressManager = await (await ethers.getContractFactory("Lib_AddressManager")).deploy();

        //TODO mock addr
        resolver = user2;

        const optimismResolverFactory = await ethers.getContractFactory("OptimismResolver");
        optimismResolver = (await optimismResolverFactory.deploy(
            "foo.io",
            user1.address,
            addressManager.address,
            resolver.address
        )) as OptimismResolver;
    });

    it("test", async () => {
        const node = ethers.utils.namehash("foo.eth");
        const storageKey = keccak256(node + "00".repeat(31) + "01");

        const storageGenerator = await TrieTestGenerator.fromNodes({
            nodes: [
                {
                    key: storageKey,
                    // 0x94 is the RLP prefix for a 20-byte string
                    val: "0x94" + user2.address.substring(2),
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

        await optimismResolver.resolveWithProof(calldata, "0x");

        console.log(calldata);
    });
});
