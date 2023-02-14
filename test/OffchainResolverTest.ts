import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers.js";
import { expect } from "chai";
import { hexlify, keccak256 } from "ethers/lib/utils";
import { ethers, storageLayout } from "hardhat";
import { IStateCommitmentChain, LibAddressManager, OptimismResolver, PublicResolver } from "typechain";
import { TrieTestGenerator } from "./helper/trie-test-generator.js";
import { StorageHelper } from "../gateway/service/storage/StorageService";

describe.skip("OptimismResolver", () => {
    let owner: SignerWithAddress;
    let nameOwner: SignerWithAddress;

    let addressManager: FakeContract<LibAddressManager>;
    let stateCommitmentChain: FakeContract<IStateCommitmentChain>;

    let publicResolver: PublicResolver;

    let optimismResolver: OptimismResolver;

    async function mockContracts() {
        stateCommitmentChain = await smock.fake("IStateCommitmentChain");
        //TODO find a way to test this
        stateCommitmentChain.verifyStateCommitment.returns(true);

        addressManager = await smock.fake("Lib_AddressManager");
        addressManager.getAddress.whenCalledWith("StateCommitmentChain").returns(stateCommitmentChain.address);
    }

    beforeEach(async () => {
        [owner, nameOwner] = await ethers.getSigners();

        await mockContracts();

        const publicResolverFactory = await ethers.getContractFactory("PublicResolver");
        publicResolver = (await publicResolverFactory.deploy()) as PublicResolver;

        const optimismResolverFactory = await ethers.getContractFactory("OptimismResolver");
        optimismResolver = (await optimismResolverFactory.deploy(
            "foo.io",
            owner.address,
            addressManager.address,
            publicResolver.address
        )) as OptimismResolver;
    });

    it("returns dm3 profile if valid", async () => {
        const node = ethers.utils.namehash("foo.eth");
        const storageKey = keccak256(node + "00".repeat(31) + "01");
        const recordName = "network.dm3.eth";
        const profile = {
            publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
            publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
            deliveryServices: ["foo.dm3"],
        };
        await publicResolver.connect(nameOwner).setText(node, recordName, JSON.stringify(profile));
        await publicResolver
            .connect(nameOwner)
            .setText(ethers.utils.namehash("bar.dm3"), recordName, "fewfeewferfefeffewfEWFWFEWFWEFEEEFEWFWEF");

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
                    address: publicResolver.address,
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
            stateTrieWitness: (await generator.makeAccountProofTest(publicResolver.address)).accountTrieWitness,
            storageTrieWitness: (await storageGenerator.makeInclusionProofTest(storageKey)).proof,
        };

        const calldata = await optimismResolver.getResponse("0x", storageKey, proof);

        const responseBytes = await optimismResolver.resolveWithProof(calldata, "0x");
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql(JSON.stringify(profile));

        const nodeHash = keccak256(node);
        const recordHash = keccak256(ethers.utils.toUtf8Bytes(recordName));
        const slotIndex = "00".repeat(31) + "01";

        //keccak256(recordHash . keccak256(nodeHash slotIndex))
        //
        const finalHash = keccak256(ethers.utils.toUtf8Bytes(recordHash + keccak256(nodeHash + slotIndex)));
        const givenSlot = await ethers.provider.getStorageAt(publicResolver.address, 0);
        console.log(responseBytes.substring(2).length);
        console.log(givenSlot);
        await storageLayout.export();

        console.log(await getSlot(0, node, recordName));

        const gateway = new StorageHelper(ethers.provider, publicResolver.address);
        console.log(responseBytes);

        console.log("Gateway");
        await gateway.readFromStorage(0, node, recordName);
    });
});

const getSlot = (slot: number, node: string, recordName: string) => {
    const innerHash = ethers.utils.solidityKeccak256(["bytes32", "uint256"], [node, slot]);
    return ethers.utils.solidityKeccak256(["string", "bytes32"], [recordName, innerHash]);
};
