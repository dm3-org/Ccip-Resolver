import { FakeContract, smock } from "@defi-wonderland/smock";
import { OptimisimProofVerifier } from "typechain";

export const mockOptimismProofVerifier = async (): Promise<FakeContract<OptimisimProofVerifier>> => {
    const optimismProofVerifier = (await smock.fake("OptimisimProofVerifier")) as FakeContract<OptimisimProofVerifier>;

    return optimismProofVerifier;
};
