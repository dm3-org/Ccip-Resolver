import { getResolverInterface } from "../../utils/getResolverInterface";
export function encodePubkey(x: string, y: string) {
    return getResolverInterface().encodeFunctionResult("pubkey(bytes,bytes32)", [x, y]);
}
