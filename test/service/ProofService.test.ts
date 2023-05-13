import { expect } from "chai";
import { ethers } from "hardhat";
import { L2PublicResolver, L2PublicResolver__factory, LibAddressManager, BedrockProofVerifier } from "typechain";
import { ProofService } from "../../gateway/service/proof/ProofService";
import { EnsResolverService } from "../../gateway/service/ens/EnsService";
describe("ProofServiceTest", () => {
    let BedrockProofVerifier: BedrockProofVerifier;
    let publicResolver: L2PublicResolver;

    const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
    const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");

    const whale = new ethers.Wallet("ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014");

    beforeEach(async () => {
        //TODO ensure that testnet runs!!!!
        const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockProofVerifier");

        BedrockProofVerifier = (await BedrockProofVerifierFactory.deploy(
            //See github.com/ethereum-optimism/optimism/op-bindings/predeploys/dev_addresses.go
            "0x6900000000000000000000000000000000000000"
        )) as BedrockProofVerifier;

        //Todo enable dynamic creation
        const factory = (await ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

        publicResolver = await factory.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0").connect(l2Provider);

        const prepareTestSingleSlot = async () => {
            //Prepare test single slot
            const node = ethers.utils.namehash("alice.eth");

            await publicResolver.connect(alice.connect(l2Provider)).setText(node, "foo", "bar");
        };

        //Prepare test 31 byte
        const prepareTest31yte = async () => {
            const node = ethers.utils.namehash("alice.eth");
            const recordName = "my-slot";

            await publicResolver.connect(alice.connect(l2Provider)).setText(node, recordName, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        };

        //await prepareTest31yte();
        const prepeTestMultipleSlots = async () => {
            const node = ethers.utils.namehash("alice.eth");
            const recordName = "network.dm3.eth";

            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };

            await publicResolver.connect(alice.connect(l2Provider)).setText(node, recordName, JSON.stringify(profile));
        };
        // await prepeTestMultipleSlots();
    });

    it("empy slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const node = ethers.utils.namehash("alice1234.eth");
        const recordName = "empy-slot";

        const ownedNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, publicResolver.address])
        );

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof, result } = await proofService.createProof("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", slot);

        expect(proof.length).to.be.equal(0);

        const responseString = Buffer.from(result.slice(2), "hex").toString();
        expect(responseString).to.be.equal("");
    });
    it("sinlge slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const recordName = "foo";

        const ownedNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [ethers.utils.namehash("alice.eth"), alice.address])
        );

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof, result } = await proofService.createProof("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", slot);

        expect(proof.length).to.be.equal(3);

        const responseString = Buffer.from(result.slice(2), "hex").toString();
        expect(responseString).to.be.equal("bar");
    });
    it("sinlge slot 31 bytes long", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const recordName = "my-slot";

        const ownedNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [ethers.utils.namehash("alice.eth"), alice.address])
        );

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof, result } = await proofService.createProof("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", slot);

        expect(proof.length).to.be.equal(31);
        const responseString = Buffer.from(result.slice(2), "hex").toString();
        expect(responseString).to.be.equal("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    });
    it("multislot slot", async () => {
        const proofService = new ProofService(l1Provider, l2Provider);

        const node = ethers.utils.namehash("alice.eth");
        const recordName = "network.dm3.eth";

        const ownedNode = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, alice.address]));

        const slot = EnsResolverService.getStorageSlotForText(7, 0, ownedNode, recordName);
        const { proof, result } = await proofService.createProof("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", slot);

        const profile = {
            publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
            publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
            deliveryServices: ["foo.dm3"],
        };
        expect(proof.length).to.be.equal(JSON.stringify(profile).length);
        const responseString = Buffer.from(result.slice(2), "hex").toString();
        expect(responseString).to.be.equal(JSON.stringify(profile));
    });
});
