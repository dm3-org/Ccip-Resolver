import { ethers } from "hardhat";

async function main() {
    const l2OutputOracle = "0xE6Dfba0953616Bacab0c9A8ecb3a9BBa77FC15c0";
    const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockProofVerifier");
    const deployTx = await BedrockProofVerifierFactory.deploy(l2OutputOracle);

    await deployTx.deployed();

    console.log(`BedrockProofVerifier deployed at  ${deployTx.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
