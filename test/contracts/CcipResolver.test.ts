import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { error } from "console";
import { ethers } from "ethers";
import { ethers as hreEthers } from "hardhat";
import {
    BedrockCcipVerifier,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier,
    BedrockProofVerifier__factory,
    CcipResolver,
    ENS,
    INameWrapper,
} from "typechain";

describe("CCIpResolver Test", () => {
    let owner: SignerWithAddress;
    // Example user alice
    let alice: SignerWithAddress;
    // ENS
    let ensRegistry: FakeContract<ENS>;
    // NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;
    // Resolver
    let ccipResolver: CcipResolver;
    // Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    // Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;

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
        nameWrapper = (await smock.fake(
            "@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol:INameWrapper"
        )) as FakeContract<INameWrapper>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(nameWrapper.address);
        nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(alice.address);

        const BedrockProofVerifierFactory = (await hreEthers.getContractFactory("BedrockProofVerifier")) as BedrockProofVerifier__factory;
        bedrockProofVerifier = await BedrockProofVerifierFactory.deploy("0x6900000000000000000000000000000000000000");

        const BedrockCcipVerifierFactory = (await hreEthers.getContractFactory("BedrockCcipVerifier")) as BedrockCcipVerifier__factory;

        bedrockCcipVerifier = await BedrockCcipVerifierFactory.deploy(
            bedrockProofVerifier.address,
            "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        );

        const OptimismResolverFactory = await hreEthers.getContractFactory("CcipResolver");
        ccipResolver = (await OptimismResolverFactory.deploy(
            owner.address,
            ensRegistry.address,
            nameWrapper.address,
            "http://localhost:8080/graphql"
        )) as CcipResolver;
    });

    describe("setVerifierForDomain", () => {
        it("reverts if node is 0x0", async () => {
            await ccipResolver
                .setVerifierForDomain(ethers.constants.HashZero, bedrockCcipVerifier.address, "http://localhost:8080/{sender}/{data}")
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e.message).to.contains("node is 0x0");
                });
        });
        it("reverts if resolverAddress is 0x0", async () => {
            await ccipResolver
                .connect(alice)
                .setVerifierForDomain(
                    ethers.utils.namehash("alice.eth"),
                    ethers.constants.AddressZero,
                    "http://localhost:8080/{sender}/{data}"
                )
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e.message).to.contains("verifierAddress is 0x0");
                });
        });
        it("reverts if msg.sender is not the profile owner", async () => {
            await ccipResolver
                .setVerifierForDomain(
                    ethers.utils.namehash("vitalik.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                )
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e.message).to.contains("only node owner");
                });
        });

        it("reverts if resolverAddress does not support resolveWithProofInterface", async () => {
            await ccipResolver
                .connect(alice)
                .setVerifierForDomain(
                    ethers.utils.namehash("alice.eth"),
                    // Alice is an EOA, so this is not a valid resolver
                    bedrockProofVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                )
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    console.log(e);
                    expect(e.message).to.contains("verifierAddress is not a CCIP Verifier");
                });
        });
        it("reverts if url string is empty", async () => {
            await ccipResolver
                .connect(alice)
                .setVerifierForDomain(
                    ethers.utils.namehash("alice.eth"),
                    // Alice is an EOA, so this is not a valid resolver
                    bedrockCcipVerifier.address,
                    ""
                )
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    console.log(e);
                    expect(e.message).to.contains("url is empty");
                });
        });
        it("adds verifier + event contains node, url, and resolverAddress", async () => {
            const tx = await ccipResolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash("alice.eth"),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const receipt = await tx.wait();

            const [ResolverAddedEvent] = receipt.events;

            const [node, resolverAddress, gatewayUrl] = ResolverAddedEvent.args;

            expect(node).to.equal(ethers.utils.namehash("alice.eth"));
            expect(gatewayUrl).to.equal("http://localhost:8080/{sender}/{data}");
            expect(resolverAddress).to.equal(bedrockCcipVerifier.address);
        });
        it("adds verifier + event contains node, url, and resolverAddress for NameWrapperProfile", async () => {
            const tx = await ccipResolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash("namewrapper.alice.eth"),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const receipt = await tx.wait();

            const [ResolverAddedEvent] = receipt.events;

            const [node, resolverAddress, gatewayUrl] = ResolverAddedEvent.args;

            expect(node).to.equal(ethers.utils.namehash("namewrapper.alice.eth"));
            expect(gatewayUrl).to.equal("http://localhost:8080/{sender}/{data}");
            expect(resolverAddress).to.equal(bedrockCcipVerifier.address);
        });

        describe.only("resolve", () => {

            it("reverts if requested node has no verifier", async () => {

                try {
                    await ccipResolver.resolve(ethers.utils.dnsEncode("foo.eth"), "0x")
                } catch (e) {
                    expect(e.errorName).to.equal("UnknownVerfier")
                }

            })
            it("returns the resolver address", async () => {
                await ccipResolver.connect(alice).setVerifierForDomain(
                    ethers.utils.namehash("alice.eth"),
                    // Alice is an EOA, so this is not a valid resolver
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

                const iface = new ethers.utils.Interface([
                    "function onResolveWithProof(bytes calldata name, bytes calldata data) public pure override returns (bytes4)",
                    "function addr(bytes32 node) external view returns (address)",
                    "error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)",
                    "function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)",

                    "function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)"
                ]);

                const name = ethers.utils.dnsEncode("alice.eth");
                const data = iface.encodeFunctionData("addr", [ethers.utils.namehash("alice.eth")]);

                let errorString;
                try {
                    await ccipResolver.resolve(name, data);
                } catch (e) {
                    errorString = e.data;
                }

                const decodedError = iface.decodeErrorResult("OffchainLookup", errorString);
                const [sender, urls, callData, callbackFunction, extraData] = decodedError;



                expect(sender).to.equal(ccipResolver.address);
                expect(urls[0]).to.equal("http://localhost:8080/{sender}/{data}");
                expect(callData).to.equal(iface.encodeFunctionData("resolveWithContext", [name, data, alice.address]));
                expect(callbackFunction).to.equal(iface.getSighash("resolveWithProof"));
                expect(extraData).to.equal(iface.encodeFunctionData("resolveWithContext", [name, data, alice.address]));



            });
        });
    });
});
