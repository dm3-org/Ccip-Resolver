import { ethers } from "ethers";

declare global {
    var l1_provider: ethers.providers.JsonRpcProvider;
    var l2_provider: ethers.providers.JsonRpcProvider;
}
