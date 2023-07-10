import bodyParser from 'body-parser';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import express from 'express';
import http from 'http';
import winston from 'winston';
import { EnsBedrockHandler } from './http/EnsBedrockHandler';


dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const resolverAddress = process.env.L2_RESOLVER_ADDRESS;
if (!resolverAddress) {
    throw new Error('L2_RESOLVER_ADDRESS not set');
}

const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());



(async () => {
    app.locals.logger = winston.createLogger({
        transports: [new winston.transports.Console()],
    });

    const L2_PROVIDER_URL = process.env.L2_PROVIDER_URL;
    if (!L2_PROVIDER_URL) {
        throw new Error('L2_PROVIDER_URL not set');
    }
    const provider = new ethers.providers.StaticJsonRpcProvider(L2_PROVIDER_URL);

    app.use('/', EnsBedrockHandler(provider, resolverAddress));
})();
const port = process.env.PORT || '8887';
server.listen(port, () => {
    app.locals.logger.info(
        '[Ens Handler] listening at port ' + port + ' and dir ' + __dirname,
    );
    app.locals.logger.info(
        '[Ens Handler] Serving L2 Public Resolver Address ' + resolverAddress
    );
});
