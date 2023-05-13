import { expect } from "chai";
import { ethers } from "hardhat";
import {
    L2PublicResolver,
    L2PublicResolver__factory,
    LibAddressManager,
    BedrockProofVerifier,
    L2OutputOracle__factory,
    L2OutputOracle,
} from "typechain";
import { ProofService } from "../../gateway/service/proof/ProofService";
import { EnsResolverService } from "../../gateway/service/ens/EnsService";

const PUBLIC_RESOLVER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
describe("ProofServiceTest", () => {
    let l2OutputOracle: L2OutputOracle;
    let BedrockProofVerifier: BedrockProofVerifier;
    let publicResolver: L2PublicResolver;

    const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
    const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");

    //0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014");

    beforeEach(async () => {
        const l2OutputOracleFactory = (await ethers.getContractFactory("L2OutputOracle")) as L2OutputOracle__factory;
        //See github.com/ethereum-optimism/optimism/op-bindings/predeploys/dev_addresses.go
        l2OutputOracle = l2OutputOracleFactory.attach("0x6900000000000000000000000000000000000000").connect(l1Provider);

        const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockProofVerifier");
        BedrockProofVerifier = (await BedrockProofVerifierFactory.deploy(l2OutputOracle.address)) as BedrockProofVerifier;

        const factory = (await ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;
        publicResolver = await factory.attach(PUBLIC_RESOLVER_ADDRESS).connect(l2Provider);
    });

    it("empy slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const node = ethers.utils.namehash("alice1234.eth");
        const recordName = "empy-slot";

        const ownedNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, publicResolver.address])
        );

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof } = await proofService.createProof(PUBLIC_RESOLVER_ADDRESS, slot);

        expect(proof.length).to.be.equal(0);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.equal("");
    });
    it("sinlge slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const recordName = "foo";

        const ownedNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [ethers.utils.namehash("alice.eth"), alice.address])
        );

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof } = await proofService.createProof(PUBLIC_RESOLVER_ADDRESS, slot);

        expect(proof.length).to.be.equal(3);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql("bar");
    });
    it("sinlge slot 31 bytes long", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const recordName = "my-slot";

        const ownedNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [ethers.utils.namehash("alice.eth"), alice.address])
        );

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof } = await proofService.createProof(PUBLIC_RESOLVER_ADDRESS, slot);

        const responseBytes = await BedrockProofVerifier.getProofValue(proof);
        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

        expect(responseString).to.eql("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    });
    it("multislot slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const node = ethers.utils.namehash("alice.eth");
        const recordName = "network.dm3.eth";

        const ownedNode = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, alice.address]));

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof } = await proofService.createProof(PUBLIC_RESOLVER_ADDRESS, slot);
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
