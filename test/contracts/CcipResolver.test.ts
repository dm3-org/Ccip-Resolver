import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { ethers as hreEthers } from "hardhat";
import { BedrockCcipVerifier, BedrockCcipVerifier__factory, BedrockProofVerifier, BedrockProofVerifier__factory, CcipResolver, ENS, INameWrapper } from "typechain";
const { expect } = require("chai");

describe("CCIpResolver Test", () => {
    let owner: SignerWithAddress;
    //Example user alice
    let alice: SignerWithAddress
    //ENS
    let ensRegistry: FakeContract<ENS>;
    //NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;
    //Resolver
    let ccipResolver: CcipResolver;
    //Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    //Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;
    //Gateway
    let ccipApp;



    beforeEach(async () => {
        [owner, alice] = await hreEthers.getSigners();
        /**
         * MOCK ENS Registry  
         */
        ensRegistry = (await smock.fake("@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS")) as FakeContract<ENS>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("alice.eth")).returns(alice.address);
        /**
         * MOCK NameWrapper
        */
        nameWrapper = (await smock.fake("@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol:INameWrapper")) as FakeContract<INameWrapper>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(nameWrapper.address);
        nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(alice.address);


        const BedrockProofVerifierFactory = await hreEthers.getContractFactory("BedrockProofVerifier") as BedrockProofVerifier__factory;
        bedrockProofVerifier = (await BedrockProofVerifierFactory.deploy("0x6900000000000000000000000000000000000000"))

        const BedrockCcipVerifierFactory = await hreEthers.getContractFactory("BedrockCcipVerifier") as BedrockCcipVerifier__factory;

        bedrockCcipVerifier = (await BedrockCcipVerifierFactory.deploy(bedrockProofVerifier.address, "0x5FbDB2315678afecb367f032d93F642f64180aa3"))

        const OptimismResolverFactory = await hreEthers.getContractFactory("CcipResolver");
        ccipResolver = (await OptimismResolverFactory.deploy(
            owner.address,
            ensRegistry.address,
            nameWrapper.address,
            "http://localhost:8080/graphql"
        )) as CcipResolver;
    });



    describe("setResolverForDomain", () => {
        it("reverts if node is 0x0", async () => {
            await ccipResolver.setResolverForDomain(
                ethers.constants.HashZero,
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}")
                .then((res) => {
                    expect.fail("Should have thrown an error")
                })
                .catch((e) => {
                    expect(e.message).to.contains("node is 0x0");
                })

        })
        it("reverts if resolverAddress is 0x0", async () => {
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                ethers.constants.AddressZero,
                "http://localhost:8080/{sender}/{data}")
                .then((res) => {
                    expect.fail("Should have thrown an error")
                })
                .catch((e) => {
                    expect(e.message).to.contains("resolverAddress is 0x0");
                })

        })
        it("reverts if resolverAddress does not support resolveWithProofInterface", async () => {
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                //Alice is an EOA, so this is not a valid resolver  
                alice.address,
                "http://localhost:8080/{sender}/{data}")
                .then((res) => {
                    expect.fail("Should have thrown an error")
                })
                .catch((e) => {
                    console.log(e)
                    expect(e.message).to.contains("resolverAddress is not a CCIP Resolver");
                })

        })
        it("reverts if url string is empty", async () => {
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                //Alice is an EOA, so this is not a valid resolver  
                bedrockCcipVerifier.address,
                "")
                .then((res) => {
                    expect.fail("Should have thrown an error")
                })
                .catch((e) => {
                    console.log(e)
                    expect(e.message).to.contains("url is empty");
                })

        })
        it("adds resolver + event contains node, url, and resolverAddress", async () => {
            const tx = await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                //Alice is an EOA, so this is not a valid resolver  
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}")


            const receipt = await tx.wait();

            const [ResolverAddedEvent] = receipt.events

            const [node, gatewayUrl, resolverAddress] = ResolverAddedEvent.args

            expect(node).to.equal(ethers.utils.namehash("alice.eth"))
            expect(gatewayUrl).to.equal("http://localhost:8080/{sender}/{data}")
            expect(resolverAddress).to.equal(bedrockCcipVerifier.address)


        })


        describe("Legacy ENS name", () => {
            it("reverts if msg.sender is not the profile owner", async () => {
                await ccipResolver.setResolverForDomain(
                    ethers.utils.namehash("vitalik.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}")
                    .then((res) => {
                        expect.fail("Should have thrown an error")
                    })
                    .catch((e) => {
                        expect(e.message).to.contains("only subdomain owner");
                    })

            })


        })
    })

});

