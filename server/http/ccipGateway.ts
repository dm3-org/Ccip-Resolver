import express from 'express';
import { CcipRouter } from './ccip/CcipRouter';
import { decodeCcipRequest } from "./encoding/ccipRequest/decodeCcipRequest";

export function EnsHandler() {
    const router = express.Router();

    router.get(
        '/:resolverAddr/:calldata',
        async (
            req: express.Request,
            res: express.Response,
        ) => {
            const calldata = req.params.calldata.replace('.json', '');

            try {
                const { signature, request } = decodeCcipRequest(calldata);

                if (!request) {
                    return res.status(404).send({ message: `unsupported signature ${signature}` });
                }

                const ccipRouter = await CcipRouter.instance();
                const response = await ccipRouter.handleRequest(signature, request)

                if (!response) {
                    return res.status(404).send({ message: `unable to process request` });
                }
                res.status(200).send({ data: response });


            } catch (e) {
                req.app.locals.logger.warn((e as Error).message);
                res.status(400).send({ message: 'Unknown error' });
            }
        },
    );
    return router;
}
