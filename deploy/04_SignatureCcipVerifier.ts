import hre, { ethers } from 'hardhat';

const CCIP_RESOLVER_ADDRESS = '0x49e0AeC78ec0dF50852E99116E524a43bE91B789';
const RESOLVER_NAME = 'SignatureCcipVerifier';
const RESOLVER_CHAINID = 60;
const GraphQlUrl = 'http://localhost:8081/graphql';
async function main() {
    const [signer] = await ethers.getSigners();

    const SignatureVerifier = await ethers.getContractFactory('SignatureCcipVerifier');
    const deployTx = await SignatureVerifier.deploy(signer.address, GraphQlUrl, RESOLVER_CHAINID, RESOLVER_NAME, CCIP_RESOLVER_ADDRESS, [
        signer.address,
    ]);
    await deployTx.deployed();

    console.log(`SignatureCcipVerifier deployed at  ${deployTx.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
