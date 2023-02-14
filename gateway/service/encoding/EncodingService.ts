import { getResolverInterface } from "../../utils/getResolverInterface";
import { decodeText } from "./text/decodeText";

export class EncodingService {
    public static decodeRequest(calldata: string) {
        try {
            const textResolver = getResolverInterface();

            //Parse the calldata returned by a contra
            const [ensName, data] = textResolver.parseTransaction({
                data: calldata,
            }).args;

            const { signature, args } = textResolver.parseTransaction({
                data,
            });

            switch (signature) {
                case "text(bytes32,string)":
                    return { signature, request: decodeText(ensName, args) };

                default:
                    throw Error(`${signature} is not supported`);
            }
        } catch (err: any) {
            console.log("[Decode Calldata] Can't decode calldata ");
            console.log(err);
            throw err;
        }
    }
}
