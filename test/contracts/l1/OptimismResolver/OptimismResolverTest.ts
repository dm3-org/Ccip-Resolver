import { FakeContract } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bodyParser from "body-parser";
import express from "express";
import { ethers as hreEthers } from "hardhat";
import request from "supertest";
import { ENS, OptimisimProofVerifier, OptimismResolver } from "typechain";
import { mockEnsRegistry } from "./mockEnsRegistry";
import { mockOptimismProofVerifier } from "./mockOptimismProofVerifier";
import { MockProvider } from "./mockProvider";
import { ccipGateway } from "./../../../../gateway/http/ccipGateway";
const { expect } = require("chai");

describe("OptimismResolver Test", () => {
    let optimismResolver: OptimismResolver;
    let owner: SignerWithAddress;
    let optimismProofVerifier: FakeContract<OptimisimProofVerifier>;
    let ensRegistry: FakeContract<ENS>;
    let ccipApp;

    beforeEach(async () => {
        [owner] = await hreEthers.getSigners();
        optimismProofVerifier = await mockOptimismProofVerifier();
        ensRegistry = await mockEnsRegistry();
        const OptimismResolverFactory = await hreEthers.getContractFactory("OptimismResolver");
        optimismResolver = (await OptimismResolverFactory.deploy(
            "http://localhost:8080/{sender}/{data}",
            owner.address,
            optimismProofVerifier.address,
            ensRegistry.address
        )) as OptimismResolver;

        ccipApp = express();
        ccipApp.use(bodyParser.json());
        ccipApp.use(ccipGateway(optimismResolver.address));
    });

    describe("resolveText", () => {
        it.only("resolves propfile using ethers.provider.getText()", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            const resolver = await provider.getResolver("foo.eth");

            const text = await resolver.getText("network.dm3.eth");

            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };

            expect(text).to.eql(JSON.stringify(profile));
        });
        it("Throws error if lookup went wrong", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            const resolver = await provider.getResolver("foo.dm3.eth");

            expect(resolver.getText("unknown record")).rejected;
        });
    });
    describe("ResolveAddr", () => {
        it("resolvesName returns the Address of the name", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            await provider.resolveName("foo.dm3.eth");
        });
    });
    const fetchRecordFromCcipGateway = async (url: string, json?: string) => {
        const [sender, data] = url.split("/").slice(3);

        const response = await request(ccipApp).get(`/${sender}/${data}`).send();

        return response;
    };
});
