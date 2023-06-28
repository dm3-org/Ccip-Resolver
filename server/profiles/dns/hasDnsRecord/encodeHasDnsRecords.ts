import { getResolverInterface } from "../../../utils/getResolverInterface";

export function encodeHasDnsRecord(result: string,) {
    return getResolverInterface().encodeFunctionResult("hasDNSRecords(bytes ,bytes32 ,bytes32)", [result]);
}
