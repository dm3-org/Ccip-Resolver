import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import bodyParser from 'body-parser';
import { Wallet, ethers } from 'ethers';
import express from 'express';
import { ethers as hreEthers } from 'hardhat';
import request from 'supertest';
import { ccipGateway } from '../../gateway/http/ccipGateway';
import { BedrockCcipVerifier, BedrockCcipVerifier__factory, BedrockProofVerifier, BedrockProofVerifier__factory, ENS, INameWrapper, OptimismResolver } from '../../typechain';
import { getGateWayUrl } from "../helper/getGatewayUrl";

import { FakeContract, smock } from '@defi-wonderland/smock';
import { config } from 'hardhat';
import { StorageLayout } from '../../gateway/service/proof/ProofService';

const { expect } = require('chai');

describe('Optimism Bedrock Handler', () => {
    let ccipApp: express.Express;
    let ccipResolver: OptimismResolver
    let owner: SignerWithAddress;

    //0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014").connect(hreEthers.provider)


    let signer: Wallet;


    let ensRegistry: FakeContract<ENS>;
    //NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;

    //Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    let bedrockCcipVerifier: BedrockCcipVerifier

    beforeEach(async () => {
        const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
        const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");

        [owner] = await hreEthers.getSigners();
        signer = ethers.Wallet.createRandom()
        /**
         * MOCK ENS Registry  
         */
        ensRegistry = (await smock.fake("@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS")) as FakeContract<ENS>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("alice.eth")).returns(alice.address);
        /**
         * MOCK NameWrapper
        */
        nameWrapper = (await smock.fake("@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol:INameWrapper")) as FakeContract<INameWrapper>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(nameWrapper.address);
        //nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(alice.address);


        const BedrockProofVerifierFactory = await hreEthers.getContractFactory("BedrockProofVerifier") as BedrockProofVerifier__factory;
        bedrockProofVerifier = (await BedrockProofVerifierFactory.deploy("0x6900000000000000000000000000000000000000"))

        const BedrockCcipVerifierFactory = await hreEthers.getContractFactory("BedrockCcipVerifier") as BedrockCcipVerifier__factory;

        bedrockCcipVerifier = (await BedrockCcipVerifierFactory.deploy(bedrockProofVerifier.address, "0x5FbDB2315678afecb367f032d93F642f64180aa3"))
        const OptimismResolverFactory = await hreEthers.getContractFactory("OptimismResolver");
        ccipResolver = (await OptimismResolverFactory.deploy(
            owner.address,
            ensRegistry.address,
            nameWrapper.address,
            "http://localhost:8080/graphql"
        )) as OptimismResolver;

        await owner.sendTransaction({
            to: alice.address,
            value: ethers.utils.parseEther("1")
        })



        ccipApp = express();
        ccipApp.use(bodyParser.json());

        ccipApp.locals.logger = {
            // eslint-disable-next-line no-console
            info: (msg: string) => console.log(msg),
            // eslint-disable-next-line no-console
            warn: (msg: string) => console.log(msg),
        };
    });

    it('Returns valid data from resolver', async () => {
        process.env.SIGNER_PRIVATE_KEY = signer.privateKey;

        const mock = new MockAdapter(axios);

        await ccipResolver.connect(alice).setResolverForDomain(
            ethers.utils.namehash("alice.eth"),
            bedrockCcipVerifier.address,
            "http://test/{sender}/{data}"
        );

        const { callData } = await getGateWayUrl("alice.eth", "foo", ccipResolver);

        const result = {
            target: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            slot: "0xbb067781a09f1c3e4bacec4a5146d6405c3f727f6ccc8a7703d7a998ecf2d418",
            layout: StorageLayout.FIXED
        }
        mock.onGet(`http://test/${bedrockCcipVerifier.address}/${callData}`).reply(
            200,
            result,
        );

        const ccipConfig = {};
        ccipConfig[bedrockCcipVerifier.address] = {
            type: 'optimism-bedrock',
            handlerUrl: 'http://test',
            l1providerUrl: "http://localhost:8545",
            l2providerUrl: "http://localhost:9545",
        };

        config[bedrockCcipVerifier.address] = ccipApp.use(ccipGateway(ccipConfig));

        const sender = bedrockCcipVerifier.address;

        //You the url returned by he contract to fetch the profile from the ccip gateway
        const response = await request(ccipApp)
            .get(`/${sender}/${callData}`)
            .send();

        expect(response.status).to.equal(200);




        const responseBytes = await ccipResolver.resolveWithProof(
            response.body.data,
            callData,
        );



        const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();
        expect(responseString).to.eql(ethers.utils.toUtf8String(responseBytes));


    });
});
