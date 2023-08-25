import { FakeContract, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, ethers } from 'ethers';
import { dnsEncode } from 'ethers/lib/utils';
import { ethers as hreEthers } from 'hardhat';

import { expect } from '../../test/chai-setup';
import { BedrockCcipVerifier__factory, BedrockProofVerifier } from '../../typechain';

describe('Bedrock CcipVerifier', () => {
    let owner: SignerWithAddress;
    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let rando: SignerWithAddress;
    let alice: SignerWithAddress;
    let resolver: SignerWithAddress;

    let bedrockProofVerifier: FakeContract<BedrockProofVerifier>;

    beforeEach(async () => {
        // Get signers
        [owner, signer1, signer2, rando, alice, resolver] = await hreEthers.getSigners();

        bedrockProofVerifier = (await smock.fake('BedrockProofVerifier')) as FakeContract<BedrockProofVerifier>;
    });
    describe('Constructor', () => {
        it('Initially set the owner,url and signers using the constructor ', async () => {
            const bedrockCcipVerifier = await new BedrockCcipVerifier__factory()
                .connect(owner)
                .deploy(
                    owner.address,
                    'http://localhost:8080/graphql',
                    'Optimism Resolver',
                    420,
                    bedrockProofVerifier.address,
                    resolver.address,
                );

            const actualOwner = await bedrockCcipVerifier.owner();
            const actualGraphQlUrl = await bedrockCcipVerifier.graphqlUrl();
            const actualTaget = await bedrockCcipVerifier.target();
            const actualBedrockProofVerifier = await bedrockCcipVerifier.bedrockProofVerifier();

            expect(actualOwner).to.equal(owner.address);
            expect(actualGraphQlUrl).to.equal('http://localhost:8080/graphql');
            expect(actualTaget).to.equal(resolver.address);
            expect(actualBedrockProofVerifier).to.equal(bedrockProofVerifier.address);
        });
    });
    describe('setOwner', () => {
        it('Owner can set a new Owner ', async () => {
            const bedrockCcipVerifier = await new BedrockCcipVerifier__factory()
                .connect(owner)
                .deploy(
                    owner.address,
                    'http://localhost:8080/graphql',
                    'Optimism Resolver',
                    420,
                    bedrockProofVerifier.address,
                    resolver.address,
                );

            const actualOwner = await bedrockCcipVerifier.owner();
            expect(actualOwner).to.equal(owner.address);

            const tx = await bedrockCcipVerifier.setOwner(signer1.address);
            const receipt = await tx.wait();

            const [NewOwnerEvent] = receipt.events;

            const [newOwner] = NewOwnerEvent.args;

            expect(await bedrockCcipVerifier.owner()).to.equal(signer1.address);
            expect(newOwner).to.equal(signer1.address);
        });
        it("Rando can't set a new owner ", async () => {
            const bedrockCcipVerifier = await new BedrockCcipVerifier__factory()
                .connect(owner)
                .deploy(
                    owner.address,
                    'http://localhost:8080/graphql',
                    'Optimism Resolver',
                    420,
                    bedrockProofVerifier.address,
                    resolver.address,
                );

            const actualOwner = await bedrockCcipVerifier.owner();
            expect(actualOwner).to.equal(owner.address);

            try {
                await bedrockCcipVerifier.connect(rando).setOwner(signer1.address, { gasLimit: 1000000 });
                expect.fail('should have reverted');
            } catch (e) {
                expect(e.toString()).to.include('only owner');
            }
        });
    });
    describe('set GrapgQlUrl', () => {
        it('Owner can set a new Url ', async () => {
            const bedrockCcipVerifier = await new BedrockCcipVerifier__factory()
                .connect(owner)
                .deploy(
                    owner.address,
                    'http://localhost:8080/graphql',
                    'Optimism Resolver',
                    420,
                    bedrockProofVerifier.address,
                    resolver.address,
                );

            const actualUrl = await bedrockCcipVerifier.graphqlUrl();
            expect(actualUrl).to.equal('http://localhost:8080/graphql');

            const tx = await bedrockCcipVerifier.setGraphUrl('http://foo.io/graphql');
            const receipt = await tx.wait();

            const [GraphQlUrlChanged] = receipt.events;

            const [newUrl] = GraphQlUrlChanged.args;

            expect(await bedrockCcipVerifier.graphqlUrl()).to.equal('http://foo.io/graphql');
            expect(newUrl).to.equal('http://foo.io/graphql');
        });
        it("Rando can't set a new owner ", async () => {
            const bedrockCcipVerifier = await new BedrockCcipVerifier__factory()
                .connect(owner)
                .deploy(
                    owner.address,
                    'http://localhost:8080/graphql',
                    'Optimism Resolver',
                    420,
                    bedrockProofVerifier.address,
                    resolver.address,
                );

            const actualUrl = await bedrockCcipVerifier.graphqlUrl();
            expect(actualUrl).to.equal('http://localhost:8080/graphql');

            try {
                await bedrockCcipVerifier.connect(rando).setGraphUrl('http://foo.io/graphql');
                expect.fail('should have reverted');
            } catch (e) {
                expect(e.toString()).to.include('only owner');
            }
        });
    });
    describe('Metadata', () => {
        it('returns metadata', async () => {
            const convertCoinTypeToEVMChainId = (_coinType: number) => {
                return (0x7fffffff & _coinType) >> 0;
            };
            const bedrockCcipVerifier = await new BedrockCcipVerifier__factory()
                .connect(owner)
                .deploy(
                    owner.address,
                    'http://localhost:8080/graphql',
                    'Optimism Resolver',
                    420,
                    bedrockProofVerifier.address,
                    resolver.address,
                );

            const [name, coinType, graphqlUrl, storageType, storageLocation, context] =
                await bedrockCcipVerifier.metadata(dnsEncode('alice.eth'));
            expect(name).to.equal('Optimism Resolver');
            expect(convertCoinTypeToEVMChainId(BigNumber.from(coinType).toNumber())).to.equal(420);
            expect(graphqlUrl).to.equal('http://localhost:8080/graphql');
            expect(storageType).to.equal(storageType);
            expect(ethers.utils.getAddress(storageLocation)).to.equal(resolver.address);
            expect(ethers.utils.getAddress(context)).to.equal(ethers.constants.AddressZero);
        });
    });
});
