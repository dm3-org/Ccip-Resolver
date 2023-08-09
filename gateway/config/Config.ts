export interface SigningConfigEntry {
    type: 'signing';
    handlerUrl: string;
}

export interface OptimismBedrockConfigEntry {
    type: 'optimism-bedrock';
    handlerUrl: string;
    l1ProviderUrl: string;
    l2ProviderUrl: string;
    l1chainId: string;
    l2chainId: string;
}
/**
 * Every supported Config by the Gateway.
 */
export type ConfigEntry = SigningConfigEntry | OptimismBedrockConfigEntry;

/**
 * Checks wether the provided ConfigEntry is a SigningConfigEntry.
 */
export function isSigningConfigEntry(configEntry: ConfigEntry): configEntry is SigningConfigEntry {
    return configEntry.type === 'signing';
}

/**
 * Checks wether the provided ConfigEntry is a OptimismBedrockConfigEntry.
 */
export function isOptimismBedrockConfigEntry(configEntry: ConfigEntry): configEntry is OptimismBedrockConfigEntry {
    return configEntry.type === 'optimism-bedrock';
}
/**
 * The gateway can be configured to support multiple resolvers.
 */
export type Config = Record<string, ConfigEntry>;
