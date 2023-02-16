import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { ethers, storageLayout } from "hardhat";
import {
    IResolverService__factory,
    IStateCommitmentChain,
    LibAddressManager,
    OptimisimProofVerifier,
    PublicResolver,
    StateCommitmentChain,
} from "typechain";
import { ProofService } from "../../gateway/service/proof/ProofService";

describe("ProofServiceTest", () => {
    let owner: SignerWithAddress;
    let optimismProofVerifier: OptimisimProofVerifier;
    let stateCommitmentChain: StateCommitmentChain;
    let addresManager: LibAddressManager;

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

        addresManager = new ethers.Contract(
            "0xdE1FCfB0851916CA5101820A69b13a4E276bd81F",
            addresManagerFactory.interface,
            l1_provider
        ) as LibAddressManager;

        optimismProofVerifier = (await optimismProofVerifierFactory.deploy(
            addresManager.address,
            "0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6"
        )) as OptimisimProofVerifier;
    });

    it.only("Creates proof", async () => {
        const l2Provider = new ethers.providers.JsonRpcProvider(
            "https://opt-mainnet.g.alchemy.com/v2/DBATzBzSluCdFAA6Zi7YMWHpDGm1soJI"
        );
        const proofService = new ProofService(l1_provider, l2Provider);

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "network.dm3.eth";

        const ownNode = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "address"],
                [node, "0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870"]
            )
        );

        const proof = await proofService.proofText("0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6", ownNode, recordName);

        /*    interface ProofInputObject {
            stateRoot: string;
            stateRootBatchHeader: StateRootBatchHeader;
            stateRootProof: {
                index: number;
                siblings: string[];
            };
            stateTreeWitness: string;
            storageProof: StorageProof[];
        } */
        // console.log(JSON.stringify(proof));
        /*    console.log(proof);
        
        console.log(ocRes); */
        const ocRes = await optimismProofVerifier.isValidProof(proof);

        const code = await l2Provider.getCode("0x2D2d42a1200d8e3ACDFa45Fe58b47F45ebbbaCd6");
        console.log("code");
        console.log(keccak256(code));
    });
});
