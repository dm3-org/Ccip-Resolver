import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { mockProof } from "../mockProof";
import { OptimisimProofVerifier, StateCommitmentChain, LibAddressManager } from "typechain";
import { expect } from "chai";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { mockProofForEmptySlot } from "../mocks/mockProofForEmptySlot";

describe.only("OptimismProofVerifier", () => {
    let owner: SignerWithAddress;
    let optimismProofVerifier: OptimisimProofVerifier;
    let stateCommitmentChain: StateCommitmentChain;
    let addresManager: FakeContract<LibAddressManager>;

    const l1_provider = new ethers.providers.JsonRpcProvider(
        "https://eth-mainnet.g.alchemy.com/v2/L1PIhq_TFU7sofEqd2IJwWqhBsJYah1S"
    );

    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        const optimismProofVerifierFactory = await ethers.getContractFactory("OptimisimProofVerifier");
        const stateCommitmentChainFactory = await ethers.getContractFactory("StateCommitmentChain");
        const addresManagerFactory = await ethers.getContractFactory("Lib_AddressManager");

        stateCommitmentChain = new ethers.Contract(
            "0xBe5dAb4A2e9cd0F27300dB4aB94BeE3A233AEB19",
            stateCommitmentChainFactory.interface,
            l1_provider
        ) as StateCommitmentChain;

        addresManager = await smock.fake("Lib_AddressManager");
        addresManager.getAddress
            .whenCalledWith("StateCommitmentChain")
            .returns("0xBe5dAb4A2e9cd0F27300dB4aB94BeE3A233AEB19");

        optimismProofVerifier = (await optimismProofVerifierFactory.deploy(
            addresManager.address,
            "0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6"
        )) as OptimisimProofVerifier;
    });
    it("Resolves correct Proof for an empty slot", async () => {
        const proof = mockProofForEmptySlot;
        const responseBytes = await optimismProofVerifier.getProofValue(proof);
        console.log(responseBytes);

        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.equal("");
    });
    it("Resolves correct Proof over multiple Slots", async () => {
        const proof = mockProof;
        const responseBytes = await optimismProofVerifier.getProofValue(proof);
        console.log(responseBytes);
        const profile = {
            publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
            publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
            deliveryServices: ["foo.dm3"],
        };
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql(JSON.stringify(profile));
    });
});
