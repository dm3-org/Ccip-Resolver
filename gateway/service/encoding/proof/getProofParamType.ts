// This code instantiates the BedrockProofVerifierFactory contract and returns the type of the L2StateProofParamType

import { ethers } from 'ethers';

import { BedrockProofVerifier__factory } from '../../../../typechain';

// This function returns the BedrockProofVerifier contract's "getProofValue" interface. This interface can
// be used to get the L2StateProof, which is the type of the "proof" param in the "getProofValue"
// function.

export async function getProofParamType() {
    const iFace = new ethers.utils.Interface(BedrockProofVerifier__factory.abi);
    const [_, getProofValueFragment] = iFace.fragments;
    const [L2StateProofParamType] = getProofValueFragment.inputs;
    return L2StateProofParamType;
}
