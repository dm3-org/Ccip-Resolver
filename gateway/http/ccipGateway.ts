import express from 'express';

import { ConfigReader } from '../config/ConfigReader';
import { optimismBedrockHandler } from '../handler/optimism-bedrock/optimismBedrockHandler';
import { signingHandler } from '../handler/signing/signingHandler';

/**
 * Creates an Express router to handle requests for the CCIP gateway.
 * @param configReader - The configuration reader that provides the necessary config entries.
 * @returns The Express router for the CCIP gateway.
 */
export function ccipGateway(configReader: ConfigReader) {
    const router = express.Router();

    router.get('/:resolverAddr/:calldata', async (req: express.Request, res: express.Response) => {
        const { resolverAddr } = req.params;
        const calldata = req.params.calldata.replace('.json', '');

        try {
            // eslint-disable max-line-length
            /**
             * To get the right handler for a resolverAddr, we need to look up the config entry
             * for that resolverAddr.
             * The host of the gateway has to specifiy in the CONFIG environment variable which config file to use.
             * The config file is a JSON file that maps resolverAddr to config entries. The config entries are either
             * signing or optimism-bedrock config entries. The config entries contain the handlerUrl,
             * which is the URL of the handler that should be used for that resolverAddr.
             */
            const configEntry = configReader.getConfigForResolver(resolverAddr);

            if (!configEntry) {
                /**
                 * If there is no config entry for the resolverAddr, we return a 404. As there is no way for the gateway to resolve the request
                 */
                console.warn(`Unknown resolver selector pair for resolverAddr: ${resolverAddr}`);

                res.status(404).send({
                    message: 'Unknown resolver selector pair',
                });
                return;
            }
            /**
             * To get the data from the offchain resolver we make a request to the corosspeding handlerUrl.
             * That handler has to return the data in the format that the resolver expects.
             */
            switch (configEntry.type) {
                case 'signing': {
                    console.info({ type: 'signing' });
                    console.debug({ type: 'signing', calldata, resolverAddr, configEntry });
                    const response = await signingHandler(calldata, resolverAddr, configEntry);
                    res.status(200).send({ data: response });
                    break;
                }
                case 'optimism-bedrock': {
                    console.info({ type: 'optimism-bedrock' });
                    console.debug({ type: 'optimism-bedrock', calldata, resolverAddr, configEntry });
                    const response = await optimismBedrockHandler(calldata, resolverAddr, configEntry);

                    res.status(200).send({ data: response });
                    break;
                }

                default:
                    res.status(404).send({
                        message: 'Unsupported entry type',
                    });
            }
        } catch (e) {
            console.warn((e as Error).message);
            res.status(400).send({ message: 'ccip gateway error ,' + e });
        }
    });
    return router;
}
