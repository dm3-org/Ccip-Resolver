import { FakeContract, smock } from "@defi-wonderland/smock";
import { ethers } from "hardhat";
import { OptimisimProofVerifier } from "typechain";

export const mockOptimismProofVerifier = async (): Promise<OptimisimProofVerifier> => {
    const optimismProofVerifierFactory = await ethers.getContractFactory("OptimisimProofVerifier");
    const addresManager = await smock.fake("Lib_AddressManager");
    addresManager.getAddress
        .whenCalledWith("StateCommitmentChain")
        .returns("0xBe5dAb4A2e9cd0F27300dB4aB94BeE3A233AEB19");

    const optimismProofVerifier = (await optimismProofVerifierFactory.deploy(
        addresManager.address
    )) as OptimisimProofVerifier;
    return optimismProofVerifier;
};
