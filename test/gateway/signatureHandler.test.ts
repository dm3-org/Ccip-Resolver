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

import { getConfigReader } from '../../gateway/config/ConfigReader';
import { ccipGateway } from '../../gateway/http/ccipGateway';
import {
    ENS,
    ERC3668Resolver,
    INameWrapper,
    SignatureCcipVerifier,
    SignatureCcipVerifier__factory,
} from '../../typechain';
import { getGateWayUrl, getGateWayUrlForAddress } from '../helper/getGatewayUrl';

describe('Signature Handler', () => {
    let ccipApp: express.Express;
    let erc3668Resolver: ERC3668Resolver;
    let owner: SignerWithAddress;
    let vitalik: SignerWithAddress;

    let signer: Wallet;

    let ensRegistry: FakeContract<ENS>;
    // NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;

    let signatureCcipVerifier: SignatureCcipVerifier;

    beforeEach(async () => {
        [owner, vitalik] = await hreEthers.getSigners();
        signer = ethers.Wallet.createRandom();
        /**
         * MOCK ENS Registry
         */
        ensRegistry = (await smock.fake(
            '@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS',
        )) as FakeContract<ENS>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash('vitalik.eth')).returns(vitalik.address);
        /**
         * MOCK NameWrapper
         */
        nameWrapper = (await smock.fake(
            '@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol:INameWrapper',
        )) as FakeContract<INameWrapper>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash('namewrapper.alice.eth')).returns(nameWrapper.address);
        // nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(alice.address);

        const SignerCcipVerifierFactory = (await hreEthers.getContractFactory(
            'SignatureCcipVerifier',
        )) as SignatureCcipVerifier__factory;

        const ERC3668ResolverFactory = await hreEthers.getContractFactory('ERC3668Resolver');
        erc3668Resolver = (await ERC3668ResolverFactory.deploy(
            ensRegistry.address,
            nameWrapper.address,
            ethers.constants.AddressZero,
            [''],
        )) as ERC3668Resolver;

        signatureCcipVerifier = await SignerCcipVerifierFactory.deploy(
            owner.address,
            'http://localhost:8081/graphql',
            'Signature Ccip Resolver',
            420,
            erc3668Resolver.address,
            [signer.address],
        );
        // Get signers
        [owner] = await hreEthers.getSigners();

        ccipApp = express();
        ccipApp.use(bodyParser.json());
    });

    it('Returns valid data from resolver', async () => {
        process.env.SIGNER_PRIVATE_KEY = signer.privateKey;

        const mock = new MockAdapter(axios);

        await erc3668Resolver
            .connect(vitalik)
            .setVerifierForDomain(ethers.utils.namehash('vitalik.eth'), signatureCcipVerifier.address, [
                'http://test/{sender}/{data}',
            ]);

        const { callData } = await getGateWayUrl('vitalik.eth', 'my-record', erc3668Resolver);

        const result = ethers.utils.defaultAbiCoder.encode(['string'], ['Hello World']);
        mock.onGet(`http://test/${erc3668Resolver.address}/${callData}`).reply(200, result);

        const ccipConfig = {};
        ccipConfig[erc3668Resolver.address] = {
            type: 'signing',
            handlerUrl: 'http://test',
        };

        const configReader = getConfigReader(JSON.stringify(ccipConfig));

        config[erc3668Resolver.address] = ccipApp.use(ccipGateway(configReader));

        const sender = erc3668Resolver.address;

        // You the url returned by he contract to fetch the profile from the ccip gateway
        const response = await request(ccipApp).get(`/${sender}/${callData}`).send();

        expect(response.status).to.equal(200);
        console.log('check');
        const resultString = await erc3668Resolver.resolveWithProof(response.body.data, callData);

        expect(resultString).to.equal(result);
    });
    it('Returns valid address from resolver', async () => {
        process.env.SIGNER_PRIVATE_KEY = signer.privateKey;

        const mock = new MockAdapter(axios);

        await erc3668Resolver
            .connect(vitalik)
            .setVerifierForDomain(ethers.utils.namehash('vitalik.eth'), signatureCcipVerifier.address, [
                'http://test/{sender}/{data}',
            ]);

        const { callData } = await getGateWayUrlForAddress('vitalik.eth', erc3668Resolver);

        // Pass the addr to the contract
        const expected = ethers.utils.hexlify(vitalik.address);
        console.log(expected);

        mock.onGet(`http://test/${erc3668Resolver.address}/${callData}`).reply(200, expected);

        const ccipConfig = {};
        ccipConfig[erc3668Resolver.address] = {
            type: 'signing',
            handlerUrl: 'http://test',
        };

        const configReader = getConfigReader(JSON.stringify(ccipConfig));

        config[erc3668Resolver.address] = ccipApp.use(ccipGateway(configReader));

        const sender = erc3668Resolver.address;

        // You the url returned by he contract to fetch the profile from the ccip gateway
        const response = await request(ccipApp).get(`/${sender}/${callData}`).send();

        expect(response.status).to.equal(200);
        console.log('check');
        const resultString = await erc3668Resolver.resolveWithProof(response.body.data, callData);

        const ethersFormated = new ethers.providers.Formatter().callAddress(resultString);

        expect(ethersFormated).to.equal(ethers.utils.getAddress(vitalik.address));
    });
});
