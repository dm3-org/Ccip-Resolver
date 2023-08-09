import { ethers } from 'hardhat';
import { ProofServiceTestContract, ProofServiceTestContract__factory } from 'typechain';
/*
 * This script is used to setup the environment for the e2e tests.
 * It asumes that you have set up the local development environment for OP bedrock
 * https://community.optimism.io/docs/developers/build/dev-node/
 */

// 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
const whale = new ethers.Wallet('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// 0x8111DfD23B99233a7ae871b7c09cCF0722847d89
const alice = new ethers.Wallet('0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014');

const l1Provider = new ethers.providers.StaticJsonRpcProvider('http://localhost:8545');
const l2Provider = new ethers.providers.StaticJsonRpcProvider('http://localhost:9545');
async function main() {
    // Test proof logic
    let proofServiceTestContract: ProofServiceTestContract;
    let foreignProofServiceTestContract: ProofServiceTestContract;

    const l2Whale = whale.connect(l2Provider);

    // Verifiy that the local development environment is set up correctly
    if ((await l1Provider.getNetwork()).chainId !== 900 || (await l2Provider.getNetwork()).chainId !== 901) {
        console.error("Please ensure that you're running the local development environment for OP bedrock");
        return;
    }
    const proofServiceTestContractFactory = (await ethers.getContractFactory(
        'ProofServiceTestContract',
    )) as ProofServiceTestContract__factory;

    proofServiceTestContract = await proofServiceTestContractFactory.connect(l2Whale).deploy();
    foreignProofServiceTestContract = await proofServiceTestContractFactory.connect(l2Whale).deploy();

    console.log(`ProofServiceTestContract deployed at ${proofServiceTestContract.address}`);
    console.log(`ForeignProofServiceTestContract deployed at ${foreignProofServiceTestContract.address}`);

    const prepateProofServiceTestContractBytes32 = async () => {
        await proofServiceTestContract.setBool(true);
        await proofServiceTestContract.setAddress(alice.address);
        await proofServiceTestContract.setUint256(123);
        await proofServiceTestContract.setBytes32(ethers.utils.namehash('alice.eth'));
        await proofServiceTestContract.setBytes(ethers.utils.namehash('alice.eth'));
        await proofServiceTestContract.setString('Hello from Alice');
        // prettier-ignore
        await proofServiceTestContract.setLongString(
            "Praesent elementum ligula et dolor varius lobortis. Morbi eget eleifend augue.Nunc quis lectus in augue feugiat malesuada vitae sed lacus. Aenean suscipit tristique mauris a blandit. Maecenas ut lectus quis metus commodo tincidunt. Aliquam erat volutpat. Fusce non erat malesuada, consequat mauris id, tincidunt nisi. Aenean a pulvinar ex. Mauris ullamcorper eget odio nec eleifend. Donec pellentesque et tellus id consectetur. Nullam dictum, felis sit amet consectetur convallis, leo lorem rhoncus nulla, eget tincidunt leo erat sit amet urna. Quisque urna turpis, lobortis laoreet nunc at, fermentum ultrices neque.Proin dignissim enim non arcu elementum tempor.Donec convallis turpis at erat luctus, eget pellentesque augue blandit.In faucibus rhoncus mollis.Phasellus malesuada, mauris ut finibus venenatis, ex risus consectetur dolor, quis suscipit augue magna iaculis leo.Proin non nibh at justo porttitor sollicitudin.Pellentesque id malesuada tellus.Aliquam condimentum accumsan ex eu vulputate.Aenean faucibus a quam vitae tincidunt.Fusce vitae mollis nunc, at volutpat ex.Vestibulum sed tellus urna.Donec ac urna lectus.Phasellus a dolor elit.Aenean bibendum hendrerit elit, in cursus sem maximus id.Sed porttitor nulla non consectetur vehicula.Fusce elementum, urna in gravida accumsan, lectus arcu congue augue, at rhoncus purus nunc ac libero."
        );
    };
    await prepateProofServiceTestContractBytes32();
    console.log('Environment setup complete wait a few minutes until everything is set');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
