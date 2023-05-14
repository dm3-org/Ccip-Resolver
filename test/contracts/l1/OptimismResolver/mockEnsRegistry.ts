import { FakeContract, smock } from "@defi-wonderland/smock";
import { ENS } from "typechain";

export const mockEnsRegistry = async (node, owner) => {
    const ensRegistry = (await smock.fake("@ensdomains/ens-contracts/contracts/registry/ENS.sol:ENS")) as FakeContract<ENS>;
    ensRegistry.owner.whenCalledWith(node).returns(owner);
    return ensRegistry;
};
