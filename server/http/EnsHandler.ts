import express from 'express';
import { L2PublicResolver, L2PublicResolver__factory } from "../../typechain";
import { handleBedrockCcipRequest } from "./handleBedrockCcipRequest";
import { ethers } from 'ethers';

export function EnsBedrockHandler(provider: ethers.providers.StaticJsonRpcProvider, l2ResolverAddress: string) {
    const router = express.Router();

    const l2PublicResolver = new ethers.Contract(
        l2ResolverAddress,
        L2PublicResolver__factory.createInterface(),
        provider
    ) as L2PublicResolver

    router.get(
        '/:resolverAddr/:calldata',
        async (
            req: express.Request,
            res: express.Response,
        ) => {
            const calldata = req.params.calldata.replace('.json', '');
            try {
                const response = await handleBedrockCcipRequest(l2PublicResolver, calldata);
                console.log(response)

                if (!response) {
                    return res.status(404).send({ message: `unsupported signature` });
                }

                res.status(200).send({ ...response });
            } catch (e) {
                req.app.locals.logger.warn((e as Error).message);
                res.status(400).send({ message: 'Unknown error' });
            }
        },
    );
    return router;
}
