import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import exp from "constants";
import { ethers as hreEthers } from "hardhat";

import { expect } from "../../test/chai-setup";
import { SignatureCcipVerifier__factory } from "../../typechain";
import { dnsEncode } from "ethers/lib/utils";
import { BigNumber, ethers } from "ethers";

describe("Signature Handler", () => {
    let owner: SignerWithAddress;
    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let rando: SignerWithAddress;
    let resolver: SignerWithAddress;

    beforeEach(async () => {
        // Get signers
        [owner, signer1, signer2, rando, resolver] = await hreEthers.getSigners();
    });
    describe("Constructor", () => {
        it("Initially set the owner,url and signers using the constructor ", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const actualOwner = await signatureCcipVerifier.owner();
            const actualGraphQlUrl = await signatureCcipVerifier.graphqlUrl();
            const actualSigner = await signatureCcipVerifier.signers(signer1.address);

            expect(actualOwner).to.equal(owner.address);
            expect(actualGraphQlUrl).to.equal("http://localhost:8080/graphql");

            expect(actualSigner).to.equal(true);
        });
    });
    describe("setOwner", () => {
        it("Owner can set a new Owner ", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

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
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const actualOwner = await signatureCcipVerifier.owner();
            expect(actualOwner).to.equal(owner.address);

            try {
                await signatureCcipVerifier.connect(rando).setOwner(signer1.address, { gasLimit: 1000000 });
                expect.fail("should have reverted");
            } catch (e) {
                expect(e.toString()).to.include("only owner");
            }
        });
    });
    describe("set GrapgQlUrl", () => {
        it("Owner can set a new Url ", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const actualUrl = await signatureCcipVerifier.graphqlUrl();
            expect(actualUrl).to.equal("http://localhost:8080/graphql");

            const tx = await signatureCcipVerifier.setGraphUrl("http://foo.io/graphql");
            const receipt = await tx.wait();

            const [GraphQlUrlChanged] = receipt.events;

            const [newUrl] = GraphQlUrlChanged.args;

            expect(await signatureCcipVerifier.graphqlUrl()).to.equal("http://foo.io/graphql");
            expect(newUrl).to.equal("http://foo.io/graphql");
        });
        it("Rando can't set a new owner ", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const actualUrl = await signatureCcipVerifier.graphqlUrl();
            expect(actualUrl).to.equal("http://localhost:8080/graphql");

            try {
                await signatureCcipVerifier.connect(rando).setGraphUrl("http://foo.io/graphql");
                expect.fail("should have reverted");
            } catch (e) {
                expect(e.toString()).to.include("only owner");
            }
        });
    });
    describe("addSigners", () => {
        it("Owner can add new signers", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const tx = await signatureCcipVerifier.addSigners([signer1.address, signer2.address]);
            const receipt = await tx.wait();

            const [NewSignersEvent] = receipt.events;

            const [newSigners] = NewSignersEvent.args;

            const [eventNewSigner1, eventNewSigner2] = newSigners;

            expect(eventNewSigner1).to.equal(signer1.address);
            expect(eventNewSigner2).to.equal(signer2.address);

            const isSigner1Enabled = await signatureCcipVerifier.signers(signer1.address);

            const isSigner2Enabled = await signatureCcipVerifier.signers(signer2.address);

            expect(isSigner1Enabled && isSigner2Enabled).to.be.true;
        });
        it("Rando can't add new signers", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            try {
                await signatureCcipVerifier.connect(rando).addSigners([signer1.address, signer2.address]);
                expect.fail("should have reverted");
            } catch (e) {
                expect(e.toString()).to.include("only owner");
            }
        });
    });
    describe("removeSigners", () => {
        it("Owner can remove signers", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const signerIsEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsEnabled).to.be.true;

            const tx = await signatureCcipVerifier.removeSigners([signer1.address]);

            const receipt = await tx.wait();
            const [SignerRemovedEvent] = receipt.events;

            const [signerRemoved] = SignerRemovedEvent.args;
            expect(signerRemoved).to.equal(signer1.address);

            const signerIsStillEnabled = await signatureCcipVerifier.signers(signer1.address);

            expect(signerIsStillEnabled).to.be.false;
        });
        it("Only remove signers that were already created before", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const signerIsEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsEnabled).to.be.true;

            const tx = await signatureCcipVerifier.removeSigners([signer1.address, signer2.address]);

            const receipt = await tx.wait();

            const events = receipt.events!;
            // The contract should just have thrown only one event, despite beeing called with two args
            expect(events.length).to.equal(1);

            expect(events[0].decode!(events[0].data)[0]).to.equal(signer1.address);

            const signerIsStillEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsStillEnabled).to.be.false;
        });
        it("Rando can't remove signers", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const signerIsEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsEnabled).to.be.true;

            try {
                await signatureCcipVerifier.connect(rando).removeSigners([signer1.address]);
                expect.fail("should have reverted");
            } catch (e) {
                expect(e.toString()).to.include("only owner");
            }

            const signerIsStillEnabled = await signatureCcipVerifier.signers(signer1.address);
            expect(signerIsStillEnabled).to.be.true;
        });
    });
    describe("Metadata", () => {
        it("returns metadata", async () => {
            const signatureCcipVerifier = await new SignatureCcipVerifier__factory()
                .connect(owner)
                .deploy(owner.address, "http://localhost:8080/graphql", resolver.address, [signer1.address]);

            const [name, coinType, graphqlUrl, storageType, encodedData] = await signatureCcipVerifier.metadata(dnsEncode("alice.eth"));
            expect(name).to.equal("Signature Ccip Resolver");
            expect(BigNumber.from(coinType).toNumber()).to.equal(60);
            expect(graphqlUrl).to.equal("http://localhost:8080/graphql");
            expect(storageType).to.equal(storageType);
            expect(ethers.utils.toUtf8String(encodedData)).to.equal("Signature Ccip Resolver");
        });
    });
});
