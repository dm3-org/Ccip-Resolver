import { ethers } from "ethers";

export function encodeText(result: string) {
    const iTextResolver = new ethers.utils.Interface([
        "function text(bytes32 node, string calldata key) external view returns (string memory)",
    ]);
    return iTextResolver.encodeFunctionResult("text(bytes32,string)", [Buffer.from(result.slice(2), "hex").toString()]);
}
