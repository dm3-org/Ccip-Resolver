import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import express from "express";
import http from "http";
import cors from "cors";
import winston from "winston";

import { ccipGateway } from "./http/ccipGateway";
import { getConfigReader } from "./config/ConfigReader";

dotenv.config();

declare global {
    var logger: winston.Logger
}
  
global.logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    transports: [new winston.transports.Console()],
});

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

(async () => {
    const config = getConfigReader(process.env.CONFIG);
    app.use("/", ccipGateway(config));
})();
const port = process.env.PORT || "8081";
server.listen(port, () => {
    global.logger.info("[Server] listening at port " + port + " and dir " + __dirname);
});
