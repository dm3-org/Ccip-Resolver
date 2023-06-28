import express from 'express';
import { handleCcipRequest } from "./handleCcipRequest";
import { ethers } from "hardhat";
import { L2PublicResolver__factory, L2PublicResolver } from "../../typechain"

export async function EnsHandler(l2ResolverAddress: string) {
    const router = express.Router();
    const l2PublicResolverFactory = (await ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

    const l2PublicResolver = await l2PublicResolverFactory.attach(l2ResolverAddress)


    router.get(
        '/:resolverAddr/:calldata',
        async (
            req: express.Request,
            res: express.Response,
        ) => {
            const calldata = req.params.calldata.replace('.json', '');

            try {
                const response = await handleCcipRequest(l2PublicResolver, calldata);

                if (!response) {
                    return res.status(404).send({ message: `unsupported signature` });
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
