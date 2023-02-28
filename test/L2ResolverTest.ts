import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers.js";
import { ethers } from "hardhat";

import { L2PublicResolver } from "typechain";

import { expect } from "chai";

describe.only("L2PublicResolver", () => {
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let l2PublicResolver: L2PublicResolver;

    beforeEach(async () => {
        [user1, user2] = await ethers.getSigners();
        const l2PublicResolverFactory = await ethers.getContractFactory("L2PublicResolver", user1);
        l2PublicResolver = (await l2PublicResolverFactory.deploy()) as L2PublicResolver;
    });

    describe("TextResolver", () => {
        it("set text record on L2", async () => {
            const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
            const ownedNode = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user1.address])
            );

            // record should initially be empty
            expect(await l2PublicResolver.text(node, "network.dm3.profile")).to.equal("");
            expect(await l2PublicResolver.text(ownedNode, "network.dm3.profile")).to.equal("");

            const tx = await l2PublicResolver.setText(node, "network.dm3.profile", "test");
            const receipt = await tx.wait();

            const [textChangedEvent] = receipt.events;

            const [eventNode, eventOwnNode, _, eventKey, eventValue] = textChangedEvent.args;

            expect(eventNode).to.equal(node);
            expect(eventOwnNode).to.equal(ownedNode);
            expect(eventKey).to.equal("network.dm3.profile");
            expect(eventValue).to.equal("test");

            // record of the original node shouldn't be touched
            expect(await l2PublicResolver.text(node, "network.dm3.profile")).to.equal("");

            // record of the owned node should be changed
            expect(await l2PublicResolver.text(ownedNode, "network.dm3.profile")).to.equal("test");
        });
    });

    describe("AddrResolver", () => {
        it("set addr record on L2", async () => {
            const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
            const ownedNode = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user1.address])
            );

            // record should initially be empty
            expect(await l2PublicResolver["addr(bytes32)"](node)).to.equal(
                "0x0000000000000000000000000000000000000000"
            );
            expect(await l2PublicResolver["addr(bytes32)"](ownedNode)).to.equal(
                "0x0000000000000000000000000000000000000000"
            );

            const tx = await l2PublicResolver["setAddr(bytes32,address)"](node, user2.address);
            const receipt = await tx.wait();
            const [addressChangedEvent, addrChangedEvent] = receipt.events;

            let [eventNode, eventOwnNode, eventCoinType, eventAddress] = addressChangedEvent.args;

            expect(eventNode).to.equal(node);
            expect(eventOwnNode).to.equal(ownedNode);
            expect(eventCoinType).to.equal(60);
            expect(ethers.utils.getAddress(eventAddress)).to.equal(user2.address);

            [eventNode, eventOwnNode, eventAddress] = addrChangedEvent.args;

            expect(eventNode).to.equal(node);
            expect(eventOwnNode).to.equal(ownedNode);
            expect(ethers.utils.getAddress(eventAddress)).to.equal(user2.address);

            // record of the original node shouldn't be touched
            expect(await l2PublicResolver["addr(bytes32)"](node)).to.equal(
                "0x0000000000000000000000000000000000000000"
            );

            // record of the owned node should be changed
            expect(await l2PublicResolver["addr(bytes32)"](ownedNode)).to.equal(user2.address);
        });
    });
    describe("ABIResolver", () => {
        it("set abi record on L2", async () => {
            const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
            const ownedNode = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user1.address])
            );
            const abi = l2PublicResolver.interface.format(ethers.utils.FormatTypes.json);
            const tx = await l2PublicResolver.setABI(node, 1, ethers.utils.toUtf8Bytes(abi.toString()));

            const receipt = await tx.wait();
            const [addressChangedEvent] = receipt.events;

            const [eventNode, eventOwnNode, eventContentType] = addressChangedEvent.args;

            expect(eventNode).to.equal(node);
            expect(eventOwnNode).to.equal(ownedNode);
            expect(eventContentType).to.equal(1);

            const [actualContentType, actualAbi] = await l2PublicResolver.ABI(ownedNode, 1);

            expect(actualContentType).to.equal(1);
            expect(Buffer.from(actualAbi.slice(2), "hex").toString()).to.equal(abi.toString());
        });
    });
    describe("ContentHash", () => {
        it("set contentHash on L2", async () => {
            const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
            const ownedNode = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user1.address])
            );
            const contentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            const tx = await l2PublicResolver.setContenthash(node, contentHash);

            const receipt = await tx.wait();
            const [contentHashChangedEvent] = receipt.events;

            const [eventNode, eventOwnNode, eventHash] = contentHashChangedEvent.args;

            expect(eventNode).to.equal(node);
            expect(eventOwnNode).to.equal(ownedNode);
            expect(eventHash).to.equal(eventHash);

            const actualContentHash = await l2PublicResolver.contenthash(ownedNode);

            expect(actualContentHash).to.equal(contentHash);
        });
    });
    describe("Interface", () => {
        it("set interface on L2", async () => {
            const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
            const ownedNode = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user1.address])
            );
            const interfaceId = "0x9061b923";
            const tx = await l2PublicResolver.setInterface(node, interfaceId, user2.address);

            const receipt = await tx.wait();
            const [interfaceChangedEvent] = receipt.events;

            const [eventNode, eventOwnNode, eventInterfaceId, eventImplementer] = interfaceChangedEvent.args;

            expect(eventNode).to.equal(node);
            expect(eventOwnNode).to.equal(ownedNode);
            expect(eventInterfaceId).to.equal(interfaceId);
            expect(eventImplementer).to.equal(user2.address);

            const actualImplementer = await l2PublicResolver.interfaceImplementer(ownedNode, interfaceId);

            expect(actualImplementer).to.equal(user2.address);
        });
    });
    describe("Name", () => {
        it("set name on L2", async () => {
            const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
            const ownedNode = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user1.address])
            );
            const interfaceId = "0x9061b923";
            const tx = await l2PublicResolver.setName(node, "foo");

            const receipt = await tx.wait();
            const [nameChangedEvent] = receipt.events;

            const [eventNode, eventOwnNode, eventNewName] = nameChangedEvent.args;

            expect(eventNode).to.equal(node);
            expect(eventOwnNode).to.equal(ownedNode);
            expect(eventNewName).to.equal("foo");

            const actualName = await l2PublicResolver.name(ownedNode);

            expect(actualName).to.equal("foo");
        });
    });
});
