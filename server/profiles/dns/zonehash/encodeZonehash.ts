import { getResolverInterface } from "../../../utils/getResolverInterface";
export function encodeZonehash(result: string,) {
    return getResolverInterface().encodeFunctionResult("zonehash(bytes, bytes32)", [result]);
}
