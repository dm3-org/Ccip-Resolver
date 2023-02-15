import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, storageLayout } from "hardhat";
import { PublicResolver } from "typechain";
import { ProofService } from "../../gateway/service/proof/ProofService";
describe("ProofServiceTest", () => {
    let publicResolver: PublicResolver;
    let owner: SignerWithAddress;

    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        const publicResolverFactory = await ethers.getContractFactory("PublicResolver");
        publicResolver = (await publicResolverFactory.deploy(owner.address)) as PublicResolver;
    });
    it.only("Creates proof", async () => {
        const l2Provider = new ethers.providers.JsonRpcProvider(
            "https://opt-mainnet.g.alchemy.com/v2/DBATzBzSluCdFAA6Zi7YMWHpDGm1soJI"
        );
        const proofService = new ProofService(l2Provider);

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "network.dm3.eth";

        const ownNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "address"],
                [node, "0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870"]
            )
        );



        await proofService.proofText("0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6", ownNode, recordName);
    });
});
