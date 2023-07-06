import { getResolverInterface } from "../../utils/getResolverInterface";


export function encodeContentHash(result: string) {
    return getResolverInterface().encodeFunctionResult("contenthash(bytes calldata context, bytes32 node)", [result]);
}
