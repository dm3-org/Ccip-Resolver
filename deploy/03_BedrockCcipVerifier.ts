import hre, { ethers } from "hardhat";

async function main() {
    const [owner] = await ethers.getSigners();
    const graphQlUrl = "http://localhost:8081/graphql";
    const bedrockProofVerifierAddress = "0x37c75DaE09e82Cd0211Baf95DE18f069F64Cb069";
    //TBD add the address you want to resolve on l2
    const l2ContractAddress = "";

    const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockCcipVerifier");
    const deployTx = await BedrockProofVerifierFactory.deploy(owner.address, graphQlUrl, bedrockProofVerifierAddress, l2ContractAddress);
    await deployTx.deployed();

    console.log(`BedrockCcipVerifier deployed at  ${deployTx.address}`);
    console.log(
        `Verify the contract using  npx hardhat verify --network ${hre.network.name} ${deployTx.address} ${owner.address} ${graphQlUrl} ${bedrockProofVerifierAddress} ${l2ContractAddress} `
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
