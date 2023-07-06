
import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bodyParser from "body-parser";
import { ethers } from "ethers";
import express from "express";
import { ethers as hreEthers } from "hardhat";
import request from "supertest";
import { BedrockCcipVerifier, BedrockCcipVerifier__factory, BedrockProofVerifier, BedrockProofVerifier__factory, CcipResolver, ENS, INameWrapper } from "ccip-resolver/typechain";
import { getGateWayUrl } from "../helper/getGatewayUrl";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { dnsWireFormat } from "../helper/encodednsWireFormat";
import { CcipResolver__factory } from "ccip-resolver/typechain";
const { expect } = require("chai");

describe("OptimismResolver Test", () => {
    const provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
    //Ccip Resolver
    let ccipResolver: CcipResolver;
    //Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    //Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;
    //Gateway
    let ccipApp;
    //0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014").connect(hreEthers.provider)



    beforeEach(async () => {
        bedrockProofVerifier = await new BedrockProofVerifier__factory().attach("0x5c74c94173F05dA1720953407cbb920F3DF9f887")
        bedrockCcipVerifier = new BedrockCcipVerifier__factory().attach("0x720472c8ce72c2A2D711333e064ABD3E6BbEAdd3")
        ccipResolver = new CcipResolver__factory().attach("0xAA292E8611aDF267e563f334Ee42320aC96D0463");
    });


    describe.only("resolve", () => {
        it("ccip gateway resolves existing profile using ethers.provider.getText()", async () => {
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
            const resolver = await provider.getResolver("alice.eth");

            const addr = await resolver.getAddress();

            expect(addr).to.equal(alice.address);
        })

        it("ccip gateway resolves existing abi using ethers.provider.getABI", async () => {
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
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const achtualhash = await resolver.getContentHash()


            expect(achtualhash).to.equal("ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4");
        });

        it("ccip gateway resolves existing name ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
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
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
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
            expect(x).to.equal(ethers.utils.formatBytes32String("foo"))
            expect(y).to.equal(ethers.utils.formatBytes32String("bar"))
        });
        it("ccip gateway resolves dnsRecord ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4")

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("dnsRecord",
                [alice.address, ethers.utils.namehash("alice.eth"), keccak256("0x" + record.substring(0, 30)),
                    1]
            )

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("dnsRecord", await resolver._fetch(sig));
            //await require("hardhat").storageLayout.export()
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal("0x161076578616d706c6503636f6d000001000100000e100004010203040")

        });
        it("ccip gateway resolves hasDnsRecords", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4")

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("hasDNSRecords",
                [alice.address, ethers.utils.namehash("alice.eth"), keccak256("0x" + record.substring(0, 30))]
            )

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("hasDNSRecords", await resolver._fetch(sig));
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal(true)

        });
        it("ccip gateway resolves zonehash", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");


            const sig = l2PublicResolverFactory.interface.encodeFunctionData("zonehash",
                [alice.address, ethers.utils.namehash("alice.eth"),]
            )

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("zonehash", await resolver._fetch(sig));
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal(keccak256(toUtf8Bytes("foo")))

        });


        it("Returns empty string if record is empty", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const resolver = await provider.getResolver("alice.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
        it("use parents resolver if node has no subdomain", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const resolver = await provider.getResolver("a.b.c.alice.eth");

            const text = await resolver.getText("my-slot");

            expect(text).to.equal("my-subdomain-record");
        })
        it("reverts if resolver is unknown", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
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
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("namewrapper.alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const resolver = await provider.getResolver("namewrapper.alice.eth");

            const text = await resolver.getText("namewrapper-slot");

            expect(text).to.equal("namewrapper-subdomain-record");
        })
    });

    describe.skip("resolveWithProof", () => {

        it("proof is valid onchain", async () => {
            console.log("start proof")
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );
            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", ccipResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();
            console.log(status)

            const responseBytes = await ccipResolver.resolveWithProof(body.data, callData);
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
            await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", ccipResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();

            await ccipResolver.resolveWithProof(body.data, callData)
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

    const fetchRecordFromCcipGateway = async (url: string, json?: string) => {
        const [sender, data] = url.split("/").slice(3);
        const response = await request(ccipApp).get(`/${sender}/${data}`).send();
        return response;
    };
});

