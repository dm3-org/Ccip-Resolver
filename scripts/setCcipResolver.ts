import { BigNumber } from "ethers"
import hre, { ethers } from "hardhat"


const CCIP_RESOLVER_ADDRESS = "0x6D8D77aD82a954A0001a845Ff28C4278e6F5E879"
const ENS_NAME = "alice123.eth"

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"

export const setCcipResolver = async () => {
    const [signer] = await hre.ethers.getSigners()
    const node = ethers.utils.namehash(ENS_NAME)
    console.log(node)
    const registryInterface = new ethers.utils.Interface([
        "function setResolver(bytes32 node, address resolver) external"
    ])

    const data = registryInterface.encodeFunctionData("setResolver", [node, CCIP_RESOLVER_ADDRESS])

    const tx = await signer.sendTransaction({
        to: ENS_REGISTRY,
        data,
        gasLimit: 1000000,
        gasPrice: 1000000
    })

    await tx.wait()

    console.log("Transaction hash: ", tx.hash)
}

setCcipResolver()
