import { dnsEncode } from "ethers/lib/utils";
import hre from "hardhat";
import { L2PublicResolver__factory } from "typechain";

const l2ResolverAddress = "0x39Dc8A3A607970FA9F417D284E958D4cA69296C8";
const ENS_NAME = "bob123.eth";

export async function createTextRecord() {
    const L2PublicResolverFactory = (await hre.ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

    const L2PublicResolver = L2PublicResolverFactory.attach(l2ResolverAddress);

    const tx = await L2PublicResolver.setText(dnsEncode(ENS_NAME), "my-record", "my-record-value");

    const rec = await tx.wait();

    console.log(rec.transactionHash);
}

createTextRecord();
