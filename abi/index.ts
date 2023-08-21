import {
    ProofServiceTestContract__factory,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier__factory,
    IBedrockProofVerifier__factory,
    SignatureCcipVerifier__factory, CcipResponseVerifier__factory,
    ICcipResponseVerifier__factory,
    ERC3668Resolver__factory,
    IExtendedResolver__factory,
    IMetadataResolver__factory,
    SupportsInterface__factory
} from "../typechain"

export default {
    ProofServiceTestContract: ProofServiceTestContract__factory.abi,
    BedrockCcipVerifier: BedrockCcipVerifier__factory.abi,
    BedrockProofVerifier: BedrockProofVerifier__factory.abi,
    IBedrockProofVerifier: IBedrockProofVerifier__factory.abi,
    SignatureCcipVerifier: SignatureCcipVerifier__factory.abi,
    CcipResponseVerifier: CcipResponseVerifier__factory.abi,
    ICcipResponseVerifier: ICcipResponseVerifier__factory.abi,
    ERC3668Resolver: ERC3668Resolver__factory.abi,
    IExtendedResolver: IExtendedResolver__factory.abi,
    IMetadataResolver: IMetadataResolver__factory.abi,
    SupportsInterface: SupportsInterface__factory.abi
}
