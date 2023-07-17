import { ethers } from "ethers";

import { ConfigEntry } from "./Config";

export function getConfigReader(config?: string) {
    if (!config) {
        throw new Error("CONFIG IS MISSING");
    }

    let configJson;
    
    try {
        configJson = JSON.parse(config);
    } catch (e) {
        throw new Error("Invalid JSON");
    }

    Object.keys(configJson).forEach((address: string) => {
        if (!ethers.utils.isAddress(address)) {
            throw new Error(`Invalid address ${address}`);
        }
        const normalizedAddress = ethers.utils.getAddress(address);
        configJson[normalizedAddress] = configJson[address];
    });

    function getConfigForResolver(resolverAddr: string): ConfigEntry {
        return configJson[resolverAddr];
    }
    return {
        getConfigForResolver,
    };
}

export type ConfigReader = {
    getConfigForResolver: (resolverAddr: string) => ConfigEntry;
};
