import { getResolverInterface } from "../../utils/getResolverInterface";
export function encodeAbi(result: string, contentType: string) {
    return getResolverInterface().encodeFunctionResult("ABI(bytes,bytes32,uint256)", [contentType, result]);
}
