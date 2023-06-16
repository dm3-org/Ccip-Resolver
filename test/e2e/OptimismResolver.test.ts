import { FakeContract } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bodyParser from "body-parser";
import { ethers, getDefaultProvider } from "ethers";
import express from "express";
import { ethers as hreEthers } from "hardhat";
import request from "supertest";
import { BedrockCcipVerifier, BedrockCcipVerifier__factory, BedrockProofVerifier, BedrockProofVerifier__factory, ENS, OptimismResolver } from "typechain";
import { ccipGateway } from "../../gateway/http/ccipGateway";
import { mockEnsRegistry } from "../contracts/l1/OptimismResolver/mockEnsRegistry";
import { MockProvider } from "../contracts/l1/OptimismResolver/mockProvider";
import { getGateWayUrl } from "../helper/getGatewayUrl";
const { expect } = require("chai");

describe("OptimismResolver Test", () => {
    let owner: SignerWithAddress;
    //ENS
    let ensRegistry: FakeContract<ENS>;
    //Resolver
    let optimismResolver: OptimismResolver;
    //Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    //Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;
    //Gateway
    let ccipApp;
    //0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014").connect(hreEthers.provider)



    beforeEach(async () => {

        const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
        const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");
        [owner] = await hreEthers.getSigners();
        ensRegistry = await mockEnsRegistry(ethers.utils.namehash("alice.eth"), alice.address);


        const BedrockProofVerifierFactory = await hreEthers.getContractFactory("BedrockProofVerifier") as BedrockProofVerifier__factory;
        bedrockProofVerifier = (await BedrockProofVerifierFactory.deploy("0x6900000000000000000000000000000000000000"))

        const BedrockCcipVerifierFactory = await hreEthers.getContractFactory("BedrockCcipVerifier") as BedrockCcipVerifier__factory;

        bedrockCcipVerifier = (await BedrockCcipVerifierFactory.deploy(bedrockProofVerifier.address, "0x5FbDB2315678afecb367f032d93F642f64180aa3"))

        const OptimismResolverFactory = await hreEthers.getContractFactory("OptimismResolver");
        optimismResolver = (await OptimismResolverFactory.deploy(
            owner.address,
            ensRegistry.address,
            "http://localhost:8080/graphql"
        )) as OptimismResolver;

        await optimismResolver.connect(alice).setResolverForDomain(
            ethers.utils.namehash("alice.eth"),
            bedrockCcipVerifier.address,
            "http://localhost:8080/{sender}/{data}"
        );

        ccipApp = express();
        ccipApp.use(bodyParser.json());
        ccipApp.use(ccipGateway(l1Provider, l2Provider));
    });

    describe("resolve", () => {
        it("ccip gateway resolves existing profile using ethers.provider.getText()", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            const resolver = await provider.getResolver("alice.eth");

            const text = await resolver.getText("network.dm3.eth");
            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };

            expect(text).to.eql(JSON.stringify(profile));
        });
        it("ccip gateway resolves existing profile using ethers.provider.getAddress()", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            const resolver = await provider.getResolver("alice.eth");

            const addr = await resolver.getAddress();

            expect(addr).to.equal(alice.address);
        });

        it("Returns empty string if record is empty", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            const resolver = await provider.getResolver("alice.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
    });

    describe("resolveWithProof", () => {
        it("proof is valid onchain", async () => {
            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", optimismResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();

            const responseBytes = await optimismResolver.resolveWithProof(body.data, callData);
            const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };
            expect(responseString).to.eql(JSON.stringify(profile));
        });
        it("rejects proofs from contracts other than l2Resolver", async () => {
            process.env = {
                ...process.env,
                L2_PUBLIC_RESOLVER_ADDRESS: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
            }

            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", optimismResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();

            await optimismResolver.resolveWithProof(body.data, callData)
                .then((res) => {
                    expect.fail("Should have thrown an error")
                })
                .catch((e) => {
                    expect(e.reason).to.equal("proof target does not match resolver");
                })


        });

    });
    describe("setResolverForDomain", () => {
        it("reverts if node is 0x0", async () => {
            await optimismResolver.setResolverForDomain(
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
            await optimismResolver.connect(alice).setResolverForDomain(
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
            await optimismResolver.connect(alice).setResolverForDomain(
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
            await optimismResolver.connect(alice).setResolverForDomain(
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
        it("event contains node, url, and resolverAddress", async () => {
            const tx = await optimismResolver.connect(alice).setResolverForDomain(
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

                await optimismResolver.setResolverForDomain(
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

    const fetchRecordFromCcipGateway = async (url: string, json?: string) => {
        const [sender, data] = url.split("/").slice(3);
        const response = await request(ccipApp).get(`/${sender}/${data}`).send();
        return response;
    };
});

