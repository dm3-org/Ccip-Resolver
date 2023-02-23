import { FakeContract, smock } from "@defi-wonderland/smock";
import { ENS } from "typechain";

export const mockEnsRegistry = async () => {
    const ensRegistry = (await smock.fake(
        "@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS"
    )) as FakeContract<ENS>;
    ensRegistry.owner
        .whenCalledWith("0x1169ffe427a6ddc1eee3a4aa65a55999cb4c99829b1ee3ababb627f521972a21")
        .returns("0x99C19AB10b9EC8aC6fcda9586E81f6B73a298870");
    return ensRegistry;
};
