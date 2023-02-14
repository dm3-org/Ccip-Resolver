import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers.js";
import { ethers } from "hardhat";

import { ENSRegMock, OwnedENSNode } from "typechain";

import { expect } from "chai";

describe.only("OwnedENSNodeTest", () => {
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let ownedENSNode: OwnedENSNode;

    beforeEach(async () => {
        [user1, user2] = await ethers.getSigners();
        const ensRegMockFactory = await ethers.getContractFactory("ENSRegMock", user1);
        const ensRegMock = (await ensRegMockFactory.deploy(user2.address)) as ENSRegMock;
        const ownedENSNodeFactory = await ethers.getContractFactory("OwnedENSNode", user1);
        ownedENSNode = (await ownedENSNodeFactory.deploy(ensRegMock.address)) as OwnedENSNode;
    });

    it("should update addr calldata correctly", async () => {
        const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
        const ownedNode = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user2.address]));
        const addrInterface = new ethers.utils.Interface(['function addr(bytes32 node) external view returns (address)'])

        const callData = addrInterface.encodeFunctionData('addr' , [node])
        const updatedCallData = addrInterface.encodeFunctionData('addr' , [ownedNode])
        

        expect(await ownedENSNode.replaceNodeWithOwnedNode(callData)).to.equal(updatedCallData);
   
    });

    it("should update text calldata correctly", async () => {
        const node = ethers.utils.namehash(ethers.utils.nameprep("dm3.eth"));
        const ownedNode = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [node, user2.address]));
        const addrInterface = new ethers.utils.Interface(['function text(bytes32 node, string calldata key) external view returns (string memory)'])

        const callData = addrInterface.encodeFunctionData('text' , [node, 'network.dm3.profile'])
        const updatedCallData = addrInterface.encodeFunctionData('text' , [ownedNode, 'network.dm3.profile'])
        

        expect(await ownedENSNode.replaceNodeWithOwnedNode(callData)).to.equal(updatedCallData);
   
    });


});
