import hre, { ethers } from "hardhat";

const CCIP_RESOLVER_ADDRESS = "0x491316b83fDb7dC1370b0815775C8d2D2d0b6428";
const NAME = "SignatureCcipVerifier";
const GraphQlUrl = "http://localhost:8081/graphql";
async function main() {
    const [signer] = await ethers.getSigners();

    const SignatureVerifier = await ethers.getContractFactory("SignatureCcipVerifier");
    const deployTx = await SignatureVerifier.deploy(signer.address, GraphQlUrl, NAME, CCIP_RESOLVER_ADDRESS, [signer.address]);
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
