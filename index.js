const ProofServiceTestContract = require('./build/contracts/test-contract/ProofServiceTestContract');

const BedrockCcipVerifier = require('./build/contracts/verifier/optimism-bedrock/BedrockCcipVerifier');
const BedrockProofVerifier = require('./build/contracts/verifier/optimism-bedrock/BedrockProofVerifier');
const IBedrockProofVerifier = require('./build/contracts/verifier/optimism-bedrock/IBedrockProofVerifier');

const SignatureVerifier = require('./build/contracts/verifier/signature/SignatureVerifier');
const SignatureCcipVerifier = require('./build/contracts/verifier/signature/SignatureCcipVerifier');

const CcipResponseVerifier = require('./build/contracts/verifier/CcipResponseVerifier');
const ICcipResponseVerifier = require('./build/contracts/verifier/ICcipResponseVerifier');

const ERC3668Resolver = require('./build/contracts/ERC3668Resolver');
const IContextResolver = require('./build/contracts/IContextResolver');
const IExtendedResolver = require('./build/contracts/IExtendedResolver');
const Supportsinterface = require('./build/contracts/Supportsinterface');

module.exports = {
    ProofServiceTestContract,

    BedrockCcipVerifier,
    BedrockProofVerifier,
    IBedrockProofVerifier,

    SignatureVerifier,
    SignatureCcipVerifier,

    CcipResponseVerifier,
    ICcipResponseVerifier,

    ERC3668Resolver,
    IContextResolver,
    IExtendedResolver,
    Supportsinterface,
};
