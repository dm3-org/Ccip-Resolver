import hre, { ethers } from "hardhat"

const ENS_NAME = "alice123.eth"
const URL = "http://localhost:8081/{sender}/{data}"

const CCIP_RESOLVER = "0x410EBbabB4471e9c18CC36642F4057812E125e94"
const BEDROCK_CCIP_VERIFIER = "0x4b563D894619331993f2EA95B4050bCBa87F869D"

export const setResolverForDomain = async () => {
    const [signer] = await hre.ethers.getSigners()
    const node = ethers.utils.namehash(ENS_NAME)

    const registryInterface = new ethers.utils.Interface([
        "function setVerifierForDomain(bytes32 node, address resolverAddress, string memory url) external "
    ])

    const data = registryInterface.encodeFunctionData("setVerifierForDomain", [node, BEDROCK_CCIP_VERIFIER, URL])

    const tx = await signer.sendTransaction({
        to: CCIP_RESOLVER,
        data,
        gasLimit: 500000,
    })

    console.log("Transaction hash: ", tx.hash)
    await tx.wait()
    console.log(`resolver set to ${BEDROCK_CCIP_VERIFIER}, url set to ${URL}`)
}
setResolverForDomain()
