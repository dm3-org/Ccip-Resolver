import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { LibAddressManager, OptimisimProofVerifier, StateCommitmentChain } from "typechain";
import { ProofService } from "../../gateway/service/proof/ProofService";
import { EnsResolverService } from "./../../gateway/service/ens/EnsService";
describe("ProofServiceTest", () => {
    let owner: SignerWithAddress;
    let optimismProofVerifier: OptimisimProofVerifier;
    let addresManager: LibAddressManager;

    const l1_provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    const l2Provider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL);
    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        const optimismProofVerifierFactory = await ethers.getContractFactory("OptimisimProofVerifier");
        const addresManagerFactory = await ethers.getContractFactory("Lib_AddressManager");

        addresManager = new ethers.Contract(
            "0xdE1FCfB0851916CA5101820A69b13a4E276bd81F",
            addresManagerFactory.interface,
            l1_provider
        ) as LibAddressManager;

        optimismProofVerifier = (await optimismProofVerifierFactory.deploy(
            addresManager.address
        )) as OptimisimProofVerifier;
    });

    it("sinlge slot", async () => {
        const proofService = new ProofService(l1_provider, l2Provider);

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "foo";

        const ownNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "address"],
                [node, "0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870"]
            )
        );

        const slot = EnsResolverService.getStorageSlotForText(9, ownNode, recordName);
        const { proof, result } = await proofService.createProof("0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6", slot);

        expect(proof.length).to.be.equal(3);

        const responseString = Buffer.from(result.slice(2), "hex").toString();
        expect(responseString).to.be.equal("bar");
    });
    it("sinlge slot 31 bytes long", async () => {
        const proofService = new ProofService(l1_provider, l2Provider);

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "my-slot";

        const ownNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "address"],
                [node, "0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870"]
            )
        );

        const slot = EnsResolverService.getStorageSlotForText(9, ownNode, recordName);
        const { proof, result } = await proofService.createProof("0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6", slot);

        expect(proof.length).to.be.equal(31);
        const responseString = Buffer.from(result.slice(2), "hex").toString();
        expect(responseString).to.be.equal("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    });
    it("multislot slot", async () => {
        const proofService = new ProofService(l1_provider, l2Provider);

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "network.dm3.eth";

        const ownNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "address"],
                [node, "0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870"]
            )
        );

        const slot = EnsResolverService.getStorageSlotForText(9, ownNode, recordName);

        const { proof, result } = await proofService.createProof("0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6", slot);

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
