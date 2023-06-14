import { getResolverInterface } from "../../../utils/getResolverInterface";
import { decodeText } from "../text/decodeText";
import { decodeAddr } from "../addr/decodeAddr";
import { ethers } from "ethers";

export function decodeCcipRequest(calldata: string) {
    try {
        const textResolver = getResolverInterface();

        //Parse the calldata returned by the contract
        const [rawContext, data] = textResolver.parseTransaction({
            data: calldata,
        }).args;

        //In this case the context is always just the owner address. Hence we're removing the padding
        const [context] = ethers.utils.defaultAbiCoder.decode(["address"], rawContext)

        const { signature, args } = textResolver.parseTransaction({
            data,
        });

        switch (signature) {
            case "text(bytes32,string)":
                return { signature, request: decodeText(context, args) };
            case "addr(bytes32)": {
                return { signature, request: decodeAddr(context, args) };
            }

            default:
                return { signature, request: null };
        }
    } catch (err: any) {
        console.log("[Decode Calldata] Can't decode calldata ");
        console.log(err);
        throw err;
    }
}
