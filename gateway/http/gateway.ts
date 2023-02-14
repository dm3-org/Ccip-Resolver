import { Signer } from "ethers";
import express from "express";
import { CcipRouter } from "../service/ccip/CcipRouter";
import { EncodingService } from "../service/encoding/EncodingService";

export function ccipGateway(signer: Signer, resolverAddr: string) {
    const router = express.Router();

    router.get("/:resolverAddr/:calldata", async (req: express.Request, res: express.Response) => {
        const { resolverAddr, calldata } = req.params;

        req.app.locals.logger.info(`GET ${resolverAddr}`);

        try {
            const { request, signature } = EncodingService.decodeRequest(calldata);

            const router = new CcipRouter();

            const response = router.handleRequest(req, signature, request);

            if (!response) {
                Lib.log("Record not found");
                res.status(404).send({ message: "Record not found" });
            } else {
                const data = await Lib.offchainResolver.encodeResponse(
                    signer,
                    resolverAddr,
                    response,
                    calldata,
                    signature
                );

                res.send({ data });
            }
        } catch (e) {
            req.app.locals.logger.warn((e as Error).message);
            res.status(400).send({ message: "Unknown error" });
        }
    });
    return router;
}
