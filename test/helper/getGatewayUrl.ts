import { Contract, ethers } from "ethers";
import { encodeEnsName } from "./encodeEnsName";

export const getGateWayUrl = async (ensName: string, recordName: string, offchainResolver: Contract) => {
    try {
        const textData = new ethers.utils.Interface([
            "function text(bytes32 node, string calldata key) external view returns (string memory)",
        ]).encodeFunctionData("text", [ethers.utils.namehash(ensName), recordName]);

        //This always revers and throws the OffchainLookup Exceptions hence we need to catch it
        await offchainResolver.resolve(encodeEnsName(ensName), textData);
        return { gatewayUrl: "", callbackFunction: "", extraData: "" };
    } catch (err: any) {
        const { sender, urls, callData } = err.errorArgs;
        //Decode call

        //Replace template vars
        const gatewayUrl = urls[0].replace("{sender}", sender).replace("{data}", callData);

        return { gatewayUrl, sender, callData };
    }
};
