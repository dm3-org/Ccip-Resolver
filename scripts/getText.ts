import hre, { ethers } from "hardhat";

export const getText = async () => {
    const [signer] = await hre.ethers.getSigners();

    const resolver = await ethers.provider.getResolver("alice123.eth");

    console.log("start getTEXT");
    const text = await resolver.getText("my-record");
    console.log(text);
};

getText();
