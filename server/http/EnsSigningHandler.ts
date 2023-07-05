import { ethers } from 'ethers';
import express from 'express';
import { L2PublicResolver, L2PublicResolver__factory } from "../../typechain";
import { handleSignatureCcipRequest } from './handleSignatureCcipRequest';

export function EnsSigningHandler(provider: ethers.providers.StaticJsonRpcProvider, l2ResolverAddress: string) {
    const router = express.Router();

    const l2PublicResolver = new ethers.Contract(
        l2ResolverAddress,
        L2PublicResolver__factory.createInterface(),
        provider
    ) as L2PublicResolver

    console.log("mount")
    router.get(
        '/:resolverAddr/:calldata',
        async (
            req: express.Request,
            res: express.Response,
        ) => {
            const calldata = req.params.calldata.replace('.json', '');
            try {
                const response = await handleSignatureCcipRequest(l2PublicResolver, calldata);

                if (!response) {
                    return res.status(404).send({ message: `unsupported signature` });
                }

                const enc = ethers.utils.defaultAbiCoder.encode(["string"], [response])
                res.status(200).send(enc);
            } catch (e) {
                req.app.locals.logger.warn((e as Error).message);
                res.status(400).send({ message: 'Unknown error' });
            }
        },
    );
    return router;
}
