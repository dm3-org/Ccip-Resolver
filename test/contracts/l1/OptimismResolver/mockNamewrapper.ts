import { FakeContract, smock } from "@defi-wonderland/smock";
import { INameWrapper } from "typechain";

export const mockEnsRegistry = async (node, owner) => {
    const nameWrapper = (await smock.fake("@ensdomains/ens-contracts/contracts/wrapper/NameWrapper.sol")) as FakeContract<INameWrapper>;
    nameWrapper.ownerOf.whenCalledWith(node).returns(owner);
    return nameWrapper;
};
