// This code instantiates the OptimisimProofVerifierFactory contract and returns the type of the L2StateProofParamType

import { ethers } from "hardhat";
import { OptimisimProofVerifier__factory } from "typechain";

// This function returns the OptimisimProofVerifier contract's "getProofValue" interface. This interface can
// be used to get the L2StateProof, which is the type of the "proof" param in the "getProofValue"
// function.

export async function getProofParamType() {
    const OptimisimProofVerifierFactory = (await ethers.getContractFactory(
        "OptimisimProofVerifier"
    )) as OptimisimProofVerifier__factory;
    const iFace = OptimisimProofVerifierFactory.interface;
    const [_, getProofValueFragment] = iFace.fragments;
    const [L2StateProofParamType] = getProofValueFragment.inputs;
    return L2StateProofParamType;
}
