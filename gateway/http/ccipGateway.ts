import express from "express";
import { CcipRouter } from "../service/ccip/CcipRouter";
import { EncodingService } from "../service/encoding/EncodingService";

export function ccipGateway(resolverAddr: string) {
    const router = express.Router();

    router.get("/:resolverAddr/:calldata", async (req: express.Request, res: express.Response) => {
        const { resolverAddr, calldata } = req.params;

        console.info(`GET ${resolverAddr}`);

        try {
            const { request, signature } = EncodingService.decodeRequest(calldata);

            const router = new CcipRouter(resolverAddr);

            const response = await router.handleRequest(signature, request);

            if (!response) {
                console.log("Record not found");
                return res.status(404).send({ message: "Record not found" });
            }

            // const data = await Lib.offchainResolver.encodeResponse(signer, resolverAddr, response, calldata, signature);
            res.status(500).send("unimplemented");
        } catch (e) {
            console.warn((e as Error).message);
            res.status(400).send({ message: "rfgtrgtrrror" });
        }
    });
    return router;
}
