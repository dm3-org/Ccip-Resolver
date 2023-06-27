import { ethers, ethers as hreEthers } from "hardhat";
import { L2PublicResolver, L2PublicResolver__factory } from "typechain";
import { getPublicResolverAddress } from "../../constants";

/**
 * This class provides the storage location for different for the particular fiels of the PublicResolverContract
 */
export class EnsResolverService {
    private readonly l2PublicResolver: L2PublicResolver;

    constructor(l2PublicResolver: L2PublicResolver,) {
        this.l2PublicResolver = l2PublicResolver;
    }
    public static async instance() {
        const l2PublicResolverFactory = (await hreEthers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

        const l2PublicResolver = await l2PublicResolverFactory.attach(getPublicResolverAddress()).connect(global.l2_provider);
        return new EnsResolverService(l2PublicResolver);
    }






}
