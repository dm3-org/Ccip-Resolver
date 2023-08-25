import hre, { ethers } from 'hardhat';

const NAMEWRAPPER_GOERLI = '0x114D4603199df73e7D157787f8778E21fCd13066';
const NAMEWRAPPER_MAINNET = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401';
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';


const DEFAULT_VERIFIER_ADDRESS = "0x183C1F81D0159794973c157694627a689DEB9F72"
const DEFAULT_VERIFIER_URL = "http://localhost:8081/{sender}/{data}"

async function main() {
    const chainId = await hre.getChainId();
    const namewrapper = chainId === '1' ? NAMEWRAPPER_MAINNET : NAMEWRAPPER_GOERLI;
    const OptimismResolverFactory = await ethers.getContractFactory('ERC3668Resolver');

    const deployTx = await OptimismResolverFactory.deploy(ENS_REGISTRY, namewrapper, DEFAULT_VERIFIER_ADDRESS, [DEFAULT_VERIFIER_URL]);

    await deployTx.deployed();

    console.log('ERC3668Resolver deployed to:', deployTx.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
