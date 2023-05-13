import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BedrockProofVerifier, BedrockProofVerifier__factory, L2OutputOracle, L2OutputOracle__factory } from "typechain";
import { mockProofForEmptySlot } from "../../../mocks/mockProofForEmptySlot";
import { mockProofOfMultislot } from "../../../mocks/mockProofForMultislot";
import { mockProofForSingleSlot } from "../../../mocks/mockProofForSingleSlot";
import { mockProofForSlot31BytesLong } from "../../../mocks/mockProofForSlot31BytesLong";
import { mockProofForWrongOutputRoot } from "../../../mocks/mockProofForWrongOutputRoot";

const whale = new ethers.Wallet("ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

describe("BedrockProofVerifier", () => {
    let owner: SignerWithAddress;
    let BedrockProofVerifier: BedrockProofVerifier;
    let l2OutputOracle: L2OutputOracle;

    const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
    const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");

    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        const BedrockProofVerifierFactory = (await ethers.getContractFactory("BedrockProofVerifier")) as BedrockProofVerifier__factory;
        const l2OutputOracleFactory = (await ethers.getContractFactory("L2OutputOracle")) as L2OutputOracle__factory;

        l2OutputOracle = l2OutputOracleFactory.attach("0x6900000000000000000000000000000000000000").connect(l1Provider);

        BedrockProofVerifier = (await BedrockProofVerifierFactory.deploy(l2OutputOracle.address)) as BedrockProofVerifier;
    });

    describe("Validate Output", () => {
        it("Reverts if the output root does not match the provided block", async () => {
            const proof = mockProofForWrongOutputRoot;
            //TODO use OZ test utils
            try {
                await expect(BedrockProofVerifier.getProofValue(proof)).to.be.revertedWith("Invalid output root");
                expect(false);
            } catch (e) {
                expect(true);
            }
        });
    });
    it("Resolves correct Proof for an empty slot", async () => {
        const proof = mockProofForEmptySlot;
        const responseBytes = await BedrockProofVerifier.getProofValue(proof);

        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.equal("");
    });

    it("Resolves correct Proof for a single Slot", async () => {
        const proof = mockProofForSingleSlot;
        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql("bar");
    });
    it("Resolves correct Proof for a 31 byte long single Slot", async () => {
        const proof = mockProofForSlot31BytesLong;
        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    });
    it("Resolves correct Proof over multiple Slots", async () => {
        const proof = mockProofOfMultislot;
        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        const profile = {
            publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
            publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
            deliveryServices: ["foo.dm3"],
        };
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql(JSON.stringify(profile));
    });
});
