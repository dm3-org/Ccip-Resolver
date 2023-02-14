import { BigNumber, ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils";
const ZERO_BYTES = "0x0000000000000000000000000000000000000000000000000000000000000000";

export class StorageHelper {
    private readonly provider: ethers.providers.BaseProvider;
    private readonly contractAddress: string;

    constructor(provider: ethers.providers.BaseProvider, contractAddress: string) {
        this.provider = provider;
        this.contractAddress = contractAddress;
    }

    private getStorageSlot(slot: number, node: string, recordName: string) {
        const innerHash = ethers.utils.solidityKeccak256(["bytes32", "uint256"], [node, slot]);
        return ethers.utils.solidityKeccak256(["string", "bytes32"], [recordName, innerHash]);
    }

    public async readFromStorage(slot: number, node: string, recordName: string) {
        const initialSlot = this.getStorageSlot(slot, node, recordName);
        console.log(initialSlot);
        //This is the initial value of the slot
        //Indicting the length of the following sequence

        const value = await this.provider.getStorageAt(this.contractAddress, initialSlot);
        if (value === ZERO_BYTES) {
            console.log("Slot empty");
            return ZERO_BYTES;
        }

        const lastByte = value.substring(value.length - 2);
        const lastBit = parseInt(lastByte, 16) % 2;

        if (lastBit === 0) {
            const length = BigNumber.from("0x" + lastByte).toNumber() + 2;
            return value.substring(0, length);
        }

        const length = BigNumber.from(value).toNumber() + 2;
        return this.iterateOverStorage(initialSlot, length);
    }

    private async iterateOverStorage(initialSlot: string, length: number) {
        //Very first data location is keccak256(initialSlot)
        let currentSlot = keccak256(initialSlot);
        let result = await this.provider.getStorageAt(this.contractAddress, currentSlot);

        let currentValue = result;

        while (currentValue !== ZERO_BYTES) {
            currentSlot = BigNumber.from(currentSlot).add(1).toHexString();
            currentValue = await this.provider.getStorageAt(this.contractAddress, currentSlot);
            result += currentValue.substring(2);
        }

        return result.substring(0, length);
    }
}
