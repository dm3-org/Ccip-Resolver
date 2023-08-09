import axios from 'axios';
import { ethers } from 'ethers';
import { Logger } from 'winston';

import { SigningConfigEntry } from '../../config/Config';

import { signAndEncodeResponse } from './signAndEncodeResponse';

/**
 * Signs the provided calldata using the resolver address and returns the signed and encoded response.
 * @param calldata - The calldata to be signed.
 * @param resolverAddr - The resolver address.
 * @param configEntry - The signing configuration entry.
 * @returns The signed and encoded response.
 */
export async function signingHandler(calldata: string, resolverAddr: string, configEntry: SigningConfigEntry) {
    /**
     * Fetches the result from the data source.
     */

    let result;
    try {
        result = (await axios.get(`${configEntry.handlerUrl}/${resolverAddr}/${calldata}`)).data;
    } catch (e) {
        throw new Error('signingHandler : Invalid data source response');
    }
    /**
     * Read the private key from the environment variable.
     */
    const singerPk = process.env.SIGNER_PRIVATE_KEY;

    if (!singerPk) {
        throw new Error('signingHandler : no private key provided');
    }

    /**
     * Sign and encode the response the signingHandler has returned using the private key from the environment variable.
     */
    const signer = new ethers.Wallet(singerPk);
    global.logger.info({ message: 'signingHandler', signer: signer.address });
    return signAndEncodeResponse(signer, resolverAddr, result, calldata);
}
