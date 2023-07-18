import axios from "axios";
import { ethers } from "ethers";

import { SigningConfigEntry } from "../../config/Config";

import { signAndEncodeResponse } from "./signAndEncodeResponse";
import { Logger } from "winston";

export async function signingHandler(calldata: string, resolverAddr: string, configEntry: SigningConfigEntry, logger: Logger) {
    const url = `${configEntry.handlerUrl}/${resolverAddr}/${calldata}`
    logger.info({ message: "signingHandler", url });
    const result = (await axios.get(url)).data;

    const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY as string);
    return signAndEncodeResponse(signer, resolverAddr, result, calldata);
}
