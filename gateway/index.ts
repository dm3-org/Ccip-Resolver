import bodyParser from "body-parser";
import { ethers } from "ethers";
import express from "express";
import { ccipGateway } from "./http/ccipGateway";

const port = 3000;
const main = async () => {
    const l1_provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    const l2_provider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL);

    const app = express();
    app.use(bodyParser.json());
    app.use(ccipGateway(l1_provider, l2_provider));

    app.listen(port, () => console.log(`Listening on port ${port}`));
};
