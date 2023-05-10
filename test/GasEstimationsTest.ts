import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, ethers as hreEthers } from "hardhat";
import { OptimisimProofVerifier } from "typechain";

describe.skip("Gas Estimations", () => {
    let deployer: SignerWithAddress;

    beforeEach(async () => {
        [deployer] = await ethers.getSigners();
    });
    describe("OptimismProofVerifier", () => {
        it("Deployment", async () => {
            const optimismProofVerifierFactory = await hreEthers.getContractFactory("OptimisimProofVerifier");

            const deployTx = optimismProofVerifierFactory.getDeployTransaction(ethers.constants.AddressZero);

            const deployTxResponse = await deployer.sendTransaction(deployTx);

            const deployTxReceipt = await deployTxResponse.wait();

            const gasUsed = deployTxReceipt.gasUsed;

            console.log(`Optimism Proof Verifier deployment took ${gasUsed} Gas`);

            console.log(
                "Based on 50 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("50", "gwei")))
            );
            console.log(
                "Based on 60 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("60", "gwei")))
            );
            console.log(
                "Based on 70 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("70", "gwei")))
            );
            console.log(
                "Based on 80 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("80", "gwei")))
            );
            console.log(
                "Based on 90 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("90", "gwei")))
            );
            console.log(
                "Based on 100 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("100", "gwei")))
            );
        });
        it("Deployment", async () => {
            const optimismProofVerifierFactory = await hreEthers.getContractFactory("OptimismResolver");

            const deployTx = optimismProofVerifierFactory.getDeployTransaction(
                "http://localhost:8080/{sender}/{data}",
                deployer.address,
                ethers.constants.AddressZero,
                ethers.constants.AddressZero
            );

            const deployTxResponse = await deployer.sendTransaction(deployTx);

            const deployTxReceipt = await deployTxResponse.wait();

            const gasUsed = deployTxReceipt.gasUsed;

            console.log(`OptimismResolver deployment took ${gasUsed} Gas`);

            console.log(
                "Based on 50 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("50", "gwei")))
            );
            console.log(
                "Based on 60 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("60", "gwei")))
            );
            console.log(
                "Based on 70 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("70", "gwei")))
            );
            console.log(
                "Based on 80 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("80", "gwei")))
            );
            console.log(
                "Based on 90 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("90", "gwei")))
            );
            console.log(
                "Based on 100 GWEI it would've cost : " +
                    ethers.utils.formatEther(gasUsed.mul(ethers.utils.parseUnits("100", "gwei")))
            );
        });
    });
});
