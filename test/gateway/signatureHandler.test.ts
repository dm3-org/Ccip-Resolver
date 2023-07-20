import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import bodyParser from "body-parser";
import { expect } from "chai";
import { ethers, Wallet } from "ethers";
import express from "express";
import { config, ethers as hreEthers } from "hardhat";
import request from "supertest";

import { getConfigReader } from "../../gateway/config/ConfigReader";
import { ccipGateway } from "../../gateway/http/ccipGateway";
import { CcipResolver, ENS, INameWrapper, SignatureCcipVerifier, SignatureCcipVerifier__factory } from "../../typechain";
import { getGateWayUrl } from "../helper/getGatewayUrl";

describe("Signature Handler", () => {
    let ccipApp: express.Express;
    let signatureVerifier: CcipResolver;
    let owner: SignerWithAddress;
    let vitalik: SignerWithAddress;

    let signer: Wallet;

    let ensRegistry: FakeContract<ENS>;
    // NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;

    let signerCcipVerifier: SignatureCcipVerifier;

    beforeEach(async () => {
        [owner, vitalik] = await hreEthers.getSigners();
        signer = ethers.Wallet.createRandom();
        /**
         * MOCK ENS Registry
         */
        ensRegistry = (await smock.fake("@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS")) as FakeContract<ENS>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("vitalik.eth")).returns(vitalik.address);
        /**
         * MOCK NameWrapper
         */
        nameWrapper = (await smock.fake(
            "@ensdomains/ens-contracts/contracts/wrapper/INameWrapper.sol:INameWrapper"
        )) as FakeContract<INameWrapper>;
        ensRegistry.owner.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(nameWrapper.address);
        // nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash("namewrapper.alice.eth")).returns(alice.address);

        const CcipResolverFactory = await hreEthers.getContractFactory("CcipResolver");
        signatureVerifier = (await CcipResolverFactory.deploy(ensRegistry.address, nameWrapper.address)) as CcipResolver;

        const SignerCcipVerifierFactory = (await hreEthers.getContractFactory("SignatureCcipVerifier")) as SignatureCcipVerifier__factory;

        signerCcipVerifier = await SignerCcipVerifierFactory.deploy(
            owner.address,
            "http://localhost:8081/graphql",
            signatureVerifier.address,
            [signer.address]
        );
        // Get signers
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

    it("Returns valid data from resolver", async () => {
        process.env.SIGNER_PRIVATE_KEY = signer.privateKey;

        const mock = new MockAdapter(axios);

        await signatureVerifier
            .connect(vitalik)
            .setVerifierForDomain(ethers.utils.namehash("vitalik.eth"), signerCcipVerifier.address, ["http://test/{sender}/{data}"]);

        const { callData } = await getGateWayUrl("vitalik.eth", "my-record", signatureVerifier);

        const result = ethers.utils.defaultAbiCoder.encode(["string"], ["Hello World"]);
        mock.onGet(`http://test/${signatureVerifier.address}/${callData}`).reply(200, result);

        const ccipConfig = {};
        ccipConfig[signatureVerifier.address] = {
            type: "signing",
            handlerUrl: "http://test",
        };

        const configReader = getConfigReader(JSON.stringify(ccipConfig));

        config[signatureVerifier.address] = ccipApp.use(ccipGateway(configReader));

        const sender = signatureVerifier.address;

        // You the url returned by he contract to fetch the profile from the ccip gateway
        const response = await request(ccipApp).get(`/${sender}/${callData}`).send();

        expect(response.status).to.equal(200);
        console.log("check");
        const resultString = await signatureVerifier.resolveWithProof(response.body.data, callData);

        expect(resultString).to.equal(result);
    });
});
