import hre, { ethers } from "hardhat"

const ENS_NAME = "bob123.eth"
const URL = "http://localhost:8081/{sender}/{data}"

const CCIP_RESOLVER = "0x410EBbabB4471e9c18CC36642F4057812E125e94"
const SIGNATURE_VERIFIER = "0x0C25389fc41b392C7cEAD6f0a82e22BD2Cc358F1"

export const setResolverForDomain = async () => {
    const [signer] = await hre.ethers.getSigners()
    const node = ethers.utils.namehash(ENS_NAME)

    const registryInterface = new ethers.utils.Interface([
        "function setVerifierForDomain(bytes32 node, address resolverAddress, string memory url) external "
    ])

    const data = registryInterface.encodeFunctionData("setVerifierForDomain", [node, SIGNATURE_VERIFIER, URL])

    const tx = await signer.sendTransaction({
        to: CCIP_RESOLVER,
        data,
        gasLimit: 500000,
    })

    console.log("Transaction hash: ", tx.hash)
    await tx.wait()
    console.log(`verifier set to ${SIGNATURE_VERIFIER}, url set to ${URL}`)
}
setResolverForDomain()
