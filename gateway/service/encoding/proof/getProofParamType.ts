import { ethers } from "hardhat";
import { OptimisimProofVerifier__factory } from "typechain";

export async function getProofParamType() {
    const OptimisimProofVerifierFactory = (await ethers.getContractFactory(
        "OptimisimProofVerifier"
    )) as OptimisimProofVerifier__factory;
    const iFace = OptimisimProofVerifierFactory.interface;
    const [_, getProofValueFragment] = iFace.fragments;
    const [L2StateProofParamType] = getProofValueFragment.inputs;
    return L2StateProofParamType;
}
