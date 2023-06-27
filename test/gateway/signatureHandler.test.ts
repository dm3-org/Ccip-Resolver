import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import bodyParser from 'body-parser';
import { Wallet, ethers } from 'ethers';
import express from 'express';
import { ethers as hreEthers } from 'hardhat';
import request from 'supertest';
import { ccipGateway } from '../../gateway/http/ccipGateway';
import { ENS, INameWrapper, CcipResolver, SignatureCcipVerifier, SignatureCcipVerifier__factory } from '../../typechain';
import { getGateWayUrl } from "../helper/getGatewayUrl";

import { FakeContract, smock } from '@defi-wonderland/smock';
import { config } from 'hardhat';

const { expect } = require('chai');

describe('Signature Handler', () => {
    let ccipApp: express.Express;
    let signatureResolver: CcipResolver
    let owner: SignerWithAddress;
    let vitalik: SignerWithAddress;

    let signer: Wallet;


    let ensRegistry: FakeContract<ENS>;
    //NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;


    let signerCcipVerifier: SignatureCcipVerifier

    beforeEach(async () => {
        const l1Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545");
        const l2Provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");

        [owner, vitalik] = await hreEthers.getSigners();
        signer = ethers.Wallet.createRandom()
        /**
         * MOCK ENS Registry  
         */
        ensRegistry = (await smock.fake("@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS")) as FakeContract<ENS>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("vitalik.eth")).returns(vitalik.address);
        /**
         * MOCK NameWrapper
        */
        nameWrapper = (await smock.fake("@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol:INameWrapper")) as FakeContract<INameWrapper>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(nameWrapper.address);
        //nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(alice.address);


        const SignerCcipVerifierFactory = await hreEthers.getContractFactory("SignatureCcipVerifier") as SignatureCcipVerifier__factory;


        signerCcipVerifier = (await SignerCcipVerifierFactory.deploy(owner.address, [signer.address]))

        const CcipResolverFactory = await hreEthers.getContractFactory("CcipResolver");
        signatureResolver = (await CcipResolverFactory.deploy(
            owner.address,
            ensRegistry.address,
            nameWrapper.address,
            "http://localhost:8080/graphql"
        ));
        //Get signers
        [owner] = await hreEthers.getSigners();


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

        await signatureResolver.connect(vitalik).setResolverForDomain(
            ethers.utils.namehash("vitalik.eth"),
            signerCcipVerifier.address,
            "http://test/{sender}/{data}"
        );

        const { callData } = await getGateWayUrl("vitalik.eth", "my-record", signatureResolver);

        const result = '0x1234';
        mock.onGet(`http://test/${signerCcipVerifier.address}/${callData}`).reply(
            200,
            result,
        );

        const ccipConfig = {};
        ccipConfig[signerCcipVerifier.address] = {
            type: 'signing',
            handlerUrl: 'http://test',
        };

        config[signerCcipVerifier.address] = ccipApp.use(ccipGateway(ccipConfig));

        const sender = signerCcipVerifier.address;

        //You the url returned by he contract to fetch the profile from the ccip gateway
        const response = await request(ccipApp)
            .get(`/${sender}/${callData}`)
            .send();

        expect(response.status).to.equal(200);



        const resultString = await signatureResolver.resolveWithProof(
            response.body.data,
            callData,
        );

        expect(resultString).to.equal(result);
    });
});
