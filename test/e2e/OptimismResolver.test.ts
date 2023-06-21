import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bodyParser from "body-parser";
import { ethers } from "ethers";
import express from "express";
import { ethers as hreEthers } from "hardhat";
import request from "supertest";
import { BedrockCcipVerifier, BedrockCcipVerifier__factory, BedrockProofVerifier, BedrockProofVerifier__factory, ENS, INameWrapper, OptimismResolver } from "typechain";
import { ccipGateway } from "../../gateway/http/ccipGateway";
import { MockProvider } from "../contracts/l1/OptimismResolver/mockProvider";
import { getGateWayUrl } from "../helper/getGatewayUrl";
const { expect } = require("chai");

describe("OptimismResolver Test", () => {
    let owner: SignerWithAddress;
    //ENS
    let ensRegistry: FakeContract<ENS>;
    //NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;
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

        const OptimismResolverFactory = await hreEthers.getContractFactory("OptimismResolver");
        optimismResolver = (await OptimismResolverFactory.deploy(
            owner.address,
            ensRegistry.address,
            nameWrapper.address,
            "http://localhost:8080/graphql"
        )) as OptimismResolver;



        await owner.sendTransaction({
            to: alice.address,
            value: ethers.utils.parseEther("1")
        })


        ccipApp = express();
        ccipApp.use(bodyParser.json());
        ccipApp.use(ccipGateway(l1Provider, l2Provider));
    });

    describe("resolve", () => {
        it("ccip gateway resolves existing profile using ethers.provider.getText()", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
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
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");

            const addr = await resolver.getAddress();

            expect(addr).to.equal(alice.address);
        })

        it("ccip gateway resolves existing abi using ethers.provider.getABI", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");

            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");
            const sig = l2PublicResolverFactory.interface.encodeFunctionData("ABI",
                [alice.address, ethers.utils.namehash("alice.eth"), 1]
            )

            const res = await resolver._fetch(sig);
            const [actualContextType, actualAbi] = l2PublicResolverFactory.interface.decodeFunctionResult("ABI", res);


            const expectedAbi = l2PublicResolverFactory.interface.format(ethers.utils.FormatTypes.json).toString();

            expect(actualContextType).to.equal(1)
            expect(Buffer.from(actualAbi.slice(2), "hex").toString()).to.equal(expectedAbi);
        });
        it("ccip gateway resolves existing contenthash ethers.provider.getContenthash", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const achtualhash = await resolver.getContentHash()


            expect(achtualhash).to.equal("ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4");
        });
        it.skip("ccip gateway resolves existing interface resolver", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");


            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const interfaceId = "0x9061b923";
            const sig = l2PublicResolverFactory.interface.encodeFunctionData("interfaceImplementer",
                [alice.address, ethers.utils.namehash("alice.eth"), interfaceId]
            )

            const res = await resolver._fetch(sig);

            //          await require("hardhat").storageLayout.export()
            expect(res).to.equal(alice.address);

        });
        it("ccip gateway resolves existing name ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("name",
                [alice.address, ethers.utils.namehash("alice.eth")]
            )


            const [responseBytes] = l2PublicResolverFactory.interface.decodeFunctionResult("name", await resolver._fetch(sig));

            const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();


            expect(responseString).to.equal("alice");
        });
        it("ccip gateway resolves existing pubkey ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("pubkey",
                [alice.address, ethers.utils.namehash("alice.eth")]
            )

            const [x, y] = l2PublicResolverFactory.interface.decodeFunctionResult("pubkey", await resolver._fetch(sig));
           // await require("hardhat").storageLayout.export()
            expect(x).to.equal(ethers.utils.formatBytes32String("foo"))
            expect(y).to.equal(ethers.utils.formatBytes32String("bar"))
        });

        it("Returns empty string if record is empty", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
        it("use parents resolver if node has no subdomain", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const resolver = await provider.getResolver("a.b.c.alice.eth");

            const text = await resolver.getText("my-slot");

            expect(text).to.equal("my-subdomain-record");
        })
        it("reverts if resolver is unknown", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const resolver = await provider.getResolver("bob.eth");

            await resolver.getText("my-slot")
                .then((res) => {
                    expect.fail("Should have thrown an error")
                })
                .catch((e) => {
                    expect(e).to.be.instanceOf(Error);

                })
        })
        it("resolves namewrapper profile", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("namewrapper.alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const resolver = await provider.getResolver("namewrapper.alice.eth");

            const text = await resolver.getText("namewrapper-slot");

            expect(text).to.equal("namewrapper-subdomain-record");
        })
    });

    describe("resolveWithProof", () => {
        it("proof is valid onchain", async () => {
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
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
            await optimismResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

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
        it("adds resolver + event contains node, url, and resolverAddress", async () => {
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

