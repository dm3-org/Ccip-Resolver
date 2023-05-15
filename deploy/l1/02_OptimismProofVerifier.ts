import { ethers } from "hardhat";

async function main() {
    const url = "http://localhost:8080/{sender}/{data}";
    const [owner] = await ethers.getSigners();
    const bedrockProofVerfivier = "0xA4178AF5847a633dAd8c2A3fC84520F9951489De";
    const ensRegistry = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
    const OptimismResolverFactory = await ethers.getContractFactory("OptimismResolver");

    const deployTx = await OptimismResolverFactory.deploy(url, owner.address, bedrockProofVerfivier, ensRegistry);

    await deployTx.deployed();

    console.log(`OptimismResolver deployed at  ${deployTx.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
