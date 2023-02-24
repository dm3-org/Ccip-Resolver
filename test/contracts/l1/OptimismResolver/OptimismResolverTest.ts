import { FakeContract } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bodyParser from "body-parser";
import { ethers } from "ethers";
import express from "express";
import { ethers as hreEthers } from "hardhat";
import request from "supertest";
import { ENS, OptimisimProofVerifier, OptimismResolver } from "typechain";
import { getGateWayUrl } from "../../../helper/getGatewayUrl";
import { ccipGateway } from "./../../../../gateway/http/ccipGateway";
import { mockEnsRegistry } from "./mockEnsRegistry";
import { mockOptimismProofVerifier } from "./mockOptimismProofVerifier";
import { MockProvider } from "./mockProvider";
const { expect } = require("chai");

describe("OptimismResolver Test", () => {
    let optimismResolver: OptimismResolver;
    let owner: SignerWithAddress;
    let optimismProofVerifier: OptimisimProofVerifier;
    let ensRegistry: FakeContract<ENS>;

    let ccipApp;

    beforeEach(async () => {
        const l1_provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
        const l2_provider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL);
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
        ccipApp.use(ccipGateway(l1_provider, l2_provider));
    });

    describe("resolve", () => {
        it("ccip gateway resolves existing profile using ethers.provider.getText()", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            const resolver = await provider.getResolver("alex1234.eth");

            const text = await resolver.getText("network.dm3.eth");
            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };

            expect(text).to.eql(JSON.stringify(profile));
        });

        it("Returns empty string if record is empty", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, optimismResolver);

            const resolver = await provider.getResolver("foo.dm3.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
    });

    describe("resolveWithProof", () => {
        it("proof is valid onchain", async () => {
            const { callData, sender } = await getGateWayUrl("alex1234.eth", "network.dm3.eth", optimismResolver);
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
    });

    const fetchRecordFromCcipGateway = async (url: string, json?: string) => {
        const [sender, data] = url.split("/").slice(3);
        const response = await request(ccipApp).get(`/${sender}/${data}`).send();
        return response;
    };
});
