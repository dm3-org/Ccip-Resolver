import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bodyParser from "body-parser";
import { expect } from "chai";
import express from "express";
import { ethers } from "hardhat";
import request from "supertest";
import { L2PublicResolver } from "typechain";
import { EnsBedrockHandler } from "../../server/http/EnsBedrockHandler";
import { getResolverInterface } from "../../server/utils/getResolverInterface";

describe("EnsHandler", () => {
    let l2PublicResolver: L2PublicResolver;
    let alice: SignerWithAddress;

    let expressApp;
    beforeEach(async () => {
        [alice] = await ethers.getSigners();
        const l2PublicResolverFactory = await ethers.getContractFactory("L2PublicResolver");
        l2PublicResolver = (await l2PublicResolverFactory.deploy()) as L2PublicResolver;
        expressApp = express();
        expressApp.use(bodyParser.json());
        expressApp.use(await EnsBedrockHandler(ethers.provider, l2PublicResolver.address));
    });

    describe("Addr", () => {
        it("resolves address", async () => {
            const name = ethers.utils.dnsEncode("alice.eth");
            const dnsName = ethers.utils.dnsEncode(name);
            const node = ethers.utils.namehash(name);

            await l2PublicResolver.connect(alice)["setAddr(bytes,address)"](dnsName, alice.address);

            const ccipRequest = getCcipRequest("addr", alice.address, node);
            console.log(ccipRequest);

            const res = await request(expressApp).get(`/${ethers.constants.AddressZero}/${ccipRequest}`).send();
            const { slot, target } = res.body;

            const slotValue = await ethers.provider.getStorageAt(target, slot);
            expect(ethers.utils.getAddress(slotValue.substring(0, 42))).to.eq(alice.address);
        });
    });
    describe("Name", () => {
        it("resolves name", async () => {
            const name = ethers.utils.dnsEncode("alice.eth");
            const dnsName = ethers.utils.dnsEncode(name);
            const node = ethers.utils.namehash(name);

            await l2PublicResolver.connect(alice).setName(dnsName, "alice");
            const ccipRequest = getCcipRequest("name", alice.address, alice.address, node);

            const res = await request(expressApp).get(`/${ethers.constants.AddressZero}/${ccipRequest}`).send();
            const { slot, target } = res.body;

            const slotValue = await ethers.provider.getStorageAt(target, slot);

            expect(ethers.utils.toUtf8String(slotValue.substring(0, 12))).to.equal("alice");
        });
    });
    describe("Text", () => {
        it("resolves text", async () => {
            const name = ethers.utils.dnsEncode("alice.eth");
            const dnsName = ethers.utils.dnsEncode(name);
            const node = ethers.utils.namehash(name);

            await l2PublicResolver.connect(alice).setText(dnsName, "my-record", "my-record-value");
            const ccipRequest = getCcipRequest("text", alice.address, node, "my-record");

            const res = await request(expressApp).get(`/${ethers.constants.AddressZero}/${ccipRequest}`).send();
            const { slot, target } = res.body;

            const slotValue = await ethers.provider.getStorageAt(target, slot);

            expect(ethers.utils.toUtf8String(slotValue.substring(0, 32))).to.equal("my-record-value");
        });
    });
    describe("Abi", () => {
        it("resolves abi", async () => {
            const name = ethers.utils.dnsEncode("alice.eth");
            const dnsName = ethers.utils.dnsEncode(name);
            const node = ethers.utils.namehash(name);

            await l2PublicResolver.connect(alice).setABI(dnsName, 1, ethers.utils.toUtf8Bytes("0xabc"));

            const ccipRequest = getCcipRequest("ABI", alice.address, alice.address, node, "1");

            const res = await request(expressApp).get(`/${ethers.constants.AddressZero}/${ccipRequest}`).send();
            const { slot, target } = res.body;

            const slotValue = await ethers.provider.getStorageAt(target, slot);

            expect(ethers.utils.toUtf8String(slotValue.substring(0, 12))).to.equal("0xabc");
        });
    });
});

const getCcipRequest = (sig: string, context: string, ...args: string[]) => {
    const iface = getResolverInterface();
    const innerReq = iface.encodeFunctionData(sig, args);
    const outerReq = iface.encodeFunctionData("resolve", [context, innerReq]);
    return outerReq;
};
