import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { PublicResolver } from "typechain";
import { ProofService } from "../../gateway/service/proof/ProofService";
describe("ProofServiceTest", () => {
    let publicResolver: PublicResolver;
    let owner: SignerWithAddress;

    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        const publicResolverFactory = await ethers.getContractFactory("PublicResolver");
        publicResolver = (await publicResolverFactory.deploy()) as PublicResolver;
    });
    it("Creates proof", async () => {
        const proofService = new ProofService(ethers.provider);

        await proofService.proof(publicResolver.address);
        //const storage = storageHelper.
    });
});
