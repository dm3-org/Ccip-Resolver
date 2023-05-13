import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BedrockProofVerifier, BedrockProofVerifier__factory, L2OutputOracle, L2OutputOracle__factory } from "typechain";
import { mockProofForEmptySlot } from "../../../mocks/mockProofForEmptySlot";
import { mockProofOfMultislot } from "../../../mocks/mockProofForMultislot";
import { mockProofForSingleSlot } from "../../../mocks/mockProofForSingleSlot";
import { mockProofForSlot31BytesLong } from "../../../mocks/mockProofForSlot31BytesLong";

const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");
describe.skip("BedrockProofVerifier", () => {
    let owner: SignerWithAddress;
    let BedrockProofVerifier: BedrockProofVerifier;
    let l2OutputOracle: L2OutputOracle;

    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        const l2OutputOracleFactory = (await ethers.getContractFactory("L2OutputOracle")) as L2OutputOracle__factory;
        l2OutputOracle = l2OutputOracleFactory.attach("0x6900000000000000000000000000000000000000").connect(l1Provider);

        const BedrockProofVerifierFactory = (await ethers.getContractFactory("BedrockProofVerifier")) as BedrockProofVerifier__factory;

        BedrockProofVerifier = (await BedrockProofVerifierFactory.deploy(l2OutputOracle.address)) as BedrockProofVerifier;
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
