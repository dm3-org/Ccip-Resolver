import { FakeContract, smock } from "@defi-wonderland/smock";
import { ENS } from "typechain";

export const mockEnsRegistry = async () => {
    const ensRegistry = (await smock.fake(
        "@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS"
    )) as FakeContract<ENS>;
    return ensRegistry;
};
