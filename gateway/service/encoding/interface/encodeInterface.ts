import { getResolverInterface } from "../../../utils/getResolverInterface";
export function encodeInterface(result: string,) {
    return getResolverInterface().encodeFunctionResult("interfaceImplementer(bytes,bytes32,bytes4)", [result]);
}
