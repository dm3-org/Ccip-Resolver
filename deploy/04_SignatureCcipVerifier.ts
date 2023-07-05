import hre, { ethers } from "hardhat";

async function main() {
    const [signer] = await ethers.getSigners();

    const BedrockProofVerifierFactory = await ethers.getContractFactory("SignatureCcipVerifier");
    const deployTx = await BedrockProofVerifierFactory.deploy(signer.address, [signer.address]);
    await deployTx.deployed();

    console.log(`SignatureCcipVerifier deployed at  ${deployTx.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
