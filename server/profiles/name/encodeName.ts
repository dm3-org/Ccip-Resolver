import { getResolverInterface } from "../../utils/getResolverInterface";
export function encodeName(result: string,) {
    return getResolverInterface().encodeFunctionResult("name(bytes,bytes32)", [result]);
}
