import { expect } from "chai";
import { ethers } from "hardhat";
import { BedrockProofVerifier, ProofServiceTestContract__factory, } from "typechain";

import { ProofService, StorageLayout } from "../../gateway/service/proof/ProofService";
import { BigNumber } from "ethers";


const PROOF_SERVICE_TEST_CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

describe("ProofServiceTest", () => {
    let BedrockProofVerifier: BedrockProofVerifier;

    const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
    const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");


    beforeEach(async () => {
        //See github.com/ethereum-optimism/optimism/op-bindings/predeploys/dev_addresses.go
        const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockProofVerifier");
        BedrockProofVerifier = (await BedrockProofVerifierFactory.deploy(
            "0x6900000000000000000000000000000000000000"
        )) as BedrockProofVerifier;
    });

    it("bool slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(PROOF_SERVICE_TEST_CONTRACT, ethers.constants.HashZero, StorageLayout.FIXED);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        expect(responseBytes).to.equal("0x01");
    })
    it("bytes32 slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(PROOF_SERVICE_TEST_CONTRACT, "0x0000000000000000000000000000000000000000000000000000000000000001", StorageLayout.FIXED);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        expect(responseBytes).to.equal(ethers.utils.namehash("alice.eth"));
    })

    it("address slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(PROOF_SERVICE_TEST_CONTRACT, "0x0000000000000000000000000000000000000000000000000000000000000002", StorageLayout.FIXED);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        expect(ethers.utils.getAddress(responseBytes)).to.equal("0x8111DfD23B99233a7ae871b7c09cCF0722847d89");
    })
    it("uint slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(PROOF_SERVICE_TEST_CONTRACT, "0x0000000000000000000000000000000000000000000000000000000000000003", StorageLayout.FIXED);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        expect(BigNumber.from(responseBytes).toNumber()).to.equal(123);
    })
    it("bytes slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(PROOF_SERVICE_TEST_CONTRACT, "0x0000000000000000000000000000000000000000000000000000000000000004", StorageLayout.DYNAMIC);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        expect(responseBytes).to.equal(ethers.utils.namehash("alice.eth"));
    })
    it("string slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(PROOF_SERVICE_TEST_CONTRACT, "0x0000000000000000000000000000000000000000000000000000000000000005", StorageLayout.DYNAMIC);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        expect(Buffer.from(responseBytes.slice(2), "hex").toString()).to.equal("Hello from Alice");
    })
});
