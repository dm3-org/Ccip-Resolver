import { BaseProvider, BlockTag, Network, TransactionRequest } from "@ethersproject/providers";
import { BytesLike, ethers } from "ethers";
import { fetchJson, FetchJsonResponse, hexlify } from "ethers/lib/utils";
import { OptimismResolver } from "typechain";

export type Fetch = (
    url: string,
    json?: string,
    processFunc?: (value: any, response: FetchJsonResponse) => any
) => Promise<any>;

export class MockProvider extends ethers.providers.BaseProvider {
    readonly parent: ethers.providers.BaseProvider;
    readonly fetcher: Fetch;
    readonly optimismResolver: OptimismResolver;

    /**
     * Constructor.
     * @param provider: The Ethers provider to wrap.
     */
    constructor(provider: BaseProvider, fetcher: Fetch = fetchJson, optimsimResolver: OptimismResolver) {
        super(31337);
        this.parent = provider;
        this.fetcher = fetcher;
        this.optimismResolver = optimsimResolver;
    }
    async getResolver(name: string) {
        return new ethers.providers.Resolver(this, this.optimismResolver.address, name) as any;
    }

    async perform(method: string, params: any): Promise<any> {
        switch (method) {
            case "call":
                const { result } = await this.handleCall(this, params);
                return result;
            default:
                return this.parent.perform(method, params);
        }
    }

    async handleCall(
        provider: MockProvider,
        params: { transaction: TransactionRequest; blockTag?: BlockTag }
    ): Promise<{ transaction: TransactionRequest; result: BytesLike }> {
        const fnSig = params.transaction.data!.toString().substring(0, 10);

        const rawResult = await provider.parent.perform("call", params);
        //0x9061b923 = resolve
        if (fnSig !== "0x9061b923") {
            const result = this.optimismResolver.interface.encodeFunctionResult(fnSig, [rawResult]);
            return {
                transaction: params.transaction,
                result,
            };
        }

        const { urls, callData } = this.optimismResolver.interface.decodeErrorResult("OffchainLookup", rawResult);

        const response = await this.sendRPC(provider.fetcher, urls, params.transaction.to, callData);
        return {
            transaction: params.transaction,
            result: response,
        };
    }

    async sendRPC(fetcher: Fetch, urls: string[], to: any, callData: BytesLike): Promise<BytesLike> {
        const processFunc = (value: any, response: FetchJsonResponse) => {
            return { body: value, status: response.statusCode };
        };

        const args = { sender: hexlify(to), data: hexlify(callData) };
        const template = urls[0];
        const url = template.replace(/\{([^}]*)\}/g, (_match, p1: keyof typeof args) => args[p1]);
        const data = await fetcher(url, template.includes("{data}") ? undefined : JSON.stringify(args), processFunc);
        if (data.status === 200) {
            return data.body.data;
        }

        return data.body.message;
    }

    detectNetwork(): Promise<Network> {
        return this.parent.detectNetwork();
    }
}
