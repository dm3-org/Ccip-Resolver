import express from "express";
import { CcipRouter } from "../service/ccip/CcipRouter";
import { EncodingService } from "../service/encoding/EncodingService";

export function ccipGateway(resolverAddr: string) {
    const router = express.Router();

    router.get("/:resolverAddr/:calldata", async (req: express.Request, res: express.Response) => {
        const { resolverAddr, calldata } = req.params;

        console.info(`GET ${resolverAddr}`);

        try {
            const decodedRequest = EncodingService.decodeRequest(calldata);

            if (!decodedRequest) {
                return res.status(404).send({ message: `invalid calldata` });
            }
            const { request, signature } = decodedRequest;

            const router = CcipRouter.instance();

            const response = await router.handleRequest(signature, request);

            if (!response) {
                console.log("no req");
                return res.status(404).send({ message: `request is not supported` });
            }

            res.status(200).send({ data: response });
        } catch (e) {
            console.warn((e as Error).message);
            res.status(400).send({ message: "Cant process request" });
        }
    });
    return router;
}
