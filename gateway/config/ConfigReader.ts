import { ethers } from "ethers";
import { ConfigEntry } from "./Config";


export function getConfigReader(config?: string) {
    if (!config) {
        throw "CONFIG IS MISSING"
    }
    const configJson = JSON.parse(config);

    Object.keys(configJson).forEach((address: string) => {
        const normalizedAddress = ethers.utils.getAddress(address)
        configJson[normalizedAddress] = configJson[address]
    })


    function getConfigForResolver(resolverAddr: string): ConfigEntry {
        return configJson[resolverAddr]
    }
    return {
        getConfigForResolver
    }
}

export type ConfigReader = {
    getConfigForResolver: (resolverAddr: string) => ConfigEntry
};
