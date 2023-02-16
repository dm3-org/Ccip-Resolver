import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { L2PublicResolver, PublicResolver } from "typechain";
import { StorageHelper } from "../../gateway/service/storage/StorageService";

describe("StorageService", () => {
    let owner: SignerWithAddress;
    let publicResolver: L2PublicResolver;

    beforeEach(async () => {
        [owner] = await ethers.getSigners();

        const publicResolverFactory = await ethers.getContractFactory("L2PublicResolver");
        publicResolver = (await publicResolverFactory.deploy()) as L2PublicResolver;
    });

    it("Reads byte sequence longer than 32 bytes from storage", async () => {
        const storageHelper = new StorageHelper(ethers.provider, publicResolver.address);

        const profile = {
            publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
            publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
            deliveryServices: ["foo.dm3"],
        };

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "network.dm3.eth";

        await publicResolver.connect(owner).setText(node, recordName, JSON.stringify(profile));

        const profileFromStorageBytes = await storageHelper.readFromStorage(0, node, recordName);
        const profileFromStorageString = Buffer.from(profileFromStorageBytes.slice(2), "hex").toString();

    

        expect(profileFromStorageString).to.equal(JSON.stringify(profile));
    });
    it("Reads byte sequence shorter than 32 bytes from storage", async () => {
        const storageHelper = new StorageHelper(ethers.provider, publicResolver.address);

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "network.dm3.eth";

        await publicResolver.connect(owner).setText(node, recordName, "hii");

        const profileFromStorageBytes = await storageHelper.readFromStorage(0, node, recordName);
        const profileFromStorageString = Buffer.from(profileFromStorageBytes.slice(2), "hex").toString();

        expect(profileFromStorageString).to.equal("hii");
    });
    it("Reads string from storage", async () => {
        const storageHelper = new StorageHelper(ethers.provider, publicResolver.address);

        const node = ethers.utils.namehash("foo.eth");
        const recordName = "network.dm3.eth";

        await publicResolver.connect(owner).setText(node, recordName, "MyNotSoLongString");

        const profileFromStorageBytes = await storageHelper.readFromStorage(0, node, recordName);
        const profileFromStorageString = Buffer.from(profileFromStorageBytes.slice(2), "hex").toString();

        expect(profileFromStorageString).to.equal("MyNotSoLongString");
    });
});
