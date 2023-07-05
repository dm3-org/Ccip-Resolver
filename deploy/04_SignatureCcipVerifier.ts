import hre, { ethers } from "hardhat";

const CCIP_Resolver_Address = "0x410ebbabb4471e9c18cc36642f4057812e125e94";
async function main() {
    const [signer] = await ethers.getSigners();

    const SignatureVerifier = await ethers.getContractFactory("SignatureCcipVerifier");
    const deployTx = await SignatureVerifier.deploy(signer.address, CCIP_Resolver_Address, [signer.address]);
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
