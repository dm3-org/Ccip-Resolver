import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import exp from 'constants';
import { BigNumber, ethers } from 'ethers';
import { dnsEncode } from 'ethers/lib/utils';
import { ethers as hreEthers } from 'hardhat';
import winston from 'winston';

import { signAndEncodeResponse } from '../../gateway/handler/signing/signAndEncodeResponse';
import { expect } from '../../test/chai-setup';
import { SignatureCcipVerifier__factory } from '../../typechain';

describe('Signature Ccip Verifier', () => {
    let owner: SignerWithAddress;
    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let rando: SignerWithAddress;
    let alice: SignerWithAddress;
    let resolver: SignerWithAddress;

    global.logger = winston.createLogger({
        level: process.env.LOG_LEVEL ?? 'info',
        transports: [new winston.transports.Console()],
    });

    beforeEach(async () => {
        // Get signers
        [owner, signer1, signer2, rando, alice, resolver] = await hreEthers.getSigners();
    });
    describe('Constructor', () => {
        it('Initially set the owner,url and signers using the constructor ', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const actualOwner = await signatureCcipVerifier.owner();
            const actualGraphQlUrl = await signatureCcipVerifier.graphqlUrl();
            const actualSigner = await signatureCcipVerifier.signers(signer1.address);

            expect(actualOwner).to.equal(owner.address);
            expect(actualGraphQlUrl).to.equal('http://localhost:8080/graphql');

            expect(actualSigner).to.equal(true);
        });
    });
    describe('setOwner', () => {
        it('Owner can set a new Owner ', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const actualOwner = await signatureCcipVerifier.owner();
            expect(actualOwner).to.equal(owner.address);

            const tx = await signatureCcipVerifier.setOwner(signer1.address);
            const receipt = await tx.wait();

            const [NewOwnerEvent] = receipt.events;

            const [newOwner] = NewOwnerEvent.args;

            expect(await signatureCcipVerifier.owner()).to.equal(signer1.address);
            expect(newOwner).to.equal(signer1.address);
        });
        it("Rando can't set a new owner ", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const actualOwner = await signatureCcipVerifier.owner();
            expect(actualOwner).to.equal(owner.address);

            try {
                await signatureCcipVerifier.connect(rando).setOwner(signer1.address, { gasLimit: 1000000 });
                expect.fail('should have reverted');
            } catch (e) {
                expect(e.toString()).to.include('only owner');
            }
        });
    });
    describe('set GrapgQlUrl', () => {
        it('Owner can set a new Url ', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const actualUrl = await signatureCcipVerifier.graphqlUrl();
            expect(actualUrl).to.equal('http://localhost:8080/graphql');

            const tx = await signatureCcipVerifier.setGraphUrl('http://foo.io/graphql');
            const receipt = await tx.wait();

            const [GraphQlUrlChanged] = receipt.events;

            const [newUrl] = GraphQlUrlChanged.args;

            expect(await signatureCcipVerifier.graphqlUrl()).to.equal('http://foo.io/graphql');
            expect(newUrl).to.equal('http://foo.io/graphql');
        });
        it("Rando can't set a new owner ", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const actualUrl = await signatureCcipVerifier.graphqlUrl();
            expect(actualUrl).to.equal('http://localhost:8080/graphql');

            try {
                await signatureCcipVerifier.connect(rando).setGraphUrl('http://foo.io/graphql');
                expect.fail('should have reverted');
            } catch (e) {
                expect(e.toString()).to.include('only owner');
            }
        });
    });
    describe('addSigners', () => {
        it('Owner can add new signers', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const tx = await signatureCcipVerifier.addSigners([signer1.address, signer2.address]);
            const receipt = await tx.wait();

            const [NewSignersEvent] = receipt.events;

            const [newSigners] = NewSignersEvent.args;

            const [eventNewSigner1, eventNewSigner2] = newSigners;

            expect(eventNewSigner1).to.equal(signer1.address);
            expect(eventNewSigner2).to.equal(signer2.address);

            const isSigner1Enabled = await signatureCcipVerifier.signers(signer1.address);

            const isSigner2Enabled = await signatureCcipVerifier.signers(signer2.address);

            expect(isSigner1Enabled && isSigner2Enabled).to.equal(true);
        });
        it("Rando can't add new signers", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            try {
                await signatureCcipVerifier.connect(rando).addSigners([signer1.address, signer2.address]);
                expect.fail('should have reverted');
            } catch (e) {
                expect(e.toString()).to.include('only owner');
            }
        });
    });
    describe('removeSigners', () => {
        it('Owner can remove signers', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const signerIsEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsEnabled).to.equal(true);

            const tx = await signatureCcipVerifier.removeSigners([signer1.address]);

            const receipt = await tx.wait();
            const [SignerRemovedEvent] = receipt.events;

            const [signerRemoved] = SignerRemovedEvent.args;
            expect(signerRemoved).to.equal(signer1.address);

            const signerIsStillEnabled = await signatureCcipVerifier.signers(signer1.address);

            expect(signerIsStillEnabled).to.equal(false);
        });
        it('Only remove signers that were already created before', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const signerIsEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsEnabled).to.equal(true);

            const tx = await signatureCcipVerifier.removeSigners([signer1.address, signer2.address]);

            const receipt = await tx.wait();

            const events = receipt.events!;
            // The contract should just have thrown only one event, despite beeing called with two args
            expect(events.length).to.equal(1);

            expect(events[0].decode!(events[0].data)[0]).to.equal(signer1.address);

            const signerIsStillEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsStillEnabled).to.equal(false);
        });
        it("Rando can't remove signers", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const signerIsEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsEnabled).to.equal(true);

            try {
                await signatureCcipVerifier.connect(rando).removeSigners([signer1.address]);
                expect.fail('should have reverted');
            } catch (e) {
                expect(e.toString()).to.include('only owner');
            }

            const signerIsStillEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsStillEnabled).to.equal(true);
        });
    });

    describe('resolveWithProof', () => {
        it('returns result if signed correctly ', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const iface = new ethers.utils.Interface([
                'function addr(bytes32)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',
            ]);

            const result = ethers.utils.defaultAbiCoder.encode(['bytes'], [alice.address]);

            const name = ethers.utils.dnsEncode('alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);
            const extraData = iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]);
            const response = await signAndEncodeResponse(signer1, resolver.address, result, extraData);

            const decodedResponse = await signatureCcipVerifier.resolveWithProof(response, extraData);
            expect(ethers.utils.getAddress(decodedResponse)).to.equal(alice.address);
        });

        it('reverts if response was signed from rando ', async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const iface = new ethers.utils.Interface([
                'function addr(bytes32)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',
            ]);

            const result = ethers.utils.defaultAbiCoder.encode(['bytes'], [alice.address]);

            const name = ethers.utils.dnsEncode('alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);
            const extraData = iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]);
            const response = await signAndEncodeResponse(rando, resolver.address, result, extraData);

            try {
                await signatureCcipVerifier.resolveWithProof(response, extraData);
                expect.fail('should have reverted');
            } catch (e) {
                console.log(e);
                expect(e.reason).to.equal('SignatureVerifier: Invalid signature');
            }
        });
    });
    describe('Metadata', () => {
        it('returns metadata', async () => {
            const convertCoinTypeToEVMChainId = (_coinType: number) => {
                return (0x7fffffff & _coinType) >> 0;
            };
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, 'http://localhost:8080/graphql', 'Signature Ccip Resolver', resolver.address, [
                    signer1.address,
                ]);

            const [name, coinType, graphqlUrl, storageType, storageLocation, context] =
                await signatureCcipVerifier.metadata(dnsEncode('alice.eth'));
            expect(name).to.equal('Signature Ccip Resolver');
            expect(convertCoinTypeToEVMChainId(BigNumber.from(coinType).toNumber())).to.equal(60);
            expect(graphqlUrl).to.equal('http://localhost:8080/graphql');
            expect(storageType).to.equal(storageType);
            expect(ethers.utils.toUtf8String(storageLocation)).to.equal('Postgres');
            expect(context).to.equal(ethers.constants.AddressZero);
        });
    });
});
