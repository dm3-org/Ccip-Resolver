import { BigNumber } from "ethers";

/**
 * Converts a number or BigNumber to a hexadecimal string in RPC format.
 * Copied from the Optimism core-utils package to avoid including the entire package as a dependency.
 * @see https://github.com/ethereum-optimism/optimism/blob/7eda941967549aab449c21b2a2e4c10de792bd0b/packages/core-utils/src/common/hex-strings.ts#L65
 * @param n - The number or BigNumber to convert to a hexadecimal string.
 * @returns A hexadecimal string in RPC format.
 */
export const toRpcHexString = (n: number | BigNumber) => {
    let num;
    if (typeof n === 'number') {
        num = '0x' + n.toString(16);
    }
    else {
        num = n.toHexString();
    }
    if (num === '0x0') {
        return num;
    }
    else {
        return num.replace(/^0x0/, '0x');
    }
};
