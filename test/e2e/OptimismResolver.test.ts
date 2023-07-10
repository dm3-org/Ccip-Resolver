import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bodyParser from "body-parser";
import { ethers } from "ethers";
import express from "express";
import { ethers as hreEthers } from "hardhat";
import request from "supertest";
import {
    BedrockCcipVerifier,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier,
    BedrockProofVerifier__factory,
    CcipResolver,
    ENS,
    INameWrapper,
} from "ccip-resolver/typechain";
import { getGateWayUrl } from "../helper/getGatewayUrl";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { dnsWireFormat } from "../helper/encodednsWireFormat";
import { CcipResolver__factory } from "ccip-resolver/typechain";
import e from "express";
const { expect } = require("chai");

describe.only("OptimismResolver Test", () => {
    const provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545", {
        name: "optimismGoerli",
        chainId: 900,
    });
    //Ccip Resolver
    let ccipResolver: CcipResolver;
    //Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    //Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;
    //Gateway
    let ccipApp;
    //0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014").connect(hreEthers.provider);

    beforeEach(async () => {
        bedrockProofVerifier = await new BedrockProofVerifier__factory()
            .attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
            .connect(provider);
        bedrockCcipVerifier = new BedrockCcipVerifier__factory().attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
        ccipResolver = new CcipResolver__factory().attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    });
    describe("resolve", () => {
        it("debug test", async () => {
            const ccipResult =
                "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003626172000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000009fe46736679d2d9a65f0992f2272de9f3c7fa6e00000000000000000000000000000000000000000000000000000000000000003c7e566458335df7c0cae78a288e97c30b00169af9bb311f36766720f52b7acd20000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000002388486cf156506d3bdd13d27851076ed92207b4be0a7c682152b7efe34c00eb8ed4baae3a927be3dea54996b4d5899f8c01e7594bf50b17dc1e741388ce3d1279ad234dd7148c869f31d2fa186391d4848bb1f522129804477055ee3de24a6000000000000000000000000000000000000000000000000000000000000007c00000000000000000000000000000000000000000000000000000000000000629f90626b90214f90211a0e33e7ef1e1812bb4e45032236ae18aff9d808d26330b5042f7f584f9f3312778a0160f2c817e3162e97c8addbbde198605c6c3703121ae6a880f4c608c0ed67389a0f81e937e2d5ff7c1f8a392103e8125cd54808452f10bafdc7dbb3f0fe6c4eb5ba03874e4918e2fe36beb01f6abfb3246962accffab844332e551318d3f5e266955a00bdf6340d5879e2500ae944ae4e550eaace51b252e6171a5ce67f104055df7d3a06e6d4b6c7a781500ca3288d65e40c36746a332e4b42ac409447cf3c68638619ea004873662e32a2c7b56263c834fa312775fca35d684a9441bebe0d065f5103671a074714750e1d267cd6090763f6ed4b173cc48d26a4a79a1dd53af4e3a9b3430bea049acf550152805f3a96db83cc5c3d6306beaa83e13f81d52c55844e4a0817937a002dcf5f65bed288e36dff7c5f125e6a1661536fd2733f8c4c66d66a190bc5ee6a01f5b7ae3f9169e9781ca2bbcbde9fa9306d4c4187fc49ba6b6e6b23d5e949828a02910c1dc3fe0c125f7a5ec0ad1d108a0c65f65ee94a63d10298da93439f8e3c1a0ad5ccb80e68c6f36226137f8846944f3edda206e847ce3d89312186dacc697fda0f503a03e5f8d8c570949d4bbdfa6a2c0b05e43265d814e9a7f60c247f86bfc57a09fb1930266673f4c85348fe395c8567a7978b74f278a587c0ea0e2292dc584c5a04e70f3b203f5976a5330ead9a032414f5882214ea35a4977ea42866138bc811e80b90214f90211a0d822fcda4fe151c4f2064581d51e5ed328746437ba625f33e65ec2c8c7eba21aa0f662289e4896086e09dcb07f18a2094f1f363fdda86c4274225c8fcc07f7829ea0a4aab2b2e4a8a0180ac476ab9a82accc8346b05956b9a8ddb1d54f81ffd21b58a0e29783ba9b46fa0953dc806e6178905500e6391efcbc690150bddea9fca5a16da0c7b8e7045b33c1f238f958b23da7f56230d6660f53c98ad1cda33b65f89b2c30a02911b276f4ddca7160420f9762c4e88c54daac0510c853291ad84a19f1e4d738a02dcbcdafd3ca410c40b27eb12bbada85f669525ac421ec238eedffc1af6682f0a0f372795b70986564542ae8e7fa34dab8254e3aa5066371de1d996625acbb3f5aa0469555c6ed4d45726b7ec3a49da33270c63441e26637afe4b516d823a1a3e9cca0e0d7e87d380fc47f7343c164389a5575249c0e2caf6832530a9aee80317ab6bda02a594204284ee9c69c0fcfd0ec11ca33fb8d857a0a3a96706aceec156f9fb22ca086266fdae49d7402035874ba3415faf0b122e3505cac9918bcdda5aeee8f6776a071fdba718a53a53fc6fa3c257004872055e63500cec3fbd2ea10d2f754988746a04ded84487206ab7ecdc06c4becf4f1fab099a34c79176c2236a8861189a4e516a05d77c140426669a57e2bb45a5cd1ff5ca3a3b31f2e62a787dd2543f48bf0b995a068f06f0af8adaacd27c0a5d19addd50994ce29e6420ea4f0cd8e956e06b5612180b90114f9011180a0b018aba825122f4555c6174cab9fc3276a6b70428735d33b6fbe7c597a59914780a0a2f7ffc069829cff1d8e4a969167598b3e46d5149e80934c26475d12d2272dfda08c4ef1826dd158521afdecbed47ceb16b90dbc17f3aeee004c8fca0edc48181b8080a0988265144dc92519e0a4e9ee4d629022b47a9996aac1aca5db472353b43a57f1a0ce7516edb303a37049b66673cffb8720e360d237b4fa8cb46b5716d7a1dda4c18080a02aa926323a8dbf542712191637088ccc6b6964eef3435b8142c6c342ef13571da054ee670c1c6864a7bfa9e8af8393db0b18aa34ccc057050ba4eb46e910ade7548080a090d39acd37397ec1eaebd2bc3c9a135deddaef827c3f946ddacdbda9a230fefc80b873f8718080a08f17f0effe21da2c9ab16a179bb0971bd0de6510b8228699794cf808ceabc7b6808080a01066dad02351c348c4746e4ba1c1ff732c46a13b2b2e4d0bc7db2be9459befc4808080808080a0564629cac7ad1b80555d8ca148c3927b085caeac7641db74b2735202706f9375808080b86af8689f200e45164e07e0e4df7165de40d5863fb7b8ece896a164bf57a134287c68f5b846f8440180a0c7e566458335df7c0cae78a288e97c30b00169af9bb311f36766720f52b7acd2a0ceca8646f359ce8d696e0982a4bc9fab4feb6fe662db4cf5ec9549fc80ba682e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020bb067781a09f1c3e4bacec4a5146d6405c3f727f6ccc8a7703d7a998ecf2d41800000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000236f90233b90194f90191a0aa0cd6e58016971a49d0cbb059decd3757f02549142b0c519730e0fa3253f5c9a0cdd5ca9dcbc532146838bf3eab2717959c7dbf0e82ca2984169a01f9bb99dac780a0541a139f7d5fd9639a689cd5ab873922214d60691804f4a142f5a0c344507c4280a0d41a0a711a3d8e65ce6e044d76b8e345c7c096af8e4835a4f1b930e320f6c5e7a0a25bbfc1448c34a90cea4b5589f24440c8344d841a4559c1d4356ce50f555eaca084c1f3a6482ee7fa37c0d0585b8c829e40727b4085f05432a20e7086bc470bd1a0d1e51e898af9970b20cff10560168c6ecff410e9b94dc98c86282f32b9b791f5a0c0bcfbd79003cdf8826c54d612d0dafa16c30672e3b8be7ea95c19d5301e5141a002a550cdaf3c7d007462bd6fcb54619074d686f9b208316630835d2176b34dce80a044edc48c3aa2bcb54889d04b07d0209efd71ac3ad701615417b6cf13bc3191c2a012f0b9ea6a71a919c8988b28310aad8c1ab47a6096a5a76f3580d5b16cf6938980a088317d9b259beaebb29e57da14faa93720333344816fcd6f81382cfce091583880b853f8518080a0b6978c0beff22ab7b1aca6260b002a8c300f4b38f7f11c9e82c4e90b6bb0306ba0da369e8e34dc45f4e7791d2df45210abda1426db7d41a5e1f939947c6a0c5e4080808080808080808080808080b845f843a020033695275cd867e3673c0f6eac110e116b33c5f8b4d83f266a3b9beb8390a8a1a0626172000000000000000000000000000000000000000000000000000000000600000000000000000000";

            const extraData =
                "0x9061b9230000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000148111dfd23b99233a7ae871b7c09ccf0722847d89000000000000000000000000000000000000000000000000000000000000000000000000000000000000008459d1d43c787192fc5378cc32aa956ddfdedbf26b24e8d78e40109add0eea2c1a012c3dec00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003666f6f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

            const backendResponse =
                "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003626172000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000009fe46736679d2d9a65f0992f2272de9f3c7fa6e00000000000000000000000000000000000000000000000000000000000000003c7e566458335df7c0cae78a288e97c30b00169af9bb311f36766720f52b7acd20000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000b0000000000000000000000000000000000000000000000000000000000000000cfccbe9a516cd8c7ccbf798c73b060c385f1536021c0618d7714817aca25fea18ed4baae3a927be3dea54996b4d5899f8c01e7594bf50b17dc1e741388ce3d12dc9c23ac403e9e35d5703f0b309b636d0b8b91f7ac5147abb5793d0c01fc156e00000000000000000000000000000000000000000000000000000000000007c00000000000000000000000000000000000000000000000000000000000000629f90626b90214f90211a0f73b5c8b416f229cd498a5ef6133a89d1db93d7eae8ccfa089b70751531c671aa087a3d8b154891f248030e70e8441016e5bae016be44daaebba208d7267fe9a4fa0f81e937e2d5ff7c1f8a392103e8125cd54808452f10bafdc7dbb3f0fe6c4eb5ba03874e4918e2fe36beb01f6abfb3246962accffab844332e551318d3f5e266955a02c8cdb68a975a1db43dde8c7040d7123def6a9dba767f728a16bbde869de23a6a06e6d4b6c7a781500ca3288d65e40c36746a332e4b42ac409447cf3c68638619ea004873662e32a2c7b56263c834fa312775fca35d684a9441bebe0d065f5103671a074714750e1d267cd6090763f6ed4b173cc48d26a4a79a1dd53af4e3a9b3430bea0d88a1f76fb678f23feeeef5255455448d5f1a90b3c2523dfb62280962bd795aba002dcf5f65bed288e36dff7c5f125e6a1661536fd2733f8c4c66d66a190bc5ee6a01f5b7ae3f9169e9781ca2bbcbde9fa9306d4c4187fc49ba6b6e6b23d5e949828a02910c1dc3fe0c125f7a5ec0ad1d108a0c65f65ee94a63d10298da93439f8e3c1a0ad5ccb80e68c6f36226137f8846944f3edda206e847ce3d89312186dacc697fda0f503a03e5f8d8c570949d4bbdfa6a2c0b05e43265d814e9a7f60c247f86bfc57a0a461f66bda5b6623c62ffe7824dea5368a1e36950a4c039366dceeb1d2337910a04e70f3b203f5976a5330ead9a032414f5882214ea35a4977ea42866138bc811e80b90214f90211a0d822fcda4fe151c4f2064581d51e5ed328746437ba625f33e65ec2c8c7eba21aa0f662289e4896086e09dcb07f18a2094f1f363fdda86c4274225c8fcc07f7829ea0a4aab2b2e4a8a0180ac476ab9a82accc8346b05956b9a8ddb1d54f81ffd21b58a0e29783ba9b46fa0953dc806e6178905500e6391efcbc690150bddea9fca5a16da0c7b8e7045b33c1f238f958b23da7f56230d6660f53c98ad1cda33b65f89b2c30a02911b276f4ddca7160420f9762c4e88c54daac0510c853291ad84a19f1e4d738a02dcbcdafd3ca410c40b27eb12bbada85f669525ac421ec238eedffc1af6682f0a0f372795b70986564542ae8e7fa34dab8254e3aa5066371de1d996625acbb3f5aa0469555c6ed4d45726b7ec3a49da33270c63441e26637afe4b516d823a1a3e9cca0e0d7e87d380fc47f7343c164389a5575249c0e2caf6832530a9aee80317ab6bda0d67428d822d036162b250c7e931d55567eeb4e9b4b4cc683d43448f5c2a7639da086266fdae49d7402035874ba3415faf0b122e3505cac9918bcdda5aeee8f6776a071fdba718a53a53fc6fa3c257004872055e63500cec3fbd2ea10d2f754988746a04ded84487206ab7ecdc06c4becf4f1fab099a34c79176c2236a8861189a4e516a05d77c140426669a57e2bb45a5cd1ff5ca3a3b31f2e62a787dd2543f48bf0b995a068f06f0af8adaacd27c0a5d19addd50994ce29e6420ea4f0cd8e956e06b5612180b90114f9011180a0b018aba825122f4555c6174cab9fc3276a6b70428735d33b6fbe7c597a59914780a0a2f7ffc069829cff1d8e4a969167598b3e46d5149e80934c26475d12d2272dfda08c4ef1826dd158521afdecbed47ceb16b90dbc17f3aeee004c8fca0edc48181b8080a0988265144dc92519e0a4e9ee4d629022b47a9996aac1aca5db472353b43a57f1a0ce7516edb303a37049b66673cffb8720e360d237b4fa8cb46b5716d7a1dda4c18080a02aa926323a8dbf542712191637088ccc6b6964eef3435b8142c6c342ef13571da054ee670c1c6864a7bfa9e8af8393db0b18aa34ccc057050ba4eb46e910ade7548080a090d39acd37397ec1eaebd2bc3c9a135deddaef827c3f946ddacdbda9a230fefc80b873f8718080a08f17f0effe21da2c9ab16a179bb0971bd0de6510b8228699794cf808ceabc7b6808080a01066dad02351c348c4746e4ba1c1ff732c46a13b2b2e4d0bc7db2be9459befc4808080808080a0564629cac7ad1b80555d8ca148c3927b085caeac7641db74b2735202706f9375808080b86af8689f200e45164e07e0e4df7165de40d5863fb7b8ece896a164bf57a134287c68f5b846f8440180a0c7e566458335df7c0cae78a288e97c30b00169af9bb311f36766720f52b7acd2a0ceca8646f359ce8d696e0982a4bc9fab4feb6fe662db4cf5ec9549fc80ba682e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020bb067781a09f1c3e4bacec4a5146d6405c3f727f6ccc8a7703d7a998ecf2d41800000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000236f90233b90194f90191a0aa0cd6e58016971a49d0cbb059decd3757f02549142b0c519730e0fa3253f5c9a0cdd5ca9dcbc532146838bf3eab2717959c7dbf0e82ca2984169a01f9bb99dac780a0541a139f7d5fd9639a689cd5ab873922214d60691804f4a142f5a0c344507c4280a0d41a0a711a3d8e65ce6e044d76b8e345c7c096af8e4835a4f1b930e320f6c5e7a0a25bbfc1448c34a90cea4b5589f24440c8344d841a4559c1d4356ce50f555eaca084c1f3a6482ee7fa37c0d0585b8c829e40727b4085f05432a20e7086bc470bd1a0d1e51e898af9970b20cff10560168c6ecff410e9b94dc98c86282f32b9b791f5a0c0bcfbd79003cdf8826c54d612d0dafa16c30672e3b8be7ea95c19d5301e5141a002a550cdaf3c7d007462bd6fcb54619074d686f9b208316630835d2176b34dce80a044edc48c3aa2bcb54889d04b07d0209efd71ac3ad701615417b6cf13bc3191c2a012f0b9ea6a71a919c8988b28310aad8c1ab47a6096a5a76f3580d5b16cf6938980a088317d9b259beaebb29e57da14faa93720333344816fcd6f81382cfce091583880b853f8518080a0b6978c0beff22ab7b1aca6260b002a8c300f4b38f7f11c9e82c4e90b6bb0306ba0da369e8e34dc45f4e7791d2df45210abda1426db7d41a5e1f939947c6a0c5e4080808080808080808080808080b845f843a020033695275cd867e3673c0f6eac110e116b33c5f8b4d83f266a3b9beb8390a8a1a0626172000000000000000000000000000000000000000000000000000000000600000000000000000000";

            const expCd = bedrockCcipVerifier.interface.encodeFunctionData("resolveWithProof", [backendResponse, extraData]);

            const res = await bedrockCcipVerifier.connect(provider).resolveWithProof(backendResponse, extraData);

            console.log(res);
            console.log("-----");
            console.log(expCd);
            // await bedrockCcipVerifier.connect(provider).resolveWithProof(ccipResult, extraData)
        });
        it.only("ccip gateway resolves existing profile using ethers.provider.getText()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");

            const text = await resolver.getText("foo");
            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };

            expect(text).to.eql(JSON.stringify(profile));
        });
        it("ccip gateway resolves existing profile using ethers.provider.getAddress()", async () => {
            const resolver = await provider.getResolver("alice.eth");

            const addr = await resolver.getAddress();

            expect(addr).to.equal(alice.address);
        });

        it("ccip gateway resolves existing abi using ethers.provider.getABI", async () => {
            const resolver = await provider.getResolver("alice.eth");

            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");
            const sig = l2PublicResolverFactory.interface.encodeFunctionData("ABI", [alice.address, ethers.utils.namehash("alice.eth"), 1]);

            const res = await resolver._fetch(sig);
            const [actualContextType, actualAbi] = l2PublicResolverFactory.interface.decodeFunctionResult("ABI", res);

            const expectedAbi = l2PublicResolverFactory.interface.format(ethers.utils.FormatTypes.json).toString();

            expect(actualContextType).to.equal(1);
            expect(Buffer.from(actualAbi.slice(2), "hex").toString()).to.equal(expectedAbi);
        });
        it("ccip gateway resolves existing contenthash ethers.provider.getContenthash", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const achtualhash = await resolver.getContentHash();

            expect(achtualhash).to.equal("ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4");
        });

        it("ccip gateway resolves existing name ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("name", [alice.address, ethers.utils.namehash("alice.eth")]);

            const [responseBytes] = l2PublicResolverFactory.interface.decodeFunctionResult("name", await resolver._fetch(sig));

            const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

            expect(responseString).to.equal("alice");
        });
        it("ccip gateway resolves existing pubkey ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("pubkey", [alice.address, ethers.utils.namehash("alice.eth")]);

            const [x, y] = l2PublicResolverFactory.interface.decodeFunctionResult("pubkey", await resolver._fetch(sig));
            expect(x).to.equal(ethers.utils.formatBytes32String("foo"));
            expect(y).to.equal(ethers.utils.formatBytes32String("bar"));
        });
        it("ccip gateway resolves dnsRecord ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("dnsRecord", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
                keccak256("0x" + record.substring(0, 30)),
                1,
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("dnsRecord", await resolver._fetch(sig));
            //await require("hardhat").storageLayout.export()
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal("0x161076578616d706c6503636f6d000001000100000e100004010203040");
        });
        it("ccip gateway resolves hasDnsRecords", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("hasDNSRecords", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
                keccak256("0x" + record.substring(0, 30)),
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("hasDNSRecords", await resolver._fetch(sig));
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal(true);
        });
        it("ccip gateway resolves zonehash", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("zonehash", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("zonehash", await resolver._fetch(sig));
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal(keccak256(toUtf8Bytes("foo")));
        });

        it("Returns empty string if record is empty", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
        it("use parents resolver if node has no subdomain", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const resolver = await provider.getResolver("a.b.c.alice.eth");

            const text = await resolver.getText("my-slot");

            expect(text).to.equal("my-subdomain-record");
        });
        it("reverts if resolver is unknown", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const resolver = await provider.getResolver("bob.eth");

            await resolver
                .getText("my-slot")
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e).to.be.instanceOf(Error);
                });
        });
        it("resolves namewrapper profile", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("namewrapper.alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const resolver = await provider.getResolver("namewrapper.alice.eth");

            const text = await resolver.getText("namewrapper-slot");

            expect(text).to.equal("namewrapper-subdomain-record");
        });
    });

    describe.skip("resolveWithProof", () => {
        it("proof is valid onchain", async () => {
            console.log("start proof");
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", ccipResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();
            console.log(status);

            const responseBytes = await ccipResolver.resolveWithProof(body.data, callData);
            const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };
            expect(responseString).to.eql(JSON.stringify(profile));
        });
        it("rejects proofs from contracts other than l2Resolver", async () => {
            process.env = {
                ...process.env,
                L2_PUBLIC_RESOLVER_ADDRESS: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            };
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", ccipResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();

            await ccipResolver
                .resolveWithProof(body.data, callData)
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e.reason).to.equal("proof target does not match resolver");
                });
        });
    });
    describe.skip("setResolverForDomain", () => {
        it("reverts if node is 0x0", async () => {
            await ccipResolver
                .setResolverForDomain(ethers.constants.HashZero, bedrockCcipVerifier.address, "http://localhost:8080/{sender}/{data}")
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e.message).to.contains("node is 0x0");
                });
        });
        it("reverts if resolverAddress is 0x0", async () => {
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    ethers.constants.AddressZero,
                    "http://localhost:8080/{sender}/{data}"
                )
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e.message).to.contains("resolverAddress is 0x0");
                });
        });
        it("reverts if resolverAddress does not support resolveWithProofInterface", async () => {
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    //Alice is an EOA, so this is not a valid resolver
                    alice.address,
                    "http://localhost:8080/{sender}/{data}"
                )
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    console.log(e);
                    expect(e.message).to.contains("resolverAddress is not a CCIP Resolver");
                });
        });
        it("reverts if url string is empty", async () => {
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    //Alice is an EOA, so this is not a valid resolver
                    bedrockCcipVerifier.address,
                    ""
                )
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    console.log(e);
                    expect(e.message).to.contains("url is empty");
                });
        });
        it("adds resolver + event contains node, url, and resolverAddress", async () => {
            const tx = await ccipResolver.connect(alice).setResolverForDomain(
                ethers.utils.namehash("alice.eth"),
                //Alice is an EOA, so this is not a valid resolver
                bedrockCcipVerifier.address,
                "http://localhost:8080/{sender}/{data}"
            );

            const receipt = await tx.wait();

            const [ResolverAddedEvent] = receipt.events;

            const [node, gatewayUrl, resolverAddress] = ResolverAddedEvent.args;

            expect(node).to.equal(ethers.utils.namehash("alice.eth"));
            expect(gatewayUrl).to.equal("http://localhost:8080/{sender}/{data}");
            expect(resolverAddress).to.equal(bedrockCcipVerifier.address);
        });

        describe("Legacy ENS name", () => {
            it("reverts if msg.sender is not the profile owner", async () => {
                await ccipResolver
                    .setResolverForDomain(
                        ethers.utils.namehash("vitalik.eth"),
                        bedrockCcipVerifier.address,
                        "http://localhost:8080/{sender}/{data}"
                    )
                    .then((res) => {
                        expect.fail("Should have thrown an error");
                    })
                    .catch((e) => {
                        expect(e.message).to.contains("only subdomain owner");
                    });
            });
        });
    });

    const fetchRecordFromCcipGateway = async (url: string, json?: string) => {
        const [sender, data] = url.split("/").slice(3);
        const response = await request(ccipApp).get(`/${sender}/${data}`).send();
        return response;
    };
});
