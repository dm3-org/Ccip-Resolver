import { log } from "console"
import { dnsEncode } from "ethers/lib/utils"
import hre, { ethers } from "hardhat"
import { get } from "http"

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.DEBUG)
export const getText = async () => {
    const [signer] = await hre.ethers.getSigners()
    const node = ethers.utils.namehash("alice123.eth")

    const ccipVerifierInterface = new ethers.utils.Interface([

        "function ccipVerifier(bytes32 node) external view returns (string memory, address)",
        "function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory)",
        "function text(bytes32 node, string calldata key) returns (string memory)"
    ])

    const res = await signer.provider.call({
        to: "0x6D8D77aD82a954A0001a845Ff28C4278e6F5E879",
        data: ccipVerifierInterface.encodeFunctionData("ccipVerifier", [node]),
    })

    console.log(ccipVerifierInterface.decodeFunctionResult("ccipVerifier", res))

    const innerReq = ccipVerifierInterface.encodeFunctionData("text", [ethers.utils.namehash("alice123.eth"), "my-record"])
    const calldata = ccipVerifierInterface.encodeFunctionData("resolve", [dnsEncode("alice123.eth"), innerReq])


    const resolver = await ethers.provider.getResolver("alice123.eth")

    


    const ifce = new ethers.utils.Interface([
        "function foo() returns (bytes memory)",
    ]);

    const fr = ifce.encodeFunctionResult("foo", ["0x6d792d7265636f72642d76616c7565"])

    console.log(fr)
    console.log("start getTEXT")


    const text = await resolver.getText("my-record")
    console.log(text)


}

const getMainnet = async () => {
    const name = "heiko.beta-user.dm3.eth"
    const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/L1PIhq_TFU7sofEqd2IJwWqhBsJYah1S")

    const resolver = await provider.getResolver(name)
    const text = await resolver.getText("network.dm3.profile")
    console.log(text)
}
//getMainnet()
getText()
