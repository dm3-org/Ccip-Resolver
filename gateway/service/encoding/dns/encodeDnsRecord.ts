import { getResolverInterface } from "../../../utils/getResolverInterface";
export function encodeDnsRecord(result: string,) {
    return getResolverInterface().encodeFunctionResult("dnsRecord(bytes ,bytes32 ,bytes32 ,uint16)", [result]);
}
