import { ethers } from "hardhat";
import { L2PublicResolver, L2PublicResolver__factory } from "typechain";
/**
 * This script is used to setup the environment for the e2e tests.
 * It asumes that you've set up the local development environment for OP bedrock
 * https://community.optimism.io/docs/developers/build/dev-node/
 * */

//0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
const whale = new ethers.Wallet("ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

//0x8111DfD23B99233a7ae871b7c09cCF0722847d89
const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014");

const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");

const setupEnvironment = async () => {
    let l2PublicResolver: L2PublicResolver;

    const l2Whale = whale.connect(l2Provider);

    //Verifiy that the local development environment is set up correctly
    if ((await l1Provider.getNetwork()).chainId !== 900 || (await l2Provider.getNetwork()).chainId !== 901) {
        console.error("Please ensure that you're running the local development environment for OP bedrock");
        return;
    }

    const factory = (await ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;
    l2PublicResolver = await factory.connect(l2Whale).deploy();
    await l2PublicResolver.deployed();

    console.log(`L2 Resolver deployed at ${l2PublicResolver.address}`);

    //Fund alice account
    const fundTx = await l2Whale.sendTransaction({
        to: alice.address,
        value: ethers.utils.parseEther("100"),
    });

    await fundTx.wait();
    console.log(`${alice.address} funded with ${await l2Provider.getBalance(alice.address)}`);

    //Create data on L2 that later be used for the tests
    const prepareTestSingleSlot = async () => {
        //Prepare test single slot
        const node = ethers.utils.namehash("alice.eth");

        const recordName = "foo";
        const value = "bar";
        await l2PublicResolver.connect(alice.connect(l2Provider)).setText(node, recordName, value);
        console.log(`Added record '${recordName}' with value '${value}' at ${node}`);
    };

    //Prepare test 31 byte
    const prepareTest31yte = async () => {
        const node = ethers.utils.namehash("alice.eth");
        const recordName = "my-slot";
        const value = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        await l2PublicResolver.connect(alice.connect(l2Provider)).setText(node, recordName, value);
        console.log(`Added record '${recordName}' with value '${value}' at ${node}`);
    };

    //await prepareTest31yte();
    const prepeTestMultipleSlots = async () => {
        const node = ethers.utils.namehash("alice.eth");
        const recordName = "network.dm3.eth";

        const profile = {
            publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
            publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
            deliveryServices: ["foo.dm3"],
        };

        await l2PublicResolver.connect(alice.connect(l2Provider)).setText(node, recordName, JSON.stringify(profile));
        console.log(`Added record '${recordName}' with value '${JSON.stringify(profile)}' at ${node}`);
    };
    await prepareTestSingleSlot();
    await prepareTest31yte();
    await prepeTestMultipleSlots();
    console.log("Environment setup complete wait a few minutes until everything is set");
};
setupEnvironment();
