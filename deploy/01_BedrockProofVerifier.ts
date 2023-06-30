import hre, { ethers } from "hardhat";

//https://community.optimism.io/docs/useful-tools/networks/
const L2_OUTPUT_ORALCE_GOERLI = "0xE6Dfba0953616Bacab0c9A8ecb3a9BBa77FC15c0";
const L2_OUTPUT_ORALCE_MAINNET = "0xdfe97868233d1aa22e815a266982f2cf17685a27";
async function main() {
    const chainId = await hre.getChainId();
    const l2OutputOracleAddress = chainId === "1" ? L2_OUTPUT_ORALCE_MAINNET : L2_OUTPUT_ORALCE_GOERLI;

    const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockProofVerifier");
    const deployTx = await BedrockProofVerifierFactory.deploy(l2OutputOracleAddress);

    await deployTx.deployed();

    console.log(`BedrockProofVerifier deployed at  ${deployTx.address}`);

    console.log(
        `Verify the contract using  npx hardhat verify --network ${hre.network.name} ${deployTx.address} ${l2OutputOracleAddress} `
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
