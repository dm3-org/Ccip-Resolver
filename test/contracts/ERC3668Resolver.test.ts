import { FakeContract, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, ethers } from 'ethers';
import { dnsEncode } from 'ethers/lib/utils';
import { ethers as hreEthers } from 'hardhat';
import {
    BedrockCcipVerifier,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier,
    BedrockProofVerifier__factory,
    CcipResponseVerifier,
    ENS,
    ERC3668Resolver,
    INameWrapper,
    SignatureCcipVerifier,
    SignatureCcipVerifier__factory,
} from 'typechain';

import { signAndEncodeResponse } from '../../gateway/handler/signing/signAndEncodeResponse';
describe('ERC3668Resolver Test', () => {
    let owner: SignerWithAddress;
    // Example user alice
    let alice: SignerWithAddress;
    // Singer for signing responses
    let signer: ethers.Wallet;

    // ENS
    let ensRegistry: FakeContract<ENS>;
    // NameWrapper
    let nameWrapper: FakeContract<INameWrapper>;
    // Resolver

    let erc3668Resolver: ERC3668Resolver;
    // Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    // Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;

    let signatureVerifier: SignatureCcipVerifier;
    // Dummy contract to test if the reverts when callback selector is not supported
    let verifierWithoutCallbackSelector: FakeContract<CcipResponseVerifier>;

    beforeEach(async () => {
        [owner, alice] = await hreEthers.getSigners();
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
        nameWrapper.ownerOf.whenCalledWith(ethers.utils.namehash('namewrapper.alice.eth')).returns(alice.address);

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
            'Optimism Goerli',
            420,
            bedrockProofVerifier.address,
            '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        );

        verifierWithoutCallbackSelector = (await smock.fake(
            'CcipResponseVerifier',
        )) as FakeContract<CcipResponseVerifier>;
        // Supports CCIPVerifierInterface
        verifierWithoutCallbackSelector.supportsInterface.whenCalledWith('0x79f6f27a').returns(true);

        const OptimismResolverFactory = await hreEthers.getContractFactory('ERC3668Resolver');
        erc3668Resolver = (await OptimismResolverFactory.deploy(
            ensRegistry.address,
            nameWrapper.address,
            bedrockCcipVerifier.address,
            ['http://localhost:8080/{sender}/{data}'],
            {
                gasLimit: 10000000,
            },
        )) as ERC3668Resolver;

        const SignatureCcipVerifierFactory = (await hreEthers.getContractFactory(
            'SignatureCcipVerifier',
        )) as SignatureCcipVerifier__factory;

        signatureVerifier = await SignatureCcipVerifierFactory.deploy(
            owner.address,
            'http://localhost:8081/graphql',
            'Signature Ccip Resolver',
            420,
            erc3668Resolver.address,
            [signer.address],
        );
    });

    describe('setVerifierForDomain', () => {
        it('reverts if resolverAddress is 0x0', async () => {
            await erc3668Resolver
                .connect(alice)
                .setVerifierForDomain(ethers.utils.namehash('alice.eth'), ethers.constants.AddressZero, [
                    'http://localhost:8080/{sender}/{data}',
                ])
                .then(res => {
                    expect.fail('Should have thrown an error');
                })
                .catch(e => {
                    expect(e.message).to.contains('verifierAddress is 0x0');
                });
        });
        it('reverts if msg.sender is not the profile owner', async () => {
            await erc3668Resolver
                .setVerifierForDomain(ethers.utils.namehash('vitalik.eth'), bedrockCcipVerifier.address, [
                    'http://localhost:8080/{sender}/{data}',
                ])
                .then(res => {
                    expect.fail('Should have thrown an error');
                })
                .catch(e => {
                    expect(e.message).to.contains('only node owner');
                });
        });

        it('reverts if resolverAddress does not support resolveWithProofInterface', async () => {
            await erc3668Resolver
                .connect(alice)
                .setVerifierForDomain(
                    ethers.utils.namehash('alice.eth'),
                    // Alice is an EOA, so this is not a valid resolver
                    bedrockProofVerifier.address,
                    ['http://localhost:8080/{sender}/{data}'],
                )
                .then(res => {
                    expect.fail('Should have thrown an error');
                })
                .catch(e => {
                    expect(e.message).to.contains('verifierAddress is not a CCIP Verifier');
                });
        });
        it('reverts if url string is empty', async () => {
            await erc3668Resolver
                .connect(alice)
                .setVerifierForDomain(
                    ethers.utils.namehash('alice.eth'),
                    // Alice is an EOA, so this is not a valid resolver
                    bedrockCcipVerifier.address,
                    [],
                )
                .then(res => {
                    expect.fail('Should have thrown an error');
                })
                .catch(e => {
                    expect(e.message).to.contains('at least one gateway url has to be provided');
                });
        });
        it('adds verifier + event contains node, url, and resolverAddress', async () => {
            const tx = await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const receipt = await tx.wait();

            const [ResolverAddedEvent] = receipt.events;

            const [node, resolverAddress, gatewayUrls] = ResolverAddedEvent.args;

            expect(node).to.equal(ethers.utils.namehash('alice.eth'));
            expect(gatewayUrls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(resolverAddress).to.equal(bedrockCcipVerifier.address);
        });
        it('adds verifier + event contains node, url, and resolverAddress for NameWrapperProfile', async () => {
            const tx = await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('namewrapper.alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const receipt = await tx.wait();

            const [ResolverAddedEvent] = receipt.events;

            const [node, resolverAddress, gatewayUrls] = ResolverAddedEvent.args;

            expect(node).to.equal(ethers.utils.namehash('namewrapper.alice.eth'));
            expect(gatewayUrls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(resolverAddress).to.equal(bedrockCcipVerifier.address);
        });
    });
    describe('resolve', () => {
        it('returns offchain lookup via default verifier for unknown TLD ', async () => {
            const iface = new ethers.utils.Interface([
                'function onResolveWithProof(bytes calldata name, bytes calldata data) public pure  returns (bytes4)',
                'function addr(bytes32 node) external view returns (address)',
                'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',

                'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
            ]);

            const name = ethers.utils.dnsEncode('foo.bar');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('foo.bar')]);

            let errorString;
            try {
                await erc3668Resolver.resolve(name, data);
            } catch (e) {
                errorString = e.data;
            }

            const decodedError = iface.decodeErrorResult('OffchainLookup', errorString);
            const [sender, urls, callData, callbackFunction, extraData] = decodedError;

            expect(sender).to.equal(erc3668Resolver.address);
            expect(urls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(callData).to.equal(
                iface.encodeFunctionData('resolveWithContext', [name, data, ethers.constants.AddressZero]),
            );
            expect(callbackFunction).to.equal(iface.getSighash('resolveWithProof'));
            expect(extraData).to.equal(
                iface.encodeFunctionData('resolveWithContext', [name, data, ethers.constants.AddressZero]),
            );
        });
        it('returns Offchain lookup for parent domain', async () => {
            await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const iface = new ethers.utils.Interface([
                'function onResolveWithProof(bytes calldata name, bytes calldata data) public pure  returns (bytes4)',
                'function addr(bytes32 node) external view returns (address)',
                'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',

                'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
            ]);

            const name = ethers.utils.dnsEncode('alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);

            let errorString;
            try {
                await erc3668Resolver.resolve(name, data);
            } catch (e) {
                errorString = e.data;
            }

            const decodedError = iface.decodeErrorResult('OffchainLookup', errorString);
            const [sender, urls, callData, callbackFunction, extraData] = decodedError;

            expect(sender).to.equal(erc3668Resolver.address);
            expect(urls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(callData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
            expect(callbackFunction).to.equal(iface.getSighash('resolveWithProof'));
            expect(extraData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
        });
        it('returns Offchain via defautl verifier for domain without custom verifier', async () => {
            const iface = new ethers.utils.Interface([
                'function onResolveWithProof(bytes calldata name, bytes calldata data) public pure  returns (bytes4)',
                'function addr(bytes32 node) external view returns (address)',
                'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',

                'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
            ]);

            const name = ethers.utils.dnsEncode('alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);

            let errorString;
            try {
                await erc3668Resolver.resolve(name, data);
            } catch (e) {
                errorString = e.data;
            }

            const decodedError = iface.decodeErrorResult('OffchainLookup', errorString);
            const [sender, urls, callData, callbackFunction, extraData] = decodedError;

            expect(sender).to.equal(erc3668Resolver.address);
            expect(urls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(callData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
            expect(callbackFunction).to.equal(iface.getSighash('resolveWithProof'));
            expect(extraData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
        });
        it('returns Offchain lookup for sub domain', async () => {
            await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const iface = new ethers.utils.Interface([
                'function onResolveWithProof(bytes calldata name, bytes calldata data) public pure  returns (bytes4)',
                'function addr(bytes32 node) external view returns (address)',
                'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',

                'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
            ]);

            const name = ethers.utils.dnsEncode('sub.alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);

            let errorString;
            try {
                await erc3668Resolver.resolve(name, data);
            } catch (e) {
                errorString = e.data;
            }

            const decodedError = iface.decodeErrorResult('OffchainLookup', errorString);
            const [sender, urls, callData, callbackFunction, extraData] = decodedError;

            expect(sender).to.equal(erc3668Resolver.address);
            expect(urls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(callData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
            expect(callbackFunction).to.equal(iface.getSighash('resolveWithProof'));
            expect(extraData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
        });
        it('returns Offchain lookup for sub domain for default verifier', async () => {
            const iface = new ethers.utils.Interface([
                'function onResolveWithProof(bytes calldata name, bytes calldata data) public pure  returns (bytes4)',
                'function addr(bytes32 node) external view returns (address)',
                'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',

                'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
            ]);

            const name = ethers.utils.dnsEncode('sub.alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);

            let errorString;
            try {
                await erc3668Resolver.resolve(name, data);
            } catch (e) {
                errorString = e.data;
            }

            const decodedError = iface.decodeErrorResult('OffchainLookup', errorString);
            const [sender, urls, callData, callbackFunction, extraData] = decodedError;

            expect(sender).to.equal(erc3668Resolver.address);
            expect(urls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(callData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
            expect(callbackFunction).to.equal(iface.getSighash('resolveWithProof'));
            expect(extraData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
        });
        it('returns Offchain lookup for namewrapper', async () => {
            await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('namewrapper.alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const iface = new ethers.utils.Interface([
                'function onResolveWithProof(bytes calldata name, bytes calldata data) public pure  returns (bytes4)',
                'function addr(bytes32 node) external view returns (address)',
                'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',

                'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
            ]);

            const name = ethers.utils.dnsEncode('namewrapper.alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);

            let errorString;
            try {
                await erc3668Resolver.resolve(name, data);
            } catch (e) {
                errorString = e.data;
            }

            const decodedError = iface.decodeErrorResult('OffchainLookup', errorString);
            const [sender, urls, callData, callbackFunction, extraData] = decodedError;

            expect(sender).to.equal(erc3668Resolver.address);
            expect(urls).to.eql(['http://localhost:8080/{sender}/{data}']);
            expect(callData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
            expect(callbackFunction).to.equal(iface.getSighash('resolveWithProof'));
            expect(extraData).to.equal(iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]));
        });
    });
    describe('resolveWithProof', () => {
        it('Revert if ccip verifier returns no callback selector', async () => {
            await erc3668Resolver
                .connect(alice)
                .setVerifierForDomain(ethers.utils.namehash('alice.eth'), verifierWithoutCallbackSelector.address, [
                    'http://localhost:8080/{sender}/{data}',
                ]);

            const iface = new ethers.utils.Interface([
                'function addr(bytes32)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',
            ]);

            const name = ethers.utils.dnsEncode('alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);
            const extraData = iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]);
            const response = ethers.utils.defaultAbiCoder.encode(['address'], [alice.address]);

            let errorString;

            try {
                await erc3668Resolver.resolveWithProof(response, extraData);
            } catch (e) {
                errorString = e.errorArgs[0];
            }

            expect(errorString).to.equal('No callback selector found');
        });
        it('Revert if resolveWithProofCall fails', async () => {
            await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const iface = new ethers.utils.Interface([
                'function addr(bytes32)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',
            ]);

            const name = ethers.utils.dnsEncode('alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);
            const extraData = iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]);
            const response = ethers.utils.defaultAbiCoder.encode(['address'], [alice.address]);

            let errorString;

            try {
                await erc3668Resolver.resolveWithProof(response, extraData);
            } catch (e) {
                errorString = e.errorArgs[0];
            }

            expect(errorString).to.equal('staticcall to verifier failed');
        });
        it('ResolveWithProf for parentDomain using verifier ', async () => {
            await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                signatureVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const iface = new ethers.utils.Interface([
                'function addr(bytes32)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',
            ]);

            const result = ethers.utils.hexlify(alice.address)

            const name = ethers.utils.dnsEncode('alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('alice.eth')]);
            const extraData = iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]);
            const response = await signAndEncodeResponse(signer, erc3668Resolver.address, result, extraData);

            const resolvedResponse = await erc3668Resolver.resolveWithProof(response, extraData);
            console.log(resolvedResponse)

            const ethersFormated = new ethers.providers.Formatter().callAddress(resolvedResponse)

            expect(ethers.utils.getAddress(ethersFormated)).to.equal(alice.address);
        });
        it('ResolveWithProf for sub domain using verifier ', async () => {
            await erc3668Resolver.connect(alice).setVerifierForDomain(
                ethers.utils.namehash('alice.eth'),
                // Alice is an EOA, so this is not a valid resolver
                signatureVerifier.address,
                ['http://localhost:8080/{sender}/{data}'],
            );

            const iface = new ethers.utils.Interface([
                'function addr(bytes32)',
                'function resolveWithContext(bytes calldata name,bytes calldata data,bytes calldata context) external view returns (bytes memory result)',
            ]);

            const result = ethers.utils.hexlify(alice.address)

            const name = ethers.utils.dnsEncode('foo.alice.eth');
            const data = iface.encodeFunctionData('addr', [ethers.utils.namehash('foo.alice.eth')]);
            const extraData = iface.encodeFunctionData('resolveWithContext', [name, data, alice.address]);
            const response = await signAndEncodeResponse(signer, erc3668Resolver.address, result, extraData);

            const resolvedResponse = await erc3668Resolver.resolveWithProof(response, extraData);

            const ethersFormated = new ethers.providers.Formatter().callAddress(resolvedResponse)

            expect(ethers.utils.getAddress(ethersFormated)).to.equal(alice.address);
        });
    });
    describe('Metadata', () => {
        const convertCoinTypeToEVMChainId = (_coinType: number) => {
            return (0x7fffffff & _coinType) >> 0;
        };

        it('returns metadata', async () => {
            await erc3668Resolver
                .connect(alice)
                .setVerifierForDomain(ethers.utils.namehash('alice.eth'), bedrockCcipVerifier.address, [
                    'http://localhost:8080/{sender}/{data}',
                ]);
            const [name, coinType, graphqlUrl, storageType, storageLocation, context] = await erc3668Resolver.metadata(
                dnsEncode('alice.eth'),
            );
            expect(name).to.equal('Optimism Goerli');
            expect(convertCoinTypeToEVMChainId(BigNumber.from(coinType).toNumber())).to.equal(420);
            expect(graphqlUrl).to.equal('http://localhost:8081/graphql');
            expect(storageType).to.equal(0);
            expect(ethers.utils.getAddress(storageLocation)).to.equal('0x5FbDB2315678afecb367f032d93F642f64180aa3');
            expect(ethers.utils.getAddress(context)).to.equal(alice.address);
        });
        it('returns metadata context of the parent if subname does not exit', async () => {
            await erc3668Resolver
                .connect(alice)
                .setVerifierForDomain(ethers.utils.namehash('alice.eth'), bedrockCcipVerifier.address, [
                    'http://localhost:8080/{sender}/{data}',
                ]);
            const [name, coinType, graphqlUrl, storageType, storageLocation, context] = await erc3668Resolver.metadata(
                dnsEncode('sub.alice.eth'),
            );
            expect(name).to.equal('Optimism Goerli');
            expect(convertCoinTypeToEVMChainId(BigNumber.from(coinType).toNumber())).to.equal(420);
            expect(graphqlUrl).to.equal('http://localhost:8081/graphql');
            expect(storageType).to.equal(0);
            expect(ethers.utils.getAddress(storageLocation)).to.equal('0x5FbDB2315678afecb367f032d93F642f64180aa3');
            expect(ethers.utils.getAddress(context)).to.equal(alice.address);
        });
    });
});
