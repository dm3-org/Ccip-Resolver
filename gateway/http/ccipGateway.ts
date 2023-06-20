import { ethers } from "ethers";
import express from "express";
import { CcipRouter } from "../service/ccip/CcipRouter";
import { decodeCcipRequest } from "../service/encoding/ccipRequest/decodeCcipRequest";

export function ccipGateway(
    l1provider: ethers.providers.StaticJsonRpcProvider,
    l2provider: ethers.providers.JsonRpcProvider
) {
    global.l1_provider = l1provider;
    global.l2_provider = l2provider;

    const router = express.Router();

    router.get("/:resolverAddr/:calldata", async (req: express.Request, res: express.Response) => {
        const { resolverAddr, calldata } = req.params;

        console.info(`GET ${resolverAddr}`);

        try {
            const { request, signature } = decodeCcipRequest(calldata);

            if (!request) {
                return res.status(404).send({ message: `unsupported signature ${signature}` });
            }

            const router = await CcipRouter.instance();

            const response = await router.handleRequest(signature, request);

            if (!response) {
                console.log("no res");
                return res.status(404).send({ message: `unable to process request` });
            }

            res.status(200).send({ data: response });
        } catch (e) {
            console.warn((e as Error).message);
            res.status(400).send({ message: "Cant process request" });
        }
    });
    return router;
}
