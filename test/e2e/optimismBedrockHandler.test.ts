import { FakeContract, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import bodyParser from 'body-parser';
import { expect } from 'chai';
import { ethers, Wallet } from 'ethers';
import express from 'express';
import { config, ethers as hreEthers } from 'hardhat';
import request from 'supertest';
import winston from 'winston';

import { getConfigReader } from '../../gateway/config/ConfigReader';
import { ccipGateway } from '../../gateway/http/ccipGateway';
import { StorageLayout } from '../../gateway/service/proof/ProofService';
import {
    BedrockCcipVerifier,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier,
    BedrockProofVerifier__factory,
    ENS,
    ERC3668Resolver,
    INameWrapper,
} from '../../typechain';
import { getGateWayUrl } from '../helper/getGatewayUrl';

describe('Optimism Bedrock Handler', () => {
    let ccipApp: express.Express;
    let erc3668Resolver: ERC3668Resolver;
    let owner: SignerWithAddress;

    // 0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet('0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014').connect(
        hreEthers.provider,
    );

    let signer: Wallet;

    let ensRegistry: FakeContract<ENS>;
    // NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;

    // Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    let bedrockCcipVerifier: BedrockCcipVerifier;

    beforeEach(async () => {
        [owner] = await hreEthers.getSigners();
        signer = ethers.Wallet.createRandom();
        /**
         * MOCK ENS Registry
         */
        ensRegistry = (await smock.fake(
            '@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS',
        )) as FakeContract<ENS>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash('alice.eth')).returns(alice.address);
        /**
         * MOCK NameWrapper
         */
        nameWrapper = (await smock.fake(
            '@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol:INameWrapper',
        )) as FakeContract<INameWrapper>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash('namewrapper.alice.eth')).returns(nameWrapper.address);
        // nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(alice.address);

        const BedrockProofVerifierFactory = (await hreEthers.getContractFactory(
            'BedrockProofVerifier',
        )) as BedrockProofVerifier__factory;
        bedrockProofVerifier = await BedrockProofVerifierFactory.deploy('0x6900000000000000000000000000000000000000');

        const BedrockCcipVerifierFactory = (await hreEthers.getContractFactory(
            'BedrockCcipVerifier',
        )) as BedrockCcipVerifier__factory;

        bedrockCcipVerifier = await BedrockCcipVerifierFactory.deploy(
            owner.address,
            'http://localhost:8081/graphql',
            'Optimism Bedrock',
            420,
            bedrockProofVerifier.address,
            '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        );
        const ERC3668ResolverFactory = await hreEthers.getContractFactory('ERC3668Resolver');
        erc3668Resolver = (await ERC3668ResolverFactory.deploy(
            ensRegistry.address,
            nameWrapper.address,
            ethers.constants.AddressZero,
            [],
        )) as ERC3668Resolver;

        await owner.sendTransaction({
            to: alice.address,
            value: ethers.utils.parseEther('1'),
        });

        ccipApp = express();
        ccipApp.use(bodyParser.json());

        global.logger = winston.createLogger({
            level: process.env.LOG_LEVEL ?? 'info',
            transports: [new winston.transports.Console()],
        });
    });

    it('Returns valid string data from resolver', async () => {
        process.env.SIGNER_PRIVATE_KEY = signer.privateKey;

        const mock = new MockAdapter(axios);

        await erc3668Resolver
            .connect(alice)
            .setVerifierForDomain(ethers.utils.namehash('alice.eth'), bedrockCcipVerifier.address, [
                'http://test/{sender}/{data}',
            ]);

        const { callData } = await getGateWayUrl('alice.eth', 'foo', erc3668Resolver);

        const result = [{
            result: ethers.utils.defaultAbiCoder.encode(['string'], ['Hello from Alice']),
            target: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            slot: '0x0000000000000000000000000000000000000000000000000000000000000005',
            layout: StorageLayout.DYNAMIC,
        }];
        mock.onGet(`http://test/${bedrockCcipVerifier.address}/${callData}`).reply(200, result);

        const ccipConfig = {};
        ccipConfig[bedrockCcipVerifier.address] = {
            type: 'optimism-bedrock',
            handlerUrl: 'http://test',
            l1ProviderUrl: 'http://localhost:8545',
            l2ProviderUrl: 'http://localhost:9545',
            l1chainId: 900,
            l2chainId: 901,
        };

        const configReader = getConfigReader(JSON.stringify(ccipConfig));
        config[bedrockCcipVerifier.address] = ccipApp.use(ccipGateway(configReader));

        const sender = bedrockCcipVerifier.address;

        // You the url returned by he contract to fetch the profile from the ccip gateway
        const response = await request(ccipApp).get(`/${sender}/${callData}`).send();

        expect(response.status).to.equal(200);

        const responseEncoded = await erc3668Resolver.resolveWithProof(response.body.data, callData);

        const [decodedBytes] = ethers.utils.defaultAbiCoder.decode(['bytes'], responseEncoded);
        const [responseDecoded] = ethers.utils.defaultAbiCoder.decode(['string'], decodedBytes);

        expect(responseDecoded).to.equal('Hello from Alice');
    });
    it('Returns valid bytes32 data from resolver', async () => {
        process.env.SIGNER_PRIVATE_KEY = signer.privateKey;

        const mock = new MockAdapter(axios);

        await erc3668Resolver
            .connect(alice)
            .setVerifierForDomain(ethers.utils.namehash('alice.eth'), bedrockCcipVerifier.address, [
                'http://test/{sender}/{data}',
            ]);

        const { callData } = await getGateWayUrl('alice.eth', 'foo', erc3668Resolver);

        const result = [{
            result: ethers.utils.namehash('alice.eth'),
            target: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            slot: '0x0000000000000000000000000000000000000000000000000000000000000001',
            layout: StorageLayout.FIXED,
        }];
        mock.onGet(`http://test/${bedrockCcipVerifier.address}/${callData}`).reply(200, result);

        const ccipConfig = {};
        ccipConfig[bedrockCcipVerifier.address] = {
            type: 'optimism-bedrock',
            handlerUrl: 'http://test',
            l1ProviderUrl: 'http://localhost:8545',
            l2ProviderUrl: 'http://localhost:9545',
            l1chainId: 900,
            l2chainId: 901,
        };

        const configReader = getConfigReader(JSON.stringify(ccipConfig));
        config[bedrockCcipVerifier.address] = ccipApp.use(ccipGateway(configReader));

        const sender = bedrockCcipVerifier.address;

        // You the url returned by he contract to fetch the profile from the ccip gateway
        const response = await request(ccipApp).get(`/${sender}/${callData}`).send();

        expect(response.status).to.equal(200);

        const responseEncoded = await erc3668Resolver.resolveWithProof(response.body.data, callData);

        const [decodedResponse] = ethers.utils.defaultAbiCoder.decode(['bytes'], responseEncoded);
        expect(decodedResponse).to.equal(ethers.utils.namehash('alice.eth'));
    });
});
