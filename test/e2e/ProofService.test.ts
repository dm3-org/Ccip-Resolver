import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { BedrockProofVerifier, ProofServiceTestContract__factory } from "typechain";

import { ProofService, StorageLayout } from "../../gateway/service/proof/ProofService";

const PROOF_SERVICE_TEST_CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

describe("ProofServiceTest", () => {
    let bedrockProofVerifier: BedrockProofVerifier;

    const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
    const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");

    beforeEach(async () => {
        // See github.com/ethereum-optimism/optimism/op-bindings/predeploys/dev_addresses.go
        const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockProofVerifier");
        bedrockProofVerifier = (await BedrockProofVerifierFactory.deploy(
            "0x6900000000000000000000000000000000000000"
        )) as BedrockProofVerifier;
    });

    it("bool slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(PROOF_SERVICE_TEST_CONTRACT, ethers.constants.HashZero, StorageLayout.FIXED);

        const responseBytes = await bedrockProofVerifier.getProofValue(proof);
        expect(responseBytes).to.equal("0x01");
    });
    it("bytes32 slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(
            PROOF_SERVICE_TEST_CONTRACT,
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            StorageLayout.FIXED
        );

        const responseBytes = await bedrockProofVerifier.getProofValue(proof);
        expect(responseBytes).to.equal(ethers.utils.namehash("alice.eth"));
    });

    it("address slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(
            PROOF_SERVICE_TEST_CONTRACT,
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            StorageLayout.FIXED
        );

        const responseBytes = await bedrockProofVerifier.getProofValue(proof);
        expect(ethers.utils.getAddress(responseBytes)).to.equal("0x8111DfD23B99233a7ae871b7c09cCF0722847d89");
    });
    it("uint slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(
            PROOF_SERVICE_TEST_CONTRACT,
            "0x0000000000000000000000000000000000000000000000000000000000000003",
            StorageLayout.FIXED
        );

        const responseBytes = await bedrockProofVerifier.getProofValue(proof);
        expect(BigNumber.from(responseBytes).toNumber()).to.equal(123);
    });
    it("bytes slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(
            PROOF_SERVICE_TEST_CONTRACT,
            "0x0000000000000000000000000000000000000000000000000000000000000004",
            StorageLayout.DYNAMIC
        );

        const responseBytes = await bedrockProofVerifier.getProofValue(proof);
        expect(responseBytes).to.equal(ethers.utils.namehash("alice.eth"));
    });
    it("string slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(
            PROOF_SERVICE_TEST_CONTRACT,
            "0x0000000000000000000000000000000000000000000000000000000000000005",
            StorageLayout.DYNAMIC
        );

        const responseBytes = await bedrockProofVerifier.getProofValue(proof);
        expect(Buffer.from(responseBytes.slice(2), "hex").toString()).to.equal("Hello from Alice");
    });
    it("long string slot", async () => {
        const longString =
            "Praesent elementum ligula et dolor varius lobortis. Morbi eget eleifend augue.Nunc quis lectus in augue feugiat malesuada vitae sed lacus. Aenean suscipit tristique mauris a blandit. Maecenas ut lectus quis metus commodo tincidunt. Aliquam erat volutpat. Fusce non erat malesuada, consequat mauris id, tincidunt nisi. Aenean a pulvinar ex. Mauris ullamcorper eget odio nec eleifend. Donec pellentesque et tellus id consectetur. Nullam dictum, felis sit amet consectetur convallis, leo lorem rhoncus nulla, eget tincidunt leo erat sit amet urna. Quisque urna turpis, lobortis laoreet nunc at, fermentum ultrices neque.Proin dignissim enim non arcu elementum tempor.Donec convallis turpis at erat luctus, eget pellentesque augue blandit.In faucibus rhoncus mollis.Phasellus malesuada, mauris ut finibus venenatis, ex risus consectetur dolor, quis suscipit augue magna iaculis leo.Proin non nibh at justo porttitor sollicitudin.Pellentesque id malesuada tellus.Aliquam condimentum accumsan ex eu vulputate.Aenean faucibus a quam vitae tincidunt.Fusce vitae mollis nunc, at volutpat ex.Vestibulum sed tellus urna.Donec ac urna lectus.Phasellus a dolor elit.Aenean bibendum hendrerit elit, in cursus sem maximus id.Sed porttitor nulla non consectetur vehicula.Fusce elementum, urna in gravida accumsan, lectus arcu congue augue, at rhoncus purus nunc ac libero.";

        const proofService = new ProofService(l1Provider, l2Provider);
        const { proof } = await proofService.createProof(
            PROOF_SERVICE_TEST_CONTRACT,
            "0x0000000000000000000000000000000000000000000000000000000000000006",
            StorageLayout.DYNAMIC
        );

        const responseBytes = await bedrockProofVerifier.getProofValue(proof);
        expect(Buffer.from(responseBytes.slice(2), "hex").toString()).to.equal(longString);
    });
});
