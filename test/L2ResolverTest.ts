import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers.js";
import { ethers } from "hardhat";

import { L2PublicResolver } from "typechain";

import { expect } from "chai";

describe("L2PublicResolver", () => {
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let l2PublicResolver: L2PublicResolver;

    beforeEach(async () => {
        [user1, user2] = await ethers.getSigners();
        const l2PublicResolverFactory = await ethers.getContractFactory("L2PublicResolver", user1);
        l2PublicResolver = (await l2PublicResolverFactory.deploy()) as L2PublicResolver;
    });

    it.only("set text record on L2", async () => {
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

     it.only("set addr record on L2", async () => {
        const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
        const ownedNode = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user1.address]))

        // record should initially be empty
        expect(await l2PublicResolver["addr(bytes32)"](node)).to.equal("0x0000000000000000000000000000000000000000");
        expect(await l2PublicResolver["addr(bytes32)"](ownedNode)).to.equal("0x0000000000000000000000000000000000000000");

        const tx = await l2PublicResolver["setAddr(bytes32,address)"](node, user2.address);
        await tx.wait();

        // record of the original node shouldn't be touched
        expect(await l2PublicResolver["addr(bytes32)"](node)).to.equal("0x0000000000000000000000000000000000000000");

        // record of the owned node should be changed
        expect(await l2PublicResolver["addr(bytes32)"](ownedNode)).to.equal(user2.address);
    }); 
});
