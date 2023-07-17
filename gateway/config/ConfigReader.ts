import { ethers } from "ethers";

import { Config, ConfigEntry } from "./Config";

export function getConfigReader(_config?: string) {
    if (!_config) {
        throw new Error("CONFIG IS MISSING");
    }

    let config: Config;

    try {
        config = JSON.parse(_config);
    } catch (e) {
        throw new Error("Invalid JSON");
    }

    Object.keys(config).forEach((address: string) => {
        if (!ethers.utils.isAddress(address)) {
            throw new Error(`Invalid address ${address}`);
        }
        const normalizedAddress = ethers.utils.getAddress(address);
        config[normalizedAddress] = config[address] as ConfigEntry;
    });

    function getConfigForResolver(resolverAddr: string): ConfigEntry {
        return config[resolverAddr];
    }
    return {
        getConfigForResolver,
    };
}

export type ConfigReader = {
    getConfigForResolver: (resolverAddr: string) => ConfigEntry;
};
