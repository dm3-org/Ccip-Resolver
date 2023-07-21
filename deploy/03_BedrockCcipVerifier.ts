import hre, { ethers } from "hardhat";

async function main() {
    const [owner] = await ethers.getSigners();
    const graphQlUrl = "http://localhost:8081/graphql";
    const bedrockProofVerifierAddress = "0x49FA2e3dc397d6AcA8e2DAe402eB2fD6164EebAC";
    const l2ResolverAddress = "0x39Dc8A3A607970FA9F417D284E958D4cA69296C8";

    const BedrockProofVerifierFactory = await ethers.getContractFactory("BedrockCcipVerifier");
    const deployTx = await BedrockProofVerifierFactory.deploy(owner.address, graphQlUrl, bedrockProofVerifierAddress, l2ResolverAddress);
    await deployTx.deployed();

    console.log(`BedrockCcipVerifier deployed at  ${deployTx.address}`);
    console.log(
        `Verify the contract using  npx hardhat verify --network ${hre.network.name} ${deployTx.address} ${owner.address} ${graphQlUrl} ${bedrockProofVerifierAddress} ${l2ResolverAddress} `
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
